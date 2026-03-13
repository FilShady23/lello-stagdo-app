// app.js — Logica principale dell'app (ES Module)
import {
  db, collection, addDoc, onSnapshot,
  query, where, getDocs, deleteDoc, doc, setDoc, updateDoc, increment
} from "./firebase.js";

// =============================================
// STATO UTENTE
// =============================================
let currentUser = "";

// Lista missioni
const MISSIONS = [
  { id: "m1", title: "Parlare con 3 irlandesi", xp: 10 },
  { id: "m2", title: "Selfie davanti Temple Bar", xp: 10 },
  { id: "m3", title: "Bere Guinness in 3 pub diversi", xp: 10 },
  { id: "m4", title: "Brindisi con degli sconosciuti", xp: 10 },
  { id: "m5", title: "Foto con un musicista di strada", xp: 10 },
  { id: "m6", title: "Imparare a dire 'Salute' in irlandese (Sláinte!)", xp: 10 },
  { id: "m7", title: "Ordinare da bere con un accento irlandese", xp: 10 },
  { id: "m8", title: "Fare una foto di gruppo in un pub", xp: 10 },
  { id: "m9", title: "Trovare qualcuno che si chiama Patrick", xp: 10 },
  { id: "m10", title: "Cantare in un pub irlandese", xp: 10 }
];

// Badge definizioni
const BADGES = [
  { id: "rookie",       icon: "🍺", name: "Rookie",       desc: "3 Guinness",    type: "beer",    threshold: 3 },
  { id: "warrior",      icon: "🍺", name: "Warrior",      desc: "6 Guinness",    type: "beer",    threshold: 6 },
  { id: "legend",       icon: "🍺", name: "Legend",       desc: "10 Guinness",   type: "beer",    threshold: 10 },
  { id: "hero",         icon: "🏆", name: "Mission Hero", desc: "5 missioni",    type: "mission", threshold: 5 },
  { id: "spirit",       icon: "☘",  name: "Irish Spirit", desc: "Tutte le missioni", type: "mission", threshold: 10 }
];

// =============================================
// LOGIN
// =============================================
window.handleLogin = function() {
  const input = document.getElementById("usernameInput");
  const name = input.value.trim();
  if (!name) {
    input.focus();
    return;
  }
  currentUser = name;
  localStorage.setItem("stagdo_user", name);
  enterApp();
};

// Gestisce tasto Enter nel campo login
document.getElementById("usernameInput").addEventListener("keydown", e => {
  if (e.key === "Enter") handleLogin();
});

function enterApp() {
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("mainApp").classList.add("active");
  document.getElementById("topbarName").textContent = currentUser;
  loadMissions();
  initLeaderboards();
  initMap();
}

// Auto-login se già salvato
const savedUser = localStorage.getItem("stagdo_user");
if (savedUser) {
  currentUser = savedUser;
  enterApp();
}

// =============================================
// NAVIGAZIONE TAB
// =============================================
window.showTab = function(tabName) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById("tab-" + tabName).classList.add("active");
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

  // Fix: ridisegna mappa quando diventa visibile
  if (tabName === "map") {
    setTimeout(() => { if (window._map) window._map.invalidateSize(); }, 200);
  }
};

// =============================================
// MISSIONI
// =============================================
let completedMissions = new Set();

function loadMissions() {
  const list = document.getElementById("missionsList");
  list.innerHTML = "";

  MISSIONS.forEach((m, i) => {
    const li = document.createElement("li");
    li.className = "mission-item";
    li.id = "mission-" + m.id;
    li.style.animationDelay = (i * 0.05) + "s";
    li.innerHTML = `
      <span class="mission-icon">☘</span>
      <div class="mission-info">
        <div class="mission-title">${m.title}</div>
        <div class="mission-xp">+${m.xp} XP</div>
      </div>
      <button class="mission-btn" onclick="toggleMission('${m.id}', '${m.title}')">✔ Fatto</button>
    `;
    list.appendChild(li);
  });

  // Ascolta missioni completate in tempo reale per questo utente
  const q = query(collection(db, "missions"), where("user", "==", currentUser));
  onSnapshot(q, snapshot => {
    completedMissions.clear();
    snapshot.forEach(doc => completedMissions.add(doc.data().missionId));
    // Defer so outerHTML replacement settles before we re-query buttons
    setTimeout(() => {
      updateMissionUI();
      updateTopbarXP();
      updateBadges();
    }, 0);
  });
}

