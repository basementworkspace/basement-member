import { useEffect, useState } from 'react';
import { ArrowRight, Download, LogOut, MailCheck, Pencil, ShieldCheck, Trash2, X } from 'lucide-react';
import { EmailAuthProvider, deleteUser, reauthenticateWithCredential, sendEmailVerification, updateProfile } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { COOKIE_NOTICE_KEY, PRIVACY_VERSION } from './legal';
import { formatDateTime, isValidIdNumber, isValidPhone, maskIdNumber, normalizeIdNumber, normalizePhone } from './lib';

/* ───── Campi anagrafici condivisi (iscrizione, completamento, modifica) ───── */

export const emptyPerson = { firstName: '', lastName: '', phone: '', idNumber: '' };

export function validatePerson(values) {
  if (!values.firstName.trim() || !values.lastName.trim()) return 'Inserisci nome e cognome.';
  if (!isValidPhone(normalizePhone(values.phone))) return 'Numero di telefono non valido. Esempio: 333 123 4567 oppure +39 333 123 4567.';
  if (!isValidIdNumber(normalizeIdNumber(values.idNumber))) return 'Numero del documento non valido: usa solo lettere e numeri (es. CA12345AB).';
  return '';
}

export const personData = (values) => {
  const firstName = values.firstName.trim(); const lastName = values.lastName.trim();
  return { firstName, lastName, fullName: `${firstName} ${lastName}`, phone: normalizePhone(values.phone), idNumber: normalizeIdNumber(values.idNumber) };
};

export function PersonFields({ values, setValues }) {
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value });
  return <>
    <div className="name-row">
      <label>Nome<input required maxLength={60} autoComplete="given-name" value={values.firstName} onChange={set('firstName')} placeholder="Il tuo nome" /></label>
      <label>Cognome<input required maxLength={60} autoComplete="family-name" value={values.lastName} onChange={set('lastName')} placeholder="Il tuo cognome" /></label>
    </div>
    <label>Telefono<input required type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={values.phone} onChange={set('phone')} placeholder="+39 333 123 4567" /></label>
    <label>N° carta d’identità<input required maxLength={24} autoCapitalize="characters" autoComplete="off" spellCheck={false} value={values.idNumber} onChange={(e) => setValues({ ...values, idNumber: e.target.value.toUpperCase() })} placeholder="es. CA12345AB" /><small className="field-hint">Serve a identificarti all’ingresso. Portalo con te la sera dell’evento.</small></label>
  </>;
}

export function ConsentFields({ consents, setConsents }) {
  const set = (key) => (e) => setConsents({ ...consents, [key]: e.target.checked });
  return <div className="consents">
    <label className="check"><input type="checkbox" required checked={consents.adult} onChange={set('adult')} /><span>Dichiaro di avere almeno 18 anni. <b>*</b></span></label>
    <label className="check"><input type="checkbox" required checked={consents.privacy} onChange={set('privacy')} /><span>Ho letto l’<a href="/privacy" target="_blank" rel="noreferrer">informativa privacy</a> e accetto il trattamento dei miei dati per l’iscrizione e l’accesso agli eventi. <b>*</b></span></label>
    <label className="check"><input type="checkbox" checked={consents.marketing} onChange={set('marketing')} /><span>Voglio ricevere comunicazioni su nuovi eventi (facoltativo, revocabile quando vuoi).</span></label>
  </div>;
}

export const emptyConsents = { adult: false, privacy: false, marketing: false };

export function createProfile(user, values, consents) {
  return setDoc(doc(db, 'profiles', user.uid), {
    uid: user.uid, ...personData(values), email: user.email,
    adult: true, privacyVersion: PRIVACY_VERSION, privacyAcceptedAt: serverTimestamp(), marketing: consents.marketing,
    createdAt: serverTimestamp(),
  });
}

/* ───── Completamento profilo (account senza scheda membro) ───── */

