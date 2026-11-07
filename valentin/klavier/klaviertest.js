// Prüflauf für die Klavierseite. Ohne Browser: Die Datei wird gelesen,
// der Teil zwischen den Script-Marken in einem Kasten ausgeführt und die
// Melodie durchgerechnet.
//
//   cd ~/Projekte/games/valentin/klavier && node klaviertest.js
//
// Geprüft wird, was man beim Spielen nicht sieht: ob die Melodie auf der
// Klaviatur liegt, ob die Aufteilung zwischen den beiden stimmt, ob zwei
// gleiche Noten zu dicht beieinanderliegen, und ob die Seite ohne Haus
// und ohne Verbindung läuft.

const fs = require("fs");
const vm = require("vm");

const datei = process.argv[2] || "zwei.html";
const roh = fs.readFileSync(datei, "utf8");

let fehler = 0;
function pruefe(gut, text) {
  if (!gut) fehler++;
  console.log((gut ? "  ok    " : "  FEHLT ") + text);
}

// ---------- Attrappen ----------
// Die Seite baut beim Laden ihre Oberfläche auf. Hier gibt es kein DOM,
// also wird so viel vorgetäuscht, wie zum Durchlaufen nötig ist.
const nichts = () => {};
function element() {
  const el = {
    style: {}, classList: { add: nichts, remove: nichts, contains: () => false },
    children: [], textContent: "", innerHTML: "",
    appendChild(k) { this.children.push(k); return k; },
    removeChild: nichts, remove: nichts,
    addEventListener: nichts, removeEventListener: nichts,
    querySelector: () => element(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    setAttribute: nichts, getAttribute: () => null,
    getContext: () => ({
      save: nichts, restore: nichts, clearRect: nichts, fillRect: nichts,
      beginPath: nichts, closePath: nichts, moveTo: nichts, lineTo: nichts,
      arc: nichts, ellipse: nichts, fill: nichts, stroke: nichts,
      drawImage: nichts, measureText: () => ({ width: 10 }), fillText: nichts,
      translate: nichts, rotate: nichts, scale: nichts, clip: nichts,
      createLinearGradient: () => ({ addColorStop: nichts })
    })
  };
  return el;
}

const kasten = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean,
  isNaN, parseInt, parseFloat, Set, Map, Infinity, RegExp, Error,
  setTimeout: () => 0, clearTimeout: nichts, setInterval: () => 0,
  clearInterval: nichts, requestAnimationFrame: () => 0,
  cancelAnimationFrame: nichts, performance: { now: () => 0 },
  location: { search: "" },
  URLSearchParams: function () { this.get = () => null; },
  addEventListener: nichts,
  document: {
    head: element(), body: element(),
    getElementById: () => element(),
    createElement: () => element(),
    querySelector: () => element(), querySelectorAll: () => [],
    activeElement: null, addEventListener: nichts
  },
  Image: function () { this.addEventListener = nichts; },
  localStorage: { getItem: () => null, setItem: nichts }
};
kasten.window = kasten;
kasten.globalThis = kasten;
vm.createContext(kasten);