function updateMissionUI() {
  MISSIONS.forEach(m => {
    const li = document.getElementById("mission-" + m.id);
    if (!li) return;
    const btn = li.querySelector("button");
    if (!btn) return;
    if (completedMissions.has(m.id)) {
      li.classList.add("done");
      btn.outerHTML = `<button class="mission-btn undo-btn" onclick="toggleMission('${m.id}', '${m.title}')">↩ Annulla</button>`;
    } else {
      li.classList.remove("done");
      btn.outerHTML = `<button class="mission-btn" onclick="toggleMission('${m.id}', '${m.title}')">✔ Fatto</button>`;
    }
  });
}

// =============================================
// TOGGLE MISSIONE (completa o annulla)
// =============================================
window.toggleMission = async function(missionId, missionTitle) {
  // Disabilita il bottone subito per evitare doppi click
  const btn = document.querySelector(`#mission-${missionId} .mission-btn`);
  if (btn) btn.disabled = true;

  try {
    if (!completedMissions.has(missionId)) {
      // COMPLETA
      await addDoc(collection(db, "missions"), {
        user: currentUser,
        missionId: missionId,
        mission: missionTitle,
        xp: 10,
        time: Date.now()
      });
      showToast("🏆 +10 XP — Missione completata!");
    } else {
      // ANNULLA
      const q = query(
        collection(db, "missions"),
        where("user", "==", currentUser),
        where("missionId", "==", missionId)
      );
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      showToast("↩ Missione annullata — -10 XP");
    }
    // Il bottone viene ridisegnato da onSnapshot → updateMissionUI
  } catch (e) {
    console.error(e);
    showToast("❌ Errore, riprova");
    const btnRetry = document.querySelector(`#mission-${missionId} .mission-btn`);
    if (btnRetry) btnRetry.disabled = false;
  }
};

