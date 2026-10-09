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
  Ein Raum kann mehrere Ansichten haben (Garage: `garage1` Werkbank, `garage2` Tür).
- **WEGE** — Verbindungen zwischen Ansichten: `{ von, nach, art, label }`
  - `art: 'links'` / `'rechts'` → Pfeil am linken/rechten Bildrand
  - `art: 'raus'` → Knopf unten in der Mitte (mit `label` als Beschriftung)
  - `art: 'rein'` → anklickbare Stelle im Bild, braucht zusätzlich `x, y, w, h`
    in Bildpixeln; wird mit einer goldenen Marke angezeigt
  - `wennOffen: '<zustand>'` → der Weg erscheint erst, wenn dieser Zustand gesetzt
    ist (zum Beispiel eine geöffnete Tür)
- **TEILE** — bewegliche/antippbare Objekte: `ansicht`, x, y, w, h (Bildpixel),
  `typ`, `zustand`, `label`
- **EIER** — `ansicht`, x, y, r, farbe, muster, `ebene` (1/2/3), `sichtbarWenn`
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
| `phasen` | Figur mit mehreren Frames. Jeder Klick geht eine Phase weiter, nach der letzten zurück auf 0. Phase 0 = Grundbild. Jede Phase: `{ bild, text }`, der Text erscheint in der Sprechblase mit `sprecher` als Namen. |
| `schalter` | Licht an/aus für DUNKEL-Bereiche |

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
| Küche | `kueche` | nein | 3 | Platzhalter-Geometrie |
| Garten | `garten` | nein | 4 | Platzhalter-Geometrie |
| Keller | `keller` | nein | 2 | Platzhalter, gesperrt bis Code 2412 |

### Navigation (Stand jetzt)
- `garage1` → Pfeil rechts → `garage2`
- `garage2` → Pfeil links → `garage1`
- `garage2` → Treppe (1200,200 190×600) → `treppenhaus`, erst wenn `g2_tuer_offen`
- `treppenhaus` → Metalltür links (10,60 270×760) → `garage2`
- `treppenhaus` → Holztür oben (998,55 90×270) → `wohnzimmer`, erst wenn `th_tuer_offen`
- `wohnzimmer` → Knopf unten → `treppenhaus`
- Küche, Garten und Keller hängen noch an keinem Weg, nur an den Raum-Knöpfen oben

### garage2 im Detail
Vier Ausschnitte, alle mit `nah: ''` — **Nahaufnahmen fehlen noch**:
- `g2_oben` Grosser Schrank, oben (470,150 350×396)
- `g2_unten` Grosser Schrank, unten (470,548 380×265)
- `g2_tuer` Tür zum Treppenhaus (1045,110 390×720) — schaltet den Weg zur Treppe frei
- `g2_spind` Spind rechts (1560,150 214×680)

### Wohnzimmer im Detail
- `w_regal` Schrank unter dem Bücherregal (860,330 230×145) → Ei e12
- `w_tvmoebel` Fernsehmöbel (1220,358 290×118) → Ei e13
- `w_regal_oben` Bücherregal (810,60 190×275), Rätsel 1 → Ei e16
- `w_frau` Die Frau im Sessel (240,95 430×330), typ `phasen`:
  0 schlafend (Grundbild) · 1 aufgeschreckt · 2 spricht · danach wieder 0.
  **Beide Texte sind Platzhalter.**
- Ei e04 liegt getarnt auf dem Teppich (1332,712)

Geplant, aber noch nicht gebaut: In einem anderen Raum liegt eine
Zigarettenschachtel. Gibt man sie der Frau, steht sie auf und geht weg —
erst dann lässt sich der Sessel untersuchen. Dafür fehlt noch das Bild
des Raums ohne die Frau.

Die alten Platzhalter-Teile des Wohnzimmers (Sofakissen, Bild an der Wand,
Vorhang, Truhe) sind weg, sie passten nicht zum echten Bild. Die vier Eier
wurden auf das neue Bild umgesetzt, Rätsel 1 hängt jetzt am Bücherregal.

### Treppenhaus im Detail
- `th_tuer` Holztür oben an der Treppe (960,20 230×395) — schaltet den Weg in den Flur frei
- `th_kiste` Holzkiste neben der Treppe (1390,440 240×175)

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

1. **Die 5 Rätsel sind Platzhalter** — markiert mit `[RÄTSEL 1–5]`. Knox muss echtes
   RPG-Wissen liefern (Figuren, Magazin-Inhalte, Orte). Aktuelle Platzhalter:
   - w_raetsel1 (Truhe): „Welche Figur hat geheiratet?" → abeena/logan
   - k_raetsel2 (Rezeptbuch): „Wie heisst das Magazin?" → simswelt
   - r_sonnenuhr: „Blazes Halbbruder?" → delsyn
   - e_sicher: „Nummer der ersten Ausgabe 2026?" → 28
   - e_tresor: Scherzrätsel → schlüssel/kamm/zahnrad
   - r_tuer (Kellertür): Code **2412**, Hinweis liegt auf der Garagen-Zeichnung
2. **Bilder für Wohnzimmer, Küche, Garten, Keller** fehlen
3. **In garage2 und treppenhaus fehlen die Eier** — die Ausschnitte sind
   verdrahtet, aber es liegt in beiden Ansichten noch kein Ei.
   Die Eier im Wohnzimmer sind grob platziert und sollten im Ausrichtemodus
   noch feinjustiert werden.
4. **Nahaufnahmen** aller Garage-Schränke fehlen
5. **„Zurück"-Knopf** am Spielende zeigt auf `index.html`, die im games-Repo nicht
   existiert → Ziel noch festzulegen (Forum? Übersichtsseite? weg?)
6. Am Handy noch nicht getestet (Zoom, Pinch, Tippen)

---

## 7. ARBEITSWEISE KNOX

- Will ehrliche Einschätzungen, kein Schönreden
- Dateien einzeln + vollständig liefern, Zielpfad angeben, ob neu oder ersetzt
- Schritt-für-Schritt-Anleitungen, wenn er selbst etwas tun soll
- Nicht raten — bei Unklarheit sagen, was er nachschauen soll
- Verifikation vor Lieferung: node-Syntaxcheck pro Script-Block, div-Balance,
  Datenkonsistenz (20 Eier, Zustände existieren, Eier liegen in ihrem Teil)
- Deploy-Muster: Dateien nach /mnt/user-data/outputs, dann present_files
