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
                     AUTOMAT_SPIEL, automatStarten, figurWahlOeffnen,
                     LABYRINTH_SEITE, labyrinthStarten,
                     MERK_SCHLUESSEL, standSichern, standLesen,
                     GEGENSTAENDE, INVENTAR_TABELLE, hat, einstecken,
                     SPIELER_TABELLE, SCHLUESSEL_FACH, schluesselBauen, schluesselSchoen,
                     figurBelegen, figurUebernehmen, belegungLaden,
                     NETZ_URL, NETZ_SCHLUESSEL, NETZ_TAKT, HOERWEITE,
                     netzStarten, netzSenden, netzAndereImRaum, netzVergeben,
                     LOBBY_QUELLE, lobbyOeffnen, lobbyWaehlen, lobbySchliessen, lobbyLosgehen,
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
  const pfade = satz.stehen ? [satz.stehen, ...satz.gehen] : [];
  console.log("  " + name + (name === MEINE ? "  (eingestellt)" : "") +
              (pfade.length ? "" : "  — noch ohne Bilder"));
  if (!pfade.length) {
    pruefe(typeof satz.name === "string" && satz.name.length > 0,
           "  die Figur hat einen Namen (" + satz.name + ")");
    return;
  }
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
  pruefe(typeof satz.name === "string" && satz.name.length > 0,
         "  die Figur hat einen Namen (" + satz.name + ")");
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
aus.LOBBY_QUELLE.betreten = function (raum, seite, m) { melden = m; m([]); };

aus.lobbyOeffnen("Probe", "Text", (uebung) => { gestartet = uebung; },
                 () => { zurueck++; }, "probe", "laeufer");
pruefe(aus.lobbyIstOffen(), "die Lobby geht auf");
pruefe(gestartet === null, "allein startet nichts");

melden([{ id: "fremd", name: "Zweiter", seite: "monitor", bereit: false, partner: null }]);
pruefe(gestartet === null, "ein Zweiter allein startet nichts");

aus.lobbyWaehlen("fremd");
pruefe(gestartet === null, "nur ich habe gew\u00e4hlt — das reicht nicht");

const karte = aus.lobbyKarte();
pruefe(karte.indexOf("oben auf dem Dach") >= 0,
       "bei zwei Seiten steht dabei, wer wo wartet");
pruefe(karte.indexOf("lobby-uebung") >= 0, "der Knopf f\u00fcr den \u00dcbungspartner ist da");
pruefe(karte.indexOf("lobby-bereit") < 0,
       "statt eines Bereit-Knopfes w\u00e4hlt man jemanden aus");
// Beide Seiten müssen starten, nicht nur die, die das Paar zuerst sieht
pruefe(typeof aus.lobbyLosgehen === "function", "beide Seiten k\u00f6nnen starten");
aus.lobbyLosgehen("fremd");
pruefe(gestartet === false, "die Nachricht des anderen startet auch mich");
gestartet = null;
aus.lobbyLosgehen("fremd");
pruefe(gestartet === null, "zweimal starten geht nicht");

aus.lobbySchliessen();
aus.LOBBY_QUELLE.betreten = echtesBetreten;
console.log("Automat");
const roh = fs.readFileSync(datei, "utf8");
let automatPunkte = 0;
RAEUME.forEach((r) => (r.punkte || []).forEach((p) => { if (p.automat) automatPunkte++; }));
pruefe(automatPunkte === 1, "es gibt genau einen Automatenpunkt");
pruefe(typeof aus.automatStarten === "function", "automatStarten ist erreichbar");
const spielPfad = path.join(path.dirname(path.resolve(datei)), aus.AUTOMAT_SPIEL);
pruefe(fs.existsSync(spielPfad), "das Spiel liegt da, wo der Automat es sucht (" +
       aus.AUTOMAT_SPIEL + ")");
pruefe(roh.includes('AUTOMAT_SPIEL + "?oben="'),
       "der Automat gibt den Namen der Figur mit");
const zweiHtml = fs.readFileSync(spielPfad, "utf8");
pruefe(zweiHtml.includes("nameLesen('oben'"),
       "die Schlittenseite liest den Namen aus der Adresse");
["klavierOffen", "ttOffen", "lobbyOffen", "automatOffen"].forEach((f) =>
  pruefe(roh.indexOf(f + " || ") >= 0 || roh.indexOf("|| " + f) >= 0,
         f + " sperrt die Haustasten mit"));

// ---------- Wer spielt welche Haelfte ----------
console.log("Rollenverteilung am Klavier");
pruefe(roh.includes("function klSeiteBestimmen(partnerId)"),
       "die Seite wird aus den beiden Kennungen bestimmt");