// =============================================
// GUINNESS
// =============================================
window.addBeer = async function() {
  const btn = document.querySelector(".beer-add-btn");
  if (btn) btn.disabled = true;
  try {
    await addDoc(collection(db, "beer"), {
      user: currentUser,
      xp: 2,
      time: Date.now()
    });
    showToast("🍺 +1 Guinness! +2 XP");
  } catch (e) {
    console.error(e);
    showToast("❌ Errore, riprova");
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.removeBeer = async function() {
  const count = parseInt(document.getElementById("myBeerCount").textContent) || 0;
  if (count <= 0) { showToast("🍺 Sei già a zero!"); return; }
  const btn = document.querySelector(".beer-remove-btn");
  if (btn) btn.disabled = true;
  try {
    // Trova l'ultimo documento beer di questo utente e lo elimina
    const q = query(collection(db, "beer"), where("user", "==", currentUser));
    const snap = await getDocs(q);
    if (snap.empty) { showToast("🍺 Nessuna birra da rimuovere"); return; }
    // Prendi l'ultimo aggiunto (massimo time)
    const sorted = snap.docs.sort((a, b) => b.data().time - a.data().time);
    await deleteDoc(sorted[0].ref);
    showToast("↩ -1 Guinness rimossa");
  } catch (e) {
    console.error(e);
    showToast("❌ Errore, riprova");
  } finally {
    if (btn) btn.disabled = false;
  }
};

// =============================================
// LEADERBOARD (REALTIME)
// =============================================
function initLeaderboards() {

  // --- XP Leaderboard (missioni + beer) ---
  // Ascolta missioni
  let missionScores = {};
  let beerScores = {};

  onSnapshot(collection(db, "missions"), snapshot => {
    missionScores = {};
    snapshot.forEach(d => {
      const data = d.data();
      missionScores[data.user] = (missionScores[data.user] || 0) + 10;
    });
    renderXPLeaderboard(missionScores, beerScores);
  });

  onSnapshot(collection(db, "beer"), snapshot => {
    beerScores = {};
    let myCount = 0;
    snapshot.forEach(d => {
      const data = d.data();
      beerScores[data.user] = (beerScores[data.user] || 0) + 1;
      if (data.user === currentUser) myCount++;
    });
    document.getElementById("myBeerCount").textContent = myCount;
    renderXPLeaderboard(missionScores, beerScores);
    renderBeerLeaderboard(beerScores);
    updateBadges();
    updateTopbarXP();
  });
}

function renderXPLeaderboard(missionScores, beerScores) {
  const allUsers = new Set([...Object.keys(missionScores), ...Object.keys(beerScores)]);
  const combined = {};
  allUsers.forEach(u => {
    combined[u] = (missionScores[u] || 0) + ((beerScores[u] || 0) * 2);
  });

  const sorted = Object.entries(combined).sort((a, b) => b[1] - a[1]);
  const list = document.getElementById("xpLeaderboard");
  list.innerHTML = "";
  const rankClasses = ["gold", "silver", "bronze"];

  sorted.forEach(([name, xp], i) => {
    const missions = Math.floor((missionScores[name] || 0) / 10);
    const beers = beerScores[name] || 0;
    const badge = getBadgeIcon(beers, missions);
    const li = document.createElement("li");
    li.className = "leader-item" + (name === currentUser ? " me" : "");
    li.style.animationDelay = (i * 0.05) + "s";
    li.innerHTML = `
      <span class="leader-rank ${rankClasses[i] || ''}">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
      <div class="leader-info">
        <div class="leader-name">${name}${name === currentUser ? " 👤" : ""}</div>
        <div class="leader-detail">${missions} missioni · ${beers} 🍺</div>
      </div>
      <span class="leader-badge-icon">${badge}</span>
      <span class="leader-value">${xp} XP</span>
    `;
    list.appendChild(li);
  });
}

function renderBeerLeaderboard(beerScores) {
  const sorted = Object.entries(beerScores).sort((a, b) => b[1] - a[1]);
  const list = document.getElementById("beerLeaderboard");
  list.innerHTML = "";

  sorted.forEach(([name, count], i) => {
    const li = document.createElement("li");
    li.className = "leader-item" + (name === currentUser ? " me" : "");
    li.style.animationDelay = (i * 0.05) + "s";
    li.innerHTML = `
      <span class="leader-rank ${["gold","silver","bronze"][i] || ''}">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
      <div class="leader-info">
        <div class="leader-name">${name}${name === currentUser ? " 👤" : ""}</div>
      </div>
      <span class="leader-value">🍺 ${count}</span>
    `;
    list.appendChild(li);
  });
}

// =============================================
// TOPBAR XP
// =============================================
function updateTopbarXP() {
  // Calcola XP del giocatore attuale
  const missionXP = completedMissions.size * 10;
  const beerCount = parseInt(document.getElementById("myBeerCount").textContent) || 0;
  const total = missionXP + (beerCount * 2);
  document.getElementById("topbarXP").textContent = total;

  const badge = getBadgeIcon(beerCount, completedMissions.size);
  document.getElementById("topbarBadge").textContent = badge;
}

// =============================================
// BADGES
// =============================================
function getBadgeIcon(beers, missions) {
  if (beers >= 10) return "🍺 Legend";
  if (beers >= 6)  return "🍺 Warrior";
  if (beers >= 3)  return "🍺 Rookie";
  if (missions >= 10) return "☘ Irish Spirit";
  if (missions >= 5)  return "🏆 Mission Hero";
  return "";
}

function updateBadges() {
  const beerCount = parseInt(document.getElementById("myBeerCount").textContent) || 0;
  const missionCount = completedMissions.size;
  const grid = document.getElementById("myBadges");
  grid.innerHTML = "";

  BADGES.forEach(b => {
    const current = b.type === "beer" ? beerCount : missionCount;
    const unlocked = current >= b.threshold;
    const card = document.createElement("div");
    card.className = "badge-card " + (unlocked ? "unlocked" : "locked");
    card.innerHTML = `
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-cond">${b.desc}</div>
    `;
    grid.appendChild(card);
  });
}

// =============================================
// MAPPA
// =============================================
function initMap() {
  if (window._map) return;

  const map = L.map("map").setView([53.3437, -6.2644], 14);
  window._map = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  const pubs = [
    { name: "Temple Bar",      lat: 53.3455, lng: -6.2644 },
    { name: "The Brazen Head", lat: 53.3437, lng: -6.2751 },
    { name: "The Long Hall",   lat: 53.3419, lng: -6.2620 },
    { name: "Mulligans",       lat: 53.3470, lng: -6.2567 },
    { name: "O'Donoghue's",   lat: 53.3396, lng: -6.2554 }
  ];

  pubs.forEach(pub => {
    const marker = L.marker([pub.lat, pub.lng]).addTo(map);
    marker.bindPopup(`
      <div class="pub-popup"><div class="pub-popup-name">🍺 ${pub.name}</div>
      <button class="pub-popup-btn" onclick="checkInPub('${pub.name}')">
        📍 CHECK-IN (+5 XP)
      </button>
    `);
  });
}

// Tiene traccia dei check-in già fatti in questa sessione
const checkedInPubs = new Set();

window.checkInPub = async function(pubName) {
  if (checkedInPubs.has(pubName)) {
    showToast("📍 Già fatto check-in qui!");
    return;
  }
  try {
    await addDoc(collection(db, "checkins"), {
      user: currentUser,
      pub: pubName,
      xp: 5,
      time: Date.now()
    });
    checkedInPubs.add(pubName);
    showToast(`📍 Check-in: ${pubName} +5 XP!`);
  } catch (e) {
    showToast("❌ Errore check-in");
  }
};

// =============================================
// TOAST NOTIFICATION
// =============================================
let toastTimeout;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove("show"), 2800);
}

// Esponi per uso da popup Leaflet
window.checkInPub = window.checkInPub;
