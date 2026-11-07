// Prüflauf für das Heckenlabyrinth, ohne Browser.
// Baut dieselben Labyrinthe wie die Seite und prüft, ob sie lösbar sind —
// auch dann noch, wenn man jede Falle umgehen muss.
//
// Aufruf:  node labtest.js

const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("zwei.html", "utf8");
const skript = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));

let fehler = 0;
function pruefe(gut, text) {
  if (gut) console.log("  ok    " + text);
  else { console.log("  FEHLT " + text); fehler++; }
}

// ---------- Syntax ----------
console.log("Syntax");
let syntaxGut = true;
try { new Function(skript); } catch (e) { syntaxGut = false; console.log("        " + e.message); }
pruefe(syntaxGut, "zwei.html ist fehlerfrei");

// ---------- Die Werte aus der Seite holen ----------
const zahl = (name) => {
  const m = skript.match(new RegExp("const\\s+" + name + "\\s*=\\s*([0-9.]+)"));
  return m ? parseFloat(m[1]) : null;
};
const FELDER = zahl("FELDER"), FALLEN = zahl("FALLEN"), SCHLEIFEN = zahl("SCHLEIFEN");
const SICHT = zahl("SICHT");

console.log("Masse");
pruefe(FELDER >= 8 && FELDER <= 20, "die Kantenlänge ist brauchbar (" + FELDER + ")");
pruefe(FALLEN > 0 && FALLEN < FELDER * FELDER * 0.2,
       FALLEN + " Fallen auf " + FELDER * FELDER + " Felder");
pruefe(SCHLEIFEN > 0, "es gibt zusätzliche Öffnungen (" + SCHLEIFEN + ") — ohne die " +
       "liesse sich keine Falle umgehen");
pruefe(SICHT >= 3, "der Läufer sieht weit genug (" + SICHT + " Felder)");

// ---------- Die Bauteile aus der Seite herausziehen ----------
const kasten = vm.createContext({ console, Math });
const teile = skript.slice(skript.indexOf("const FELDER"), skript.indexOf("// ------", skript.indexOf("function wandDa")));
const sichtTeil = skript.slice(skript.indexOf("function sichtTiefe"),
                               skript.indexOf("function spurMalen"));
vm.runInContext(teile + "\n" + sichtTeil +
  "\nglobalThis.__aus = { labyrinthBauen, wandDa, DX, DY, FELDER, sichtTiefe };", kasten);
const { labyrinthBauen, wandDa, DX, DY, sichtTiefe } = kasten.__aus;

// ---------- Erreichbarkeit ----------
// Einmal ohne Ruecksicht auf Fallen, einmal mit: wer jede Falle umgehen
// muss, darf trotzdem nicht eingesperrt sein.
function erreichbar(lab, meideFallen) {
  const gesehen = [];
  for (let y = 0; y < FELDER; y++) gesehen[y] = new Array(FELDER).fill(false);
  const warte = [[0, 0]];
  gesehen[0][0] = true;
  while (warte.length) {
    const [x, y] = warte.shift();
    for (let r = 0; r < 4; r++) {
      if (wandDa(lab, x, y, r)) continue;
      const nx = x + DX[r], ny = y + DY[r];
      if (nx < 0 || ny < 0 || nx >= FELDER || ny >= FELDER) continue;
      if (gesehen[ny][nx]) continue;
      if (meideFallen && lab.falle[ny][nx]) continue;
      gesehen[ny][nx] = true;
      warte.push([nx, ny]);
    }
  }
  return gesehen;
}

console.log("Lösbarkeit");
let alleOffen = 0, ohneFallen = 0, schnitt = 0;
const proben = 300;
for (let i = 0; i < proben; i++) {
  const lab = labyrinthBauen(i * 7919 + 13);
  const a = erreichbar(lab, false);
  const b = erreichbar(lab, true);
  if (a[FELDER - 1][FELDER - 1]) alleOffen++;
  if (b[FELDER - 1][FELDER - 1]) ohneFallen++;
  let zahlFallen = 0;
  for (let y = 0; y < FELDER; y++) for (let x = 0; x < FELDER; x++) if (lab.falle[y][x]) zahlFallen++;
  schnitt += zahlFallen;
}
pruefe(alleOffen === proben, "jedes der " + proben + " Labyrinthe ist durchgängig");
pruefe(ohneFallen / proben > 0.9,
       Math.round((ohneFallen / proben) * 100) + " von 100 lassen sich lösen, " +
       "ohne eine einzige Falle zu betreten");
pruefe(Math.abs(schnitt / proben - FALLEN) < 0.5,
       "im Schnitt werden " + (schnitt / proben).toFixed(1) + " Fallen gestreut");

// Start und Ziel muessen frei bleiben
let belegt = 0;
for (let i = 0; i < proben; i++) {
  const lab = labyrinthBauen(i * 104729 + 5);
  if (lab.falle[0][0] || lab.falle[FELDER - 1][FELDER - 1]) belegt++;
}
pruefe(belegt === 0, "weder Eingang noch Ziel tragen je eine Falle");

