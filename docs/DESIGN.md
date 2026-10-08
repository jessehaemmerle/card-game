# Lunaris – Designsystem

Alle Werte stehen als CSS-Variablen am Anfang von `css/style.css`. Regeln verwenden ausschließlich diese Tokens; feste Farben oder Pixelgrößen gehören nicht in Komponenten.

## Theme: Cyanotypie trifft Risodruck

Grundlage sind die preußischblauen Lichtdrucke (Cyanotypien) des 19. Jahrhunderts, mit denen auch der Mond fotografiert wurde: eine körnige blaue Druckplatte, darauf Dinge aus Papier und weiße Linienzeichnungen. Darüber liegt der Funk eines 70er-Planetariumsplakats im Risodruck: Neonpink, leicht versetzt überdruckt, Rasterpunkte, ein Strahlenkranz und Dinge, die schief auf dem Tisch liegen. Das Spiel bleibt bewusst bei diesem einen dunklen Look (`color-scheme: dark`).

### Farbpalette

- **Druckplatte** `#1d3b6a` – Spieltisch
- **Plattentinte** `#0e2142` – Joker-Platten, dunkle Mondflächen
- **Kreide** `#e3e9ee` – Text und Linien auf der Platte
- **Papier** `#efede4` – Spielkarten, Tickets, Quittung, Tooltips
- **Tinte** `#17233a` – Text auf Papier
- **Mondlicht** `#f2dc8c` – beleuchtete Karten, aktuelle Mondphase, Hauptaktion

- **Riso-Neonpink** `#ff48b0` – Mult, Abwerfen, Bosse und der versetzte Überdruck

Weitere Bedeutungsfarben: **Messing** `#d6a93f` für Geld, **Chips-Blau** `#2a5d9a` für Chips. Pink als Schrift auf Papier ist dunkler (`--fluo-ink` `#b0136b`), Schrift auf Pink ist immer Tinte. Rot (`--blood`) gibt es nur noch für den Blutmond.

### Schrift

- **Display (Logo, Überschriften, Kartenränge, Punktzahlen):** Shrikhand, eine fette 70er-Funk-Schrift, nur ab 18 px und nur in ihrem einen Schnitt
- **Text, Zahlen, Buttons, kleine Beschriftungen:** Alegreya Sans mit Tabellenziffern, Buttons in 800

## Tokens

| Gruppe | Tokens | Werte |
|---|---|---|
| Schriftgrößen (klassische Skala) | `--t-1` … `--t-9` | 12, 14, 16, 18, 21, 24, 30, 36, 48 px; Logo `--t-logo` |
| Abstände | `--sp-1` … `--sp-8` | 4, 8, 12, 16, 24, 32, 48, 64 px |
| Ecken | `--r-slip` / `--r-ui` / `--r-card` | 2 px Zettel, 4 px Bedienelemente und Platten, 6 px Spielkarten |
| Schatten | `--shadow-obj` / `--shadow-slip` | harter Versatz ohne Unschärfe: Dinge liegen auf dem Tisch, Zettel obenauf |
| Bewegung | `--dur-quick`, `--dur-orbit`, `--ease-orbit`, `--ease-boing` | 0,12 s für Rückmeldungen, 0,8 s für die Mond-Umlaufbahn, federnder Überschwinger für Joker, Karten und Stempel |
| Überdruck | `--misreg`, `--misreg-sm` | versetzte Pink-Kopie (3 px / 2 px) für Display-Text |
| Kontext | `--fg`, `--fg-dim`, `--rule` | auf der Platte hell, in Papier-Containern automatisch dunkel |

Papier-Container (`.ticket`, `.receipt`, `.modal-box`, `.end-box`, `#tooltip`, `.toast-item`) setzen die Kontext-Tokens um. Komponenten darin brauchen deshalb keine eigenen Farbvarianten.

## Komponenten

### Button `.btn`

| Variante | Einsatz |
|---|---|
| `.btn-primary` (Mondlicht) | die eine Hauptaktion eines Bildschirms: Hand spielen, Blinde spielen, Neuer Lauf |
| `.btn-danger` (Zinnober) | Abwerfen, Verkaufen, Lauf aufgeben |
| `.btn-buy` (Messing) | alles, was Geld kostet oder bringt |
| `.btn-quiet` (Kontur) | Nebenaktionen; `.on` markiert den aktiven Umschalter |

