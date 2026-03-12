# ☘ LELLO STAG DO APP — Guida Completa

## Struttura cartelle finale

```
stag-do-app/
├── index.html
├── manifest.json
├── service-worker.js
├── netlify.toml          ← NUOVO (necessario per Netlify)
├── css/
│   └── style.css
├── js/
│   ├── firebase.js
│   └── app.js
└── assets/
    ├── icon-192.png      ← Da creare (vedi sotto)
    └── icon-512.png      ← Da creare (vedi sotto)
```

---

## STEP 1 — Creare le icone PWA

Hai bisogno di due icone PNG per installare l'app sul telefono.

**Opzione rapida (gratis):**
1. Vai su https://favicon.io/favicon-generator/
2. Scrivi "☘" come testo, sfondo verde (#22c55e), testo nero
3. Scarica il pacchetto
4. Rinomina i file in `icon-192.png` e `icon-512.png`
5. Mettili nella cartella `assets/`

---

## STEP 2 — Configurare Firebase Firestore

1. Vai su https://console.firebase.google.com
2. Apri il progetto **lello-stag-do**
3. Nel menu laterale: **Firestore Database**
4. Crea il database (se non esiste) → scegli **Europa West**

### Regole di sicurezza Firestore

Vai su **Firestore → Regole** e incolla questo:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Queste regole sono aperte (va bene per un weekend tra amici).
> Pubblica le regole con il pulsante **Pubblica**.

---

## STEP 3 — Registrare il Service Worker

Nel file `index.html` è già presente tutto. Ma devi aggiungere
questo snippet appena prima di `</body>` se non è già presente:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
  }
</script>
```

> Questo snippet è già nel file `index.html` fornito. ✅

---

## STEP 4 — Deploy su Netlify

### Metodo A: Drag & Drop (più veloce)

1. Vai su https://app.netlify.com
2. Clicca **"Add new site" → "Deploy manually"**
3. **Trascina l'intera cartella** `stag-do-app/` nella zona di drop
4. Netlify ti darà un URL tipo `https://xyz-lello.netlify.app`

### Metodo B: GitHub (consigliato per aggiornamenti)

1. Crea un repo su GitHub con tutti i file
2. Su Netlify: **"Add new site" → "Import an existing project"**
3. Collega il repo GitHub
4. Build settings: lascia tutto vuoto (è un sito statico)
5. Clicca **Deploy**

---

## STEP 5 — Condividere con il gruppo

Una volta deployato:

1. Copia il link Netlify (es. `https://lello-stagdo.netlify.app`)
2. Mandalo nella chat del gruppo WhatsApp
3. Ogni persona:
   - Apre il link nel browser del telefono
   - Safari (iPhone): menu in basso → "Aggiungi a schermata Home"
   - Chrome (Android): menu in alto → "Aggiungi a schermata Home"

---

## STEP 6 — (Opzionale) Dominio personalizzato

Su Netlify puoi mettere un dominio tipo `lellodublin2025.netlify.app`:
1. Site settings → Domain management
2. Cambia il nome del sito in qualcosa di memorabile

---

## Come funziona l'app

| Azione | XP guadagnati |
|--------|--------------|
| Completa una missione | +10 XP |
| Aggiungi una Guinness | +2 XP |
| Check-in in un pub | +5 XP |

### Badge sbloccabili

| Badge | Condizione |
|-------|-----------|
| 🍺 Rookie | 3 Guinness |
| 🍺 Warrior | 6 Guinness |
| 🍺 Legend | 10 Guinness |
| 🏆 Mission Hero | 5 missioni |
| ☘ Irish Spirit | Tutte le missioni (10) |

---

## Bug risolti rispetto ai file originali

1. **Doppia definizione di `completeMission`** — la funzione era definita due volte con sintassi diversa
2. **`leaderboard.js` con sintassi mista** — usava sia `db.collection()` (vecchio SDK) che `collection(db,...)` (nuovo SDK)
3. **Tag HTML fuori posto** — `<div class="container">` e `<link>` erano dentro `<head>` in posizione errata
4. **Script non-module che importava da moduli** — `app.js` e `leaderboard.js` usavano variabili globali di Firebase esportate in modo inconsistente
5. **`addBeer()` definita tre volte** in file diversi
6. **Service worker** cachava percorsi sbagliati (es. `/app.js` invece di `/js/app.js`)
7. **Mappa non si ridisegnava** quando il tab diventava visibile
8. **Nessuna protezione da doppio check-in** sui pub
9. **Nessun feedback visivo** durante le operazioni async

---

## Troubleshooting

**La leaderboard non si aggiorna?**
→ Controlla le regole Firestore (Step 2)

**L'app non si installa sul telefono?**
→ Assicurati che le icone siano nella cartella `assets/`

**Errore Firebase in console?**
→ Verifica che il progetto Firebase sia attivo e che Firestore sia abilitato

**La mappa non si vede?**
→ Clicca sul tab Mappa, la mappa si ridisegna automaticamente
