// Prüflauf für das Valentinsspiel, ohne Browser.
// Lädt das Skript aus der HTML-Datei mit Attrappen und prüft:
//  - läuft das Skript überhaupt durch
//  - stehen alle Noten der Melodie auf der Klaviatur
//  - liegt jede Taste nur einmal
//  - wechseln sich die Phrasen wirklich ab
//  - überschneiden sich zwei Noten derselben Taste im Trefferfenster
//
// Aufruf:  node prueflauf.js index.html

const fs = require("fs");
const vm = require("vm");

const datei = process.argv[2] || "index.html";
const html = fs.readFileSync(datei, "utf8");
const skript = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));

// ---------- Attrappen ----------
function attrappe(name) {
  const el = {
    _name: name, id: "", className: "", textContent: "", innerHTML: "",
    style: new Proxy({}, { get: () => "", set: () => true }),
    classList: { add() {}, remove() {}, contains() { return false; } },
    children: [], offsetWidth: 100, clientHeight: 300, clientWidth: 800,
    appendChild(k) { this.children.push(k); return k; },
    removeChild() {}, remove() {},
    addEventListener() {}, removeEventListener() {},
    querySelector() { return attrappe("q"); },
    querySelectorAll() { return []; },
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 60, bottom: 80, width: 60, height: 80 };
    },
    getContext() { return stift; },
    focus() {}, blur() {}, closest() { return null; }
  };
  return el;
}
const stift = new Proxy({}, {
  get: (z, k) => (k === "canvas" ? attrappe("canvas") : () => {}),
  set: () => true
});
const document = {
  head: attrappe("head"), body: attrappe("body"),
  activeElement: null,
  getElementById: (id) => attrappe(id),
  createElement: (t) => attrappe(t),
  querySelector: () => attrappe("q"),
  querySelectorAll: () => [],
  addEventListener() {}
};
const umgebung = {
  document, console,
  location: { search: "" },
  Image: function () { this.src = ""; this.width = 1600; this.height = 900; this.complete = true; },
  addEventListener() {}, removeEventListener() {},
  requestAnimationFrame() { return 1; }, cancelAnimationFrame() {},
  setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; },
  performance: { now: () => umgebung.__uhr },
  __uhr: 0,
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  AudioContext: function () {
    this.state = "running"; this.currentTime = 0;
    this.createBiquadFilter = () => ({ frequency: {}, Q: {}, connect() {} });
    this.createOscillator = () => ({ frequency: {}, connect: () => ({ connect() {} }), start() {}, stop() {} });
    this.createGain = () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => ({ connect() {} }) });
    this.resume = () => {};
  },
  devicePixelRatio: 1,
  URLSearchParams, URL, Math, Date, JSON, Set, Map, Promise, Proxy
};
umgebung.window = umgebung;
umgebung.globalThis = umgebung;

// const-Namen landen nicht auf dem Kontext — deshalb am Ende einsammeln
const einsammeln = `
globalThis.__aus = { KL_WEISS, KL_SCHWARZ, KL_ALLE, KL_VON_TASTE, KL_PHRASEN,
                     KL_GUT, klSongBauen, RAEUME, klavierStarten, klavierGeloest,
                     FIGUREN, MEINE_FIGUR, figurMalen,
                     springt, sprungAnteil, SPRUNG_DAUER, SPRUNG_HOEHE, SPRUNG_BILD,
                     starteSprung: () => { sprungStart = performance.now(); },
                     TT_ZIEL, TT_SCHLAEGER_B, TT_BALL, TT_UEBERLAPP, TT_SCHLAEGER_Y,
                     TT_TEMPO_START, TT_TEMPO_MAX, TT_PARTNER, TT_UNTEN,
                     ttBall, ttAufschlag, ttBallSchritt, ttGrenzen, ttOberflaeche,
                     AUTOMAT_SPIEL, automatStarten,
                     LOBBY_QUELLE, lobbyOeffnen, lobbyBereit, lobbySchliessen,
                     lobbyIstOffen: () => lobbyOffen, lobbyKarte: () => lobbyBau.karte.innerHTML,
                     setzeMeinX: (v) => { ttMeinX = v; }, holeMeinX: () => ttMeinX,
                     holeTreffer: () => ttTreffer, holeServiert: () => ttServiert };
`;
const kasten = vm.createContext(umgebung);
try {
  vm.runInContext(skript + einsammeln, kasten, { filename: datei });
} catch (e) {
  console.error("FEHLER beim Laden des Skripts: " + e.message);
  process.exit(1);
}

