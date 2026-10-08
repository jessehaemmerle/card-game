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

### Groove-O-Meter `.groove`

Ein Hi-Fi-Kästchen aus Rippenplastik oben rechts im Spielfeld (auf dem Handy als Zeile darüber). Sechs Leuchtsegmente wie bei einer Aussteuerungsanzeige: zwei Avocado, zwei Senf, Orange, Rot. Im Disco-Fieber leuchten alle in den Streifenfarben, das Kästchen bekommt einen Senfrahmen, und die Naht des Spielfelds wird golden.

### Tanzfläche `.floor` und Spirale `.spiral`

Beide liegen in `.field-bg` hinter dem Inhalt. Die Spirale (`A.spiral()`, fünf verdrehte Arme in Streifenfarben, Petrol und Avocado) dreht sich per Skript; Deckkraft 8 % bis 26 % je nach Groove, im Fieber 28 %. Die Tanzfläche ist ein 8×5-Raster in Perspektive und nur im Fieber sichtbar. Pro Schlag leuchtet genau ein Viertel der Fliesen (46 % statt 12 % Deckkraft); die Gesamthelligkeit bleibt dadurch gleich. Text auf dem Spielfeld bekommt im Fieber eine dunkle Unterlage.

### Lavalampe im Anzeigefenster

Das Punktefenster füllt sich von unten mit dunkler Lava (`--fill` in Prozent des Ziels), darin steigen Blasen. Ab 100 % läuft es über und tropft. Die orange Zahl bleibt lesbar (5:1 auf der Lava, 3,9:1 auf den Blasen bei 36 px).

### Filmplakat `.poster`

Chamois-Karton im Hochformat mit doppeltem Rahmen, Strahlenkranz hinter dem Boss-Siegel, Titel in Shrikhand mit Streifenschatten (Schriftgröße passt sich dem längsten Wort an), Werbezeile in Orange, Regel zwischen Doppellinien, Abspann mit Ante, Ziel und Belohnung.

### Joker-Gesicht `.jface`

Wackelaugen (weiße Kreise mit Tintenrand) oben auf der Platte, darunter ein dunkler Mund mit Chamois-Rand. `.cheer` öffnet den Mund und weitet die Augen, im Game Over hängen Augen und Mundwinkel. Sprechblasen `.jbubble` sind Chamois-Zettel mit Tintenrand und Spitze nach oben.

### Aufnäher `.patch` und Jeansjacke `.jacket`

Gestickte Abzeichen: Stoff in einer Akzentfarbe mit Köperstruktur, dicker Rand in der dunklen Variante, gestrichelte Ziernaht. Formen: rund, Schild, oval. Die Jacke ist Denim (zwei Blautöne, Köper, Korn) mit orangefarbener Doppelnaht; offene Plätze sind gestrichelte Kreise mit Hinweis. Neue Aufnäher fliegen oben rechts herein und danach auf den Jacken-Button.

### Röhrenfernseher `.crt`

Fester Überzug über allem: Zeilenraster, Streifenmaske in Rot, Grün und Blau, Vignette und abgerundete Bildschirmecken. Bei großen Treffern verschiebt `#app.glitch` das Bild mit roten und blauen Farbsäumen. Am Ende eines Laufs schaltet sich `.run.tv-off` zu einer Linie ab, der Abschlussdialog schaltet sich mit `.tv-on` ein. Abschaltbar unter „Röhrenfernseher“.

## Übertriebene Animationen (`js/fx.js`)

Standardmäßig ist „Effekte: übertrieben“ aktiv. Das Effekt-Modul zeichnet Partikel auf einem eigenen Canvas (Konfetti, Sterne, Monde, Münzen) und steuert Bildschirmwackeln, Farbblitze, Riesentext, die Regenbogen-Wischblende, die Disco-Kugel, Feuerwerk und die Lavalampe im Hintergrund.