// Gleicher Startwert, gleiches Labyrinth — sonst sehen die beiden
// Haelften verschiedene Waende.
const l1 = labyrinthBauen(4242), l2 = labyrinthBauen(4242);
pruefe(JSON.stringify(l1) === JSON.stringify(l2),
       "derselbe Startwert ergibt dasselbe Labyrinth");
const l3 = labyrinthBauen(4243);
pruefe(JSON.stringify(l1) !== JSON.stringify(l3),
       "ein anderer Startwert ergibt ein anderes");

// ---------- Wie lang ist der Weg? ----------
function weglaenge(lab) {
  const d = [];
  for (let y = 0; y < FELDER; y++) d[y] = new Array(FELDER).fill(-1);
  d[0][0] = 0;
  const warte = [[0, 0]];
  while (warte.length) {
    const [x, y] = warte.shift();
    for (let r = 0; r < 4; r++) {
      if (wandDa(lab, x, y, r)) continue;
      const nx = x + DX[r], ny = y + DY[r];
      if (nx < 0 || ny < 0 || nx >= FELDER || ny >= FELDER) continue;
      if (d[ny][nx] >= 0 || lab.falle[ny][nx]) continue;
      d[ny][nx] = d[y][x] + 1;
      warte.push([nx, ny]);
    }
  }
  return d[FELDER - 1][FELDER - 1];
}
let summe = 0, kuerzeste = 999, laengste = 0;
for (let i = 0; i < proben; i++) {
  const l = weglaenge(labyrinthBauen(i * 7919 + 13));
  if (l < 0) continue;
  summe += l; kuerzeste = Math.min(kuerzeste, l); laengste = Math.max(laengste, l);
}
console.log("Weglänge (kürzester Weg ohne Fallen, in Feldern)");
console.log("  Schnitt " + Math.round(summe / ohneFallen) +
            ", kürzester " + kuerzeste + ", längster " + laengste);
pruefe(summe / ohneFallen > FELDER,
       "der Weg ist länger als eine Kante — man läuft nicht geradeaus durch");

// ---------- Sichtweite ----------
// Wer durch eine Hecke sieht, kann den Weg allein finden — dann braucht
// es den F\u00fchrenden nicht mehr.
console.log("Sichtweite");
let durchblick = 0, gepr\u00fcft = 0, summeTiefe = 0;
for (let i = 0; i < 60; i++) {
  const lab = labyrinthBauen(i * 2089 + 3);
  for (let y = 0; y < FELDER; y++) {
    for (let x = 0; x < FELDER; x++) {
      for (let r = 0; r < 4; r++) {
        const t = sichtTiefe(lab, x, y, r);
        gepr\u00fcft++; summeTiefe += t;
        // Jedes sichtbare Feld muss ohne Hecke dazwischen erreichbar sein
        for (let k = 0; k < t; k++) {
          const cx = x + DX[r] * k, cy = y + DY[r] * k;
          if (wandDa(lab, cx, cy, r)) { durchblick++; k = t; }
        }
        if (t > SICHT) durchblick++;
      }
    }
  }
}
pruefe(durchblick === 0,
       gepr\u00fcft + " Blickrichtungen gepr\u00fcft, kein einziger Blick durch eine Hecke");
pruefe(summeTiefe / gepr\u00fcft > 0.5,
       "im Schnitt sieht man " + (summeTiefe / gepr\u00fcft).toFixed(2) +
       " Felder weit — es ist nicht alles zugemauert");

// Steht direkt eine Hecke vor einem, sieht man nur das eigene Feld
let blind = 0, blindRichtig = 0;
for (let i = 0; i < 40; i++) {
  const lab = labyrinthBauen(i * 311 + 17);
  for (let y = 0; y < FELDER; y++) for (let x = 0; x < FELDER; x++) for (let r = 0; r < 4; r++) {
    if (!wandDa(lab, x, y, r)) continue;
    blind++;
    if (sichtTiefe(lab, x, y, r) === 0) blindRichtig++;
  }
}
pruefe(blind === blindRichtig,
       "vor einer Hecke endet die Sicht sofort (" + blindRichtig + " von " + blind + ")");

console.log("Fallen");
pruefe(skript.includes("lab.falle[y][x] && t <= 1"),
       "die Spur einer Falle sieht man erst direkt davor");
pruefe(!/falle[\s\S]{0,400}e88a8a/.test(skript),
       "sie ist kein rotes Warnzeichen mehr");
pruefe(skript.includes("function spurMalen"), "sie wird als Bodenspur gezeichnet");
pruefe(!/plan[\s\S]{0,4000}lab\.falle/.test(skript.slice(skript.indexOf("function planMalen"),
       skript.indexOf("function gehen"))),
       "auf dem Monitor taucht keine Falle auf");

console.log(fehler === 0 ? "\nAlles in Ordnung." : "\n" + fehler + " Fehler.");
process.exit(fehler === 0 ? 0 : 1);
