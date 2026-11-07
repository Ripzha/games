// Prüflauf für die Tischtennisseite. Ohne Browser: Die Datei wird
// gelesen, der Teil zwischen den Script-Marken in einem Kasten
// ausgeführt und die Geometrie durchgerechnet.
//
//   cd ~/Projekte/games/valentin/tischtennis && node tttest.js
//
// Geprüft wird, was man beim Spielen nicht sieht: ob die beiden Hälften
// zusammen die ganze Platte decken, ob der Ball nicht von beiden Seiten
// gleichzeitig gerechnet wird, und ob die Seite ohne Haus und ohne
// Verbindung läuft.

const fs = require("fs");
const vm = require("vm");

const datei = process.argv[2] || "zwei.html";
const roh = fs.readFileSync(datei, "utf8");

let fehler = 0;
function pruefe(gut, text) {
  if (!gut) fehler++;
  console.log((gut ? "  ok    " : "  FEHLT ") + text);
}

const nichts = () => {};
function element() {
  return {
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
const innen = skript
  .replace(/^\s*\(function \(\) \{\s*"use strict";/, "")
  .replace(/\}\)\(\);\s*$/, "");

try {
  vm.runInContext(innen +
    "\nglobalThis.__aus = { TT_SCHLAEGER_B, TT_UEBERLAPP, TT_ZIEL, TT_BALL," +
    " TT_TEMPO_START, TT_TEMPO_MAX, ttGrenzen, ICH_LINKS, MEINE_HAELFTE };", kasten);
} catch (e) {
  console.error("FEHLER beim Laden der Seite: " + e.message);
  process.exit(1);
}

const aus = kasten.__aus;
const { TT_SCHLAEGER_B, TT_UEBERLAPP, TT_ZIEL, TT_BALL, ttGrenzen } = aus;
const { TT_TEMPO_START, TT_TEMPO_MAX } = aus;

console.log("Die Platte");
const [ll, lr] = ttGrenzen(true);
const [rl, rr] = ttGrenzen(false);
pruefe(ll - TT_SCHLAEGER_B / 2 <= 0.01,
       "der linke Schl\u00e4ger erreicht die linke Kante");
pruefe(rr + TT_SCHLAEGER_B / 2 >= 99.99,
       "der rechte erreicht die rechte Kante");
pruefe(lr + TT_SCHLAEGER_B / 2 >= rl - TT_SCHLAEGER_B / 2,
       "die beiden Bereiche \u00fcberlappen in der Mitte — es gibt keine L\u00fccke");
pruefe(TT_UEBERLAPP > 0, "die \u00dcberlappung betr\u00e4gt " + TT_UEBERLAPP + " Prozent");
pruefe(TT_SCHLAEGER_B > TT_BALL * 2,
       "der Schl\u00e4ger (" + TT_SCHLAEGER_B + ") ist breiter als der Ball (" +
       TT_BALL + ")");

console.log("Das Ziel");
pruefe(TT_ZIEL >= 5 && TT_ZIEL <= 50, TT_ZIEL + " Ballwechsel bis zum Ziel");
pruefe(TT_TEMPO_MAX > TT_TEMPO_START,
       "der Ball wird schneller (" + TT_TEMPO_START + " bis " + TT_TEMPO_MAX + ")");

console.log("Wer rechnet den Ball");
pruefe(skript.includes("const ICH_LINKS = !PARTNER_ID || String(ICH) < String(PARTNER_ID);"),
       "die kleinere Kennung spielt links — beide rechnen dasselbe aus");
pruefe(skript.includes("if (TT_PARTNER.rechnetBall && !TT_PARTNER.rechnetBall()) return;"),
       "der Ball wird nur in der eigenen H\u00e4lfte gerechnet");
pruefe(skript.includes("return ball.haelfte === (ICH_LINKS ? 0 : 1);"),
       "die eigene H\u00e4lfte entscheidet, wem der Ball geh\u00f6rt");
pruefe(skript.includes("if (meineHaelfte(ttBall)) return;"),
       "ein fremdes Ballpaket wird verworfen, solange der Ball mir geh\u00f6rt");
pruefe(skript.includes("if (ttLaeuft && !ttServiert && ICH_LINKS) ttAufschlag(0);"),
       "aufschlagen darf nur, wer links steht — sonst sind zwei B\u00e4lle unterwegs");
pruefe(skript.includes('ttServiert = true;        // der andere hat aufgeschlagen'),
       "der rechte merkt am ersten Ballpaket, dass es losgeht");

console.log("Der Schl\u00e4ger");
pruefe(skript.includes("const [ml, mr] = ttGrenzen(ICH_LINKS);"),
       "jeder bewegt sich in seiner eigenen H\u00e4lfte");
pruefe(!/ttGrenzen\(true\)/.test(skript),
       "nirgends steht mehr fest, dass ich links bin");
pruefe(skript.includes("TT_PARTNER.schritt(dt, ttBall);\n  if (ttServiert) ttBallSchritt(dt);"),
       "der Schl\u00e4ger geht auch vor dem Aufschlag hinaus");

console.log("Allein und ohne Haus");
pruefe(skript.includes('if (!KANAL_NAME || typeof supabase === "undefined") return;'),
       "ohne Kanal bleibt der \u00dcbungspartner — die Seite l\u00e4uft allein");
pruefe(skript.includes("if (!window.parent || window.parent === window) return;"),
       "ohne Haus wird nichts gemeldet und nichts bricht");
pruefe(!/\bfensterZu\b|\bsatzfeld\b|\bMEINE_FIGUR\b|\bnetzIch\b/.test(skript),
       "keine Reste aus dem Haus mehr drin");
pruefe(skript.includes('melden({ art: "fertig" })'), "sie sagt, wenn zugemacht werden soll");
pruefe(skript.includes('melden({ art: "geloest" })'), "und wenn das Ziel erreicht ist");

console.log(fehler === 0 ? "\nAlles in Ordnung." : "\n" + fehler + " Fehler.");
process.exit(fehler === 0 ? 0 : 1);
