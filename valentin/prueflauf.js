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
                     starteSprung: () => { sprungStart = performance.now(); } };
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

// ---------- Die Figur ----------
const path = require("path");
console.log("Figur");
const FIGUREN = aus.FIGUREN, MEINE = aus.MEINE_FIGUR;
pruefe(FIGUREN && FIGUREN[MEINE], "die eingestellte Figur \"" + MEINE + "\" ist angelegt");
if (FIGUREN && FIGUREN[MEINE]) {
  const satz = FIGUREN[MEINE];
  const pfade = [satz.stehen, ...satz.gehen];
  const wurzel = path.dirname(path.resolve(datei));
  const fehlend = pfade.filter((p) => !fs.existsSync(path.join(wurzel, p)));
  pruefe(fehlend.length === 0,
         pfade.length + " Bilder liegen am richtigen Ort" +
         (fehlend.length ? " — fehlt: " + fehlend.join(", ") : ""));
  // Alle Bilder muessen gleich gross sein, sonst springt die Figur
  const groessen = pfade.map((p) => {
    const d = path.join(wurzel, p);
    if (!fs.existsSync(d)) return null;
    const b = fs.readFileSync(d);
    if (b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP") {
      const art = b.slice(12, 16).toString();
      if (art === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      if (art === "VP8L") {
        const v = b.readUInt32LE(21);
        return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)];
      }
      if (art === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    }
    if (b.slice(1, 4).toString() === "PNG") return [b.readUInt32BE(16), b.readUInt32BE(20)];
    return null;
  });
  const echte = groessen.filter(Boolean);
  pruefe(echte.length === pfade.length, "alle Bilder lesbar");
  const gleich = echte.every((g) => g[0] === echte[0][0] && g[1] === echte[0][1]);
  pruefe(gleich, "alle Bilder gleich gross" +
         (echte.length ? " (" + echte.map((g) => g.join("x")).join(", ") + ")" : ""));
  if (gleich && echte.length) {
    const soll = echte[0][0] / echte[0][1];
    pruefe(Math.abs(soll - satz.seiten) < 0.01,
           "seiten stimmt mit den Bildern (" + soll.toFixed(4) +
           " gegen " + satz.seiten.toFixed(4) + ")");
  }
  pruefe(satz.anker > 0 && satz.anker < 1, "anker liegt im Bild (" + satz.anker + ")");
}

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
const satz2 = aus.FIGUREN[aus.MEINE_FIGUR];
pruefe(satz2 && satz2.gehen[aus.SPRUNG_BILD] !== undefined,
       "das Sprungbild gibt es (gehen[" + aus.SPRUNG_BILD + "])");

console.log(fehler === 0 ? "\nAlles in Ordnung." : "\n" + fehler + " Fehler.");
process.exit(fehler === 0 ? 0 : 1);
