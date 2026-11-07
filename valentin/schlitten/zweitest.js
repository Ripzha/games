// Prüflauf für das Schlittenspiel zu zweit.
// Prüft, ob Elternseite und Spiel dieselbe Sprache sprechen — das ist die
// Stelle, an der so etwas erfahrungsgemäss auseinanderläuft.
//
// Aufruf:  node zweitest.js

const fs = require("fs");

const spiel  = fs.readFileSync("quest-schlitten.html", "utf8");
const eltern = fs.readFileSync("zwei.html", "utf8");

let fehler = 0;
function pruefe(gut, text) {
  if (gut) console.log("  ok    " + text);
  else { console.log("  FEHLT " + text); fehler++; }
}

// ---------- Syntax ----------
console.log("Syntax");
[["quest-schlitten.html", spiel], ["zwei.html", eltern]].forEach(([name, inhalt]) => {
  let gut = true;
  [...inhalt.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m) => {
    try { new Function(m[1]); } catch (e) { gut = false; console.log("        " + e.message); }
  });
  pruefe(gut, name + " ist fehlerfrei");
});

// ---------- Die Haken im Spiel ----------
console.log("Haken im Spiel");
[
  ["if (SPIEGEL) return;", "der Spiegel würfelt keine eigene Strecke"],
  ["if (SPIEGEL) {\n        weltUebernehmen();", "der Spiegel übernimmt Strecke und Tempo"],
  ["if (MEISTER) weltSenden();", "der Meister verschickt die Welt nach jedem Bild"],
  ["if (!SPIEGEL && tempo < boden)", "die Tempo-Untergrenze gilt nur beim Meister"],
  ["if (ZUZWEIT) {\n      // Zu zweit zählt die Elternseite", "der Crash meldet nur noch"],
  ["if (ZUZWEIT && netzPhasen)", "das Gelände kommt zu zweit von der Elternseite"],
  ["* ABSTAND;", "der Abstandsregler greift im Spawner"]
].forEach(([teil, text]) => pruefe(spiel.includes(teil), text));

