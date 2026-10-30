// Testlauf für das Klavierspiel, ohne Browser.
// Lädt das Skript aus der HTML-Datei mit Attrappen und prüft:
//  - läuft das Skript überhaupt durch
//  - stehen alle Noten der Melodie auf der Klaviatur
//  - liegt jede Taste nur einmal
//  - wechseln sich die Phrasen wirklich ab
//  - überschneiden sich zwei Noten derselben Taste im Trefferfenster
//
// Aufruf:  node klaviertest.js index.html

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
  performance: { now: () => 0 },
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
                     KL_GUT, klSongBauen, RAEUME, klavierStarten, klavierGeloest };
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

console.log(fehler === 0 ? "\nAlles in Ordnung." : "\n" + fehler + " Fehler.");
process.exit(fehler === 0 ? 0 : 1);
