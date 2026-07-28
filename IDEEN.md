# Ideen & Reihenfolge

Lebende Liste. Wird fortgeschrieben – erledigte Punkte wandern nach unten in
„Erledigt", neue Ideen kommen oben dazu und werden neu eingeordnet.

Zuletzt aktualisiert: Juli 2026 (Stand v91)

---

## ~~Rang 1 – „Warum diese App?" – eine Zweck-Seite~~ ✅ gebaut in v80

**Umgesetzt:** Nicht als eigener Reiter, sondern als neuer Abschnitt **oben im
„?"-Blatt**. Damit das Blatt dadurch nicht länger wird, sind die bestehenden
sechs Punkte („So funktioniert's") und die Bedienungs-Tipps in Aufklapper
gewandert – das Blatt ist jetzt **kürzer als vorher**. Der Demo-Knopf steht
weiter oben, direkt nach dem Zweck-Text.

**Spenden:** Block gebaut, erscheint an zwei Stellen (Hilfe-Blatt nach dem
Vertrauens-Abschnitt, Bilanz unter „Deine Wirkung"). Solange in
`SPENDEN_URL` kein Ziel steht, wird er **überall ausgeblendet** – lieber
nichts zeigen als ein Knopf ins Leere.
⚠️ **Offen – und bewusst vertagt.** PayPal.me wurde beim Einrichten verworfen:
PayPal weist darauf hin, dass bei einem Privatkonto **Name, Foto, E-Mail,
Handynummer und Standort** anderen Nutzern gezeigt werden.
Recherche ergab: **Ko-fi allein schützt nicht** – entscheidend ist der
Auszahlungsweg (PayPal privat ❌ · PayPal Geschäftskonto ✅ · Stripe ✅).
Zusätzlich: Ein Spendenknopf kann die App vom „rein privaten" in den
geschäftsmäßigen Bereich rücken und damit **Impressumspflicht** auslösen –
der Play Store allein tut das nicht (dort ist bei Privatkonten ohne
In-App-Käufe nur die E-Mail öffentlich).
**Empfehlung: erst ohne Spendenknopf veröffentlichen.** Details und Quellen
in PLAYSTORE.md.

Test: `test_zweck.js` 13/13 (beide Zustände – mit und ohne hinterlegtes Ziel).

<details><summary>Ursprüngliche Notizen zur Zweck-Seite</summary>

Vom Betreiber angestoßen und als wichtig eingestuft. Bisher erklärt die App
nirgends, **wofür es sie gibt und für wen** – und vor allem nicht, wie sie sich
von einer EMS-App unterscheidet. Genau diese Abgrenzung ist ihr Daseinsgrund.

### Die Kernbotschaft (Worte des Betreibers, verdichtet)

> Ein EMS steuert, was **fest angeschlossen** ist. Diese App plant alles
> **andere** – die Geräte, die du selbst startest.

- **Zielgruppe:** Haushalte mit PV, deren Geräte **nicht** am EMS hängen –
  kleine Helfer wie auch größere Verbraucher, die **unregelmäßig** laufen und
  deshalb nicht zur planbaren Grundlast gehören. „Kleinvieh macht auch Mist."
- **Die Lücke:** Die wenigsten Geräte sind wirklich ans EMS angeschlossen. Für
  alles übrige ist man bisher **auf sich allein gestellt**.
- **Die App steuert nichts** – sie berät. Deshalb braucht sie keine
  Geräte-Anbindung, keine Konten, keine laufenden Kosten. **Deshalb ist sie
  kostenlos.** Live-Steuerung ist und bleibt Aufgabe des EMS.

### Die zwei Hebel, die die App nutzt

1. **Sonne** – wann scheint sie, auch **vorausschauend**: heute, morgen und über
   den Wochenausblick („wann ist wieder ein guter Tag?"). Was sich aufschieben
   lässt, wandert dorthin, wo Sonne frei ist.
2. **Dynamischer Strompreis** – wenn wenig Sonne da ist, zählt der günstige
   Zeitpunkt am Netz. Die Börsenpreise für den Folgetag stehen **ab etwa 14 Uhr**
   zur Verfügung; ab dann kann die App den nächsten Tag vollständig planen.

### Was auf die Seite gehört

- Sinn & Zweck in einfachen Worten (Text oben)
- Klare Trennung **EMS ↔ diese App** – am besten als Gegenüberstellung
- Die beiden Hebel (Sonne / dynamischer Preis) kurz erklärt
- **Verlinkung auf die Demo-Tour** – zeigen statt beschreiben
- **Spenden-Knopf** (siehe unten) – hier ist sein natürlicher Platz
- Im gewohnten Look der App

### Spenden-Knopf – ~~Entscheidung gefallen~~ (überholt, siehe oben)

- ~~**Dienst: PayPal**~~ – beim Einrichten verworfen, siehe Hinweis oben
- **Platz: auf dieser Zweck-Seite.** Wer liest, warum es die App gibt, ist im
  richtigen Moment. Optionaler Zweitplatz: unten in der Bilanz unter „Deine
  Wirkung" – beim Bauen entscheiden, ob beides oder nur einer.
- **Ausdrücklich nicht:** Startseite (Arbeitsfläche), Pop-up, Tab-Leiste
- Ton: Danke, nicht Schranke – „Diese App ist kostenlos, werbefrei und sammelt
  keine Daten. Wenn sie dir hilft: ☕"
- Zurückhaltung: „nicht mehr anzeigen"-Möglichkeit; kein Betteln
- Technisch: externer Link (PayPal.me). Im Play Store ohnehin Pflicht – Googles
  eigene Bezahlfunktion ist für Spenden gesperrt. Ein Link deckt Web, iPhone und
  Android ab.

### Warum das obendrein Arbeit spart

Genau dieser Text ist später die **Store-Beschreibung** (Play Store Phase 3
verlangt Kurz- und Langbeschreibung). ⚠️ Einschränkung: Der **Aufmacher**
braucht zwei Fassungen. In der App darf EMS-Wissen vorausgesetzt werden, im
Store nicht – dort schaut jemand, der PV hat und sonst nichts. Deshalb steht
in der App der Nutzen zuerst („Waschen, wenn die Sonne scheint") und die
EMS-Abgrenzung als zweiter Absatz.

</details>

---

## ~~Rang 1 – Übersicht bei wachsenden Daten (Woche-Reiter)~~ ✅ erledigt in v81+v82

**Gemessen** (8 Geräte, 3 Routinen, 6 Rhythmen; Bildschirm = 852 px):
Heute 942 px · Bilanz 1285 px · **Woche 1849 px** ← der Problemfall.

✅ **Teil 1 erledigt in v81:** Der Sonnen-Ausblick ist von „Woche" auf die
Startseite gewandert – als aufklappbare Zeile in der Ertrags-Karte.
Zugeklappt kostet er nur **55 px** (Startseite bleibt unter einem Bildschirm),
aufgeklappt zeigt er die volle 7-Tage-Grafik. Zustand wird gemerkt
(`cfg.ausblickOffen`). Der Satz passt sich an: Regen morgen → „heute
vorziehen"; alle Tage ähnlich → neutraler Satz; besserer Tag kommt → „warten
lohnt". Test `test_ausblick.js` 18/18.
Im Woche-Reiter bleibt der ausführliche Ausblick erhalten.

✅ **Teil 2 erledigt in v82:** Der Reiter heißt jetzt **„Routinen"** (Symbol 🔁,
interner Schlüssel bleibt `woche`) und beschränkt sich auf das, was sich wiederholt.
Der Ausblick ist dort ganz entfallen. **1849 → 764 px** – erstmals ein Bildschirm.
Alles aufgeklappt: 1200 px. Test `test_routinen.js` 21/21.

Umgesetzt: zwei Klappgruppen mit Anzahl (Routinen offen, Rhythmen zu), wiederholter
Satz einmal über die Liste, breiter Knopf → 📌 in der Kopfzeile, Namen vor Etiketten
(das Etikett bekam `flex-shrink:8`, sonst schrumpft der längere Name zuerst),
gestrichelter Rand für geratene Rhythmen. Gerettet: Grafik-Erklärung unter den
aufgeklappten Ausblick, Punkte-Legende ins ⓘ der Routinen-Gruppe. Demo-Tour
angepasst (zeigte auf ein Element, das es dort nicht mehr gibt).

<details><summary>Die ursprünglichen fünf Aufräum-Punkte</summary>


1. **Derselbe Satz je Rhythmus** – „Nächster fälliger Lauf: heute – liegt schon
   als Vorschlag auf der Startseite." steht bei jedem Eintrag. → einmal über die
   Liste setzen.
2. **Derselbe große Knopf je Rhythmus** – „+ Als feste Routine übernehmen",
   volle Breite, ~45 px pro Eintrag, für eine einmalige Aktion.
   → kleines Symbol in die Kopfzeile zu ✏️ und 🗑.
3. **Namen werden abgeschnitten, Etiketten nicht** – „Spülmas…", „Poolpu…",
   während „Mi · jede Woche" ungekürzt danebensteht. → Rangfolge umdrehen.
4. **Dauerhafte Erklärtexte** (~250–300 px) → in ein ⓘ verlegen.
5. **Zwei Listen, die gleich aussehen** (Routinen ↔ Rhythmen), obwohl das eine
   Einstellungen sind und das andere Vermutungen. → Klappgruppen mit Anzahl,
   Rhythmen optisch als „geraten" kennzeichnen (z. B. gestrichelter Rand).

</details>

~~**Noch offen – Nebenfund:** Bilanz zeigt oben **1,8 €** und darunter **1,75 €**~~
✅ **erledigt in v84.** Ursache war nicht die Rechnung, sondern die
Hochzähl-Animation: `zaehlElement()` erkannte nur *ob* eine Nachkommastelle da
war und formatierte dann pauschal mit `toFixed(1)`. Aus dem korrekt
gerenderten `1,75 €` wurde beim Hochzählen `1,8 €` – der nicht animierte Text
zwei Zeilen tiefer blieb bei 1,75 €. Jetzt übernimmt die Animation die
Stellenzahl aus dem gerenderten Text. Die kWh-/kg-Kacheln (eine Stelle) und
die Serie (ganzzahlig) bleiben unverändert.

### Weitere Stellen, die mit Daten wachsen

Ziel des Betreibers: Der Look soll nicht zerreißen, je mehr Daten sich ansammeln.

**Regel: „Drei sichtbar, Rest im Aufklapper."**
Vorlage existiert bereits und funktioniert: Bilanz-Archiv („27 weitere Läufe
anzeigen"), die sechs `details.egrp`-Klappgruppen im Einrichten und seit v79
die Geräteliste auf der Startseite.

| Stelle | Wächst mit | Vorschlag |
|---|---|---|
| 🔁 Feste Routinen (Woche) | jeder Routine | Klappgruppe mit Anzahl im Kopf |
| 🤖 Erkannte Rhythmen (Woche) | jedem gelernten Gerät | ebenso, zugeklappt starten |
| ~~„Heute schon gelaufen"~~ | — | ✅ in v84 erledigt (ab 5 Einträgen) |
| ~~Geräte auf der Startseite~~ | — | ✅ in v79 erledigt |
| ~~Meine Geräte (Einrichten)~~ | — | ✅ steckt schon in Klappgruppe |

**Für später:** „💤 Länger nicht genutzt" – was 60 Tage nicht lief, wandert
automatisch in eine zugeklappte Gruppe. Erst bauen, wenn es nötig wird.

---

## Rang 1 – Die Ersparnis-Rechnung (Prüfung v85, noch nichts geändert)

Vom Betreiber angestoßen: „Auf was berechnest du das und sind wirklich alle
Punkte berücksichtigt?"

### Was heute gerechnet wird

`spar = Σ (sonnengedeckte kWh der Stunde) × (Netzpreis der Stunde)`
in `laufBilanz()`; Netzpreis kommt aus `stunden()`:
**dynamisch** = Börsenpreis (€/MWh ÷ 10) + `cfg.aufschlag` · **fest** =
`cfg.festpreis × 100`, konstant. Sonnengedeckt = `min(Geräte-kW, pv − hg)`.

✅ **Der Tarif ist berücksichtigt.** ✅ Der Hintergrundverbrauch wird korrekt
vorab abgezogen. ✅ Alt-Läufe sind als Schätzung gekennzeichnet (30 ct pauschal).

### Fünf Lücken

1. **Einspeisevergütung fehlt vollständig** (kein Treffer im ganzen Code).
   Jede Sonnen-kWh wird mit dem vollen Netzpreis bewertet, obwohl sie sonst
   eingespeist worden wäre. Richtig wäre `voll − einspeisung`. Bei 35 ct Netz
   und ~8 ct Vergütung: **rund ein Drittel zu hoch.** Größter Posten.
   Braucht ein Feld in den Einstellungen (Wert hängt am Inbetriebnahmedatum,
   kann die App nicht raten) und eine Aus-Option für Nulleinspeisung.
2. **Dynamischer Tarif: die Netzpreis-Ersparnis fehlt** – und zwar in die
   *andere* Richtung. Gezählt wird nur der Sonnenanteil. Ein Lauf, den die App
   von einer 45-ct- in eine 20-ct-Stunde schiebt, spart real 25 ct/kWh und
   erscheint mit **null**. Im Winter zeigt die App darum fast keine Wirkung.
   ⚠️ 1 und 2 heben sich NICHT auf – getrennt gebaut verschiebt man den Fehler nur.
3. **Doppelzählung bei gleichzeitigen Läufen.** `laufBilanz()` sieht jeden Lauf
   für sich und kennt die anderen nicht. Nachgestellt (`probe_doppelt.js`):
   2,4 kWh Überschuss um 11 Uhr, zwei Maschinen à 2 kW → **4,0 kWh
   gutgeschrieben, 120 statt 72 ct**. Der Planer verteilt normalerweise so,
   dass es nicht vorkommt (`restKW` in `bestesFensterSonne`), aber Schieben von
   Hand und nachträgliches Abhaken umgehen diesen Schutz.
4. **Der Speicher fehlt in der Bilanz.** `simuliere()` existiert, wird von
   `laufBilanz()` aber nicht genutzt: Sonne, die in den Akku gegangen wäre,
   zählt jetzt als frei *und* später beim Entladen nochmal; ein Abendlauf aus
   dem Akku zählt als reiner Netzbezug (0 ct). Aufwendigster Punkt, betrifft
   nur Akku-Haushalte → zurückstellen.
5. **Prognose, keine Messung.** `son` kommt aus der Vorhersage × Kalibrierfaktor.
   Der Bilanz-Text sagt aber „eigener Sonnenstrom statt Netz", als wäre es
   gemessen. Reine Textfrage, aber eine der Ehrlichkeit.

Nebenbei: Der Aufschlag wird additiv auf den Börsenpreis gerechnet; echte
Tarife legen die MwSt. auch auf den Spot-Anteil. Der Hilfetext sagt „Die Summe
ist dein tatsächlicher Preis" – Sache der Nutzer-Eingabe, kein Rechenfehler.

### Neu gewichtet nach der Robustheits-Messung (`tests/probe_robust.js`)

⚠️ Die erste Empfehlung („1 + 2 zusammen") ist **überholt**. Gemessen wurde,
wie stark der *Rat* davon abhängt, dass man jeden Hintergrundverbraucher
einträgt – 9 Kombinationen aus Sommer/trüb/Winter × nichts/3 kW/8 kW
verborgener Last:

| | nichts eingetragen | 3 kW verborgen | 8 kW verborgen |
|---|---|---|---|
| Sommertag | 8–10 Uhr | 10–12 Uhr | 13–15 Uhr |
| trüber Tag | 10–12 Uhr | 14–16 Uhr | 14–16 Uhr |
| Wintertag | 13–15 Uhr | 14–16 Uhr | 14–16 Uhr |

Der Rat **verschiebt sich**, bleibt aber ausnahmslos zwischen 8 und 16 Uhr –
nie im Abend. Die Reihenfolge der Stunden ist also stabil, auch wenn die
Mengen wackeln. Gegen die Alternative, die die App ersetzt („anstellen, wenn
ich heimkomme"), stehen im geprüften Preisverlauf rund **17 ct/kWh** allein
über den Preis, ganz ohne Sonne – auch bei völlig falsch geschätztem
Hintergrund.

**Folgerung:** Die größte Unsicherheit steckt im **Hintergrundprofil**, nicht
im Preis je kWh. 30 % Preisgenauigkeit zu bauen, während der Rat um zwei
Stunden wandern kann, wäre Präzision an der falschen Stelle. Die App ist kein
Messgerät, sondern ein Terminvorschlag – die Bilanz ist Beiwerk, nicht Zweck.

**Neue Reihenfolge:**
1. ~~**Die Zahl ehrlich beschriften**~~ ✅ **gebaut in v86.** „≈ 2,28 €" +
   „geschätzt gespart"; der Erklärsatz führt mit „Eine Schätzung, keine
   Messung." und benennt die drei Grenzen (Prognose statt Zähler · nicht
   eingetragene Verbraucher · Einspeisevergütung nicht abgezogen). Dazu
   Rückblick, Teilen-Text, CSV-Kopf, Hilfe und Demo-Tour. **Keine Zahl hat
   sich geändert.** Das „≈" steht neben dem hochzählenden Element, nicht darin
   – sonst greift `zaehlElement()` nicht mehr und die Animation fällt aus.
   Test: `test_ehrlich.js` 14/14 (prüft auch, dass die Animation noch läuft).
   App-Beschreibung und Manifest blieben unverändert: dort war nie von
   gemessener Ersparnis die Rede, sondern von Startzeiten.
   ✅ **Nachgezogen in v87:** Die Rangfolge in der Bilanz ist getauscht. Vorn
   stehen jetzt die **kWh aus eigener Sonne** – die einzige Kennzahl, die weder
   am Einspeisetarif noch am Aufschlag noch am Preismodell hängt. Der Euro
   rückt in die Kachelreihe zu CO₂ und Serie. Idee kam vom Betreiber.
   ⚠️ Bewusst **nicht** „in die Sonne verlegt" genannt, obwohl das griffiger
   klänge: `son` misst die Sonnendeckung, nicht die Verschiebung gegenüber
   einem Zeitpunkt ohne App. Das wäre genau die Sorte Überhöhung, die v86
   abgestellt hat. Daher „aus eigener Sonne gedeckt".
   Test: `test_ehrlich.js` 20/20.
2. ~~**Preis-Ersparnis mitzählen**~~ ✅ **gebaut in v88.** Neues Feld `pspar`
   je Lauf. Verglichen wird der Netzanteil mit einem **Durchschnittszeitpunkt im
   Zeitfenster des Geräts** – nicht mit dem Tagesschnitt, denn nachts hätte das
   Gerät ohnehin nicht laufen dürfen. Bewusst **nur auf den Netzanteil**: Der
   Sonnenanteil ist mit dem vollen Netzpreis schon in `spar` verbucht, sonst
   zählte derselbe Vorteil zweimal. Der Wert darf **negativ** werden (Lauf zur
   teuren Stunde) – die App beschönigt nicht. Bei festem Tarif immer 0, dann
   entfällt die Zeile. Gemessen ohne jede Sonne: 13 Uhr **+12,6 ct**,
   20 Uhr **−19,4 ct** auf 2 kWh. Test: `test_preishebel.js` 12/12.
3. ~~**Doppelzählung reparieren**~~ ✅ **gebaut in v88.** Neue Funktion
   `belegteSonne(tagKey, ausser)` zieht ab, was andere bestätigte Läufe
   desselben Tages schon beanspruchen. Gemessener Überschuss 2,864 kWh:
   vorher 4,000 kWh gutgeschrieben, jetzt exakt 2,864.
   ⚠️ **Korrektur an meiner früheren Angabe:** Die „2,4 kWh Überschuss" aus dem
   ersten Befund waren mein eigener Annahmewert im Prüfskript, kein gemessener
   Wert der App – die App rechnet Globalstrahlung über die Anlagendaten in Watt
   um. Die *Doppelzählung* war echt (beide Geräte bekamen identisch 2,0 kWh),
   nur die Vergleichszahl stammte von mir. Der Test misst den Überschuss jetzt
   selbst, statt ihn anzunehmen. Test: `test_doppelt.js` 6/6.
   ⚠️ Bereits gespeicherte Läufe behalten ihre alten Werte: Für vergangene Tage
   liegen die stündlichen Sonnendaten nicht mehr vor, eine Rückrechnung wäre
   geraten statt gerechnet.
4. **Einspeisevergütung optional**, standardmäßig aus (war Punkt 1). Nach der
   Messung nicht mehr vordringlich – bleibt aber sachlich richtig für alle,
   die den strengeren Wert wollen.
5. **Speicher bleibt draußen** (war Punkt 4). Zieht am ehesten Richtung EMS.

Punkte 1–3 verlangen **keine zusätzliche Eingabe** vom Nutzer.

---

## Offene Punkte (kein Rang – Erinnerung)

- **Impressum**: enthält noch Platzhalter statt ladungsfähiger Anschrift.
  Aktuell per `noindex` + robots.txt bewusst versteckt.
  Ob überhaupt Pflicht, hängt am Spendenknopf – siehe Abwägung in PLAYSTORE.md.
  Ohne Spenden gute Chance auf „rein privat" (§ 5 DDG greift dann nicht).
  Falls doch: Postfach genügt nicht, ladungsfähige Anschrift nötig –
  Impressumsservices sind üblich. ⚠️ Keine Rechtsberatung, vor der
  Veröffentlichung fachlich prüfen lassen.
- **Play Store Phase 3**: Konto (25 $), 12 Tester über 14 Tage, Store-Texte
  (→ Grundlage ist der Zweck-Text aus v80, Aufmacher aber neu fassen –
  siehe Einschränkung dort), Feature-Grafik 1024×500.
- **Fester Signaturschlüssel**: Der Bau-Workflow erzeugt derzeit je Lauf einen
  neuen Schlüssel → `.well-known/assetlinks.json` müsste bei jedem Neubau
  mitziehen. Vor dem Store einmal festzurren (Secrets sind im Workflow schon
  vorgesehen: `ANDROID_KEYSTORE_B64` / `ANDROID_KEYSTORE_PASSWORD`).
- **Vier veraltete Testdateien** (`test_learn`, `test_streak`, `test_bilanz`,
  `test_bilanz_woche`) hängen am „Was ist neu"-Blatt fest, weil ihr Startzustand
  kein `newsGesehen` setzt. Kein App-Fehler – bei Gelegenheit nachziehen.

---

## Erledigt

- **v91** – **„Heute bringt das nichts mehr – leg es auf morgen."**
  Gemessen (`rechne_jetzt.js`): Steht man abends vor der Maschine, sucht die App
  den besten Platz **nur im heutigen Rest** – und findet keinen. Sie nannte
  19:15 statt 19:00 Uhr und sparte damit **null**. Der wertvollste Rat
  (Abend → morgen Mittag, ~36 ct) fehlte ganz.
  **Gerechnet wird mit `simuliere()`, nicht mit `laufBilanz()`** – nur die
  Simulation kennt Speicher, Grundlast und Stundenpreis. Damit stimmt es ohne
  Sonderfälle für festen wie dynamischen Tarif (`voll` ist bei festem Tarif
  24-mal derselbe Wert) und mit wie ohne Speicher (`cap = 0`). Dafür führt
  `simuliere()` jetzt die Netzkosten **je Block** mit (`_gridCt`).
  Die App schweigt, wenn: heute selbst gut · morgen trüb · unter 10 ct ·
  Speicher abends geladen · Routine · Urlaub.
  ⚠️ **Verworfen beim Bauen:** eine eigene Regen-Abfrage über
  `wochenSonne[].regen`. Sie lädt asynchron nach und war beim ersten Zeichnen
  meist noch nicht da – der Test fiel prompt durch. Die Stunden-Prognose für
  morgen stammt ohnehin aus demselben Wettermodell und hat schlechtes Wetter
  schon eingepreist.
  ⚠️ **Ebenfalls verworfen** (mehrere Anläufe, alle zu kompliziert): ein
  „Planungsgewinn" in der Bilanz gegen einen Durchschnitts- oder festen
  Vergleichszeitpunkt. Der Betreiber hat es dreimal nicht verstanden – das war
  das Urteil über das Konzept, nicht über ihn. Zwei Zeilen mit zwei Preisen
  sagen dasselbe ohne Erklärung.
  ⚠️ **Nicht gebaut:** Nacht-Reserve für den Speicher. Wäre eine
  Steueranweisung, die die App nicht durchsetzen kann – das macht das EMS.
  Test: `test_morgen.js` 17/17.

### Nebenbefund aus v91

`simuliere()` kann den Speicher korrekt – `laufBilanz()` (die Bilanz) nicht.
Lücke 4 aus der Ersparnis-Prüfung ist damit **billiger als gedacht**: Die
Maschinerie liegt schon da, die Bilanz müsste sie nur benutzen. Noch offen,
weil es rückwirkend gespeicherte Läufe betrifft.

- **v90** – **Vollprüfung auf Wunsch des Betreibers: „Sind die Beschreibungen und
  die Berechnungen korrekt?"**
  **Rechnung unabhängig nachgerechnet** (`tests/test_rechnung.js`, 17 Checks):
  Der Preis-Stub hängt dort an *echten Berliner Stunden*, damit der Test die
  Erwartung selbst ausrechnet statt sie der App abzuschauen. Ergebnis: Der
  Preisvorteil stimmt auf die Nachkommastelle (erwartet 20,6 ct → App 20,6 ct;
  teure Stunde erwartet −11,4 → App −11,4). Ebenso geprüft: `son ≤ Bedarf`,
  `spar = son × Netzpreis der Stunde`, Preisvorteil nur auf den Netzrest,
  `CO₂ = son × 0,38`, Deckungsquote, Kachel = Summe beider Hebel, fester Tarif
  ohne Preisvorteil. Ebenfalls verifiziert: Woche ab Montag (ISO-korrekt),
  Monat ab dem 1., Jahr ab dem 1. Januar.
  **Zwei Textfehler gefunden und behoben:**
  1. Der Bilanz-Hinweis behauptete „– ab jetzt exakt", direkt unter der Zeile
     „Eine Schätzung, keine Messung." Ein Überbleibsel von vor v86; beides
     konnte nicht zugleich stimmen.
  2. Elf sichtbare Zahlen im Tagesplan standen mit Dezimal**punkt** („5.5 kWh")
     statt Komma – Chart-Legende, Aufstellung Sonne/Speicher/Netz, Netz-Warnung
     und Speicherstand. Überall fehlte `dz()`. Ein Test hält das jetzt fest.
  **Geprüft und für richtig befunden:** alle News-Einträge v83–v89 gegen den
  tatsächlichen Code, die Zweck- und Hilfetexte, die generierten Warmwasser-
  und Heizungs-Hinweise, `wk-scope`, die Schätz-Fußnote für Alt-Läufe.

### Nebenbefund, nicht geändert

Die Kachel **🔥 Serie** rechnet über *alle* Läufe (`serieTage(alle)`), während
Euro und CO₂ dem gewählten Zeitraum folgen. Beim Umschalten Woche→Monat→Jahr
ändern sich zwei Kacheln, die dritte nicht. Sachlich richtig – eine Serie ist
nicht zeitraumgebunden –, aber die Beschriftung sagt es nicht. Erst ändern,
wenn es jemandem auffällt.

- **v89** – **Urlaubs-Modus war vergraben.** Vom Betreiber gemeldet, nachgemessen:
  Startseite → ⚙️ → Blatt „Einrichten" → 🏡 Haushalt aufklappen → **2110 px
  scrollen** (Bildschirm = 852 px). Verschärfend: Die Gruppen starten bei jedem
  Öffnen wieder zugeklappt, und die Gruppen-Unterschrift („Speicher · E-Auto ·
  Hintergrund-Verbrauch") erwähnte den Urlaub nicht einmal.
  **Die eigentliche Fehleinordnung war aber nicht die Tiefe:** Alles in
  „Haushalt" richtet man *einmal* ein – der Urlaubs-Modus ist der einzige
  Eintrag, den man *immer wieder* anfasst, und stand ausgerechnet hinter dem
  technischsten Teil. Jetzt eigene Karte ganz oben: **2110 → 92 px**, ohne
  Aufklappen. Der ✈️-Hinweis im Haushalt-Status ist entfallen, weil er dort
  nichts mehr zu suchen hat.
- **v89 (nebenbei)** – **Vier Schalterzeilen hatten kaputte Beschriftung.**
  `.fk-opt` war nur als `.fk-titel .fk-opt` gestylt; in einer `.switch-zeile`
  erbte der Zusatz das fette Dunkelblau des Titels und klebte ohne Abstand
  daran: „Urlaubs-Modusniemand zu Hause", „Heizung (Wärmepumpe)passt sich dem
  Wetter an", dazu Tagesprofil und Warmwasser. Eine CSS-Regel für alle vier.
  Tests: `test_urlaub_platz.js` 15/15, `test_urlaub.js` auf den neuen Ort
  umgestellt (Absicht der Prüfung unverändert).

- **v85** – **Routinen mit festem Tagesabstand.** Vom Betreiber angestoßen: Die
  Rhythmus-*Erkennung* kann längst `{typ:"intervall", intervall:4}` – die festen
  *Routinen* konnten es nicht, ihr Modell war rein wochentagbasiert
  (Wochentag + jede/alle 2 Wochen).
  Dabei fiel ein echter Fehler auf: `alsRoutineUebernehmen()` hatte für ein
  Intervall-Muster keinen Wochentag und nahm ersatzweise **den heutigen** plus
  „jede Woche" – aus „alle 4 Tage" wurden stillschweigend 7, ohne Hinweis.
  Routinen haben jetzt ein Feld `art`; fehlt es (Altbestand), gilt „wochentag".
  **Zählweise: ab dem letzten tatsächlichen Lauf**, nicht ab einem festen
  Kalenderanker – ein Raster sammelt jede Verschiebung dauerhaft an, und die
  Rhythmus-Erkennung rechnet ohnehin schon so, Routine und Vorschlag ticken
  damit gleich. Überfällige Läufe stehen nur auf *heute*, nicht zusätzlich auf
  morgen (sonst würden sie doppelt eingeplant).
  Bewusst **nicht** mitgebaut (Entscheidung des Betreibers): „alle 3/4 Wochen"
  im Wochentag-Zweig. Test: `test_intervall.js` 24/24.
- **v84** – Die beiden Restposten aus der Aufräum-Runde.
  „Heute schon gelaufen" wächst nicht mehr unbegrenzt: ab dem **fünften**
  Durchgang bleiben die drei jüngsten offen, die früheren stehen darüber im
  Aufklapper. **Schwelle bewusst 5 statt 4** – bei genau vier Einträgen würde
  der Aufklapper einen einzigen verstecken und dabei selbst so hoch bauen wie
  dieser. Gemessen bei 6 Läufen: **217 → 154 px**, und die Höhe bleibt dort,
  egal wie viele noch folgen. Die `data-erl-…`-Indizes zählen weiter über die
  ganze Liste, sonst träfen „zurück" und ✎ den falschen Durchgang.
  Dazu die Bilanz-Rundung (siehe oben). Test: `test_aufraeumen.js` 18/18.
- **v83** – Zwei Beobachtungen des Betreibers aus dem laufenden Betrieb:
  (1) Die Hintergrund-Marken im Tagesplan zeigten zur vollen Stunde nur „5"
  statt „5:00". Ursache: `uhrStr()` lässt die Minuten bewusst weg – richtig für
  Zeitspannen („9–11 Uhr"), falsch für eine alleinstehende Zeit. Neuer Helfer
  `uhrVoll()` daneben; beim Prüfen aller Aufrufstellen fiel derselbe Fehler im
  CSV-Export auf (Spalten Start/Ende) und wurde mitgefixt.
  (2) Der Hinweis unter dem Sonnen-Ausblick führte mit dem Börsenpreis, obwohl
  die Grafik nur die Sonne zeigt. Jetzt erklärt er zuerst die Balken; der
  Börsenpreis steht als kurze Begründung dahinter (3 Zeilen → 154 Zeichen).
  Test: `test_uhrzeit.js` 11/11.
- **v82** – Reiter „Woche" → „Routinen"; Ausblick dort entfernt, sechs
  Aufräum-Punkte umgesetzt. 1849 → 764 px.
- **v81** – Sonnen-Ausblick als aufklappbare Zeile auf die Startseite geholt
  (+55 px zugeklappt statt +254 px als eigener Kasten); Satz passt sich der
  Wetterlage an, Zustand wird gemerkt.
- **v80** – Zweck-Seite „Wofür ist das?" oben im „?"-Blatt; bestehende
  Erklärungen in Aufklapper verschoben (Blatt wurde dadurch kürzer);
  Spendenblock gebaut, bleibt ohne hinterlegtes Ziel unsichtbar (Auszahlungsweg
  noch offen – siehe oben).
- **v79** – Hakeliges Scrollen (früher Rang 1). Drei Ursachen überlagerten sich:
  die Wischerkennung war zu großzügig (`|dx|>8 && |dx|>|dy|+2` wertete schon
  einen leicht schrägen Scrollversuch als Wischen), `.dash-row` fehlte
  `touch-action:pan-y`, und die Startseiten-Liste war ein eigener Scrollkasten
  (`max-height:172px`, mit Vorschlags-Chip sogar 88 px). Gelöst über den
  gemeinsamen Helfer `gestenModus()` (im Zweifel gewinnt Scrollen),
  `touch-action` und einen Aufklapper statt Scrollkasten.
  Test: `test_scroll.js` 16/16 mit echten Touch-Ereignissen.
- **v78** – Mehrere Läufe pro Gerät und Tag wurden nur einmal gezählt (Bilanz
  zeigte einen Durchgang zu wenig). Ursache: `protokolliereLauf` ersetzte den
  ganzen Tag statt des einzelnen Laufs.
- **v77** – Play-Store Phase 1: Android-Zurück-Taste, Manifest-Vollausbau,
  Datenschutz/Impressum, Theme-Farben.
- **Domain** `energie-optimierer.eu` verbunden, HTTPS aktiv.
- **APK** per GitHub-Actions-Workflow baubar, Digital Asset Links veröffentlicht
  (App läuft im Vollbild ohne Adressleiste).
- **Suchmaschinen** während der Testphase ausgesperrt.
- **Monetarisierung entschieden**: kostenlos & werbefrei, Spenden per PayPal
  (Details im v80-Abschnitt oben und in PLAYSTORE.md).
