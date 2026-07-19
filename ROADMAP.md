# Energie-Optimierer — Roadmap / Ideen-Backlog

Gesammelte Verbesserungs-Ideen mit Aufwand/Nutzen-Einschätzung, um die App
best-in-class (Kategorie PV-Eigenverbrauch/Timing) und ggf. Store-fähig zu machen.
Status-Legende: ⬜ offen · 🔄 in Arbeit · ✅ erledigt · ❌ verworfen

## Realitäts-Check
- Die App ist eine self-contained PWA (GitHub Pages). Für den echten App Store
  braucht es eine native Hülle (PWABuilder/Capacitor) + Apple-Developer-Account.
- Eine deutsche PV-Nischen-App führt keine allgemeinen Charts an – Ziel ist:
  **die beste App ihrer Kategorie** (Bindung, Design, Ehrlichkeit).

## Priorisierte Liste (bester Wirkung-pro-Aufwand zuerst)

| # | Idee | Aufwand | Nutzen | Backend nötig? | Gruppe | Status |
|---|------|---------|--------|----------------|--------|--------|
| 2 | „Deine Wirkung"-Statistik: € gespart, kWh in die Sonne verschoben, CO₂, Serie/Streak | niedrig–mittel | hoch | nein | 🟢 Sofort | ✅ v47 |
| 6 | Motion & Haptik: Vibration beim Bestätigen, Federanimationen, Konfetti bei 100 %, Skeleton-Loader | niedrig | mittel | nein | 🟢 Sofort | ✅ v49 |
| 8a | Barrierefreiheit: Dynamic Type/Schriftgröße, VoiceOver, Kontrast | niedrig–mittel | mittel | nein | 🟢 Sofort | ✅ v50 |
| 10 | Vertrauen/Social Proof: „100 % lokal" prominenter + App-teilen (Web Share); KEINE erfundenen Testimonials | niedrig | niedrig–mittel | nein | 🟢 Sofort | ✅ v50 |
| 4 | Onboarding-„Aha" in 30 s: geführter Erststart (Adresse → sofort deine Sonne) | mittel | mittel–hoch | nein | 🟡 Mittel | ✅ v51 |
| 7 | Wochen-/Mehrtages-Ausblick: „bester Tag diese Woche" (nur Sonne/Wetter über morgen hinaus) | mittel | mittel | nein | 🟡 Mittel | ✅ v51 |
| 1 | Proaktive Push-Erinnerungen / Timing-Nudges | hoch | sehr hoch | ja (VAPID) | 🔴 Groß | ⬜ |
| 8b | Englisch / i18n (Textextraktion, großer Umbau) | hoch | hoch (nur Auslands-Ziel) | nein | 🔴 Groß | ⬜ |
| 3 | Store-Wrapper (PWABuilder/Capacitor) + ASO (Icon, Screenshots, Review) | hoch, extern | hoch (nur wenn Store wörtlich Ziel) | – | 🔴 Groß | ⬜ |
| 5 | EMS-/Wechselrichter-Integration → automatische Lauf-Erkennung | sehr hoch | sehr hoch | ja | 🔴 Groß | ⬜ |
| 9 | Widgets / Sperrbildschirm („nächste gute Stunde") | hoch (nativ) | mittel–hoch | – | 🔴 an #3 gekoppelt | ⬜ |

## Detail je Punkt

### #2 „Deine Wirkung"-Statistik  🟢
- **Was:** Wochen-/Monats-Bilanz aus `cfg.verlauf`: € gespart (kWh × Preisdelta),
  kWh in die Sonne verschoben, CO₂ (kWh × Faktor), Serie/Streak.
- **Aufwand niedrig–mittel:** reine Client-Rechnung, Daten vorhanden; neue Ansicht/Sektion.
- **Nutzen hoch:** stärkster Retention-/Emotions-/Teil-Hebel.
- **Umfang ehrlich gekennzeichnet (v53):** Bilanz zählt nur selbst eingeplante
  Geräte + Routinen. Dezente Scope-Zeile + Aufklapp-Info „Was zählt hier rein?"
  (EMS-Hintergrundlasten wie Wärmepumpe/Speicher sind nicht enthalten; Grundlast
  wird vorab abgezogen; WP-Vorbehalt = Sonnen-Nutzung ggf. leicht zu hoch). Auch in
  der Demo als Hinweis. Voller Haushalts-Blick erst mit EMS-Anbindung (→ #5).

### #6 Motion & Haptik  🟢
- **Was:** `navigator.vibrate` beim Bestätigen, sanfte Federübergänge, Konfetti bei
  100 % Eigenverbrauch, Skeleton-Loader statt „–".
- **Aufwand niedrig:** stückweise; **Nutzen mittel** (Look-and-Feel).

### #8a Barrierefreiheit  🟢
- **Was:** Dynamic Type (rem/Schriftskalierung), VoiceOver-Labels, Kontrast-Check.
- **Aufwand niedrig–mittel; Nutzen mittel** (Inklusion + Store-Qualität).

### #10 Vertrauen/Social Proof  🟢
- **Was:** Testimonials, „100 % lokal / kein Konto" prominenter, Bewertungs-Prompt
  (nur im Store-Kontext sinnvoll).
- **Aufwand niedrig; Nutzen niedrig–mittel;** teils schon vorhanden.

### #4 Onboarding-„Aha" in 30 s  🟡 ✅ v51
- **Was:** geführter Erststart statt Formular; Adresse → sofortige Sonnen-Vorschau.
- **Umgesetzt (v51):** eigenes Willkommen-Sheet (`#sheet-willkommen`). Schritt 1 =
  warmer Einstieg + Vertrauens-Chips (kein Konto/kein Tracking/100 % lokal) + ein
  Adressfeld. Nach „Suchen" (Geocoding) direkt Schritt 2: `ladePV()` holt die echte
  Sonne, daraus wird das beste Sonnenfenster von heute berechnet und mit
  Mini-Sonnenkurve (`wkKurve`, Fenster hervorgehoben) + „fast gratis"-Text gezeigt.
  Wenig-Sonne-Fall (Winter/bedeckt) wird ehrlich abgefangen und auf den
  Wochen-Ausblick verwiesen. Danach „Perfekt – jetzt einrichten" (volle Einrichtung,
  Adresse schon gesetzt) oder „Später einrichten". Erststart zeigt Willkommen statt
  direkt das Formular (`cfg.onboardingGesehen`).

### #7 Wochen-/Mehrtages-Ausblick  🟡 ✅ v51
- **Was:** 3–7-Tage-Sonnen/Wetter-Trend, „bester Tag diese Woche". Preise nur bis
  morgen (aWATTar) → ehrlich kennzeichnen.
- **Umgesetzt (v51):** neuer „Sonnen-Ausblick" oben im Woche-Tab (`#woche-ausblick`).
  `holeWochenSonne()` holt bei Open-Meteo die tägliche Globalstrahlung + Wettercode +
  Max-Temperatur für 7 Tage (`ladeWochenSonne`, 3-h-Cache pro Standort). Anzeige:
  7-Tage-Streifen mit Wetter-Emoji, relativem Sonnenstärke-Balken und Temperatur,
  bester Tag amber hervorgehoben + Callout „Bester Sonnentag: …". Ehrlicher Hinweis,
  dass es Börsenpreise nur für heute & morgen gibt – der Ausblick zeigt darüber
  hinaus nur Sonne & Wetter.

### #1 Proaktive Push-Erinnerungen  🔴
- **Was:** „Jetzt läuft die Sonne …", „morgen 12–15 Uhr günstig".
- **Aufwand hoch:** echtes Web-Push braucht Server (VAPID); iOS-PWA-Push limitiert
  (installiert, ≥16.4). Ohne Backend nur eingeschränkt (In-App).
- **Nutzen sehr hoch** (Engagement-Killerfeature).

### #8b Englisch / i18n  🔴
- **Was:** alle Strings extrahieren + Sprachschalter.
- **Aufwand hoch** (Single-File, hunderte Inline-Texte); **Nutzen** nur bei Auslands-Ziel.

### #3 Store-Wrapper + ASO  🔴
- **Was:** native Hülle (PWABuilder/Capacitor), App-Icon, Screenshots, Store-Text,
  Datenschutz, Review.
- **Aufwand hoch & extern:** Apple-Account (99 €/Jahr), Mac/Build, App Review. Wrapper
  kann vorbereitet werden, **Einreichung macht der Betreiber.**
- **Nutzen** nur, wenn „Store" wörtlich das Ziel ist.

### #5 EMS-/Wechselrichter-Integration  🔴
- **Was:** Anbindung (Bullerbü / SMA / Fronius / Home Assistant / Tibber-API) →
  automatische Lauf-Erkennung, echte Verbrauchsdaten; ersetzt manuelle Bestätigung.
- **Aufwand sehr hoch:** pro Hersteller API/Auth, wahrscheinlich Backend/Proxy (CORS).
- **Nutzen sehr hoch:** größter „Magie"-Sprung; eigenes Projekt.

### #21 Einrichten aufgeräumt: 3 Gruppen mit Status-Kopf  ✅ v68
- Optionale Bereiche in drei einklappbare Gruppen (details.egrp): 🏡 Haushalt
  (Speicher · E-Auto · Hintergrund), 🎛️ Genauigkeit (Datenquelle · Kalibrierung),
  💾 Daten & Geräte (Meine Geräte · Backup). Basis (Adresse, Dach, Tarif) bleibt offen.
- Kopfzeilen zeigen zugeklappt einen Mini-Status („🔋 an · 🚗 an · 🚿 an · 🔥 aus",
  Quelle/kalibriert, Geräteanzahl/Backup) – live via renderEgrpStatus() in syncRegler.
- Gruppen starten bei jedem Öffnen zugeklappt (sheetAuf). Reine Optik, keine Logik
  geändert; alle IDs/Handler unverändert. Weitere Einstiegs-Ideen (A Presets, C
  Vollständigkeit, D Hinweis-Hub, 1 Deadline, 3–6) gesammelt im Ideen-Mock-up.

### #20 Prognose-Drift-Hinweis + stabile Tageszahl  ✅ v67
- **Hinweis „Prognose geändert":** Beim Platzieren merkt sich die App je Lauf die freie
  Sonne im gewählten Fenster (`cfg.planRef`). Verliert das Fenster durch neue Wetterdaten
  >25 % UND gibt es ein klar besseres Fenster (≥25 % + 0,3 kWh mehr), erscheint auf der
  Startseite ein dezentes Banner mit „→ Verschieben / Behalten". Nichts springt von allein;
  📌-verankerte, laufende und EV-Split-Läufe sind ausgenommen. „Behalten" merkt sich die
  Entscheidung je Lauf und Tag (`cfg.driftWeg`); eine neue Position setzt die Referenz frisch.
- **Stabile Tageszahl:** Abgelaufene Stunden von HEUTE werden eingefroren (`eo-pv-fix`,
  letzter gesehener Prognosewert) – neue Modellläufe schreiben die Vergangenheit nicht mehr
  um, nur die Zukunft bewegt die Zahl noch. Neuer Tag leert den Speicher; in der Demo aus;
  ohne geladene Prognose wird nichts (bei 0) eingefroren.
- Hintergrund: DWD ICON-D2 rechnet ~alle 3 h neu; ±20–30 % Revision an Wolkentagen ist
  normal. Die App zeigt das ehrlich, macht es aber jetzt handhabbar statt verwirrend.

### #11b Hintergrund-Verbrauch in 3 Bausteinen  ✅ v66
- **Umgesetzt:** Der eine Grundlast-Regler (samt Saison-Zonen) wurde durch drei Bausteine
  ersetzt, die die App stundengenau addiert (`hgProfil`, an jede Stunde als `s.hg` gehängt):
  1. **🔌 Sockel** = bisheriger Regler + Tagesform (v65), jetzt 0–1500 W.
  2. **🚿 Warmwasser (WP)** = Tages-kWh (Default 2,0, aus Bullerbü abgelesen) verteilt auf
     bis zu 3 frei einstellbare Läufe (je an/aus + Uhrzeit in 30-Min-Schritten; Lauf 2
     optional „☀️ folgt der Sonne" → beste PV-Stunde). Energie wird GETEILT, nie vervielfacht.
  3. **🔥 Heizung (WP)** = Heizkurve nach Gradtags-Methodik: Heizgrenze (Default 15 °C) +
     Ø-Leistung bei 0 °C (Default 1,2 kW); Außentemperatur automatisch aus dem 7-Tage-
     Wetter-Ausblick (Tmax + Tagesgang ±4 K), Kältezuschlag ~+2 %/K unter 0 °C (COP).
     Fallback ohne Wetterdaten: grobe Monats-Tmax-Tabelle.
- **Tagesplan:** eigene Hintergrund-Spur (#hg-lane) mit gestrichelten 🚿-Pins und 🔥-Band –
  nur Info, nicht interaktiv; Sonnenkurve/„freie Sonne"/Speicher-Simulation nutzen s.hg.
- **Fachliche Basis:** BDEW-SLP-Prinzip (Form × Niveau), VDI-Richtwerte Warmwasser
  (~2,2 kWh/Tag el. für 4 Personen), Gradtagszahl/Heizgrenzen-Methode der Energieberater.
- Demo-Schritt „🚿 Wärmepumpe & Co." ergänzt; Hilfe/Bilanz-Scope-Texte angepasst.

### #11 Grundlast-Tagesprofil  ✅ v65
- **Umgesetzt:** Statt einer flachen Grundlast verteilt die App den Sockelverbrauch
  jetzt über den Tag (`GL_SHAPE`, 24 relative Werte, Ø = 1.0). Die Form wurde aus der
  **Solinteg-Verbraucherleistung** von 5 Tagen (13.–17.07.2026) abgelesen – nur der
  Sockel zwischen den Geräte-Spitzen, gemittelt: morgens ~0,27 kW (tiefster Punkt),
  nachmittags ~0,55 kW (Maximum), Ø ~0,42 kW. Der Grundlast-Regler legt weiter das
  **Niveau** fest (`grundlastKW(h) = schwelle · GL_SHAPE[h]`), sodass die Saison-Zonen
  (Sommer/Winter-WP) erhalten bleiben; die Form skaliert mit.
- **UI:** Einrichten → Grundlast → Toggle „📊 Tagesprofil" (Standard AN) mit
  24-Balken-Sparkline und Ø-Linie. Aus = flacher Wert wie zuvor.
- **Herkunft:** Solinteg-Web-Portal liefert keinen untertägigen Export (nur Tag/Monat/
  Jahr als Summen) und keinen abgreifbaren Intraday-API-Call – die Tageskurve gibt es
  nur als Diagramm. Profil daher aus Screenshots der „Verbraucherleistung"-Ansicht
  abgeleitet statt per CSV/API-Import.
- **Später (Stufe 3, = #5-Schiene):** Solinteg-OpenAPI (braucht Mini-Proxy wegen
  Key+CORS) oder lokale Modbus-Brücke für automatische Auffrischung – beides Backend,
  bewusst verschoben.

### #9 Widgets / Sperrbildschirm  🔴
- **Was:** „nächste gute Stunde" als Homescreen-/Lockscreen-Widget.
- **Aufwand hoch:** nur nativ (WidgetKit) → an #3 gekoppelt. **Nutzen mittel–hoch.**

## Kandidaten aus dem Markt-Vergleich (Juli 2026)
| # | Idee | Aufwand | Nutzen | Backend? | Status |
|---|------|---------|--------|----------|--------|
| 12 | Backup & Umzug: alle Daten als Datei sichern/wiederherstellen (JSON) | niedrig | hoch | nein | ✅ v62 |
| 13 | Einspeisevergütung: Ersparnis = Netzpreis − EEG-Vergütung (ehrlichere Ökonomie) | niedrig | mittel–hoch | nein | ⬜ |
| 14 | E-Auto-Ladeplaner: Ladeleistung kW + Ziel-kWh → bestes Ladefenster (Opt-in) | mittel | hoch | nein | ✅ v64 (inkl. Stufe 2) |
| 15 | Bilanz-/Läufe-Export als CSV (für Excel) | niedrig | mittel | nein | ✅ v62 |
| 16 | CO₂-Ampel „grünste Stunden" (Strommix, z. B. energy-charts.info; CORS prüfen) | mittel | mittel | nein | ⬜ |
| 17 | Tages-Rückblick-Banner („Dein Gestern: X kWh Sonne") | niedrig | mittel | nein | ✅ v62 |
| 19 | „Was ist neu": Update-Popup (einmalig je Version) + Versionsverlauf in der Hilfe | niedrig | mittel | nein | ✅ v62 |

### #14 E-Auto-Ladeplaner (v62 Stufe 1 + v64 Stufe 2)
Opt-in (Einrichten → E-Auto & Wallbox): Ladeleistung (2,3/3,7/7,4/11 kW), Ziel-kWh
(Presets mit angezeigter Ladezeit + freier Wert), Ladezeit = kWh ÷ kW aufgerundet,
Empfehlungszeile auf der Startseite, Demo-Schritt. **Stufe 2 (v64):** ab 3 h Ladezeit
prüft die Platzierung automatisch, ob 2 Etappen (echte Lücke, ≥10 % geringere ungedeckte
Netzkosten) besser sind – z. B. um teure Mittagsstunden herum. 2 Blöcke/Etappen-Labels,
Split überlebt Reload (cfg.plaene mit teil/dauer/ed), bestätigt wird EINMAL (beide
Fenster → 2 erledigt-Einträge für korrekte Belegung, 1 Verlaufs-Eintrag mit Summen-Bilanz).

## Empfohlene Reihenfolge
1. Grüne Gruppe zuerst (billig, sofort spürbar, kein Store-Stress) — Start mit **#2**.
2. Danach 🟡 (#4, #7).
3. Rote Punkte einzeln entscheiden (externe Voraussetzungen): #1, #3, #5, #8b, #9.
