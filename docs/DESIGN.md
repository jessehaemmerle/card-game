# Lunaris – Designsystem

Alle Werte stehen als CSS-Variablen am Anfang von `css/style.css`. Regeln verwenden ausschließlich diese Tokens; feste Farben oder Pixelgrößen gehören nicht in Komponenten.

## Theme: Cyanotypie

Vorbild sind die preußischblauen Lichtdrucke (Cyanotypien) des 19. Jahrhunderts, mit denen auch der Mond fotografiert wurde: eine körnige blaue Druckplatte, darauf Dinge aus Papier und weiße Linienzeichnungen. Das Spiel bleibt bewusst bei diesem einen dunklen Look (`color-scheme: dark`).

### Farbpalette

- **Druckplatte** `#1d3b6a` – Spieltisch
- **Plattentinte** `#0e2142` – Joker-Platten, dunkle Mondflächen
- **Kreide** `#e3e9ee` – Text und Linien auf der Platte
- **Papier** `#efede4` – Spielkarten, Tickets, Quittung, Tooltips
- **Tinte** `#17233a` – Text auf Papier
- **Mondlicht** `#f2dc8c` – beleuchtete Karten, aktuelle Mondphase, Hauptaktion

Bedeutungsfarben: **Zinnober** `#c33b25` für Mult, Abwerfen und Bosse, **Messing** `#d6a93f` für Geld, **Chips-Blau** `#2a5d9a` für Chips.

### Schrift

- **Überschriften, Namen, Kartenränge:** IM Fell English (Bleisatz-Antiqua), nur ab 18 px
- **Text, Zahlen, kleine Beschriftungen:** Alegreya Sans mit Tabellenziffern

## Tokens

| Gruppe | Tokens | Werte |
|---|---|---|
| Schriftgrößen (klassische Skala) | `--t-1` … `--t-9` | 12, 14, 16, 18, 21, 24, 30, 36, 48 px; Logo `--t-logo` |
| Abstände | `--sp-1` … `--sp-8` | 4, 8, 12, 16, 24, 32, 48, 64 px |
| Ecken | `--r-slip` / `--r-ui` / `--r-card` | 2 px Zettel, 4 px Bedienelemente und Platten, 6 px Spielkarten |
| Schatten | `--shadow-obj` / `--shadow-slip` | harter Versatz ohne Unschärfe: Dinge liegen auf dem Tisch, Zettel obenauf |
| Bewegung | `--dur-quick`, `--dur-orbit`, `--ease-orbit` | 0,12 s für Rückmeldungen, 0,8 s für die Mond-Umlaufbahn |
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

- Zahlenkarten zeigen die klassische Anordnung der Farbsymbole, Bildkarten einen kursiven Buchstaben (B, D, K), Asse ein großes Symbol.
- Verbesserungen färben das Papier und tragen oben ein Etikett (`.enh-tag`).
- Zustände: `.selected` (angehoben), `.lit` (Mondlicht-Rand), `.debuff` (grau mit Zinnober-Strich), `.back` (Rückseite, je Deck eigenes Muster), `.mini` (Deckübersicht).
- Handkarten sind `<button aria-pressed>`, Karten auf dem Tisch reine Bilder.

### Platte `.joker`, `.cons`, `.pack`

Linienzeichnung (`js/art.js`) plus Name. Seltenheit zeigt sich am Rahmen: einfach, doppelt, doppelt mit Mondlicht. Editionen sind statische Muster (Folie schraffiert, Holo Farbstreifen unten, Polychrom Streifen), keine Animation.
Arkana tragen ihre echte Tarot-Nummer, Sternbilder eine Sternkarte, Packs eine Umschlagklappe.

### Zettel

Tooltip, Hinweis (Toast), Quittung (gezackter Abriss, gepunktete Führungslinien), Ticket (gestanzte Seitenränder, Stempel „Besiegt“). Alle aus Papier mit hartem Versatzschatten.

### Mond-Umlaufbahn `.orbit`

Die eine laute Stelle des Designs. Fünf Phasen liegen auf einer Ellipse, die aktuelle steht vorn im Mondlicht-Ring, die nächste rechts daneben. Nach jeder Hand dreht sich die Bahn um eine Phase (`--dur-orbit`). Darunter steht in einem Satz, welche Farbe beleuchtet ist und was danach kommt.

## Regeln

- Mondlicht-Gelb bedeutet immer „beleuchtet“ oder „jetzt dran“, nie Dekoration.
- Keine Emoji, keine Verläufe als Schmuck, kein Glühen, keine Unschärfe-Schatten.
- Versalien und Sperrsatz für Beschriftungen vermeiden; Labels in normaler Schreibweise.
- Begriffe einheitlich: „beleuchtet“ (nicht „leuchtend“), „Blinde“, „Vorrat“ für Verbrauchskarten.
- Kontraste mindestens WCAG AA (geprüft: Kreide/Platte 9,1:1, Tinte/Papier 13,4:1, Zinnober/Papier 4,5:1, Karo/Papier 5,1:1).
- Bewegung nur als Antwort auf eine Aktion; `prefers-reduced-motion` schaltet Umlaufbahn und Kartenanimationen ab.
