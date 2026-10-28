import { ArrowLeft } from 'lucide-react';
import { CONTROLLER, LEGAL_UPDATED } from './legal';

function Privacy() {
  return <>
    <h1>Informativa privacy</h1>
    <p className="legal-lead">Informativa sul trattamento dei dati personali dei membri e dei visitatori, ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (“GDPR”) e del D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018.</p>

    <h2>1. Titolare del trattamento</h2>
    <p>{CONTROLLER.name} — {CONTROLLER.vat}<br />Sede: {CONTROLLER.address}<br />Email: <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a></p>

    <h2>2. Quali dati trattiamo</h2>
    <ul>
      <li><strong>Dati di iscrizione:</strong> nome, cognome, email, numero di telefono, numero del documento d’identità, dichiarazione di maggiore età, password (conservata in forma cifrata dal fornitore di autenticazione, mai leggibile da noi).</li>
      <li><strong>Dati di accesso agli eventi:</strong> QR personale generato per ogni evento, data e ora della convalida all’ingresso.</li>
      <li><strong>Preferenze:</strong> consenso facoltativo a ricevere comunicazioni sugli eventi.</li>
      <li><strong>Dati tecnici:</strong> dati di navigazione strettamente necessari al funzionamento del sito (vedi <a href="/cookie">cookie policy</a>).</li>
    </ul>

    <h2>3. Finalità e basi giuridiche</h2>
    <table>
      <thead><tr><th>Finalità</th><th>Base giuridica</th></tr></thead>
      <tbody>
        <tr><td>Iscrizione alla membership, gestione del profilo e invio del QR personale per gli eventi</td><td>Esecuzione del rapporto richiesto dall’interessato (art. 6.1.b GDPR)</td></tr>
        <tr><td>Identificazione del membro all’ingresso, verifica della maggiore età, controllo accessi e sicurezza del locale (numero di documento e telefono)</td><td>Esecuzione del rapporto (art. 6.1.b) e legittimo interesse del titolare alla sicurezza delle persone e del locale (art. 6.1.f)</td></tr>
        <tr><td>Adempimenti di legge e richieste delle autorità competenti</td><td>Obbligo legale (art. 6.1.c)</td></tr>
        <tr><td>Comunicazioni su nuovi eventi e iniziative (facoltativo)</td><td>Consenso, revocabile in ogni momento dal profilo (art. 6.1.a)</td></tr>
      </tbody>
    </table>
    <p>Il conferimento dei dati di iscrizione è necessario per diventare membro: senza questi dati non è possibile rilasciare il QR d’ingresso. Il consenso alle comunicazioni è facoltativo e il suo rifiuto non ha conseguenze sull’iscrizione. Non effettuiamo profilazione né processi decisionali automatizzati.</p>

    <h2>4. Come trattiamo i dati</h2>
    <p>I dati sono trattati con strumenti elettronici e misure di sicurezza adeguate: connessione cifrata (HTTPS), accesso ai dati personali consentito solo al membro stesso e all’amministratore autorizzato, regole di sicurezza sul database che impediscono a chiunque altro di leggerli. Il QR contiene solo un codice casuale, nessun dato personale.</p>

    <h2>5. Destinatari e responsabili</h2>
    <p>I dati non sono diffusi né venduti. Possono accedervi il personale autorizzato del titolare (staff all’ingresso, amministrazione) e i fornitori tecnici che agiscono come responsabili del trattamento ai sensi dell’art. 28 GDPR:</p>
    <ul>
      <li><strong>Google Ireland Ltd / Google LLC</strong> (Firebase Authentication e Cloud Firestore) — autenticazione e database;</li>
      <li><strong>Vercel Inc.</strong> — hosting del sito.</li>
    </ul>
    <p>Alcuni di questi fornitori possono trattare dati anche fuori dall’Unione Europea (Stati Uniti). Il trasferimento avviene sulla base della decisione di adeguatezza UE-USA (EU-U.S. Data Privacy Framework) e/o delle Clausole Contrattuali Standard approvate dalla Commissione Europea. I dati possono essere comunicati alle autorità di pubblica sicurezza o giudiziarie se richiesto dalla legge.</p>

    <h2>6. Per quanto tempo conserviamo i dati</h2>
    <ul>
      <li><strong>Dati del profilo:</strong> finché resti membro. Se elimini l’account vengono cancellati subito; in caso di inattività prolungata (nessun ingresso per 24 mesi) possono essere cancellati dal titolare.</li>
      <li><strong>QR e storico ingressi:</strong> al massimo 12 mesi dalla data dell’evento, poi vengono eliminati.</li>
      <li><strong>Consenso alle comunicazioni:</strong> fino alla revoca.</li>
    </ul>

    <h2>7. I tuoi diritti</h2>
    <p>Puoi esercitare in ogni momento i diritti previsti dagli artt. 15–22 GDPR: accesso, rettifica, cancellazione, limitazione, portabilità, opposizione e revoca del consenso (senza pregiudicare il trattamento svolto prima della revoca). Dal tuo profilo puoi direttamente:</p>
    <ul>
      <li>modificare i tuoi dati e il consenso alle comunicazioni;</li>
      <li>scaricare una copia dei tuoi dati (portabilità);</li>
      <li>eliminare definitivamente il tuo account e i tuoi dati.</li>
    </ul>
    <p>Per ogni altra richiesta scrivi a <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>: risponderemo entro 30 giorni. Hai inoltre il diritto di proporre reclamo al Garante per la protezione dei dati personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer">www.garanteprivacy.it</a>).</p>

    <h2>8. Minori</h2>
    <p>L’iscrizione è riservata ai maggiorenni. Non raccogliamo consapevolmente dati di minori di 18 anni: se ci accorgiamo di un’iscrizione di un minore, il profilo viene eliminato.</p>

    <h2>9. Modifiche</h2>
    <p>Eventuali modifiche a questa informativa saranno pubblicate su questa pagina, con la data di aggiornamento.</p>
  </>;
}