export function CompleteProfile({ user, onLogout }) {
  const [values, setValues] = useState(() => {
    const [firstName = '', ...rest] = (user.displayName || '').split(' ');
    return { ...emptyPerson, firstName, lastName: rest.join(' ') };
  });
  const [consents, setConsents] = useState(emptyConsents);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const problem = validatePerson(values);
    if (problem) { setError(problem); return; }
    setBusy(true); setError('');
    try { await createProfile(user, values, consents); } catch { setError('Non è stato possibile salvare il profilo. Riprova.'); } finally { setBusy(false); }
  };
  return <div className="account-card">
    <span className="eyebrow">COMPLETA IL PROFILO</span>
    <h2>Ci manca<br /><em>qualche dato.</em></h2>
    <p>Per ricevere il QR d’ingresso completa la tua scheda membro.</p>
    <form className="auth-form" onSubmit={submit}>
      <PersonFields values={values} setValues={setValues} />
      <ConsentFields consents={consents} setConsents={setConsents} />
      {error && <p className="form-error">{error}</p>}
      <button className="button auth-submit" disabled={busy}>{busy ? 'UN ATTIMO…' : 'SALVA E CONTINUA'} <ArrowRight size={17} /></button>
    </form>
    <button type="button" className="text-button" onClick={onLogout}><LogOut size={15} /> Esci</button>
  </div>;
}

/* ───── I miei dati: modifica, consenso, download, eliminazione ───── */

function downloadJson(name, data) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

const serialize = (value) => (value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value);

export function MyData({ user, profile, tickets, events }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(emptyPerson);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');

  const startEdit = () => { setValues({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone || '', idNumber: profile.idNumber || '' }); setError(''); setEditing(true); };
  const save = async (e) => {
    e.preventDefault();
    const problem = validatePerson(values);
    if (problem) { setError(problem); return; }
    setBusy(true); setError('');
    try {
      const data = personData(values);
      await updateDoc(doc(db, 'profiles', user.uid), { ...data, updatedAt: serverTimestamp() });
      await updateProfile(user, { displayName: data.fullName });
      setEditing(false);
    } catch { setError('Salvataggio non riuscito. Riprova.'); } finally { setBusy(false); }
  };
  const toggleMarketing = async () => {
    try { await updateDoc(doc(db, 'profiles', user.uid), { marketing: !profile.marketing, updatedAt: serverTimestamp() }); } catch { setError('Non è stato possibile aggiornare la preferenza.'); }
  };
  const exportData = () => {
    const titles = new Map(events.map((ev) => [ev.id, ev.title]));
    downloadJson(`base-i-miei-dati-${new Date().toISOString().slice(0, 10)}.json`, {
      esportato: new Date().toISOString(),
      account: { uid: user.uid, email: user.email, creato: user.metadata.creationTime },
      profilo: Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, serialize(v)])),
      ingressi: tickets.map((t) => ({ evento: titles.get(t.eventId) || t.eventId, stato: t.status === 'used' ? 'utilizzato' : 'valido', creato: serialize(t.createdAt), convalidato: serialize(t.usedAt) || null })),
    });
  };
  const removeAccount = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      await deleteDoc(doc(db, 'profiles', user.uid));
      const own = await getDocs(query(collection(db, 'tickets'), where('uid', '==', user.uid)));
      await Promise.all(own.docs.map((d) => deleteDoc(d.ref)));
      await deleteUser(user);
    } catch (err) {
      setError(err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' ? 'Password non corretta.' : 'Eliminazione non riuscita. Riprova o scrivici.');
      setBusy(false);
    }
  };

  return <section className="my-data">
    <div className="ticket-heading"><span>I TUOI DATI</span><span className="mono">PRIVACY</span></div>
    {editing ? <form className="auth-form my-data-form" onSubmit={save}>
      <PersonFields values={values} setValues={setValues} />
      {error && <p className="form-error">{error}</p>}
      <div className="my-data-actions"><button className="button" disabled={busy}>{busy ? 'SALVATAGGIO…' : 'SALVA'}</button><button type="button" className="text-button" onClick={() => setEditing(false)}><X size={15} /> Annulla</button></div>
    </form> : <dl className="my-data-list">
      <div><dt>Nome</dt><dd>{profile.fullName}</dd></div>
      <div><dt>Email</dt><dd>{user.email}</dd></div>
      <div><dt>Telefono</dt><dd>{profile.phone || '—'}</dd></div>
      <div><dt>Documento</dt><dd>{maskIdNumber(profile.idNumber)}</dd></div>
      <div><dt>Iscritto dal</dt><dd>{formatDateTime(profile.createdAt)}</dd></div>
      <div><dt>Comunicazioni eventi</dt><dd><label className="switch"><input type="checkbox" checked={Boolean(profile.marketing)} onChange={toggleMarketing} /><span>{profile.marketing ? 'Attive' : 'Disattivate'}</span></label></dd></div>
    </dl>}
    {!editing && <div className="my-data-actions">
      <button type="button" className="text-button" onClick={startEdit}><Pencil size={15} /> Modifica dati</button>
      <button type="button" className="text-button" onClick={exportData}><Download size={15} /> Scarica i miei dati</button>
      <button type="button" className="text-button danger" onClick={() => { setDeleting(true); setError(''); }}><Trash2 size={15} /> Elimina account</button>
    </div>}
    {!editing && error && <p className="form-error">{error}</p>}
    {deleting && <div className="modal-scrim" data-lenis-prevent onMouseDown={(e) => e.target === e.currentTarget && !busy && setDeleting(false)}>
      <form className="auth-modal" onSubmit={removeAccount}>
        <button type="button" className="icon-button modal-close" onClick={() => setDeleting(false)} aria-label="Chiudi"><X size={20} /></button>
        <span className="eyebrow">ELIMINA ACCOUNT</span>
        <h2>Sicuro<br /><em>di uscire?</em></h2>
        <p className="modal-intro">Cancelleremo definitivamente profilo, QR e storico ingressi. L’operazione non si può annullare.</p>
        <div className="auth-form">
          <label>Conferma con la tua password<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="button auth-submit button-danger" disabled={busy}>{busy ? 'ELIMINAZIONE…' : 'ELIMINA DEFINITIVAMENTE'}</button>
        </div>
      </form>
    </div>}
  </section>;
}

