# Lunaris – Designsystem

Alle Werte stehen als CSS-Variablen am Anfang von `css/style.css`. Regeln verwenden ausschließlich diese Tokens; feste Farben oder Pixelgrößen gehören nicht in Komponenten.

## Theme: Ausgabe 1976

Lunaris sieht aus, als wäre es in den Siebzigern erschienen: eine Spielschachtel mit Regenbogenstreifen, eine Konsole mit Holzfurnier und schwarzem Rippenplastik, ein Spieltisch aus braunem Cord und Karten aus Chamois-Karton. Hersteller und „Ausgabe 1976“ sind erfunden. Das Spiel bleibt bewusst bei diesem einen dunklen Look (`color-scheme: dark`).

### Farbpalette

- **Kakao** `#2c1a10` – Spieltisch (Cord)
- **Nussholz** `#5e341a` – Seitenleiste (Furnier)
- **Chamois** `#f4e6c8` – Karten, Tickets, Tooltips und helle Schrift
- **Tinte** `#3a2215` – Schrift auf Karton
- **Senfgelb** `#f2b52b` – beleuchtete Karten, aktuelle Mondphase, Hauptaktion
- **Orange** `#f0782a` – Mult, Abwerfen, Bosse
- **Petrol** `#187172` – Chips
- **Avocado** `#a2b13a` – Geld und Kaufen

Die Siebziger-Streifen laufen von hell nach dunkel: `#f2b52b`, `#f08b1f`, `#e05a1a`, `#a83a18`, `#5e2814` (`--st1` … `--st5`). Schrift in Akzentfarben auf Karton nutzt dunklere Varianten (`--orange-ink`, `--teal-ink`, `--avocado-ink`), Geld auf Holz eine hellere (`--avocado-lt`). Rot (`--blood`) gibt es nur für den Blutmond.

### Schrift

- **Display (Logo, Überschriften, Kartenränge, große Punktzahlen):** Shrikhand, im Stil der Cooper Black, nur ab 18 px
- **Groovy (Buttons, Zahlen, Labels, Anzeigen):** Righteous, die runde Techno-Schrift der Spielautomaten
- **Fließtext:** Alegreya Sans

## Tokens

| Gruppe | Tokens | Werte |
|---|---|---|
| Schriftgrößen (klassische Skala) | `--t-1` … `--t-9` | 12, 14, 16, 18, 21, 24, 30, 36, 48 px; Logo `--t-logo` |
| Abstände | `--sp-1` … `--sp-8` | 4, 8, 12, 16, 24, 32, 48, 64 px |
| Ecken | `--r-slip` / `--r-card` / `--r-ui` / `--r-pill` | 6 px Zettel, 10 px Karten, 12 px Ablagen, Pillenform für Buttons und Plaketten |
| Schatten | `--shadow-obj` / `--shadow-slip` | harter Versatz ohne Unschärfe |
| Streifenschatten | `--stack-lg` / `--stack-md` / `--stack-sm` | gestaffelte Kopien in den Streifenfarben hinter Display-Schrift |
| Texturen | `--tex-grain`, `--tex-wood`, `--tex-cord`, `--tex-rib`, `--stripes-h` | Korn, Holzmaserung, Cordrippen, Rippenplastik, Streifenband |
| Bewegung | `--dur-quick`, `--dur-orbit`, `--ease-orbit`, `--ease-boing` | 0,12 s Rückmeldung, 0,8 s Umlaufbahn, federnder Überschwinger |
| Kontext | `--fg`, `--fg-dim`, `--rule` | auf Tisch und Holz hell, in Karton-Containern automatisch dunkel |

Karton-Container (`.ticket`, `.receipt`, `.modal-box`, `.end-box`, `#tooltip`, `.toast-item`) setzen die Kontext-Tokens um. Komponenten darin brauchen keine eigenen Farbvarianten.

## Komponenten

### Schachteldeckel (Titel)

Logo mit gestaffeltem Streifenschatten und tanzenden Buchstaben, Untertitel, Plaketten wie auf einer Spielschachtel („1 Spieler“, „ab 10 Jahren“, „ca. 30 Min.“), ein Streifen-Schwung von unten rechts und die Spielvarianten in einer Rippenplastik-Ablage.

### Button `.btn`

