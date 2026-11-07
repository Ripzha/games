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

console.log(fehler === 0 ? "\nAlles in Ordnung." : "\n" + fehler + " Fehler.");
process.exit(fehler === 0 ? 0 : 1);