/* ───── Admin: verifica dell'email prima di entrare ───── */

export function AdminVerify({ user, onLogout, onRefresh }) {
  const [state, setState] = useState('');
  const send = async () => {
    setState('sending');
    try { await sendEmailVerification(user); setState('sent'); } catch (err) { setState(err.code === 'auth/too-many-requests' ? 'wait' : 'error'); }
  };
  const check = async () => {
    setState('checking');
    await user.reload();
    await user.getIdToken(true);
    onRefresh();
    setState(auth.currentUser?.emailVerified ? '' : 'not-yet');
  };
  const messages = { sent: `Email inviata a ${user.email}. Apri il link e poi torna qui.`, wait: 'Troppe richieste: attendi qualche minuto.', error: 'Invio non riuscito. Riprova.', 'not-yet': 'Non risulta ancora verificata: apri il link nell’email e riprova.' };
  return <main className="dashboard-shell admin-verify"><div className="account-card">
    <span className="eyebrow"><ShieldCheck size={14} /> ACCESSO ADMIN</span>
    <h2>Verifica<br /><em>la tua email.</em></h2>
    <p>Per proteggere i dati dei membri, il pannello admin si apre solo dopo aver confermato che la casella <strong>{user.email}</strong> è tua. Si fa una volta sola.</p>
    {messages[state] && <p className="form-note">{messages[state]}</p>}
    <div className="my-data-actions">
      <button type="button" className="button" disabled={state === 'sending'} onClick={send}><MailCheck size={16} /> INVIA EMAIL DI VERIFICA</button>
      <button type="button" className="button button-light" disabled={state === 'checking'} onClick={check}>HO VERIFICATO</button>
    </div>
    <button type="button" className="text-button" onClick={onLogout}><LogOut size={15} /> Esci</button>
  </div></main>;
}

/* ───── Banner informativo cookie (solo strumenti tecnici: nessun consenso richiesto) ───── */

export function CookieBanner({ onOpenPolicy }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COOKIE_NOTICE_KEY) || 'null');
      setVisible(!saved || Date.now() - saved.at > 365 * 864e5);
    } catch { setVisible(true); }
  }, []);
  if (!visible) return null;
  const close = () => {
    try { localStorage.setItem(COOKIE_NOTICE_KEY, JSON.stringify({ at: Date.now() })); } catch { /* non salvato: il banner ricomparirà */ }
    setVisible(false);
  };
  return <div className="cookie-banner" role="region" aria-label="Informativa cookie">
    <p>Usiamo solo cookie e strumenti <strong>tecnici</strong>, necessari a far funzionare il sito e l’area membri. Nessuna profilazione, nessun tracciamento di terze parti. <a href="/cookie" onClick={(e) => { e.preventDefault(); onOpenPolicy(); }}>Cookie policy</a></p>
    <button type="button" className="button" onClick={close}>HO CAPITO</button>
  </div>;
}
