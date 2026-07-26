# Ideen & Reihenfolge

Lebende Liste. Wird fortgeschrieben – erledigte Punkte wandern nach unten in
„Erledigt", neue Ideen kommen oben dazu und werden neu eingeordnet.

Zuletzt aktualisiert: Juli 2026 (Stand v80)

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

## Rang 1 – Übersicht bei wachsenden Daten

Ziel des Betreibers: Der Look soll nicht zerreißen, je mehr Daten sich ansammeln.

**Regel: „Drei sichtbar, Rest im Aufklapper."**
Vorlage existiert bereits und funktioniert: Bilanz-Archiv („27 weitere Läufe
anzeigen"), die sechs `details.egrp`-Klappgruppen im Einrichten und seit v79
die Geräteliste auf der Startseite.

| Stelle | Wächst mit | Vorschlag |
|---|---|---|
| 🔁 Feste Routinen (Woche) | jeder Routine | Klappgruppe mit Anzahl im Kopf |
| 🤖 Erkannte Rhythmen (Woche) | jedem gelernten Gerät | ebenso, zugeklappt starten |
| „Heute schon gelaufen" | im Lauf des Tages | ab 4 Einträgen einklappen |
| ~~Geräte auf der Startseite~~ | — | ✅ in v79 erledigt |
| ~~Meine Geräte (Einrichten)~~ | — | ✅ steckt schon in Klappgruppe |

**Für später:** „💤 Länger nicht genutzt" – was 60 Tage nicht lief, wandert
automatisch in eine zugeklappte Gruppe. Erst bauen, wenn es nötig wird.

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