// ---------- Prüfungen ----------
let fehler = 0;
function pruefe(bedingung, text) {
  if (bedingung) console.log("  ok    " + text);
  else { console.log("  FEHLT " + text); fehler++; }
}

const aus = kasten.__aus;
const { KL_WEISS, KL_SCHWARZ, KL_ALLE, KL_VON_TASTE, KL_PHRASEN,
        KL_GUT, klSongBauen, RAEUME } = aus;

console.log("Klaviatur");
pruefe(KL_WEISS.length + KL_SCHWARZ.length === Object.keys(KL_ALLE).length,
       "keine Note doppelt (" + Object.keys(KL_ALLE).length + " Tasten)");
const kuerzel = [...KL_WEISS, ...KL_SCHWARZ].map((t) => t.kuerzel.toLowerCase());
pruefe(new Set(kuerzel).size === kuerzel.length, "jede Rechnertaste nur einmal vergeben");
pruefe(Object.keys(KL_VON_TASTE).length === kuerzel.length, "Zuordnung Taste zu Note vollständig");

console.log("Melodie");
const song = klSongBauen();
const unbekannt = song.noten.filter((n) => !KL_ALLE[n.note]).map((n) => n.note);
pruefe(unbekannt.length === 0, "alle Noten liegen auf der Klaviatur" +
       (unbekannt.length ? " — fehlt: " + [...new Set(unbekannt)].join(", ") : ""));
pruefe(song.noten.length > 20, song.noten.length + " Noten, Länge " +
       Math.round(song.laenge / 1000) + " Sekunden");

const wer = KL_PHRASEN.map((p) => p.wer);
let laeufe = 1, laengster = 1;
wer.forEach((w, i) => {
  if (i === 0) return;
  laeufe = (w === wer[i - 1]) ? laeufe + 1 : 1;
  laengster = Math.max(laengster, laeufe);
});
pruefe(laengster <= 2, "niemand spielt mehr als zwei Phrasen am St\u00fcck (l\u00e4ngster Lauf " + laengster + ")");
const meine = song.noten.filter((n) => n.wer === 0).length;
const anteil = meine / song.noten.length;
pruefe(anteil > 0.4 && anteil < 0.6,
       "Aufteilung ausgewogen: " + meine + " zu " + (song.noten.length - meine));

// Zwei gleiche Noten zu dicht beieinander: die Trefferfenster überlappen,
// dann wertet ein Tastendruck die falsche.
let eng = [];
song.noten.forEach((a, i) => {
  song.noten.slice(i + 1).forEach((b) => {
    if (a.note === b.note && Math.abs(a.zeit - b.zeit) < KL_GUT * 2 && a.wer === b.wer)
      eng.push(a.note + " bei " + Math.round(a.zeit) + " und " + Math.round(b.zeit) + " ms");
  });
});
pruefe(eng.length === 0, "keine zwei gleichen Noten im selben Trefferfenster" +
       (eng.length ? " — " + eng.join("; ") : ""));

console.log("Anbindung");
const salon = RAEUME[0];
const klavierpunkt = (salon.punkte || []).filter((p) => p.klavier);
pruefe(klavierpunkt.length === 1, "der Salon hat genau einen Klavierpunkt");
pruefe(typeof aus.klavierStarten === "function", "klavierStarten ist erreichbar");
pruefe(typeof aus.klavierGeloest === "boolean", "klavierGeloest ist angelegt");