function Cookie() {
  return <>
    <h1>Cookie policy</h1>
    <p className="legal-lead">Questa pagina spiega quali cookie e strumenti simili usa il sito, ai sensi dell’art. 122 del D.Lgs. 196/2003 e delle Linee guida del Garante privacy del 10 giugno 2021.</p>

    <h2>Usiamo solo strumenti tecnici</h2>
    <p>Il sito <strong>non usa cookie di profilazione, di marketing o di statistica di terze parti</strong>, non mostra pubblicità e non traccia la tua navigazione. Anche i caratteri tipografici sono ospitati direttamente sul nostro sito, senza richieste a servizi esterni.</p>
    <p>Usiamo solo strumenti tecnici, necessari a far funzionare il sito e a fornirti il servizio che chiedi. Per questi la legge non richiede il consenso: ti informiamo con il banner e con questa pagina.</p>

    <table>
      <thead><tr><th>Nome / tipo</th><th>Fornitore</th><th>Finalità</th><th>Durata</th></tr></thead>
      <tbody>
        <tr><td>Sessione di accesso (IndexedDB <code>firebaseLocalStorageDb</code>)</td><td>Google Firebase, per conto del titolare</td><td>Mantenere l’accesso all’area membri dopo il login</td><td>Fino al logout</td></tr>
        <tr><td><code>{'base-cookie-notice'}</code> (localStorage)</td><td>Questo sito</td><td>Ricordare che hai chiuso il banner informativo</td><td>12 mesi</td></tr>
        <tr><td><code>base-pre</code> (sessionStorage)</td><td>Questo sito</td><td>Mostrare l’animazione di apertura una sola volta per visita</td><td>Fino alla chiusura della scheda</td></tr>
      </tbody>
    </table>

    <h2>Link esterni</h2>
    <p>Il sito contiene semplici link verso Instagram e Google Maps. Quei servizi non vengono caricati finché non clicchi il link; una volta aperti si applicano le loro informative.</p>

    <h2>Come gestire i cookie</h2>
    <p>Puoi cancellare in ogni momento cookie e dati dei siti dalle impostazioni del browser. Bloccare gli strumenti tecnici può impedire l’accesso all’area membri.</p>

    <h2>Titolare</h2>
    <p>{CONTROLLER.name} — {CONTROLLER.address} — <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>. Per maggiori informazioni sul trattamento dei dati leggi l’<a href="/privacy">informativa privacy</a>.</p>
  </>;
}

export default function Legal({ page, go }) {
  return <main className="legal">
    <header className="legal-head"><button type="button" onClick={() => go('home')}><ArrowLeft size={18} /> BASE</button><nav><a href="/privacy" className={page === 'privacy' ? 'active' : ''} onClick={(e) => { e.preventDefault(); go('privacy'); }}>Privacy</a><a href="/cookie" className={page === 'cookie' ? 'active' : ''} onClick={(e) => { e.preventDefault(); go('cookie'); }}>Cookie</a></nav></header>
    <article className="legal-body">
      {page === 'privacy' ? <Privacy /> : <Cookie />}
      <p className="legal-updated">Ultimo aggiornamento: {LEGAL_UPDATED}</p>
    </article>
  </main>;
}