pruefe(roh.includes("klIchBin = partnerId && String(netzIch) > String(partnerId) ? 1 : 0;"),
       "die kleinere Kennung spielt die erste H\u00e4lfte — beide rechnen dasselbe aus");
pruefe(!/n\.wer === 0/.test(roh) && !/n\.wer !== 0/.test(roh),
       "nirgends steht mehr fest, dass ich die erste H\u00e4lfte spiele");
pruefe(roh.includes("klSeiteBestimmen(mit && mit.id)"),
       "der Partner aus der Lobby entscheidet die Seite");
pruefe(roh.includes("const klAnderer = () => (klIchBin === 0 ? 1 : 0);"),
       "der \u00dcbungspartner \u00fcbernimmt die andere H\u00e4lfte");

// ---------- Figurenauswahl ----------
console.log("Figurenauswahl");
const namen = Object.keys(FIGUREN).map((k) => FIGUREN[k].name);
pruefe(Object.keys(FIGUREN).length === 6, Object.keys(FIGUREN).length + " Figuren sind angelegt");
pruefe(new Set(namen).size === namen.length, "kein Name doppelt (" + namen.join(", ") + ")");
pruefe(Object.keys(FIGUREN).every((k) => FIGUREN[k].farbe),
       "jede Figur hat eine Farbe f\u00fcr den Platzhalter");
pruefe(typeof aus.figurWahlOeffnen === "function", "die Auswahl ist erreichbar");
pruefe(roh.includes("localStorage.setItem(\"valentin_figur\""), "die Wahl wird gemerkt");
pruefe(roh.includes("wahlOffen) return"), "w\u00e4hrend der Auswahl h\u00f6rt das Haus nicht auf Tasten");
const ohneBild = Object.keys(FIGUREN).filter((k) => !FIGUREN[k].stehen);
pruefe(ohneBild.length === 4, ohneBild.length + " Figuren warten noch auf Bilder (" +
       ohneBild.join(", ") + ")");

// ---------- Die Verbindung ----------
console.log("Verbindung");
pruefe(/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(aus.NETZ_URL),
       "die Projektadresse sieht richtig aus (" + aus.NETZ_URL + ")");
if (!aus.NETZ_SCHLUESSEL) {
  console.log("  ----  kein Schl\u00fcssel eingetragen — das Spiel l\u00e4uft allein");
} else {
  pruefe(!/^eyJ.*service_role/.test(aus.NETZ_SCHLUESSEL) &&
         aus.NETZ_SCHLUESSEL.indexOf("service_role") < 0,
         "es ist nicht der service_role-Schl\u00fcssel");
  pruefe(aus.NETZ_SCHLUESSEL.startsWith("sb_publishable_") ||
         aus.NETZ_SCHLUESSEL.startsWith("eyJ"),
         "der Schl\u00fcssel hat die erwartete Form");
}
pruefe(roh.includes("supabase-js@2.45.4"), "die Bibliothek ist auf eine Fassung festgenagelt");
pruefe(typeof aus.netzStarten === "function" && typeof aus.netzAndereImRaum === "function",
       "die Netzfunktionen sind da");
pruefe(aus.NETZ_TAKT >= 50 && aus.NETZ_TAKT <= 250,
       "der Sendetakt liegt im Rahmen (" + aus.NETZ_TAKT + " ms)");
pruefe(aus.HOERWEITE > 0 && aus.HOERWEITE < 100,
       "die H\u00f6rweite ist ein Teil des Raums (" + aus.HOERWEITE + " %)");

// Gesendete und empfangene Rundruf-Namen muessen zusammenpassen
const gesendet = [...roh.matchAll(/event: "([a-z]+)",\s*\n?\s*payload/g)].map((m) => m[1]);
const gehoert  = [...roh.matchAll(/"broadcast", \{ event: "([a-z]+)" \}/g)].map((m) => m[1]);
[...new Set(gesendet)].forEach((e) =>
  pruefe(gehoert.includes(e), "was als \"" + e + "\" gesendet wird, wird auch geh\u00f6rt"));
pruefe(gehoert.length >= 2, gehoert.length + " Arten von Rundruf (" + gehoert.join(", ") + ")");
pruefe(roh.includes("const malenAllein = malen;") && roh.includes("const sagenAllein = sagen;"),
       "Zeichnen und Sprechen sind eingehängt, ohne das Bestehende zu \u00e4ndern");
