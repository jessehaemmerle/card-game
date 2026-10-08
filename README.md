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

## Disco-Fieber

Starke Hände füllen das **Groove-O-Meter** auf dem Spielfeld (ab 15 % des Ziels 1 Punkt, ab 35 % 2, ab 60 % 3), eine schwache Hand leert es wieder. Bei 6 Punkten bricht das **Disco-Fieber** aus: Die nächsten 2 Hände bekommen **×2 Mult**, der Spieltisch wird zur leuchtenden Tanzfläche, und alles wippt im Takt.

Dazu läuft ein **prozedural erzeugter Funk-Soundtrack** (Bass, Schlagzeug, im Fieber Wah-Gitarre und Disco-Streicher), der schneller wird, je näher du dem Ziel kommst. Musik und Sound lassen sich getrennt abschalten.

## Aufnäher

17 Erfolge landen als gestickte **Aufnäher auf deiner Jeansjacke**, zum Beispiel „Saturday Night“ (10.000 Punkte mit einer Hand), „Mondlandung“ (einen Mondstein benutzen) oder „Der Mond gehört dir“ (einen Lauf gewinnen). Sie bleiben über alle Läufe hinweg erhalten und lassen sich im Titelbildschirm und in der Seitenleiste ansehen.

## Inhalt

- 12 Pokerhände (inkl. versteckter Hände wie Fünfling und Flush Five) mit Level-System
- 41 Joker in drei Seltenheiten, mit Editionen (Folie, Holo, Polychrom)
- 19 Arkana, 12 Sternbilder, 4 Mondsteine, 5 Booster-Packs
- 8 Kartenverbesserungen, 21 Boss-Blinden, 6 Start-Decks
- Seeds für reproduzierbare Läufe, Optionen für Spieltempo, Effekte, Sound, Musik und Röhrenfernseher

## Gestaltung

Lunaris sieht aus, als wäre es **1976** erschienen: Der Titel ist ein Schachteldeckel mit Regenbogenstreifen und Plaketten („1 Spieler“, „ab 10 Jahren“), die Seitenleiste ist ein Steuergerät aus Nussholz mit Alu-Typenschild, Dymo-Etiketten, Zählwerken wie am Kassettendeck und einer Radioskala, Joker und Vorrat liegen in schwarzem Rippenplastik, gespielt wird auf braunem Cord. Senfgelb, Orange, Petrol und Avocado, gestaffelte Streifenschatten hinter der Schrift, Tasten wie an einem Kassettendeck (Umschalter rasten ein und haben ein Lämpchen), Op-Art-Kartenrücken, Preise als Sternplaketten und Zeitgeist-Stempel wie „Dufte!“ nach starken Händen. Spielkarten zeigen klassische Kartenbilder, Joker sind Linienzeichnungen (SVG, kein Emoji). Blickfang ist die Mond-Umlaufbahn vor einem Strahlenkranz, der bei Vollmond zum Regenbogen wird. Schriften: *Shrikhand*, *Righteous* und *Alegreya Sans*. Hersteller und Ausgabe sind erfunden.

Dazu kommen **übertriebene Animationen**: Karten wirbeln beim Austeilen herein und knallen beim Spielen auf den Tisch, Konfetti, Sterne und Münzen fliegen, der Bildschirm wackelt bei großen Treffern, die Gesamtpunktzahl erscheint riesig in der Bildmitte, Bildschirmwechsel laufen über eine Regenbogen-Wischblende, beim Rundensieg senkt sich eine Disco-Kugel, und bei Game Over fällt alles vom Tisch. In den Optionen lässt sich „Effekte: ruhig“ wählen; bei der Systemeinstellung „Bewegung reduzieren“ ist das automatisch aktiv.

Die großen Momente bekommen eigene Auftritte:

- **Zeitlupe beim Siegtreffer:** Die Wertung, die das Ziel knackt, läuft in Zeitlupe mit Kamerafahrt, Herzschlag und Explosion. Die Chips- und Mult-Zähler brennen, und das Anzeigefenster füllt sich wie eine Lavalampe, bis es beim Ziel überläuft.
- **Boss-Intros:** Vor jeder Boss-Blinde wird es dunkel, es donnert, und ein Filmplakat knallt herein („Die Klammer – Diesen Sommer im Kino“).
- **Mondlandung:** Wer einen Mondstein benutzt, sieht eine Mondfähre auf dem aktuellen Mond landen, mit Triebwerksflamme, Staubwolke, Quindar-Pieptönen und Fahne.
- **Joker mit Gesichtern:** Wackelaugen folgen dem Mauszeiger, Joker jubeln beim Auslösen, kommentieren in Sprechblasen („Groovy!“, „Knorke!“, beim Werwolf „Auuuu!“) und schauen traurig, wenn der Lauf endet.
- **Röhrenfernseher:** Zeilenraster, Farbsäume, Bildstörungen bei großen Treffern und ein Abschalten wie beim alten Fernseher, wenn der Lauf vorbei ist.
- **Psychedelische Spirale:** Hinter dem Spielfeld dreht sich eine Spirale in den Streifenfarben, umso schneller, je voller der Groove ist. Im Disco-Fieber wechselt sie im Takt die Farben.

Tokens (Farben, klassische Schriftgrößenskala, Abstände, Ecken, Schatten, Bewegung) und Komponenten sind in [`docs/DESIGN.md`](docs/DESIGN.md) beschrieben.

Barrierefreiheit: alle Bedienelemente sind echte Buttons mit sichtbarem Tastaturfokus, Farbkontraste erfüllen WCAG AA, Dialoge halten den Fokus, Wertungen und neue Aufnäher werden für Screenreader angesagt und `prefers-reduced-motion` wird respektiert. Farbblitze sind auf höchstens drei pro Sekunde begrenzt, die Tanzfläche schaltet immer nur ein Viertel der Fliesen um, und „Effekte: ruhig“ stellt Partikel, Wackeln, Sprechblasen, Spirale und Takt-Bewegung ab.

**Tastatur:** `1`–`9` Karten wählen · `Enter` Hand spielen · `D` abwerfen · `S` Sortierung wechseln · `Esc` schließen (auch das Boss-Plakat).

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
js/music.js         Prozeduraler Funk-Soundtrack mit Taktgeber
js/patches.js       Aufnäher (Erfolge) und ihre Bedingungen
js/fx.js            Übertriebene Effekte: Partikel, Wackeln, Wischblende, Disco-Kugel, Flammen, Zeitlupe, Bildstörung
js/ui.js            Darstellung, Animationen, Eingaben, Speichern
tests/logic.test.js Logiktests + Bot-Simulation (node tests/logic.test.js)
docs/DESIGN.md      Designsystem: Tokens, Komponenten, Regeln
```

## Tests

```
node tests/logic.test.js
```

Prüft Handauswertung, Mondlicht und Joker-Wertung und lässt anschließend einen einfachen Bot 300 komplette Läufe spielen, um Laufzeitfehler aufzuspüren.
