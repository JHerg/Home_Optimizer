# Ideen & Reihenfolge

Lebende Liste. Wird fortgeschrieben – erledigte Punkte wandern nach unten in
„Erledigt", neue Ideen kommen oben dazu und werden neu eingeordnet.

Zuletzt aktualisiert: Juli 2026 (Stand v79)

---

## Rang 1 – „Warum diese App?" – eine Zweck-Seite ⭐ NEU

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

### Spenden-Knopf – Entscheidung gefallen

- **Dienst: PayPal** (vom Betreiber favorisiert – kennt in Deutschland fast jeder)
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
verlangt Kurz- und Langbeschreibung). Einmal gut formuliert = zweimal genutzt.

---

## Rang 2 – Übersicht bei wachsenden Daten

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
  Nötig, bevor die Seite öffentlich auffindbar wird (aktuell per `noindex` +
  robots.txt bewusst versteckt).
- **Play Store Phase 3**: Konto (25 $), 12 Tester über 14 Tage, Store-Texte
  (→ kommen aus Rang 1), Feature-Grafik 1024×500.
- **Fester Signaturschlüssel**: Der Bau-Workflow erzeugt derzeit je Lauf einen
  neuen Schlüssel → `.well-known/assetlinks.json` müsste bei jedem Neubau
  mitziehen. Vor dem Store einmal festzurren (Secrets sind im Workflow schon
  vorgesehen: `ANDROID_KEYSTORE_B64` / `ANDROID_KEYSTORE_PASSWORD`).
- **Vier veraltete Testdateien** (`test_learn`, `test_streak`, `test_bilanz`,
  `test_bilanz_woche`) hängen am „Was ist neu"-Blatt fest, weil ihr Startzustand
  kein `newsGesehen` setzt. Kein App-Fehler – bei Gelegenheit nachziehen.

---

## Erledigt

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
  (Details siehe Rang 1 und PLAYSTORE.md).
