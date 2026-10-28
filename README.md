# BASE Basement Club

Landing page + membership con QR d'ingresso per evento. React + Vite, Firebase Authentication (email/password) e Firestore. **Niente Cloud Functions né Storage**: funziona sul piano gratuito Spark. Tutta la sicurezza è in `firestore.rules`.

## Come funziona

- **Landing (`/`)**: mostra gli eventi pubblicati e non ancora finiti, con la locandina caricata dall'admin. Si aggiorna in tempo reale.
- **Registrazione**: nome, cognome, telefono, n° carta d'identità, email, password, dichiarazione di maggiore età, presa visione dell'informativa privacy e consenso facoltativo alle comunicazioni → profilo in `profiles/{uid}`.
- **Profilo (`/profilo`)**: per ogni evento attivo il membro riceve un QR unico (`tickets/{eventId}_{uid}`, codice casuale di 24 caratteri). All'orario di fine (o quando l'admin chiude l'evento) il QR sparisce e lo scanner lo rifiuta.
- **Admin (`/control-room`, rotta non linkata)**: accesso solo con `base.basement.workspace@gmail.com` **con email verificata** (al primo accesso il sito chiede di cliccare il link di verifica).
  - **Report**: membri, nuovi iscritti per mese, QR generati, ingressi, presenza per evento, ingressi per ora, membri più presenti.
  - **Eventi**: crea/modifica/nascondi/chiudi/elimina, locandina compressa e salvata in `posters/{eventId}`.
  - **Membri**: ricerca (anche per telefono/documento), scheda con dati e QR, sospendi/riattiva, elimina profilo, annulla convalida, rigenera QR, export **PDF** e CSV.
  - **Validatore**: scanner con fotocamera (o codice a 8 caratteri sotto il QR). Esiti: valido / già scansionato / scaduto / non valido, con suono e vibrazione.

## Privacy e cookie

- `/privacy` e `/cookie`: informativa GDPR e cookie policy. I dati del titolare sono in `src/legal.js` (completare ragione sociale e P.IVA).
- Banner cookie informativo: il sito usa solo strumenti tecnici (sessione di login, preferenze locali), nessun cookie di profilazione o di terze parti; il font è ospitato in locale.
- Dal profilo il membro può modificare i dati, revocare il consenso alle comunicazioni, scaricare i propri dati (JSON) ed eliminare l'account.
- Nel report admin c'è la pulizia dei QR oltre i 12 mesi di conservazione.

## Sviluppo

```sh
npm install
npm run dev          # contro il progetto Firebase reale
```

Test in locale senza toccare i dati reali (serve Java):

```sh
npm run emulators              # in un terminale
./scripts/seed-emulator.sh     # crea l'admin verificato nell'emulatore (password: emulatore-admin)
npm run dev:emu                # in un altro terminale
```

## Firebase

Progetto: `basement-fa904`. In console devono essere attivi **Authentication → Email/Password** e **Firestore**. Dopo ogni modifica alle regole:

```sh
npm run deploy:rules
```

L'account `base.basement.workspace@gmail.com` deve esistere in Authentication e avere l'email verificata (le regole lo richiedono).

## Deploy su Vercel

Importa il repository in Vercel: `vercel.json` imposta già build Vite, cartella `dist` e fallback SPA (serve per `/profilo` e `/control-room`). Non servono variabili d'ambiente. Lo scanner richiede HTTPS, che Vercel fornisce.