Größen: `.btn-tiny` (36 px, auf Touch 44 px), `.btn-small` (40 px), Standard (44 px), `.big` (52 px).
Zustände: gedrückt (2 px nach unten, Schatten schrumpft), deaktiviert (nur Kontur, gedämpfte Schrift), `.blocked` (sichtbar, erklärt beim Klick, warum es nicht geht).

### Spielkarte `.card`

- Die Hand ist aufgefächert (`--r`, `--dy` je Karte); ausgewählte Karten springen hoch und richten sich halb auf. Gespielte Karten landen leicht schief (`--tilt`, für jede Karte gleich).
- Zahlenkarten zeigen die klassische Anordnung der Farbsymbole, Bildkarten einen kursiven Buchstaben (B, D, K), Asse ein großes Symbol.
- Verbesserungen färben das Papier und tragen oben ein Etikett (`.enh-tag`).
- Zustände: `.selected` (angehoben), `.lit` (Mondlicht-Rand), `.debuff` (grau mit Zinnober-Strich), `.back` (Rückseite, je Deck eigenes Muster), `.mini` (Deckübersicht).
- Handkarten sind `<button aria-pressed>`, Karten auf dem Tisch reine Bilder.

### Platte `.joker`, `.cons`, `.pack`

Linienzeichnung (`js/art.js`) plus Name. Seltenheit zeigt sich doppelt: am Rahmen (einfach, doppelt, doppelt mit Mondlicht) und an der Farbe des versetzten Überdrucks der Grafik (Blau, Mondlicht, Pink). Platten kippen mit dem Mauszeiger leicht in 3D und federn beim Auswählen. Editionen sind statische Muster (Folie schraffiert, Holo Farbstreifen unten, Polychrom Streifen), keine Animation.
Arkana tragen ihre echte Tarot-Nummer, Sternbilder eine Sternkarte, Packs eine Umschlagklappe.

### Zettel

Tooltip, Hinweis (Toast), Quittung (gezackter Abriss, gepunktete Führungslinien, leicht schief), Ticket (gestanzte Seitenränder, verstreut gedreht, Stempel „Besiegt“). Alle aus Papier mit hartem Versatzschatten. Preise im Shop kleben als runde Messing-Sticker an der Ware. Wertungen erscheinen als Stempel mit zufälliger Neigung.

### Mond-Umlaufbahn `.orbit`

Die lauteste Stelle des Designs. Fünf Phasen liegen auf einer Ellipse, die aktuelle steht vorn im gestrichelten Mondlicht-Ring vor einem Strahlenkranz, die nächste rechts daneben. Dunkle Mondseiten sind gerastert (`#raster` aus `js/art.js`). Bei Vollmond färbt sich der Strahlenkranz gelb und dreht sich langsam. Nach jeder Hand dreht sich die Bahn um eine Phase (`--dur-orbit`). Darunter steht in einem Satz, welche Farbe beleuchtet ist und was danach kommt.

## Regeln

- Mondlicht-Gelb bedeutet immer „beleuchtet“ oder „jetzt dran“, nie Dekoration.
- Keine Emoji, keine Verläufe als Schmuck, kein Glühen, keine Unschärfe-Schatten. Funk entsteht aus Druck-Effekten (Überdruck, Raster, Strahlen) und aus Dingen, die schief liegen.
- Versalien und Sperrsatz für Beschriftungen vermeiden; Labels in normaler Schreibweise.
- Begriffe einheitlich: „beleuchtet“ (nicht „leuchtend“), „Blinde“, „Vorrat“ für Verbrauchskarten.
- Kontraste mindestens WCAG AA (geprüft: Kreide/Platte 9,1:1, Tinte/Papier 13,4:1, Tinte/Neonpink 5,1:1, Pinkschrift/Papier 5,7:1, Mondlicht/Platte 8,2:1, Karo/Papier 5,1:1).
- Bewegung antwortet auf Aktionen; einzige Daueranimation ist der Strahlenkranz bei Vollmond. `prefers-reduced-motion` schaltet Umlaufbahn, Federn, Kippen und Strahlenkranz ab.
