# Lunaris

Ein Karten-Roguelike für den Browser, inspiriert von *Balatro* – mit einem eigenen Twist: dem **Mondzyklus**.

Spiele Pokerhände gegen steigende Punktziele, sammle Joker, verbessere dein Deck und besiege acht Antes voller Boss-Blinden.

## Spielen

Kein Build-Schritt, keine Abhängigkeiten: einfach `index.html` im Browser öffnen.
Alternativ über einen beliebigen statischen Webserver (z. B. GitHub Pages) ausliefern.

Der Spielstand wird automatisch im Browser (`localStorage`) gespeichert.

## Regeln in Kürze

- Jede **Ante** hat drei Blinden: Klein, Groß und einen **Boss** mit Sonderregel. Besiege den Boss der Ante 8, um zu gewinnen (danach geht es optional endlos weiter).
- Wähle bis zu 5 Karten und spiele eine Pokerhand. **Punkte = Chips × Mult.**
- Pro Runde hast du begrenzt viele **Hände** und **Abwürfe**.
- Nach jeder Blinde gibt es Geld (plus Zinsen) und einen **Shop** mit Jokern, Verbrauchskarten und Booster-Packs.
- Kleine und Große Blinden kannst du gegen eine Belohnung **überspringen**.

## Der Twist: Der Mondzyklus

Der Mond durchläuft fünf Phasen – **Neumond ♠ → Sichelmond ♥ → Halbmond ♣ → Buckelmond ♦ → Vollmond (alle Farben)** – und rückt nach **jeder gespielten Hand** eine Phase weiter, auch über Runden hinweg.

Die Farbe der aktuellen Phase ist **beleuchtet**: Jede gezählte Karte dieser Farbe gibt zusätzlich **+Mondkraft Mult** (anfangs +2). Dadurch wird jede Hand zu einer Planungsfrage: Spiele ich jetzt meinen Herz-Flush oder warte ich auf den Vollmond?

Rund um den Zyklus gibt es:

- **Mondsteine** (neue Verbrauchskarten): Mondkraft erhöhen, den Mond vor- oder zurückdrehen oder direkt zum Vollmond springen.
- **Mondsilber**: eine Kartenverbesserung, die immer leuchtet und doppeltes Mondlicht erhält.
- **Mond-Joker** wie *Werwolf* (×3 Mult bei Vollmond), *Polarstern* (die nächste Phase leuchtet mit), *Spiegelsee* (beleuchtete Karten zählen doppelt), *Mondkönig* (wächst mit jeder beleuchteten Karte) oder *Gezeitenwächter* (Abwürfe bewegen den Mond).
- **Mond-Bosse**: *Der Mondfresser* schwächt beleuchtete Karten, *Die Finsternis* löscht das Licht, *Der Gezeitensturm* lässt den Mond springen, und im Finale zählt beim *Blutmond* nur noch, was leuchtet.

## Inhalt

- 12 Pokerhände (inkl. versteckter Hände wie Fünfling und Flush Five) mit Level-System
- 41 Joker in drei Seltenheiten, mit Editionen (Folie, Holo, Polychrom)
- 19 Arkana, 12 Sternbilder, 4 Mondsteine, 5 Booster-Packs
- 8 Kartenverbesserungen, 21 Boss-Blinden, 6 Start-Decks
- Seeds für reproduzierbare Läufe, Spieltempo- und Sound-Optionen

## Gestaltung

Lunaris sieht aus, als wäre es **1976** erschienen: Der Titel ist ein Schachteldeckel mit Regenbogenstreifen und Plaketten („1 Spieler“, „ab 10 Jahren“), die Seitenleiste ist Holzfurnier wie an einer Spielkonsole, Joker und Vorrat liegen in schwarzem Rippenplastik, gespielt wird auf braunem Cord. Senfgelb, Orange, Petrol und Avocado, gestaffelte Streifenschatten hinter der Schrift, Pillen-Buttons, Op-Art-Kartenrücken, Preise als Sternplaketten und Zeitgeist-Stempel wie „Dufte!“ nach starken Händen. Spielkarten zeigen klassische Kartenbilder, Joker sind Linienzeichnungen (SVG, kein Emoji). Blickfang ist die Mond-Umlaufbahn vor einem Strahlenkranz, der bei Vollmond zum Regenbogen wird. Schriften: *Shrikhand*, *Righteous* und *Alegreya Sans*. Hersteller und Ausgabe sind erfunden.

Tokens (Farben, klassische Schriftgrößenskala, Abstände, Ecken, Schatten, Bewegung) und Komponenten sind in [`docs/DESIGN.md`](docs/DESIGN.md) beschrieben.

Barrierefreiheit: alle Bedienelemente sind echte Buttons mit sichtbarem Tastaturfokus, Farbkontraste erfüllen WCAG AA, Dialoge halten den Fokus, Wertungen werden für Screenreader angesagt und `prefers-reduced-motion` wird respektiert.

**Tastatur:** `1`–`9` Karten wählen · `Enter` Hand spielen · `D` abwerfen · `S` Sortierung wechseln · `Esc` schließen.

## Projektstruktur

```
index.html          Einstiegspunkt
css/style.css       Gestaltung
js/util.js          Seeded RNG, Formatierung
js/data.js          Pokerhände, Mondphasen, Bosse, Decks
js/scoring.js       Handauswertung, Mondlicht, Punkteberechnung
js/jokers.js        Joker-Definitionen
js/consumables.js   Arkana, Sternbilder, Mondsteine, Packs
js/art.js           Linienzeichnungen (SVG) für Joker, Bosse und Verbrauchskarten
js/game.js          Spielablauf (Runden, Shop, Packs)
js/audio.js         Synthetische Soundeffekte (WebAudio)
js/ui.js            Darstellung, Animationen, Eingaben, Speichern
tests/logic.test.js Logiktests + Bot-Simulation (node tests/logic.test.js)
docs/DESIGN.md      Designsystem: Tokens, Komponenten, Regeln
```

## Tests

```
node tests/logic.test.js
```

Prüft Handauswertung, Mondlicht und Joker-Wertung und lässt anschließend einen einfachen Bot 300 komplette Läufe spielen, um Laufzeitfehler aufzuspüren.