// Punkte mit derselben Taste im selben Raum — die alte Falle
console.log("Punkte je Raum");
RAEUME.forEach((r, i) => {
  const t = (r.punkte || []).map((p) => p.taste);
  // Nur melden, wenn zwei Punkte mit derselben Taste auch nah beieinander
  // liegen — nur dann waehlt das Spiel den falschen.
  const ps = r.punkte || [];
  ps.forEach((a, j) => ps.slice(j + 1).forEach((b) => {
    if (a.taste !== b.taste) return;
    const mitte = (p) => (p.von !== undefined ? (p.von + p.bis) / 2 : p.x);
    if (Math.abs(mitte(a) - mitte(b)) < 12)
      console.log("  achtung " + i + " " + r.name + ": \"" + a.titel + "\" und \"" +
                  b.titel + "\" liegen beide auf " + a.taste);
  }));
});

// ---------- Die Figuren ----------
const path = require("path");
console.log("Figuren");
const FIGUREN = aus.FIGUREN, MEINE = aus.MEINE_FIGUR;
pruefe(FIGUREN && FIGUREN[MEINE], "die eingestellte Figur \"" + MEINE + "\" ist angelegt");

function bildMass(d) {
  if (!fs.existsSync(d)) return null;
  const b = fs.readFileSync(d);
  if (b.slice(0,4).toString() === "RIFF" && b.slice(8,12).toString() === "WEBP") {
    const art = b.slice(12,16).toString();
    if (art === "VP8X") return [1 + b.readUIntLE(24,3), 1 + b.readUIntLE(27,3)];
    if (art === "VP8L") { const v = b.readUInt32LE(21);
      return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
    if (art === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  }
  if (b.slice(1,4).toString() === "PNG") return [b.readUInt32BE(16), b.readUInt32BE(20)];
  return null;
}

const wurzel = path.dirname(path.resolve(datei));
Object.keys(FIGUREN || {}).forEach((name) => {
  const satz = FIGUREN[name];
  const pfade = [satz.stehen, ...satz.gehen];
  console.log("  " + name + (name === MEINE ? "  (eingestellt)" : ""));
  const fehlend = pfade.filter((p) => !fs.existsSync(path.join(wurzel, p)));
  pruefe(fehlend.length === 0, "  " + pfade.length + " Bilder liegen am richtigen Ort" +
         (fehlend.length ? " — fehlt: " + fehlend.join(", ") : ""));
  const masse = pfade.map((p) => bildMass(path.join(wurzel, p)));
  const echte = masse.filter(Boolean);
  pruefe(echte.length === pfade.length, "  alle Bilder lesbar");
  const gleich = echte.length > 0 &&
        echte.every((g) => g[0] === echte[0][0] && g[1] === echte[0][1]);
  pruefe(gleich, "  alle Bilder gleich gross" +
         (echte.length ? " (" + echte[0].join("x") + ")" : ""));
  if (gleich) {
    const soll = echte[0][0] / echte[0][1];
    pruefe(Math.abs(soll - satz.seiten) < 0.01,
           "  seiten stimmt mit den Bildern (" + soll.toFixed(4) +
           " gegen " + satz.seiten.toFixed(4) + ")");
  }
  pruefe(satz.anker > 0 && satz.anker < 1, "  anker liegt im Bild (" + satz.anker + ")");
  pruefe(satz.gehen[aus.SPRUNG_BILD] !== undefined,
         "  das Sprungbild gibt es (gehen[" + aus.SPRUNG_BILD + "])");
});

// ---------- Hüpfen ----------
console.log("Hüpfen");
umgebung.__uhr = 100000;
pruefe(aus.sprungAnteil() === 0 && !aus.springt(), "am Boden ist die Höhe null");
aus.starteSprung();
const D = aus.SPRUNG_DAUER;
const mitte = (() => { umgebung.__uhr = 100000 + D / 2; return aus.sprungAnteil(); })();
pruefe(Math.abs(mitte - 1) < 0.001, "in der Mitte ist der höchste Punkt (" + mitte.toFixed(3) + ")");
umgebung.__uhr = 100000 + D * 0.02;
const frueh = aus.sprungAnteil();
umgebung.__uhr = 100000 + D * 0.98;
const spaet = aus.sprungAnteil();
pruefe(frueh < 0.1 && spaet < 0.1, "Abflug und Landung liegen am Boden");
umgebung.__uhr = 100000 + D + 1;
pruefe(aus.sprungAnteil() === 0 && !aus.springt(), "nach der Dauer steht sie wieder");

// ---------- Tischtennis ----------
console.log("Tischtennis");
aus.ttOberflaeche();

// Die beiden Haelften muessen sich in der Mitte ueberschneiden, sonst
// faellt der Ball durch die Luecke.
const [ll, lr] = aus.ttGrenzen(true), [rl, rr] = aus.ttGrenzen(false);
const deckeLinks  = lr + aus.TT_SCHLAEGER_B / 2;
const deckeRechts = rl - aus.TT_SCHLAEGER_B / 2;
pruefe(deckeLinks >= 50 && deckeRechts <= 50,
       "die Haelften treffen sich in der Mitte (links bis " + deckeLinks.toFixed(1) +
       ", rechts ab " + deckeRechts.toFixed(1) + ")");
pruefe(lr >= ll && rr >= rl, "beide Schlaeger haben Platz zum Fahren");

// Ein Ballwechsel mit einem Spieler, der immer richtig steht.
function ballwechsel(schritte) {
  aus.ttAufschlag(0);
  let raus = false, tiefstes = 0;
  for (let i = 0; i < schritte; i++) {
    const dt = 1 / 60;
    aus.setzeMeinX(Math.max(ll, Math.min(lr, aus.ttBall.x)));
    aus.TT_PARTNER.schritt(dt, aus.ttBall);
    aus.ttBallSchritt(dt);
    if (aus.ttBall.x < -1 || aus.ttBall.x > 101 || aus.ttBall.y < -1) raus = true;
    tiefstes = Math.max(tiefstes, aus.ttBall.y);
    if (!aus.holeServiert()) break;          // runtergefallen
    if (aus.holeTreffer() >= aus.TT_ZIEL) break;
  }
  return { raus, tiefstes, treffer: aus.holeTreffer(), laeuft: aus.holeServiert() };
}

const lauf = ballwechsel(60 * 90);
pruefe(!lauf.raus, "der Ball bleibt im Feld");
pruefe(lauf.treffer >= aus.TT_ZIEL,
       "mit sicherem Spiel ist das Ziel erreichbar (" + lauf.treffer + " von " + aus.TT_ZIEL + ")");

// Der Ball darf pro Bild nicht weiter springen als der Schlaeger dick ist,
// sonst fliegt er bei hohem Tempo durch ihn hindurch.
const proBild = aus.TT_TEMPO_MAX / 60;
pruefe(proBild < aus.TT_BALL * 2,
       "beim hoechsten Tempo kein Durchschlupf (" + proBild.toFixed(2) +
       " gegen " + (aus.TT_BALL * 2).toFixed(2) + " je Bild)");

// Wie schwer ist es? Ein Spieler, der den Ball erst nach 170 Millisekunden
// sieht und etwas zittert. Das ist kein Beweis, nur ein Mass zum Vergleichen,
// wenn an Breite, Tempo oder Ziel gedreht wird.
function ttVersuch() {
  aus.ttAufschlag(0);
  let x = 25, sp = [], n = 0, best = 0;
  const [l, r] = aus.ttGrenzen(true);
  while (aus.holeServiert() && n < 60 * 300) {
    const dt = 1 / 60;
    sp.push(aus.ttBall.x);
    const alt = sp[Math.max(0, sp.length - 10)];
    const ziel = Math.max(l, Math.min(r, alt + (Math.random() - 0.5) * 7));
    const max = 95 * dt;
    x += Math.max(-max, Math.min(max, ziel - x));
    aus.setzeMeinX(x);
    aus.TT_PARTNER.schritt(dt, aus.ttBall);
    aus.ttBallSchritt(dt);
    best = Math.max(best, aus.holeTreffer());
    n++;
    if (best >= aus.TT_ZIEL) break;
  }
  return best;
}
const proben = [];
for (let i = 0; i < 120; i++) proben.push(ttVersuch());
const quote = proben.filter((v) => v >= aus.TT_ZIEL).length / proben.length;
pruefe(quote > 0.08 && quote < 0.6,
       "Schwierigkeit im Rahmen: " + Math.round(quote * 100) +
       " von 100 Anläufen geschafft (Schläger " + aus.TT_SCHLAEGER_B + " breit)");

// ---------- Lobby ----------
console.log("Lobby");
let gestartet = null, zurueck = 0, melden = null;
const echtesBetreten = aus.LOBBY_QUELLE.betreten;
aus.LOBBY_QUELLE.betreten = function (raum, m) { melden = m; m([]); };

aus.lobbyOeffnen("Probe", "Text", (uebung) => { gestartet = uebung; }, () => { zurueck++; });
pruefe(aus.lobbyIstOffen(), "die Lobby geht auf");
pruefe(gestartet === null, "allein startet nichts");

aus.lobbyBereit(true);
pruefe(gestartet === null, "nur ich bereit startet nichts");

melden([{ name: "Zweiter", bereit: false }]);
pruefe(gestartet === null, "ein Zweiter ohne bereit startet nichts");

melden([{ name: "Zweiter", bereit: true }]);
pruefe(gestartet === false, "beide bereit startet mit echtem Mitspieler");
pruefe(!aus.lobbyIstOffen(), "danach ist die Lobby zu");

gestartet = null;
aus.lobbyOeffnen("Probe", "Text", (u) => { gestartet = u; }, () => { zurueck++; });
const karte = aus.lobbyKarte();
["lobby-bereit", "lobby-uebung", "lobby-weg"].forEach((id) =>
  pruefe(karte.indexOf(id) >= 0, "der Knopf " + id + " ist da"));
pruefe(karte.indexOf("wartet auf einen zweiten") >= 0, "der Wartehinweis steht da");
aus.lobbySchliessen();
aus.LOBBY_QUELLE.betreten = echtesBetreten;

// ---------- Der Automat ----------
console.log("Automat");
const roh = fs.readFileSync(datei, "utf8");
let automatPunkte = 0;
RAEUME.forEach((r) => (r.punkte || []).forEach((p) => { if (p.automat) automatPunkte++; }));
pruefe(automatPunkte === 1, "es gibt genau einen Automatenpunkt");
pruefe(typeof aus.automatStarten === "function", "automatStarten ist erreichbar");
const spielPfad = path.join(path.dirname(path.resolve(datei)), aus.AUTOMAT_SPIEL);
pruefe(fs.existsSync(spielPfad), "das Spiel liegt da, wo der Automat es sucht (" +
       aus.AUTOMAT_SPIEL + ")");
["klavierOffen", "ttOffen", "lobbyOffen", "automatOffen"].forEach((f) =>
  pruefe(roh.indexOf(f + " || ") >= 0 || roh.indexOf("|| " + f) >= 0,
         f + " sperrt die Haustasten mit"));

console.log(fehler === 0 ? "\nAlles in Ordnung." : "\n" + fehler + " Fehler.");
process.exit(fehler === 0 ? 0 : 1);