// ---------- Dieselben Wörter auf beiden Seiten ----------
console.log("Nachrichten");
const artenSpiel  = [...spiel.matchAll(/d\.art === '([a-z]+)'/g)].map((m) => m[1]);
const artenEltern = [...eltern.matchAll(/d\.art === '([a-z]+)'/g)].map((m) => m[1]);
const sendetSpiel  = [...spiel.matchAll(/anEltern\('([a-z]+)'/g)].map((m) => m[1]);
const sendetEltern = [...eltern.matchAll(/an(?:Beide)?\((?:[a-z]+, )?'([a-z]+)'/g)].map((m) => m[1]);

sendetEltern.forEach((a) =>
  pruefe(artenSpiel.includes(a), "die Eltern schicken \"" + a + "\" — das Spiel hört darauf"));
sendetSpiel.forEach((a) =>
  pruefe(artenEltern.includes(a), "das Spiel schickt \"" + a + "\" — die Eltern hören darauf"));

// ---------- Tasten ----------
console.log("Tasten");
const tastenBlock = eltern.slice(eltern.indexOf("const TASTEN"), eltern.indexOf("function taste"));
const codes = [...tastenBlock.matchAll(/'(\w+)'\s*:\s*\{\s*rahmen\s*:\s*'(\w+)'\s*,\s*was\s*:\s*'(\w+)'/g)];
pruefe(codes.length === 4, codes.length + " Tasten sind belegt");
const rahmen = {};
codes.forEach(([, code, r, was]) => {
  rahmen[r] = rahmen[r] || [];
  rahmen[r].push(was);
  pruefe(spiel.includes("d.was === '" + was + "'"),
         "\"" + was + "\" (" + code + ") kennt das Spiel");
});
["oben", "unten"].forEach((r) => {
  const w = (rahmen[r] || []).sort().join(",");
  pruefe(w === "ducken,sprung", r + " hat Springen und Ducken (" + w + ")");
});
const alleCodes = codes.map((c) => c[1]);
pruefe(new Set(alleCodes).size === alleCodes.length, "keine Taste doppelt vergeben");

// ---------- Die beiden Rahmen ----------
console.log("Rahmen");
const quellen = [...eltern.matchAll(/src="quest-schlitten\.html\?([^"]+)"/g)].map((m) => m[1]);
pruefe(quellen.length === 2, "zwei Rahmen sind eingebunden");
const rollen = quellen.map((q) => new URLSearchParams(q).get("sync"));
pruefe(rollen.includes("meister") && rollen.includes("spiegel"),
       "einer führt, einer spiegelt (" + rollen.join(", ") + ")");
rollen.forEach((r) =>
  pruefe(spiel.includes("SYNC === '" + r + "'"), "das Spiel kennt die Rolle \"" + r + "\""));
const abstaende = quellen.map((q) => new URLSearchParams(q).get("abstand"));
pruefe(abstaende[0] === abstaende[1] && parseFloat(abstaende[0]) > 1,
       "beide fahren mit demselben, grösseren Abstand (" + abstaende[0] + ")");

// ---------- Das Spiel allein bleibt unberührt ----------
console.log("Alleinspiel");
pruefe(spiel.includes("if (leben > 1) {"), "die Leben-Logik für allein steht noch");
pruefe(spiel.includes("function zeigeEnde()"), "der Endbildschirm für allein steht noch");
pruefe(/const ABSTAND = Math\.max\(1,/.test(spiel),
       "ohne ?abstand bleibt der Abstand wie vorher");

// ---------- Der Bot ----------
console.log("Bot");
function zahl(text, name) {
  const m = text.match(new RegExp("(?:const|let)\\s+" + name + "\\s*=\\s*(-?[0-9.]+)"));
  return m ? parseFloat(m[1]) : null;
}
const VORLAUF  = zahl(eltern, "BOT_VORLAUF");
const DUCK_VOR = zahl(eltern, "BOT_DUCK_VOR");
const FEHLER   = zahl(eltern, "BOT_FEHLER");
const GRAV     = zahl(spiel, "GRAV");
const SPRUNG   = zahl(spiel, "SPRUNG");
const TEMPO_MAX = zahl(spiel, "TEMPO_MAX");

pruefe(VORLAUF && DUCK_VOR && FEHLER !== null, "die Botwerte stehen in der Elternseite");
pruefe(GRAV && SPRUNG, "Schwerkraft und Sprungkraft stehen im Spiel");
pruefe(eltern.includes("if (botAn && t.rahmen === 'unten') return;"),
       "bei Bot werden die Pfeiltasten durchgelassen und nicht doppelt gedrückt");
pruefe(eltern.includes("botTaste('sprung'") && eltern.includes("botTaste('ducken'"),
       "der Bot kann springen und ducken");
pruefe(FEHLER > 0 && FEHLER < 0.2,
       "der Bot macht Fehler, aber nicht dauernd (" + Math.round(FEHLER * 100) + " %)");

// Springt er hoch genug? Höhe über dem Boden beim Erreichen des Hindernisses.
// y = SPRUNG * t + GRAV * t² / 2, SPRUNG ist negativ.
const hoeheBeiAnkunft = -(SPRUNG * VORLAUF + GRAV * VORLAUF * VORLAUF / 2);
const hoechstes = Math.max(...[...spiel.matchAll(/\{ typ: '[a-z]+', b: \d+, h: (\d+) \}/g)]
                             .map((m) => parseInt(m[1], 10)));
pruefe(hoeheBeiAnkunft > hoechstes + 15,
       "der Sprung trägt über das höchste Hindernis (" + Math.round(hoeheBeiAnkunft) +
       " gegen " + hoechstes + " Bildpunkte)");

// Und ist er zum Scheitelpunkt noch nicht wieder unten?
const scheitel = -SPRUNG / GRAV;
pruefe(VORLAUF > scheitel * 0.8 && VORLAUF < scheitel * 2,
       "der Absprung liegt sinnvoll zum Scheitelpunkt (" + VORLAUF.toFixed(2) +
       " s gegen " + scheitel.toFixed(2) + " s)");

// Beim höchsten Tempo noch genug Vorwarnung?
pruefe(VORLAUF * TEMPO_MAX > 180,
       "auch beim höchsten Tempo springt er früh genug (" +
       Math.round(VORLAUF * TEMPO_MAX) + " Bildpunkte vorher)");

// Die Schranke: geduckt muss der Kopf unter die Unterkante passen
const unter = spiel.match(/terrainY\(worldX \+ sx\) - (\d+)/);
const kopfDuck = spiel.match(/ducken && amBoden \? (\d+) : (\d+)/);
if (unter && kopfDuck) {
  pruefe(parseInt(kopfDuck[1], 10) < parseInt(unter[1], 10),
         "geduckt passt der Kopf unter die Schranke (" + kopfDuck[1] + " gegen " + unter[1] + ")");
  pruefe(parseInt(kopfDuck[2], 10) > parseInt(unter[1], 10),
         "aufrecht passt er nicht — Ducken ist also nötig (" + kopfDuck[2] + ")");
}
pruefe(DUCK_VOR * TEMPO_MAX > 150,
       "auch beim höchsten Tempo duckt er früh genug (" +
       Math.round(DUCK_VOR * TEMPO_MAX) + " Bildpunkte vorher)");

console.log(fehler === 0 ? "\nAlles in Ordnung." : "\n" + fehler + " Fehler.");
process.exit(fehler === 0 ? 0 : 1);
