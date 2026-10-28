import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Eye, EyeOff, LockKeyhole, LogOut, Mail, MapPin, QrCode, ShieldCheck, Ticket, Users, X,
} from 'lucide-react';
import { onIdTokenChanged, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { auth, db, isAdminEmail, isAdminUser } from './firebase';
import { AdminVerify, CompleteProfile, ConsentFields, CookieBanner, MyData, PersonFields, createProfile, emptyConsents, emptyPerson, validatePerson } from './Account.jsx';
import { ADMIN_PATH, decorateEvent, isEventLive, randomCode, ticketPayload, ticketShortCode, toMs, useNow, usePoster } from './lib';

const AdminArea = lazy(() => import('./Admin.jsx'));
const Landing = lazy(() => import('./Landing.jsx'));
const Legal = lazy(() => import('./Legal.jsx'));

function resolveView() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === ADMIN_PATH) return 'admin';
  if (path === '/profilo') return 'profile';
  if (path === '/privacy') return 'privacy';
  if (path === '/cookie') return 'cookie';
  return 'home';
}

function useLocationView() {
  const [view, setView] = useState(resolveView);
  useEffect(() => {
    const sync = () => setView(resolveView());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const go = useCallback((next) => {
    const route = { admin: ADMIN_PATH, profile: '/profilo', privacy: '/privacy', cookie: '/cookie' }[next] || '/';
    if (window.location.pathname !== route) window.history.pushState({}, '', route);
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);
  return [view, go];
}

export function Brand({ light = false, onClick }) {
  return <button className={`brand ${light ? 'brand-light' : ''}`} onClick={onClick} aria-label="BASE — home">
    <span className="brand-cube"><span>B</span></span><span className="brand-word">BASE<span className="brand-dot">.</span><small>BASEMENT CLUB</small></span>
  </button>;
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

const authMessages = {
  'auth/email-already-in-use': 'Questa email è già registrata. Accedi al tuo profilo.',
  'auth/invalid-credential': 'Email o password non corretti.',
  'auth/weak-password': 'La password deve contenere almeno 6 caratteri.',
  'auth/invalid-email': 'Inserisci un indirizzo email valido.',
  'auth/too-many-requests': 'Troppi tentativi. Riprova tra qualche minuto.',
  'auth/network-request-failed': 'Connessione assente. Controlla la rete e riprova.',
  'permission-denied': 'Account creato, ma il profilo non è stato salvato. Riprova tra poco.',
};

function AuthModal({ mode, setMode, onClose, onDone }) {
  const [person, setPerson] = useState(emptyPerson);
  const [consents, setConsents] = useState(emptyConsents);
  const [values, setValues] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const signup = mode === 'signup';
  const submit = async (event) => {
    event.preventDefault(); setError(''); setNote('');
    if (signup) {
      const problem = validatePerson(person);
      if (problem) { setError(problem); return; }
    }
    setBusy(true);
    try {
      if (signup) {
        const credential = await createUserWithEmailAndPassword(auth, values.email.trim(), values.password);
        await updateProfile(credential.user, { displayName: `${person.firstName.trim()} ${person.lastName.trim()}` });
        await createProfile(credential.user, person, consents);
        onDone(credential.user);
      } else {
        const credential = await signInWithEmailAndPassword(auth, values.email.trim(), values.password);
        onDone(credential.user);
      }
    } catch (err) {
      setError(authMessages[err.code] || 'Non è stato possibile completare l’operazione.');
    } finally { setBusy(false); }
  };
  const resetPassword = async () => {
    setError(''); setNote('');
    if (!values.email.trim()) { setError('Scrivi prima la tua email qui sopra.'); return; }
    try { await sendPasswordResetEmail(auth, values.email.trim()); } catch { /* non riveliamo se l'email esiste */ }
    setNote('Se l’email è registrata, riceverai a breve il link per reimpostare la password.');
  };
  return <div className="modal-scrim" data-lenis-prevent onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="icon-button modal-close" onClick={onClose} aria-label="Chiudi"><X size={20} /></button>
      <div className="eyebrow"><span className="eyebrow-line" /> BASE MEMBERSHIP</div>
      <h2 id="auth-title">{signup ? <>La notte<br /><em>ti aspetta.</em></> : <>Bentornato<br /><em>sotto.</em></>}</h2>
      <p className="modal-intro">{signup ? 'Crea il tuo profilo. Il prossimo ingresso è già tuo.' : 'Accedi per ritrovare i tuoi eventi e i tuoi QR.'}</p>
      <form className="auth-form" onSubmit={submit}>
        {signup && <PersonFields values={person} setValues={setPerson} />}
        <label>Email<span className="input-wrap"><Mail size={16} /><input type="email" required autoComplete="email" inputMode="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="nome@email.com" /></span></label>
        <label>Password<span className="input-wrap"><LockKeyhole size={16} /><input type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete={signup ? 'new-password' : 'current-password'} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} placeholder="Almeno 6 caratteri" /><button type="button" className="reveal-password" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        {!signup && <button type="button" className="text-button forgot" onClick={resetPassword}>Password dimenticata?</button>}
        {signup && <ConsentFields consents={consents} setConsents={setConsents} />}
        {error && <p className="form-error">{error}</p>}
        {note && <p className="form-note">{note}</p>}
        <Button disabled={busy} className="auth-submit">{busy ? 'UN ATTIMO…' : signup ? 'DIVENTA MEMBRO' : 'ACCEDI'} <ArrowRight size={17} /></Button>
      </form>
      <p className="auth-switch">{signup ? 'Hai già un profilo?' : 'È la tua prima notte?'} <button onClick={() => { setError(''); setNote(''); setMode(signup ? 'login' : 'signup'); }}>{signup ? 'Accedi' : 'Diventa membro'}</button></p>
      <div className="modal-foot"><ShieldCheck size={14} /> Dati protetti e visibili solo a te e allo staff. <a href="/privacy" target="_blank" rel="noreferrer">Privacy</a></div>
    </section>
  </div>;
}

export function Poster({ event, className = '', index = 1, total = 1 }) {
  const posterSrc = usePoster(event);
  return <article className={`poster poster-${event?.accent || 'rust'} ${posterSrc ? 'poster-has-photo' : ''} ${className}`}>
    {posterSrc && <img className="poster-photo" src={posterSrc} alt={`Locandina ${event?.title || ''}`} />}
    <div className="poster-grain" />
    <div className="poster-top"><span>BASE<span className="poster-dot">.</span></span><span className="mono">{event?.dateLabel || 'PROSSIMAMENTE'}</span></div>
    {!posterSrc && <div className="poster-orbit"><span>BS</span><i /><i /><i /></div>}
    <div className="poster-content"><span className="poster-kicker">{event?.subtitle || 'WHAT IS BASE?'}</span><h3>{event?.title || 'LA NOTTE PRENDE FORMA'}</h3><span className="poster-bottom">{event?.venue || 'CAVA DE’ TIRRENI'} <b>→</b></span></div>
    <div className="poster-number">{String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>
  </article>;
}

function TicketCard({ event, ticket, index, total }) {
  const used = ticket?.status === 'used';
  return <div className="ticket-layout">
    <div className="ticket-poster-wrap"><Poster event={event} className="member-poster" index={index} total={total} /><div className="ticket-tag"><Ticket size={14} /> INGRESSO PERSONALE</div></div>
    <div className="ticket-card">
      <div className="ticket-card-top"><span className={`ticket-status ${used ? 'used' : ''}`}><i /> {used ? 'UTILIZZATO' : ticket ? 'VALIDO' : 'IN PREPARAZIONE'}</span><span className="mono">{ticket ? `NO. ${ticketShortCode(ticket)}` : '—'}</span></div>
      <h2>{event.title}</h2>
      <p className="ticket-location"><MapPin size={15} /> {event.venue || 'BASE Basement'} · {event.dateLabel} · {event.timeLabel}</p>
      <div className="ticket-divider"><i /><span /></div>
      <div className="ticket-qr-wrap">
        <div className={`ticket-qr ${used ? 'ticket-qr-used' : ''}`}>{ticket ? <QRCodeSVG value={ticketPayload(ticket)} size={168} bgColor="#f5f3ed" fgColor="#11110f" level="M" includeMargin /> : <div className="ticket-qr-pending"><QrCode size={34} /></div>}</div>
        <div className="ticket-qr-copy"><strong>{used ? 'INGRESSO GIÀ REGISTRATO' : ticket ? 'MOSTRA QUESTO QR ALL’INGRESSO' : 'STIAMO GENERANDO IL TUO QR…'}</strong><span>{used ? 'Questo QR è già stato convalidato.' : 'Un QR. Un ingresso. Il tuo.'}</span><span className="mono">SCADE A FINE EVENTO</span></div>
      </div>
      <div className="ticket-perforation"><span>BASE MEMBER PASS</span><span>NON TRASFERIBILE</span></div>
    </div>
  </div>;
}

function MemberArea({ user, profile, profileState, liveEvents, events, tickets, go, onLogout }) {
  const name = profile?.firstName || user?.displayName?.split(' ')[0] || 'Membro';
  const ticketsByEvent = useMemo(() => new Map(tickets.map((t) => [t.eventId, t])), [tickets]);
  const blocked = profile?.blocked === true;
  let body;
  if (profileState === 'missing') {
    body = <CompleteProfile user={user} onLogout={onLogout} />;
  } else if (blocked) {
    body = <div className="empty-ticket"><div className="empty-qr"><LockKeyhole size={34} /></div><div><span className="eyebrow">ACCOUNT SOSPESO</span><h2>Il tuo accesso<br /><em>è sospeso.</em></h2><p>Al momento non puoi ricevere QR per gli eventi. Contatta lo staff di BASE.</p></div><div className="empty-orbit" /></div>;
  } else if (liveEvents.length) {
    body = <div className="ticket-list">{liveEvents.map((event, i) => <TicketCard key={event.id} event={event} ticket={ticketsByEvent.get(event.id)} index={i + 1} total={liveEvents.length} />)}</div>;
  } else {
    body = <div className="empty-ticket"><div className="empty-qr"><QrCode size={34} /></div><div><span className="eyebrow">NESSUN EVENTO IN PROGRAMMA</span><h2>Il prossimo evento<br /><em>sarà il tuo.</em></h2><p>Quando BASE pubblica una nuova notte, il tuo QR personale apparirà qui in automatico.</p><Button onClick={() => go('home')}>SCOPRI IL CLUB <ArrowRight size={17} /></Button></div><div className="empty-orbit" /></div>;
  }
  const since = toMs(profile?.createdAt) || Date.now();
  return <main className="dashboard-shell">
    <header className="dash-header"><Brand onClick={() => go('home')} /><span className="dash-section-label">MEMBER AREA <span>/</span> PROFILO</span><button className="dash-user" onClick={onLogout}><span className="user-avatar">{name.slice(0, 1).toUpperCase()}</span><span className="dash-user-name">{name}</span><LogOut size={16} /></button></header>
    <div className="member-layout"><aside className="dash-sidebar"><div className="sidebar-eyebrow">IL TUO SPAZIO</div><button className="sidebar-link active"><Users size={17} /> Il mio profilo <span>01</span></button><button className="sidebar-link" onClick={() => go('home')}><ArrowLeft size={17} /> Torna al club</button><button className="sidebar-link" onClick={onLogout}><LogOut size={17} /> Esci</button><div className="sidebar-bottom"><span className="live-pulse" /> MEMBRO BASE<br /><small>DAL {new Date(since).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase()}</small></div></aside>
      <section className="member-main"><div className="member-greeting"><div><span className="eyebrow"><span className="eyebrow-line" /> AREA PERSONALE</span><h1>BENVENUTO<br /><em>{name.toUpperCase()}.</em></h1><p>{profile?.fullName || user.displayName} · {user.email}</p></div><div className="member-id"><span>MEMBER ID</span><strong>{user.uid.slice(0, 8).toUpperCase()}</strong><BadgeCheck size={19} /></div></div>
        <div className="ticket-heading"><span>I TUOI INGRESSI</span><span className="mono">{String(liveEvents.length).padStart(2, '0')} {liveEvents.length === 1 ? 'EVENTO' : 'EVENTI'}</span></div>
        {profileState === 'loading' ? <div className="empty-ticket"><div className="loading-cube">B</div></div> : body}
        <div className="member-note"><ShieldCheck size={17} /><span>Ogni QR è personale, vale per un solo ingresso e scade a fine evento. <strong>Non condividerlo.</strong></span></div>
        {profileState === 'ready' && profile && <MyData user={user} profile={profile} tickets={tickets} events={events} />}
        <footer className="member-legal"><a href="/privacy" onClick={(e) => { e.preventDefault(); go('privacy'); }}>Privacy</a><a href="/cookie" onClick={(e) => { e.preventDefault(); go('cookie'); }}>Cookie</a><button type="button" onClick={onLogout}>Esci</button></footer>
      </section></div>
  </main>;
}

export default function App() {
  const [view, go] = useLocationView();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileState, setProfileState] = useState('loading');
  const [tickets, setTickets] = useState([]);
  const [ticketsReady, setTicketsReady] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsReady, setEventsReady] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [authOpen, setAuthOpen] = useState(false);
  const [firebaseIssue, setFirebaseIssue] = useState('');
  const [, setAuthTick] = useState(0);
  const requested = useRef(new Set());
  const now = useNow();
  const admin = isAdminUser(user);
  const adminPending = isAdminEmail(user) && !admin; // email admin non ancora verificata
  const staff = admin || adminPending;

  // onIdTokenChanged scatta anche dopo la verifica email dell'admin (token aggiornato).
  useEffect(() => onIdTokenChanged(auth, (current) => {
    setUser((prev) => { if (prev?.uid !== current?.uid) requested.current = new Set(); return current; });
    setAuthTick((t) => t + 1);
    setAuthReady(true);
  }), []);

  // Eventi pubblicati: alimentano landing e profilo, in tempo reale.
  useEffect(() => onSnapshot(query(collection(db, 'events'), where('status', '==', 'published')),
    (snapshot) => { setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))); setEventsReady(true); setFirebaseIssue(''); },
    (error) => { setEventsReady(true); setFirebaseIssue(error.message); }), []);

  useEffect(() => {
    setProfile(null); setProfileState('loading');
    if (!user || staff) return undefined;
    // Subito dopo la registrazione il profilo può non esistere ancora: diamo qualche secondo prima di dichiararlo mancante.
    let timer = 0;
    const unsub = onSnapshot(doc(db, 'profiles', user.uid), (snap) => {
      window.clearTimeout(timer);
      if (snap.exists()) { setProfile(snap.data()); setProfileState('ready'); }
      else timer = window.setTimeout(() => setProfileState('missing'), 5000);
    }, (error) => setFirebaseIssue(error.message));
    return () => { unsub(); window.clearTimeout(timer); };
  }, [user, staff]);

  useEffect(() => {
    setTickets([]); setTicketsReady(false);
    if (!user || staff) return undefined;
    return onSnapshot(query(collection(db, 'tickets'), where('uid', '==', user.uid)),
      (snapshot) => { setTickets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))); setTicketsReady(true); },
      (error) => setFirebaseIssue(error.message));
  }, [user, staff]);

  const liveEvents = useMemo(() => events.filter((e) => isEventLive(e, now)).sort((a, b) => toMs(a.startAt) - toMs(b.startAt)).map(decorateEvent), [events, now]);

  // Ogni membro attivo riceve un QR unico per ogni evento in programma.
  useEffect(() => {
    if (!user || staff || !ticketsReady || profileState !== 'ready' || profile?.blocked) return;
    const owned = new Set(tickets.map((t) => t.eventId));
    liveEvents.filter((e) => !owned.has(e.id) && !requested.current.has(e.id)).forEach((event) => {
      requested.current.add(event.id);
      setDoc(doc(db, 'tickets', `${event.id}_${user.uid}`), {
        uid: user.uid, eventId: event.id, code: randomCode(), status: 'issued', createdAt: serverTimestamp(),
      }).catch(() => { window.setTimeout(() => requested.current.delete(event.id), 15_000); });
    });
  }, [user, staff, profile, profileState, liveEvents, tickets, ticketsReady]);

  useEffect(() => {
    if (!authReady) return;
    if (view === 'admin' && user && !staff) go('profile');
    if (view === 'profile' && staff) go('admin');
    if ((view === 'profile' || view === 'admin') && !user) { setAuthMode('login'); setAuthOpen(true); }
  }, [view, user, staff, authReady, go]);

  const logout = async () => { await signOut(auth); go('home'); };
  const openAuth = (mode) => {
    if (user) { go(staff ? 'admin' : 'profile'); return; }
    setAuthMode(mode); setAuthOpen(true);
  };
  const onAuthDone = (current) => { setAuthOpen(false); go(isAdminEmail(current) ? 'admin' : 'profile'); };

  const showProfile = view === 'profile' && user && !staff;
  const showAdmin = view === 'admin' && user && admin;
  const showAdminVerify = view === 'admin' && user && adminPending;
  const showLegal = view === 'privacy' || view === 'cookie';
  const loadingScreen = <div className="loading-screen"><div className="loading-cube">B</div><span>ENTRIAMO SOTTO.</span></div>;

  return <>
    {!authReady && view !== 'home' ? loadingScreen : null}
    {authReady && showProfile ? <MemberArea user={user} profile={profile} profileState={profileState} liveEvents={liveEvents} events={events} tickets={tickets} go={go} onLogout={logout} /> : null}
    {authReady && showAdmin ? <Suspense fallback={loadingScreen}><AdminArea user={user} go={go} onLogout={logout} /></Suspense> : null}
    {authReady && showAdminVerify ? <AdminVerify user={user} onLogout={logout} onRefresh={() => setAuthTick((t) => t + 1)} /> : null}
    {showLegal && <Suspense fallback={loadingScreen}><Legal page={view} go={go} /></Suspense>}
    {!showLegal && (view === 'home' || (authReady && !showProfile && !showAdmin && !showAdminVerify)) && <Suspense fallback={loadingScreen}><Landing events={liveEvents} ready={eventsReady} user={user && !staff ? user : null} onJoin={() => openAuth('signup')} onLogin={() => openAuth('login')} onProfile={() => go(staff ? 'admin' : 'profile')} onNavigate={go} /></Suspense>}
    {view !== 'admin' && <CookieBanner onOpenPolicy={() => go('cookie')} />}
    {firebaseIssue && !authOpen && <div className="firebase-status" role="status"><span className="live-pulse" /> CONNESSIONE AL DATABASE NON RIUSCITA <button onClick={() => setFirebaseIssue('')} aria-label="Chiudi"><X size={13} /></button></div>}
    {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => { setAuthOpen(false); if (view !== 'home' && !user) go('home'); }} onDone={onAuthDone} />}
  </>;
}