const marken = [...roh.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const skript = marken.map((m) => m[1]).join("\n");

// Die äussere Klammer öffnen, damit die Innereien erreichbar werden
const innen = skript
  .replace(/^\s*\(function \(\) \{\s*"use strict";/, "")
  .replace(/\}\)\(\);\s*$/, "");

try {
  vm.runInContext(innen +
    "\nglobalThis.__aus = { KL_WEISS, KL_SCHWARZ, KL_ALLE, KL_VON_TASTE," +
    " KL_BASS, KL_MELODIE, KL_GUT, KL_SCHWELLE, klSongBauen, klSeiteBestimmen," +
    " klavierStarten };", kasten);
} catch (e) {
  console.error("FEHLER beim Laden der Seite: " + e.message);
  process.exit(1);
}

const aus = kasten.__aus;
const { KL_WEISS, KL_SCHWARZ, KL_ALLE, KL_VON_TASTE, KL_BASS, KL_MELODIE,
        KL_GUT, klSongBauen } = aus;

console.log("Klaviatur");
pruefe(KL_WEISS.length + KL_SCHWARZ.length === Object.keys(KL_ALLE).length,
       "keine Note doppelt (" + Object.keys(KL_ALLE).length + " Tasten)");
const kuerzel = [...KL_WEISS, ...KL_SCHWARZ].map((t) => t.kuerzel.toLowerCase());
pruefe(new Set(kuerzel).size === kuerzel.length, "jede Rechnertaste nur einmal vergeben");
pruefe(Object.keys(KL_VON_TASTE).length === kuerzel.length,
       "Zuordnung Taste zu Note vollst\u00e4ndig");

console.log("Melodie");
const song = klSongBauen();
const unbekannt = song.noten.filter((n) => !KL_ALLE[n.note]).map((n) => n.note);
pruefe(unbekannt.length === 0, "alle Noten liegen auf der Klaviatur" +
       (unbekannt.length ? " — fehlt: " + [...new Set(unbekannt)].join(", ") : ""));
pruefe(song.noten.length > 20, song.noten.length + " Noten, L\u00e4nge " +
       Math.round(song.laenge / 1000) + " Sekunden");

console.log("Beide gleich schwer");
const einer = song.noten.filter((n) => n.wer === 0);
const anderer = song.noten.filter((n) => n.wer === 1);
pruefe(einer.length === anderer.length,
       "gleich viele Noten: " + einer.length + " zu " + anderer.length);

// Gleich viele Noten allein reicht nicht. Der Bass ist ein Pulsschlag,
// die Melodie ein Stueck — beide muessen beides spielen.
const tausch = (skript.match(/KL_TAUSCH = (\d+)/) || [])[1];
pruefe(tausch, "es gibt einen Stimmentausch (nach " + tausch + " Z\u00e4hlzeiten)");
pruefe(skript.includes("wer: t < KL_TAUSCH ? wer : (wer === 0 ? 1 : 0),"),
       "nach dem Tausch geh\u00f6rt die Stimme dem anderen");

const bassToene = ["C4","D4","E4","F4","G4","A4","H4"];
function istBass(n) { return bassToene.includes(n.note) && n.dauer >= 0; }
const vorher = song.noten.filter((n) => n.zeit < tausch * 340);
const nachher = song.noten.filter((n) => n.zeit >= tausch * 340);
[0, 1].forEach((w) => {
  pruefe(vorher.some((n) => n.wer === w) && nachher.some((n) => n.wer === w),
         "Spieler " + (w + 1) + " spielt vor und nach dem Tausch");
});

// Die hohen Toene gehoeren zur Melodie — jeder muss welche bekommen
const hoch = ["C5","Cis5","D5","Dis5","E5","F5"];
[0, 1].forEach((w) => {
  const seine = song.noten.filter((n) => n.wer === w && hoch.includes(n.note));
  pruefe(seine.length > 0,
         "Spieler " + (w + 1) + " bekommt " + seine.length + " Melodienoten oben");
});

pruefe(Math.min(einer[0].zeit, anderer[0].zeit) === 0, "beide beginnen zur selben Zeit");
const endeA = Math.max(...einer.map((n) => n.zeit + n.dauer));
const endeB = Math.max(...anderer.map((n) => n.zeit + n.dauer));
pruefe(Math.abs(endeA - endeB) < 1500,
       "beide enden ungef\u00e4hr zusammen (" + Math.round(Math.abs(endeA - endeB)) +
       " ms auseinander)");

// Die Stimmen duerfen sich nie auf derselben Taste treffen
const kollision = [];
einer.forEach((a) => anderer.forEach((b) => {
  if (a.note === b.note && Math.abs(a.zeit - b.zeit) < KL_GUT * 2)
    kollision.push(a.note + " bei " + Math.round(a.zeit) + " ms");
}));
pruefe(kollision.length === 0,
       "die beiden kommen sich auf keiner Taste in die Quere" +
       (kollision.length ? " — " + kollision.join("; ") : ""));

pruefe(KL_MELODIE[0][0] === "E5" && KL_MELODIE[1][0] === "D5" &&
       KL_MELODIE[2][0] === "C5" && KL_MELODIE[3][0] === "H4",
       "die Melodie f\u00e4ngt mit der absteigenden Linie an, die jeder kennt");

console.log("Melodie, Feinheiten");
// Zwei gleiche Noten zu dicht beieinander: die Trefferfenster überlappen,
// dann wertet ein Tastendruck die falsche.
const eng = [];
song.noten.forEach((a, i) => {
  song.noten.slice(i + 1).forEach((b) => {
    if (a.note === b.note && Math.abs(a.zeit - b.zeit) < KL_GUT * 2 && a.wer === b.wer)
      eng.push(a.note + " bei " + Math.round(a.zeit) + " und " + Math.round(b.zeit) + " ms");
  });
});
pruefe(eng.length === 0, "keine zwei gleichen Noten im selben Trefferfenster" +
       (eng.length ? " — " + eng.join("; ") : ""));

console.log("Wer spielt welche H\u00e4lfte");
pruefe(skript.includes("function klSeiteBestimmen(partnerId)"),
       "die Seite wird aus den beiden Kennungen bestimmt");
pruefe(skript.includes('klIchBin = partnerId && String(ICH) > String(partnerId) ? 1 : 0;'),
       "die kleinere Kennung spielt die erste H\u00e4lfte — beide rechnen dasselbe aus");
pruefe(!/n\.wer === 0/.test(skript) && !/n\.wer !== 0/.test(skript),
       "nirgends steht fest, dass ich die erste H\u00e4lfte spiele");
pruefe(skript.includes("const klAnderer = () => (klIchBin === 0 ? 1 : 0);"),
       "der \u00dcbungspartner \u00fcbernimmt die andere H\u00e4lfte");

console.log("Allein und ohne Haus");
pruefe(skript.includes('if (!KANAL_NAME || typeof supabase === "undefined") return;'),
       "ohne Kanal bleibt der \u00dcbungspartner — die Seite l\u00e4uft allein");
pruefe(skript.includes("if (!window.parent || window.parent === window) return;"),
       "ohne Haus wird nichts gemeldet und nichts bricht");
pruefe(!/\bfensterZu\b|\bsatzfeld\b|\bMEINE_FIGUR\b|\bnetzIch\b/.test(skript),
       "keine Reste aus dem Haus mehr drin");

console.log("Was die Seite dem Haus sagt");
pruefe(skript.includes('melden({ art: "fertig" })'), "sie sagt, wenn zugemacht werden soll");
pruefe(skript.includes('melden({ art: "geloest" })'), "und wenn das St\u00fcck geschafft ist");

console.log("Zeitverz\u00f6gerung");
pruefe(!/klTon\(KL_ALLE\[n\.note\]\.freq, n\.dauer\);[\s\S]{0,80}klPunkte \+= gut/.test(skript),
       "der Ton des anderen kommt nicht aus seiner Nachricht — sonst steckt " +
       "die Netzverz\u00f6gerung in der Musik");
pruefe(skript.includes("if (n.wer !== klIchBin && !n.getoent && dt >= 0) {"),
       "die fremde Stimme klingt \u00f6rtlich zu ihrer eigenen Zeit");
pruefe(skript.includes("KL_PARTNER.abstimmen = function (beiLos)"),
       "es gibt einen gemeinsamen Start");
pruefe(skript.includes('const ichGebeDasZeichen = String(ICH) < String(PARTNER_ID);'),
       "wer das Zeichen gibt, steht durch die Kennungen fest");
pruefe(skript.includes("setTimeout(anfangen, 10000);"),
       "meldet sich niemand, geht es nach zehn Sekunden allein los");
pruefe(skript.includes("if (nurHoeren || !KL_PARTNER.abstimmen) { losgehen(); return; }"),
       "Vorspiel und \u00dcbungspartner fangen weiterhin sofort an");

console.log("Was \u00fcber die Leitung geht");
pruefe(skript.includes('kanal.send({ type: "broadcast", event: "note"'),
       "je Note ein Ergebnis, nicht der Tastendruck selbst");
pruefe(!/event: "taste"/.test(skript),
       "der Tastendruck geht nie hinaus — sonst entscheidet die Verz\u00f6gerung");
pruefe(skript.includes("window.klNoteMelden(klSong.noten.indexOf(beste)"),
       "ein Treffer wird gemeldet");
pruefe(skript.includes("window.klNoteMelden(klSong.noten.indexOf(n), null)"),
       "eine verpasste Note auch");

console.log(fehler === 0 ? "\nAlles in Ordnung." : "\n" + fehler + " Fehler.");
process.exit(fehler === 0 ? 0 : 1);