Pillenform mit dickem Versatzschatten, Schrift Righteous.

| Variante | Einsatz |
|---|---|
| `.btn-primary` (Senf) | die eine Hauptaktion eines Bildschirms |
| `.btn-danger` (Orange) | Abwerfen, Verkaufen, Lauf aufgeben |
| `.btn-buy` (Avocado) | alles, was Geld kostet |
| `.btn-quiet` (Kontur) | Nebenaktionen; `.on` markiert den aktiven Umschalter |

Größen: `.btn-tiny` (36 px, auf Touch 44 px), `.btn-small` (40 px), Standard (44 px), `.big` (52 px). Zustände: angehoben beim Überfahren, gedrückt, deaktiviert (nur Kontur), `.blocked` (erklärt beim Klick, warum es nicht geht).

### Konsole (Seitenleiste)

Holzfurnier mit Streifenband unter dem Logo. Die Punkte stehen in einem schwarzen Anzeigefenster mit orangen Ziffern, der Fortschritt als Streifen-Balken. Chips stehen auf Petrol, Mult auf Orange.

### Spielkarte `.card`

- Chamois-Karton mit runden Ecken; Zahlenkarten zeigen die klassische Anordnung der Farbsymbole, Bildkarten einen großen Buchstaben mit Senf-Schatten.
- Die Hand ist aufgefächert (`--r`, `--dy`); ausgewählte Karten springen hoch. Gespielte Karten landen schief (`--tilt`).
- Rückseiten sind Op-Art: Ringe, Diagonalstreifen, Wellen, Schachbrett, Punkte, Sonne halb und halb, je nach Deck.
- Zustände: `.selected`, `.lit` (Senf-Rand), `.debuff` (grau mit Orange-Strich), `.back`, `.mini`.

### Platte `.joker`, `.cons`, `.pack`

Joker sind braune Platten mit Linienzeichnung (`js/art.js`) und einem Streifenband unten: Petrol für gewöhnliche, zwei Streifen für ungewöhnliche, alle fünf für seltene. Die Grafik ist versetzt in derselben Logik überdruckt. Platten kippen mit dem Mauszeiger und federn beim Auswählen. Arkana tragen ihre Tarot-Nummer, Sternbilder eine Sternkarte auf Petrol, Mondsteine liegen auf Senf, Packs haben eine Streifenkante.

### Zettel und Tickets

Tooltip, Hinweis (Pille), Kassenzettel und Tickets aus Karton mit Streifenkante oben. Tickets liegen verstreut und gedreht, besiegte bekommen einen Stempel. Preise kleben als Sternplaketten an der Ware. Wertungen erscheinen als Pillen, ×Mult als Sternplakette, große Hände zusätzlich als Zeitgeist-Stempel („Klasse!“, „Spitze!“, „Dufte!“, „Irre!“).

### Mond-Umlaufbahn `.orbit`

Fünf Phasen auf einer Ellipse, die aktuelle steht vorn im gepunkteten Ring vor einem Strahlenkranz aus Senf und Orange. Dunkle Mondseiten sind mit orangen Punkten gerastert (`#raster`). Bei Vollmond wird der Strahlenkranz zum Regenbogen und dreht sich langsam.

## Regeln

- Senfgelb bedeutet immer „beleuchtet“ oder „jetzt dran“.
- Keine Emoji, kein Glühen, keine Unschärfe-Schatten. Der Siebziger-Funk entsteht aus Streifen, Materialien (Holz, Cord, Rippenplastik, Karton), runden Formen und Dingen, die schief liegen.
- Versalien und Sperrsatz für Beschriftungen vermeiden; Labels in normaler Schreibweise.
- Begriffe einheitlich: „beleuchtet“, „Blinde“, „Vorrat“.
- Kontraste mindestens WCAG AA (geprüft u. a.: Chamois/Tisch 13,5:1, Tinte/Karton 12:1, Tinte/Orange 5,2:1, Chamois/Petrol 4,7:1, Geld/Holz 6:1, Herz/Karton 5,3:1).
- Bewegung antwortet auf Aktionen; einzige Daueranimation ist der Strahlenkranz bei Vollmond. `prefers-reduced-motion` schaltet Umlaufbahn, Federn, Kippen und Strahlenkranz ab.