pruefe(roh.includes("vordergrundMalen = function (raum) {\n  netzAndereImRaum(raum);"),
       "die anderen werden im Raum gezeichnet, nicht auf dem Bildschirm");
pruefe(roh.includes("function netzFigurMalen(a, raum)"),
       "die fremde Figur bekommt den Raum mitgegeben");
pruefe(roh.includes("if (!NETZ_SCHLUESSEL ||"),
       "ohne Schl\u00fcssel startet nichts und das Spiel l\u00e4uft allein weiter");
pruefe(roh.includes('localStorage.getItem(NETZ_ICH_FACH)'),
       "die eigene Kennung bleibt \u00fcber das Neuladen hinweg dieselbe");
pruefe(roh.includes("if (d.figur && d.figur === MEINE_FIGUR) return;"),
       "wer dieselbe Figur spielt wie ich, wird nicht als Fremder gezeichnet");

// ---------- Wiederkommen ----------
console.log("Wiederkommen");
pruefe(typeof aus.standLesen === "function" && typeof aus.standSichern === "function",
       "Standort merken und lesen sind da");
pruefe(roh.includes('addEventListener("pagehide", standSichern)'),
       "beim Weggehen wird gesichert");
pruefe(roh.includes("if (raum.geheim) return null;"),
       "im Geheimraum wacht niemand hinter verschlossener T\u00fcr auf");
pruefe(roh.includes("Math.max(raum.links, Math.min(raum.rechts"),
       "der gemerkte Platz wird auf die Anschl\u00e4ge des Raums begrenzt");
pruefe(roh.includes("if (standAlt && wahlOffen) figurWahlSchliessen();"),
       "wer schon gew\u00e4hlt hat, wird nicht nochmal gefragt");
pruefe(roh.includes("spielt gerade deine Figur"),
       "ist die eigene Figur vergeben, wird neu gew\u00e4hlt");
pruefe(aus.MERK_SCHLUESSEL && aus.MERK_SCHLUESSEL.indexOf("valentin") === 0,
       "der Speicherplatz heisst nach dem Spiel (" + aus.MERK_SCHLUESSEL + ")");

// ---------- Chatten ----------
console.log("Chatten");
pruefe(roh.includes('if (e.key !== "Enter" && e.keyCode !== 13) return;'),
       "Enter \u00f6ffnet das Feld");
pruefe(roh.includes("Object.keys(tasten).forEach((k) => (tasten[k] = false));"),
       "gedr\u00fcckte Tasten werden beim \u00d6ffnen vergessen");
pruefe(roh.includes('if (editModus || umrissModus) return;'),
       "im Einricht- und Umrissmodus bleibt Enter, was es war");
pruefe(roh.includes('satzfeld.value = ""; satzfeld.blur();'),
       "Escape bricht ab, ohne zu schicken");
pruefe(/satzfeld\.focus\(\);[\s\S]{0,400}\}, true\);/.test(roh),
       "der Zuh\u00f6rer ist im Abfangen angemeldet und kommt vor allen anderen");
pruefe(roh.includes('wo.tagName === "INPUT"'),
       "in anderen Eingabefeldern funkt Enter nicht dazwischen");
pruefe(roh.includes("#satzfeld.wach"), "das Feld leuchtet kurz auf, wenn es wach wird");
["klavierOffen", "ttOffen", "lobbyOffen", "automatOffen", "wahlOffen"].forEach((f) => {
  const stelle = roh.indexOf('if (e.key !== "Enter" && e.keyCode !== 13) return;');
  pruefe(roh.slice(stelle, stelle + 900).indexOf(f) >= 0,
         "bei offenem " + f + " \u00f6ffnet Enter nichts");
});

// ---------- Vordergruende ----------
console.log("Vordergr\u00fcnde");
RAEUME.forEach((r, i) => {
  if (r.vordergrundbild) {
    const d = path.join(wurzel, r.vordergrundbild);
    pruefe(fs.existsSync(d), "  " + r.name + ": " + r.vordergrundbild + " liegt da");
    const bild = bildMass(d);
    const raumbild = r.bild ? bildMass(path.join(wurzel, r.bild)) : null;
    if (bild && raumbild) {
      pruefe(Math.abs(bild[0] / bild[1] - raumbild[0] / raumbild[1]) < 0.01,
             "  " + r.name + ": Vordergrund hat dasselbe Seitenverh\u00e4ltnis wie der Raum (" +
             bild.join("x") + " gegen " + raumbild.join("x") + ")");
    }
  }
  (r.vorne || []).forEach((v, j) => {
    const u = v.umriss || [];
    pruefe(u.length >= 3, "  " + r.name + ": Umriss " + j + " hat " + u.length + " Punkte");
    const drin = u.every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 100);
    pruefe(drin, "  " + r.name + ": Umriss " + j + " liegt im Bild");
  });
});