| Moment | Effekt |
|---|---|
| Titel | Buchstaben fallen herein und tanzen, Streifen zeichnen sich, Monde rollen herein, Plaketten springen auf |
| Bildschirmwechsel | Regenbogen-Wischblende aus fünf Streifen |
| Austeilen | Karten wirbeln vom Nachziehstapel in den Fächer |
| Spielen | Karten knallen auf den Tisch, Staubwolken, Wackeln |
| Wertung | Karten hüpfen und drehen sich, Joker wirbeln, Partikel in der Farbe der Wertung, ×Mult mit Blitz und starkem Wackeln, Geld als fliegende Münzen |
| Gesamtpunkte | riesige Zahl in der Bildmitte, die ins Anzeigefenster fliegt; Zeitgeist-Stempel; bei „Irre!“ Feuerwerk |
| Rundensieg | Disco-Kugel, Konfettiregen, Feuerwerk, „Blinde besiegt!“ |
| Neue Mondphase | Ring, Sternenregen, das Sonnenrad pulsiert; Vollmond mit Blitz, Heulen und Riesentext |
| Shop | Waren schwingen herein, Neu würfeln wirbelt sie, gekaufte Joker fliegen mit Drehung in die Ablage, Packs platzen |
| Siegtreffer | Zeitlupe ab der Wertung davor: Kamerafahrt auf die Karte, Vignette, Herzschlag; dann Explosion mit Ringen, Blitz und „Treffer!“ |
| Hohe Wertung | Chips und Mult brennen (Flammen-Partikel), sobald die Hand das Ziel schafft oder die Mult 40 erreicht |
| Disco-Fieber | Fanfare, Disco-Kugel, Konfetti, „Disco-Fieber!“; danach wippen Joker, Hand und Monde im Takt der Musik |
| Boss-Blinde | Abdunkeln, Donner, ein Blitz, Filmplakat knallt herein |
| Mondstein | Mondfähre landet auf dem aktuellen Mond, Staubwolke, Quindar-Töne, Fahne |
| Joker lösen aus | jubelndes Gesicht, manchmal eine Sprechblase |
| Neuer Aufnäher | Abzeichen fliegt herein, Fanfare, fliegt auf den Jacken-Button |
| Game Over | alles fällt vom Tisch, der Bildschirm wird grau, der Fernseher schaltet sich ab, das Fenster schaltet sich ein |
| Dauerbewegung | Joker wippen, die Hand wogt, Monde schweben, Preis-Sterne schaukeln, das Sonnenrad dreht sich, Lavalampen-Blasen ziehen |

Mit „Effekte: ruhig“ in den Optionen oder der Systemeinstellung „Bewegung reduzieren“ setzt das Spiel `html.fx-calm`: keine Partikel, kein Wackeln, keine Dauerbewegung, keine Zeitlupe, keine Sprechblasen, Plakate oder Landungen; Spirale und Tanzfläche stehen still.

Schutz bei Lichtempfindlichkeit: `FX.flash` löst höchstens alle 350 ms aus (unter drei Blitzen pro Sekunde), die Tanzfläche ändert nie die Gesamthelligkeit, und die Bildstörung verschiebt nur Farbsäume statt großer Flächen.

## Musik (`js/music.js`)

Ein Vorausplaner (alle 25 ms, 0,12 s im Voraus) spielt zwei Takte in Sechzehnteln mit leichtem Swing. Normal: synkopierte Bassdrum, Backbeat, Achtel-Hi-Hat und eine Basslinie in e-Moll-Pentatonik. Im Disco-Fieber: Bassdrum auf jedem Schlag, offene Hi-Hat, Oktavbass, Wah-Akkorde (Em9, A13) und Streicher. Tempo 104 bis 132 BPM je nach Rundenfortschritt, im Fieber 8 BPM mehr. Jeder Schlag meldet sich bei der Oberfläche (`html.beat`); ohne Ton läuft im Fieber eine stille Uhr weiter.

## Regeln

- Senfgelb bedeutet immer „beleuchtet“ oder „jetzt dran“.
- Keine Emoji, kein Glühen, keine Unschärfe-Schatten. Der Siebziger-Funk entsteht aus Streifen, Materialien (Holz, Cord, Rippenplastik, Karton), runden Formen und Dingen, die schief liegen.
- Versalien und Sperrsatz für Beschriftungen vermeiden; Labels in normaler Schreibweise.
- Begriffe einheitlich: „beleuchtet“, „Blinde“, „Vorrat“.
- Kontraste mindestens WCAG AA (geprüft u. a.: Chamois/Tisch 13,5:1, Tinte/Karton 12:1, Tinte/Orange 5,2:1, Chamois/Petrol 4,7:1, Geld/Holz 6:1, Herz/Karton 5,3:1, Tinte/Avocado 6,3:1, Chamois/Denim 5,4:1).
- Denim gibt es nur auf der Jeansjacke; es ist ein Material wie Holz und Cord, keine neue Akzentfarbe.
- Bewegung ist bewusst übertrieben, lässt sich aber jederzeit abschalten (`html.fx-calm`, siehe oben). Klickziele bewegen sich höchstens wenige Pixel.
