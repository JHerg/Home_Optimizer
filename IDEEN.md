# Ideen & Reihenfolge

Lebende Liste. Wird fortgeschrieben – erledigte Punkte wandern nach unten in
„Erledigt", neue Ideen kommen oben dazu und werden neu eingeordnet.

Zuletzt aktualisiert: Juli 2026 (Stand v79)

---

## ~~Rang 1 – Hakeliges Scrollen~~ ✅ erledigt in v79

Vom Betreiber gemeldet: In der Geräteliste auf der Startseite (und im Tagesplan)
lässt sich per Finger schlecht nach oben/unten scrollen.

**Drei Ursachen, die sich überlagern** (im Code verifiziert):

1. **Wischerkennung zu großzügig.** Regel bisher:
   `|dx| > 8 && |dx| > |dy| + 2`. Ein leicht schräger Scrollversuch
   (dx=10, dy=7) gilt damit schon als Wischen → Liste bleibt stehen.
2. **`touch-action` fehlt auf `.dash-row`.** Die Tagesplan-Zeilen (`.pl-zeile`)
   haben `touch-action: pan-y`, die Startseiten-Zeilen nicht. Dadurch läuft dort
   alles über die (fehleranfällige) JS-Erkennung.
3. **Scrollkasten im Scrollkasten.** `.dash-rows` hat `max-height:172px;
   overflow-y:auto` – ca. drei Zeilen. Verschachteltes Scrollen ist auf dem
   Handy immer fummelig, und am Ende springt es nicht sauber auf die Seite über.

**Umgesetzt in v79 (alle drei in einem Abwasch):**
- Gemeinsamer Helfer `gestenModus(cx,cy)` für beide Wisch-Funktionen.
  Neue Regel: `SWIPE_MIN=14`, `SWIPE_FAKTOR=1.8`, `SCROLL_MIN=6` – im Zweifel
  gewinnt das Scrollen, nur klar Waagerechtes wischt.
- `touch-action: pan-y` auf `.dash-row` ergänzt.
- Mini-Scrollkasten entfernt → erste **4** Geräte offen, Rest in
  `<details class="experte dash-mehr">`. Damit entfielen auch der
  Überlauf-Schleier (`hat-mehr`) und das Schrumpfen auf 88 px (`hat-vorschlag`).
- Test: `test_scroll.js` 16/16 – prüft die Gesten mit echten Touch-Ereignissen
  (schräg → scrollen, waagerecht → wischen) statt nur die Rechenlogik.

---

## Rang 2 – Übersicht bei wachsenden Daten ← **jetzt oben**

Ziel des Betreibers: Der Look soll nicht zerreißen, je mehr Daten sich ansammeln.

**Regel: „Drei sichtbar, Rest im Aufklapper."**
Vorlage existiert bereits und funktioniert: Bilanz-Archiv („27 weitere Läufe
anzeigen") und die sechs `details.egrp`-Klappgruppen im Einrichten.

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

## Rang 3 – Spendenknopf

Entscheidung steht: App bleibt **kostenlos und werbefrei** (siehe PLAYSTORE.md),
Spenden sind die einzige Einnahmequelle. Umsetzung **erst mit der Store-Runde**.

**Platzierung – zwei Plätze, kein dritter:**
- **Hauptplatz: unten in der Bilanz**, direkt unter „Deine Wirkung". Der Moment,
  in dem jemand die eigene Ersparnis sieht – da wirkt die Frage stimmig.
- **Zweitplatz: in der Hilfe („?")**, als ruhige Dauer-Zeile zum Wiederfinden.

**Ausdrücklich nicht:** Startseite (Arbeitsfläche), Pop-up, Tab-Leiste,
Unterbrechung jeder Art.

**Zurückhaltung eingebaut:**
- Erst nach ca. **10 bestätigten Läufen** zeigen
- **„Nicht mehr anzeigen"** daneben, dauerhaft wirksam
- Ton: Danke, nicht Schranke – „Diese App ist kostenlos, werbefrei und sammelt
  keine Daten. Wenn sie dir hilft: ☕"

**Technik:** externer Link (Ko-fi / Buy Me a Coffee / PayPal.me / Liberapay).
Im Play Store Pflicht – Googles Bezahlfunktion ist für Spenden gesperrt.
Ein Link deckt Web, iPhone und Android ab. Beträge (1/3/5 €) beim Dienst selbst.

❓ **Offene Entscheidung Betreiber:** Welcher Dienst? Ko-fi ist am freundlichsten
gestaltet, PayPal.me kennt in Deutschland dagegen fast jeder.

---

## Offene Punkte (kein Rang – Erinnerung)

- **Impressum**: enthält noch Platzhalter statt ladungsfähiger Anschrift.
  Nötig, bevor die Seite öffentlich auffindbar wird (aktuell per `noindex` +
  robots.txt bewusst versteckt).
- **Play Store Phase 3**: Konto (25 $), 12 Tester über 14 Tage, Store-Texte,
  Feature-Grafik 1024×500.
- **Fester Signaturschlüssel**: Der Bau-Workflow erzeugt derzeit je Lauf einen
  neuen Schlüssel → `.well-known/assetlinks.json` müsste bei jedem Neubau
  mitziehen. Vor dem Store einmal festzurren (Secrets sind im Workflow schon
  vorgesehen: `ANDROID_KEYSTORE_B64` / `ANDROID_KEYSTORE_PASSWORD`).
- **Vier veraltete Testdateien** (`test_learn`, `test_streak`, `test_bilanz`,
  `test_bilanz_woche`) hängen am „Was ist neu"-Blatt fest, weil ihr Startzustand
  kein `newsGesehen` setzt. Kein App-Fehler – bei Gelegenheit nachziehen.

---

## Erledigt

- **v79** – Hakeliges Scrollen (Rang 1): Wischerkennung gab dem Scrollen den
  Vorrang, `touch-action` ergänzt, verschachtelter Scrollkasten der
  Startseiten-Geräteliste durch einen Aufklapper ersetzt.
- **v78** – Mehrere Läufe pro Gerät und Tag wurden nur einmal gezählt (Bilanz
  zeigte einen Durchgang zu wenig). Ursache: `protokolliereLauf` ersetzte den
  ganzen Tag statt des einzelnen Laufs.
- **v77** – Play-Store Phase 1: Android-Zurück-Taste, Manifest-Vollausbau,
  Datenschutz/Impressum, Theme-Farben.
- **Domain** `energie-optimierer.eu` verbunden, HTTPS aktiv.
- **APK** per GitHub-Actions-Workflow baubar, Digital Asset Links veröffentlicht
  (App läuft im Vollbild ohne Adressleiste).
- **Suchmaschinen** während der Testphase ausgesperrt.