// ---------- Inventar ----------
console.log("Inventar");
const dinge = Object.keys(aus.GEGENSTAENDE || {});
pruefe(dinge.length > 0, dinge.length + " Gegenstand/Gegenst\u00e4nde angelegt (" + dinge.join(", ") + ")");
dinge.forEach((g) => {
  const d = aus.GEGENSTAENDE[g];
  pruefe(d.name && d.zeichen && d.text, "  " + g + " hat Name, Zeichen und Text");
});
const geber = [];
RAEUME.forEach((r) => (r.punkte || []).forEach((p) => {
  if (p.gibt) geber.push(r.name + " / " + p.titel + " -> " + p.gibt);
}));
pruefe(geber.length > 0, "im Haus liegen Gegenst\u00e4nde: " + geber.join("; "));
geber.forEach((g) => {
  const was = g.split(" -> ")[1];
  pruefe(!!aus.GEGENSTAENDE[was], "  \"" + was + "\" ist auch angelegt");
});
pruefe(geber.filter((g) => g.endsWith("headset")).length >= 2,
       "es gibt mindestens zwei Headsets — sonst kann nur einer reden");
pruefe(fs.existsSync(path.join(wurzel, "inventar.sql")), "das SQL zum Anlegen liegt dabei");
if (fs.existsSync(path.join(wurzel, "inventar.sql"))) {
  const sql = fs.readFileSync(path.join(wurzel, "inventar.sql"), "utf8");
  pruefe(sql.includes("enable row level security"), "die Tabelle ist gesch\u00fctzt");
  pruefe(!/for update|for delete/.test(sql), "\u00e4ndern und l\u00f6schen sind niemandem erlaubt");
  pruefe(sql.includes(aus.INVENTAR_TABELLE), "SQL und Spiel meinen dieselbe Tabelle");
}
pruefe(roh.includes("const punktOeffnenAllein = punktOeffnen;"),
       "das Aufheben h\u00e4ngt sich an, ohne das Bestehende zu \u00e4ndern");

// ---------- Figurenbelegung ----------
console.log("Figurenbelegung");
pruefe(typeof aus.figurBelegen === "function" && typeof aus.figurUebernehmen === "function",
       "Belegen und \u00dcbernehmen sind da");
const probe = aus.schluesselBauen();
pruefe(probe.length === 8, "der Schl\u00fcssel hat acht Zeichen (" + probe + ")");
pruefe(!/[O0I1]/.test(probe), "keine Zeichen, die man verwechselt");
const viele = new Set();
for (let i = 0; i < 4000; i++) viele.add(aus.schluesselBauen());
pruefe(viele.size === 4000, "4000 Schl\u00fcssel, kein einziger doppelt");
pruefe(aus.schluesselSchoen("ABCD2345") === "ABCD-2345", "er wird lesbar getrennt");
pruefe(fs.existsSync(path.join(wurzel, "spieler.sql")), "das SQL zum Anlegen liegt dabei");
if (fs.existsSync(path.join(wurzel, "spieler.sql"))) {
  const sql = fs.readFileSync(path.join(wurzel, "spieler.sql"), "utf8");
  pruefe(sql.includes("figur      text        primary key"),
         "die Figur ist Prim\u00e4rschl\u00fcssel — zweimal vergeben geht nicht");
  pruefe(sql.includes("grant select (figur, gewaehlt)") && !/grant select \([^)]*schluessel/.test(sql),
         "den Schl\u00fcssel darf niemand lesen");
  pruefe(sql.includes("security definer") && sql.includes("returns boolean"),
         "das \u00dcbernehmen antwortet nur mit ja oder nein");
  pruefe(!/for update|for delete/.test(sql), "\u00e4ndern und l\u00f6schen sind niemandem erlaubt");
  pruefe(sql.includes(aus.SPIELER_TABELLE), "SQL und Spiel meinen dieselbe Tabelle");
}

// ---------- Das Labyrinth ----------
console.log("Labyrinth");
const tore = [];
RAEUME.forEach((r) => (r.punkte || []).forEach((p) => {
  if (p.labyrinth) tore.push(r.name + " / " + p.titel + " -> " + p.labyrinth);
}));
pruefe(tore.length === 2, "zwei Zug\u00e4nge: " + tore.join("; "));
pruefe(tore.some((t) => t.endsWith("laeufer")) && tore.some((t) => t.endsWith("monitor")),
       "einer f\u00fcr den L\u00e4ufer, einer f\u00fcr den F\u00fchrenden");
