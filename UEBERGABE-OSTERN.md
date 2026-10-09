# Übergabe — Oster-Eiersuche „Acis Eiersuche"

Für einen neuen Chat, der NUR an diesem Spiel arbeitet. Diese Datei zuerst lesen.

---

## 1. WAS DAS IST

Wimmelbildspiel zu Ostern für **simsforumrpg.de** (Sims-4-Rollenspiel-Forum).
20 Eier in 5 Räumen, bewusst schwer: suchen, öffnen, Rätsel lösen.
Entstanden aus einem früheren Klick-Spiel (Garage), das verworfen wurde.

**Knox = Ripzha**, Admin des Forums. Schweizer Rechtschreibung („ss" statt „ß",
Anführungszeichen „…"). Umlaute immer ausschreiben, auch in Code-Kommentaren.

---

## 2. WO ES LIEGT

- **Repo:** `github.com/Ripzha/games` (eigenes Repo, NICHT das Adventskalender-Repo `advent`)
- **Live:** https://ripzha.github.io/games/quest-ostern.html
- **Dateien im Repo:**
  - `quest-ostern.html` (Hauptverzeichnis)
  - `bilder/garage-zu.png` (1774 × 887)
  - `bilder/garage-offen.png` (1774 × 887)
  - `bilder/garage2-zu.png` (1774 × 887)
  - `bilder/garage2-offen.png` (1774 × 887)
  - `bilder/treppenhaus-zu.png` (1774 × 887)
  - `bilder/treppenhaus-offen.png` (1774 × 887)
  - `bilder/wohnzimmer-zu.png` (1774 × 887)
  - `bilder/wohnzimmer-offen.png` (1774 × 887)
  - `bilder/wohnzimmer-frau-wach.png` (1774 × 887)
  - `bilder/wohnzimmer-frau-spricht.png` (1774 × 887)
  - `bilder/wohnzimmer-leer.png` (1774 × 887) — ohne Anfisa
  - `bilder/wohnzimmer-aus.png` (1774 × 887) — ohne Anfisa, Fernseher aus, Bild abgehängt
  - `bilder/bild-vorn.png` (1402 × 912) — Nahansicht, Tapete weggeschnitten
  - `bilder/bild-hinten-zu.png` / `-offen.png` / `-leer.png` (1402 × 912)
- **Deploy:** GitHub-Weboberfläche, „Add file → Upload files" → „Commit changes". Kein Terminal.

### Bestenliste
Läuft über das bestehende Apps Script des Adventskalenders, getrennt über `spiel=ostern`:
`https://script.google.com/macros/s/AKfycbwxKRKsfh_2YFkS5a5kpDYWSQImA1lEq3ndnVJj4YpPqWcLrqmUinp-l4WA93e5U79MPA/exec`
Gewertet wird die **Zeit in Sekunden** (kleinster Wert = bester Platz). Am Script ist nichts zu ändern.

---

## 3. AUFBAU DER DATEI

Alles Inhaltliche steht oben im `<script>` unter **„DATEN"**:

- **RAEUME** — id, name, `start` (ID der ersten Ansicht), `gesperrtBis`,
  `imMenu: false` für Durchgangsräume, die nicht in der Kopfzeile stehen sollen
- **ANSICHTEN** — ein Blickwinkel eines Raums: id, raum, name, `bild` (geschlossen),
  `bildOffen` (alles offen), `breite`/`hoehe` in Bildpixeln.
  `hellWenn` + `bildHell`: zweites Grundbild, das gilt, sobald der Zustand gesetzt
  ist (Küche: dunkel bis die Sicherung sitzt). Teile brauchen dann zwei Flicken.
  `lampeWenn` + `lampeRadius`: die Ansicht ist stockdunkel. Ist der Zustand gesetzt,
  wandert ein Lichtkegel mit dem Zeiger mit. Der Radius ist in Bildpixeln, der Kegel
  beleuchtet beim Zoomen also immer dieselbe Fläche.
  `istNah: true` = Nahansicht eines Gegenstands, gehört zu keinem Raum und wird
  über das Inventar oder über `nah` an einem Teil geöffnet.
  Ein Raum kann mehrere Ansichten haben (Garage: `garage1` Werkbank, `garage2` Tür).
- **WEGE** — Verbindungen zwischen Ansichten: `{ von, nach, art, label }`
  - `art: 'links'` / `'rechts'` → Pfeil am linken/rechten Bildrand
  - `art: 'unten'` / `'oben'` → Pfeil mittig am unteren/oberen Bildrand
  - `art: 'raus'` → Knopf unten in der Mitte (mit `label` als Beschriftung)
  - `art: 'rein'` → anklickbare Stelle im Bild, braucht zusätzlich `x, y, w, h`
    in Bildpixeln; wird mit einer goldenen Marke angezeigt. `pfeil` dreht die
    Marke: `hoch` (Standard), `runter`, `links`, `rechts`
  - `wennOffen: '<zustand>'` → der Weg erscheint erst, wenn dieser Zustand gesetzt
    ist (zum Beispiel eine geöffnete Tür)
- **TEILE** — bewegliche/antippbare Objekte: `ansicht`, x, y, w, h (Bildpixel),
  `typ`, `zustand`, `label`
- **EIER** — `ansicht`, x, y, r, farbe, muster, `ebene` (1/2/3), `sichtbarWenn`
- **GEGENSTAENDE** — Inventar: id, `symbol` (Emoji fürs Rucksack-Fach), name,
  `nah` (ID einer Nahansicht), `text`.
  Zusammensetzen: `nimmt` (andere Gegenstand-ID), `setzt`, `verbraucht`, `antwort`.
  Als Schalter: `schaltet` (Zustand), `nurWenn` (Bedingung), `fehlt` (Text wenn nicht erfüllt).
- **DUNKEL** — dunkle Bereiche, die erst nach einem Lichtschalter sichtbar werden (derzeit leer)

Wichtig: TEILE und EIER hängen an einer **Ansicht**, nicht am Raum (`ansicht: 'garage1'`).

### Teil-Typen
| typ | Verhalten |
|---|---|
| `ausschnitt` | Blendet den Bereich aus `bildOffen` ein. Nochmal antippen schliesst wieder. Ist `nah:` gesetzt, öffnet das zweite Antippen die Nahaufnahme. **Das ist der Typ für echte Bilder.** |
| `toggle` | Gezeichneter Platzhalter-Zustand (Tür, Schublade, Klappe …). Nur solange keine Bilder da sind. |
| `raetsel` | Texteingabe, `antworten: []` — Gross/Klein und ss/ß egal |
| `code` | Zahlencode, `code: '2412'` |
| `info` | Zeigt einen Text (Zettel, Notiz) |
| `nehmen` | Gegenstand aufnehmen. `gibt` = ID aus GEGENSTAENDE, `zustand` wird gesetzt, `bildAus` blendet den Bereich ohne den Gegenstand ein. Danach nicht mehr anklickbar. |
| `ziel` | Nimmt nur Gegenstände entgegen, ein blosser Klick tut nichts. Für Stellen, an denen etwas hingehört (leerer Nagel). |
| `overlay` | Nur ein eingeblendeter Bereich, nicht anklickbar. Für Zustände, die von woanders geschaltet werden. |
| `phasen` | Figur mit mehreren Frames. Jeder Klick geht eine Phase weiter, nach der letzten zurück auf 0. Phase 0 = Grundbild. Jede Phase: `{ bild, x, y, w, h, text }` — mit x/y/w/h ein freigestellter Flicken, ohne sie ein Rechteckausschnitt aus dem Vollbild. Freigestellt ist richtig, sobald sich hinter der Figur etwas ändern kann. |
| `schalter` | Licht an/aus für DUNKEL-Bereiche |

Zusatzfelder für jedes Teil: `patch` (freigestelltes PNG mit Transparenz, dazu
`patchX/patchY/patchW/patchH`), `bildAus` (aus welchem Bild der Ausschnitt kommt,
sonst `bildOffen` der Ansicht; bei `nehmen` nur `bildAus`, sonst zeichnet das Spiel
eine goldene Marke), `sichtbarWenn` und `nichtWenn` (Zustand-Keys, die das Teil
ein- oder ausblenden), `nah` (ID einer Nahansicht), `treffer: {x,y,w,h}` (eigene
Klickfläche, wenn der Bildausschnitt grösser ist als das Anklickbare).

### Gegenstände benutzen
Ein Teil nimmt einen Gegenstand entgegen über diese Felder:
`nimmt` (Gegenstand-ID **oder Liste**), `setzt` (Zustand setzen), `loescht`
(Zustand wieder aufheben), `verbraucht: true` (verschwindet aus dem Inventar),
`antwort` (Text in der Sprechblase) und `fehlt` (Text, wenn aus der Liste noch
etwas fehlt).

Ist `nimmt` eine Liste, müssen alle Gegenstände im Rucksack liegen. Angetippt
wird nur einer davon, verbraucht werden alle.

Strafe: `strafeWenn` (Zustand, der nicht sein darf), `strafeSetzt` und
`strafeAntwort`. Ist die Bedingung erfüllt, passiert **gar nichts** — kein
Zustand wird gesetzt, nichts verbraucht. Nur der Strafzustand und der Text.

Bedienung: Rucksack unten rechts antippen, er öffnet ein Gitter mit festen
Fächern. Ein Fach antippen nimmt den Gegenstand in die Hand und schliesst den
Rucksack, danach im Bild antippen, wohin er soll. Daneben getippt legt ihn
wieder weg. Am Rechner geht zusätzlich Ziehen und Fallenlassen. Fächer mit
Nahansicht haben oben rechts ein kleines 🔍.

Aci kommentiert **nicht** mehr jeden Klick. Er meldet sich nur noch bei
Meilensteinen (SPRUECHE), bei einem Hinweis, bei einem gelösten Rätsel und
wenn ein Weg gesperrt ist.

### Ausrichtemodus
`quest-ostern.html?editor=1` → alle Eier sichtbar, jeder Klick zeigt die Koordinaten
in Bildpixeln. **So werden Eier, Hotspots und Durchgänge platziert.**

## 4. STAND DER RÄUME

| Raum | Ansicht | Bild | Eier | Status |
|---|---|---|---|---|
| Garage | `garage1` Werkbank | **JA** | 7 | 5 Ausschnitte, fertig verdrahtet |
| Garage | `garage2` Tür | **JA** | 0 | 4 Ausschnitte, noch keine Eier |
| Treppenhaus | `treppenhaus` | **JA** | 0 | 2 Ausschnitte, noch keine Eier, nicht in der Kopfzeile |
| Wohnzimmer | `wohnzimmer` | **JA** | 4 | 2 Ausschnitte, 1 Rätsel, Frau mit 3 Frames |
| Küche | `kueche` | **JA**, dunkel + hell | 3 | 8 Ausschnitte, Licht über die Sicherung |
| Garten | `garten` | nein | 4 | Platzhalter-Geometrie |
| Keller | `keller` | nein | 2 | Platzhalter, gesperrt bis Code 2412 |

### Navigation (Stand jetzt)
- `garage1` → Pfeil rechts → `garage2`
- `garage2` → Pfeil links → `garage1`
- `garage2` → Treppe (1200,200 190×600) → `treppenhaus`, erst wenn `g2_tuer_offen`
- `treppenhaus` → Metalltür links (10,60 270×760) → `garage2`, Pfeil nach links
- `treppenhaus` → Holztür oben (998,55 90×270) → `wohnzimmer`, erst wenn `th_tuer_offen`
- `wohnzimmer` → Pfeil unten → `treppenhaus`
- `wohnzimmer` → Pfeil links → `kueche`, `kueche` → Pfeil rechts → `wohnzimmer`
- Garten und Keller hängen noch an keinem Weg, nur an den Raum-Knöpfen oben

### garage2 im Detail
Vier Ausschnitte, alle mit `nah: ''` — **Nahaufnahmen fehlen noch**:
- `g2_oben` Grosser Schrank, oben (470,150 350×396)
- `g2_unten` Grosser Schrank, unten (470,548 380×265)
- `g2_tuer` Tür zum Treppenhaus (1045,110 390×720) — schaltet den Weg zur Treppe frei
- `g2_spind` Spind rechts (1560,150 214×680)

### Wohnzimmer im Detail
- `w_regal` Schrank unter dem Bücherregal (862,336 236×146), Flicken mit Aussparung für die Tasse → Ei e12
- `w_tvmoebel` Fernsehmöbel (1215,400 559×108) → Ei e13. Flicken, Kante unter den Porzellanfiguren — die stehen in den beiden Bildern versetzt.
- `w_gemaelde` Bild an der Wand (415,0 275×188), typ `nehmen` → Gegenstand `gemaelde`
- `w_nagel` derselbe Fleck, typ `ziel`, nur sichtbar wenn `bild_ab`. Nimmt das
  Bild wieder entgegen und hebt `bild_ab` auf. Damit lässt sich das Bild
  zurückhängen.. Der Rahmen reicht bis y=190, ein kürzerer Ausschnitt lässt die Rahmenunterkante stehen.
- `w_tv` Fernseher (1408,148 217×200) — an und aus. Der Flicken stammt aus einem eigenen Bild, das pixelgenau zum Grundbild passt; darum stehen die Porzellanfiguren exakt gleich.
- `w_sessel_leer` Overlay ohne Anfisa (150,80 850×770), schaltet auf `anfisa_weg`
- `w_frau` Anfisa im Sessel (Flicken 200,93 520×377, Klickfläche 240,192 430×233),
  typ `phasen`, nimmt `kippen` entgegen und setzt damit `anfisa_weg`:
  0 schlafend (Grundbild) · 1 aufgeschreckt · 2 spricht · danach wieder 0.
  **Beide Texte sind Platzhalter.**
- Eier e04 (Teppich, 1332,712) und e16 (Hefte unter dem Couchtisch, 1150,600) liegen getarnt offen

### Das Bild in der Hand
Zwei Nahansichten, über das Inventar erreichbar:
- `bild_vorn` Landschaft, Knopf „Umdrehen"
- `bild_hinten` Rückwand mit Fach
  - `bi_fach` (510,600 570×210) schiebt die Abdeckung auf
  - `bi_schluessel` (535,622 268×136), typ `nehmen` → Gegenstand `schluessel`,
    Der Ausschnitt muss den Bügel links mitnehmen, sonst bleibt ein Rest stehen.
    nur sichtbar wenn `fach_offen`

Wozu der Schlüssel passt, ist noch offen.

**Noch nicht gebaut:** Die Zigarettenschachtel, mit der Anfisa aufsteht.
`anfisa_weg` wird bisher von nichts gesetzt, das Overlay ist also nur über
den Spielstand testbar. Sobald klar ist, wo die Schachtel liegt, kommt sie
als `nehmen`-Teil dazu und ein Klick auf Anfisa mit der Schachtel im Inventar
setzt `anfisa_weg`. Danach lässt sich der Sessel untersuchen.

### Küche im Detail
Grundbild dunkel, zweites Grundbild hell über `kueche_licht`. Jeder Ausschnitt
hat zwei Flicken (`patch` dunkel, `patchHell` hell), alles lässt sich auch im
Dunkeln öffnen.

| Teil | Klickfläche | Zustand |
|---|---|---|
| `k_tuer` Tür zum Flur | 0,0 222×800 | `k_tuer_offen` |
| `k_sicherung` Wandschränkchen | 245,212 167×186 | `sicherung_offen` |
| `k_licht` Sicherung | 330,238 78×155 | `kueche_licht`, nur sichtbar wenn offen |
| `k_ober1` | 425,78 171×228 | `k_ober1_offen` |
| `k_ober2` | 596,78 126×228 | `k_ober2_offen` |
| `k_ober3` über dem Herd | 722,78 290×228 | `k_ober3_offen` |
| `k_ober4` | 1012,78 129×228 | `k_ober4_offen` |
| `k_ober5` rechts | 1141,78 233×228 | `k_ober5_offen` |
| `k_unten_links` | 370,492 378×210 | `k_unten_links_offen` |
| `k_ofen` Backofen | 848,488 200×212 | `k_ofen_offen` → Ei e17 |
| `k_unten_rechts` Spüle | 1070,500 278×192 | `k_unten_rechts_offen` |
| `k_kuehl` Kühlschrank | 1374,150 316×535 | `k_kuehl_offen` → Ei e14 |

Das Wandschränkchen ist im geschlossenen Zustand nur ein feiner Umriss auf der
Tapete, praktisch unsichtbar. Das ist Absicht.

**Warum fünf Oberschränke und nicht sieben.** Im Bild sind sieben Türen, aber es
gibt nur die beiden Fassungen „alle zu" und „alle offen". Beim Öffnen schwingen
die Türen seitlich und überlappen die Nachbarfelder. Ein Trennschnitt ist nur
dort möglich, wo sich zwischen den beiden Fassungen nichts verändert — das sind
die Spalten bei 596, 722, 1012 und 1141. Daraus ergeben sich fünf Gruppen, drei
davon sind einzelne Türen. Für alle sieben einzeln bräuchte es Bilder, in denen
nur jeweils eine Tür offen ist.

Alle drei Küchen-Eier brauchen `kueche_licht`: e03 in der Obstschale, e14 in der
Eierablage im Kühlschrank, e17 auf dem Rost im Backofen. Ohne Sicherung ist in
der Küche nichts zu finden.

**Vorläufig:** Ein Klick auf die offene Sicherung schaltet direkt das Licht.
Sobald die Nahaufnahme des Sicherungskastens da ist, wird daraus das Auswechseln.

### Taschenlampe und Dachboden
Der Dachboden hat `lampeWenn: 'lampe_an'`. Ohne Lampe sieht man nichts.
Kette: Taschenlampe im linken Unterschrank der Küche (nur bei Licht sichtbar) →
Batterien im Steckschlüsselkasten der Garage → Batterien im Rucksack auf die
Lampe anwenden → Lampe antippen schaltet sie an und aus.

Beide Fundorte haben noch kein eigenes Bild, darum zeigt das Spiel dort eine
goldene Marke. Position ändern heisst: x/y/w/h bei `k_lampe` beziehungsweise
`g_batterien` anpassen.

### Treppenhaus im Detail
- `th_tuer` Holztür oben an der Treppe (960,20 230×395) — schaltet den Weg in den Flur frei
- `th_kiste` Holzkiste neben der Treppe (1390,440 240×175)
- `th_kippen` Zigarettenschachtel in der Kiste (1420,520 140×65), typ `nehmen`
  → Gegenstand `kippen`. **Vorläufiger Ort**, nur ansicht/x/y/w/h ändern, wenn
  die Schachtel woanders liegen soll. Hat kein eigenes Bild, darum zeigt das
  Spiel dort eine goldene Marke.

Weder `garage2` noch `treppenhaus` haben bisher Eier. Wenn welche dazukommen,
muss anderswo eines weg — die Gesamtzahl 20 ist fix.

### garage1 im Detail (fertig)
Fünf Ausschnitte, alle mit `nah: ''` — **Nahaufnahmen fehlen noch**:
- `g_akten` Aktenschrank-Schublade (88,428 165×85) → Ei e09
- `g_tuer` Grüner Unterschrank (318,588 135×255)
- `g_blau` Blauer Rollcontainer (536,586 170×70) → Ei e10
- `g_steck` Steckschlüssel-Schublade (1096,668 215×85) → Ei e11
- `g_wagen` Roter Werkstattwagen (1330,584 318×258)
- `g_zettel` Zeichnung an der Wand (1055,12 180×112) — Info mit Code-Hinweis

Getarnte Eier garage1: e01 (Regal oben), e02 (Holzkiste), e05 (Schubladenkasten), e08 (Boden)

### Eier-Verteilung gesamt (muss 20 bleiben)
Ebene 1 (getarnt): 8 · Ebene 2 (hinter Öffnung): 7 · Ebene 3 (hinter Rätsel): 5

## 5. WIE BILDER EINGESETZT WERDEN

Knox liefert **pro Raum zwei Bilder**: alles zu / alles offen, pixelgenau gleich gross.
Dann:
1. Bilder nach `bilder/` benennen: `<raum>-zu.png`, `<raum>-offen.png`
2. Im Raum eintragen: `bild`, `bildOffen`, `breite`, `hoehe`
3. Beide Bilder vergleichen, um die geöffneten Stellen zu finden
   (Differenzbild + zusammenhängende Flächen — hat bei der Garage gut funktioniert)
4. Pro Fundstelle ein `TEILE`-Eintrag mit `typ: 'ausschnitt'`
5. Eier platzieren, Tarnfarbe aus den Pixeln der Umgebung nehmen (etwa 12 % abdunkeln)

**Nahaufnahmen:** Knox macht später Bilder vom Inneren der Schränke.
Eintragen als `nah: 'bilder/garage-akten-nah.png', nahBreite: …, nahHoehe: …`.
Eier in einer Nahaufnahme bekommen `inNah: '<teil-id>'`.

---

## 6. OFFENE PUNKTE

1. **Die Platzhalter-Rätsel sind raus.** Erfundene Wissensfragen ergaben keinen Sinn.
   Übrig ist nur `r_tuer`, der Zahlencode **2412** für die Kellertür; der Hinweis
   dazu steht auf der Zeichnung in der Garage. Die Eier, die vorher hinter Rätseln
   lagen, hängen jetzt an vorhandenen Öffnungen oder liegen getarnt offen.
   Verteilung dadurch: Ebene 1 zehn Eier, Ebene 2 zehn, Ebene 3 keine.
2. **Bilder für Küche, Garten, Keller** fehlen, dort steht noch Platzhalter-Geometrie.
3. **In garage2 und treppenhaus liegt noch kein Ei.** Die Ausschnitte sind verdrahtet.
   Die Eier im Wohnzimmer sind grob platziert und sollten im Ausrichtemodus
   feinjustiert werden.
4. **Nahaufnahmen** der Garage-Schränke fehlen.
5. **Die Zigarettenschachtel** liegt vorläufig in der Treppenhaus-Kiste. Gibt man
   sie Anfisa, steht sie auf (`anfisa_weg`). Ihr dritter Text fehlt noch, und der
   Sessel ist danach noch nicht untersuchbar — dafür braucht es ein Bild davon.
6. **Anfisa braucht Schachtel und Feuerzeug.** Beides muss im Rucksack liegen.
   Hängt das Bild nicht an der Wand, nimmt sie nichts an und rührt sich nicht —
   man muss es erst zurückhängen. Verloren geht dabei nichts.
   Fundorte: Schachtel in der Treppenhaus-Kiste, Feuerzeug im grünen
   Unterschrank der Garage. Drei ihrer Texte sind noch Platzhalter.
6. **„Zurück"-Knopf** am Spielende zeigt auf `index.html`, die es im games-Repo
   nicht gibt → Ziel noch festzulegen.
7. Am Handy noch nicht getestet (Zoom, Pinch, Tippen).

## 8. AUSSCHNEIDEN — ZWEI VERFAHREN

### a) Rechteck aus dem zweiten Vollbild (`bildAus` / `bildOffen`)
Funktioniert nur, wenn die beiden Bilder pixelgenau übereinanderliegen und
denselben Farbton haben. Das ist der Fall bei garage2, treppenhaus und den
Bildrückseiten — die sind offensichtlich als Varianten desselben Bildes
entstanden. Die Schnittkante gehört trotzdem in eine ruhige Fläche, nie quer
durch eine Tür, eine Figur oder eine Kante.

### b) Freigestellter Flicken (`patch`)
Nötig, sobald die beiden Bilder getrennt erzeugt wurden. Dann unterscheidet
sich die ganze Fläche: Tapetenmuster, Helligkeit, Farbton. Ein Rechteck fällt
dann sofort als heller Kasten auf. Das Wohnzimmer ist so ein Fall.

Das Skript `freistellen.py` (liegt nicht im Repo, bei Bedarf neu anfordern)
macht daraus ein PNG mit Alphakanal:
1. Quellbild farblich ans Grundbild angleichen, zweistufig
2. Maske auf die veränderte Form beschränken — entweder automatisch aus dem
   Differenzbild oder per `form=(x0,y0,x1,y1)` fest vorgegeben
2b. `aussparung=[(x0,y0,x1,y1), ...]` nimmt Bereiche wieder heraus. Nötig für
   Dinge, die halb im Ausschnitt stehen und im Quellbild versetzt sind — die
   erscheinen sonst doppelt. Im Wohnzimmer betrifft das die Tasse auf dem
   Couchtisch, die in den Ausschnitt des Bücherregal-Schranks ragt.
3. Maskenrand weich auslaufen lassen
4. Auf die Maskengrösse zuschneiden

Im Spiel wird so ein Flicken mit `patch` und `patchX/Y/W/H` eingeblendet.
Die Klickfläche des Teils bleibt davon unabhängig.

### c) Licht aus dem dunklen Bild ableiten
Für die Küche ging auch b) nicht sauber: Das dunkle und das helle Bild sind
getrennt erzeugt, und dabei haben sich Gegenstände in der Grösse verändert —
der Samowar auf der Arbeitsfläche war im hellen Bild deutlich grösser. Beim
Lichtschalten wären die Dinge gewachsen.

