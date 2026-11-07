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
vm.runInContext(teile + "\nglobalThis.__aus = { labyrinthBauen, wandDa, DX, DY, FELDER };", kasten);
const { labyrinthBauen, wandDa, DX, DY } = kasten.__aus;

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

console.log(fehler === 0 ? "\nAlles in Ordnung." : "\n" + fehler + " Fehler.");
process.exit(fehler === 0 ? 0 : 1);
