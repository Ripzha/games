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
- **Deploy:** GitHub-Weboberfläche, „Add file → Upload files" → „Commit changes". Kein Terminal.

### Bestenliste
Läuft über das bestehende Apps Script des Adventskalenders, getrennt über `spiel=ostern`:
`https://script.google.com/macros/s/AKfycbwxKRKsfh_2YFkS5a5kpDYWSQImA1lEq3ndnVJj4YpPqWcLrqmUinp-l4WA93e5U79MPA/exec`
Gewertet wird die **Zeit in Sekunden** (kleinster Wert = bester Platz). Am Script ist nichts zu ändern.

---

## 3. AUFBAU DER DATEI

Alles Inhaltliche steht oben im `<script>` unter **„DATEN"**:

- **RAEUME** — id, name, `start` (ID der ersten Ansicht), `gesperrtBis`
- **ANSICHTEN** — ein Blickwinkel eines Raums: id, raum, name, `bild` (geschlossen),
  `bildOffen` (alles offen), `breite`/`hoehe` in Bildpixeln.
  Ein Raum kann mehrere Ansichten haben (Garage: `garage1` Werkbank, `garage2` Tür).
- **WEGE** — Verbindungen zwischen Ansichten: `{ von, nach, art, label }`
  - `art: 'links'` / `'rechts'` → Pfeil am linken/rechten Bildrand
  - `art: 'raus'` → Knopf unten in der Mitte (mit `label` als Beschriftung)
  - `art: 'rein'` → anklickbare Stelle im Bild, braucht zusätzlich `x, y, w, h`
    in Bildpixeln; wird mit einer goldenen Marke angezeigt
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
| Garage | `garage1` Werkbank | **JA** (1774×887) | 7 | Fertig verdrahtet, 5 Ausschnitte |
| Garage | `garage2` Tür | **JA** (1774×887) | 0 | Nur Navigation, noch keine Teile und Eier |
| Wohnzimmer | `wohnzimmer` | nein | 4 | Platzhalter-Geometrie |
| Küche | `kueche` | nein | 3 | Platzhalter-Geometrie |
| Garten | `garten` | nein | 4 | Platzhalter-Geometrie |
| Keller | `keller` | nein | 2 | Platzhalter, gesperrt bis Code 2412 |

### Navigation (Stand jetzt)
- `garage1` → Pfeil rechts → `garage2`
- `garage2` → Pfeil links → `garage1`
- `garage2` → Tür (1090,140 305×680) → `wohnzimmer` — **Ziel provisorisch**,
  gedacht ist dort das Treppenhaus
- `wohnzimmer` → Knopf unten → `garage2`
- Küche, Garten und Keller hängen noch an keinem Weg, nur an den Raum-Knöpfen oben

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
3. **garage2 ist leer** — keine Ausschnitte, keine Eier. Die beiden Bilder
   (`garage2-zu.png` / `garage2-offen.png`) sind separat erzeugt und unterscheiden
   sich auch im Rauschen, ein Differenzbild bringt dort also nichts. Die Ausschnitte
   müssen von Hand im Ausrichtemodus gesetzt werden.
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