Lösung: Das helle Grundbild wird **aus dem dunklen errechnet**. Dazu wird aus
dem echten hellen Bild nur die Beleuchtung übernommen, nicht die Zeichnung —
ein stark weichgezeichnetes Verhältnis der beiden Bilder pro Farbkanal, das als
Faktor auf das dunkle Bild gelegt wird. Das Ergebnis ist warm beleuchtet und
geometrisch identisch mit dem dunklen Bild. Backofen- und Kühlschrankinneres
werden zusätzlich lokal aufgehellt, weil die Beleuchtungskarte davon nichts weiss.

Damit stammen beide Küchen-Grundbilder und alle sechzehn Flicken aus derselben
Bildfamilie. Beim Lichtschalten bewegt sich nichts mehr.

### Für neue Bilder
Am besten wäre, die Varianten eines Raums als Bearbeitung desselben Bildes zu
erzeugen statt als neue Generierung. Dann passen Muster und Farben exakt und
Verfahren a) reicht. Sonst b), und bei Licht-/Dunkel-Paaren c).

## 7. ARBEITSWEISE KNOX

- Will ehrliche Einschätzungen, kein Schönreden
- Dateien einzeln + vollständig liefern, Zielpfad angeben, ob neu oder ersetzt
- Schritt-für-Schritt-Anleitungen, wenn er selbst etwas tun soll
- Nicht raten — bei Unklarheit sagen, was er nachschauen soll
- Verifikation vor Lieferung: node-Syntaxcheck pro Script-Block, div-Balance,
  Datenkonsistenz (20 Eier, Zustände existieren, Eier liegen in ihrem Teil)
- Deploy-Muster: Dateien nach /mnt/user-data/outputs, dann present_files
