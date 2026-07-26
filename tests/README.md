# Regressionstests

Die Tests fahren `index.html` **direkt als Datei** in einem headless Chromium an –
kein Server, kein Build. Alle Netzabrufe (Sonne, Preise, Adresse) sind gestubbt,
der Startzustand kommt je Test als `localStorage`-Seed.

## Laufen lassen

```bash
cd tests && npm install     # einmalig
cd ..    && node tests/alle.js
```

Einzeln oder gefiltert:

```bash
node tests/test_intervall.js
node tests/alle.js routinen      # alle Dateien, deren Name „routinen" enthält
```

Steht Chromium woanders:

```bash
EO_CHROMIUM=/pfad/zu/chrome node tests/alle.js
```

`alle.js` endet mit Code 1, sobald eine Datei nicht vollständig grün ist.

## Was drin ist

| Datei | prüft |
|---|---|
| `test_intervall` | Routinen mit festem Tagesabstand (v85) |
| `test_aufraeumen` | „Heute schon gelaufen" klappt ein · Bilanz-Rundung (v84) |
| `test_uhrzeit` | vollständige Uhrzeiten · Ausblick-Hinweis (v83) |
| `test_routinen` | Reiter „Routinen", Klappgruppen, 📌 (v82) |
| `test_ausblick` | Sonnen-Ausblick auf der Startseite (v81) |
| `test_zweck` | Zweck-Abschnitt und Spendenblock (v80) |
| `test_scroll` | Scrollen vs. Wischgesten (v79) |
| `test_zweilaeufe` | mehrere Läufe pro Gerät und Tag (v78) |
| `test_back` | Android-Zurück-Taste über alle Blätter (v77) |
| `test_viertel` | Planung im 15-Minuten-Raster |
| `test_urlaub` | Urlaubs-Modus pausiert Routinen und Vorschläge |
| `test_hintergrund` | Sockel, Warmwasser, Heizung im Tagesplan |
| `test_gl_profil` | Globalstrahlungs-Profil |
| `test_drift` | Nachführung bei abweichender Prognose |
| `test_spaet` | „heute ausnahmsweise bis 24 Uhr" |
| `test_v69`, `test_v72` | Kalibrierung, Bilanz-Archiv, Prognose-Wahrheit |

`probe_doppelt.js` ist **kein** Test, sondern der Beleg zu einem offenen Befund:
Laufen zwei Geräte in derselben Stunde, schreibt die App beiden denselben
Sonnenüberschuss gut (siehe „Die Ersparnis-Rechnung" in `IDEEN.md`). Das Skript
gibt die Zahlen aus, statt zu bestehen oder zu scheitern.

## Beim Schreiben neuer Tests

- Routinen brauchen `wochentag:<Zahl>` (0 = So) – **nicht** `tage:[…]`.
- `cfg.ww_l` sind Objekte `{an,z,auto}`, keine reinen Zahlen.
- `addInitScript` setzt den Seed bei **jedem** Neuladen erneut; für einen
  zweiten Zustand eine neue Seite mit eigenem Seed öffnen.
- `newsGesehen` im Seed setzen, sonst verdeckt das „Was ist neu"-Blatt alles.
- Nicht-globale Funktionen (strikter IIFE) lassen sich nicht direkt aufrufen –
  über echte DOM-Ereignisse gehen.