pruefe(tore.some((t) => t.indexOf("Dachterrasse") === 0 && t.endsWith("monitor")),
       "von der Dachterrasse sieht man das Labyrinth — das ist der Hinweis");
const labPfad = path.join(wurzel, aus.LABYRINTH_SEITE);
pruefe(fs.existsSync(labPfad), "die Seite liegt da, wo das Haus sie sucht (" +
       aus.LABYRINTH_SEITE + ")");
if (fs.existsSync(labPfad)) {
  const lab = fs.readFileSync(labPfad, "utf8");
  pruefe(lab.includes("['laeufer', 'monitor'].includes(adresse.get('rolle'))"),
         "die Seite kennt beide Rollen");
}
pruefe(roh.includes('"?rolle=" + rolle'), "das Haus gibt die Rolle mit");
pruefe(roh.includes("function labyrinthLobby(rolle)") && roh.includes("labyrinthLobby(p.labyrinth);"),
       "hinein geht es \u00fcber die Lobby, nicht direkt");
pruefe(roh.includes('inventarKlient.channel("lobby-" + raum'),
       "die Lobby h\u00e4ngt an einem Kanal je Aufgabe");
pruefe(roh.includes("if (!er || er.partner !== netzIch) return;"),
       "es geht erst los, wenn zwei einander gew\u00e4hlt haben");
pruefe(roh.includes("LOBBY_QUELLE.losSagen(meiner);"),
       "wer das Paar zuerst sieht, sagt es dem anderen ausdr\u00fccklich");
pruefe(roh.includes("if (kanal) setTimeout(() => { try { kanal.unsubscribe(); } catch (e) {} }, 400);"),
       "abgemeldet wird erst danach, damit die Nachricht noch hinausgeht");
pruefe(roh.includes('"lab-" + [netzIch, partnerId].sort().join("-")'),
       "das Paar bekommt einen gemeinsamen Kanal, auf dessen Namen beide kommen");
pruefe(roh.includes('"&kanal=" + encodeURIComponent(kanal)'),
       "der Kanalname geht in der Adresse an die Labyrinthseite");
pruefe(roh.includes('(uebung, mit) => labyrinthStarten(rolle, mit)'),
       "der Partner aus der Lobby wird ins Labyrinth mitgenommen");
pruefe(roh.includes('"&partner=" + encodeURIComponent(andereFigur)'),
       "die Figur des Partners geht mit, damit oben sein Kopf steht");
if (fs.existsSync(labPfad)) {
  const lab3 = fs.readFileSync(labPfad, "utf8");
  pruefe(lab3.includes("const VERLAUF_LAENGE = 20;"), "der Chat beh\u00e4lt 20 Zeilen");
  pruefe(lab3.includes("kanal.send({ type: 'broadcast', event: 'sagt'"),
         "die Seite schickt selbst, ohne Umweg \u00fcber das Haus");
  pruefe(lab3.includes("if (!KANAL_NAME || typeof supabase === 'undefined') return;"),
         "ohne Kanalnamen bleibt die Testseite benutzbar");
  pruefe(lab3.includes("if (!payload || payload.von === ICH) return;"),
         "die eigenen Zeilen kommen nicht doppelt zur\u00fcck");
  pruefe(lab3.includes("eintragen('ereignis'"),
         "auch Fallen und der G\u00e4rtner stehen im Verlauf");
}
["klavier", "tischtennis", "labyrinth"].forEach((raum) =>
  pruefe(roh.indexOf('"' + raum + '"') >= 0, "die Aufgabe \"" + raum + "\" hat einen eigenen Raum"));
pruefe(roh.includes('"labyrinth",\n    rolle'),
       "beim Labyrinth wird die Seite mitgemeldet");
if (fs.existsSync(labPfad)) {
  const lab2 = fs.readFileSync(labPfad, "utf8");
  pruefe(lab2.includes("if (ROLLE === 'monitor') return;"),
         "wer am Monitor sitzt, kann nicht laufen — er sieht zu");
  pruefe(lab2.includes("if (ROLLE === 'laeufer') return;             // der L\u00e4ufer markiert nicht"),
         "und der L\u00e4ufer markiert nichts auf dem Plan");
}
pruefe(roh.includes("labyrinthOffen"), "solange es offen ist, h\u00f6rt das Haus nicht auf Tasten");

console.log(fehler === 0 ? "\nAlles in Ordnung." : "\n" + fehler + " Fehler.");
process.exit(fehler === 0 ? 0 : 1);
