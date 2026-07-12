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

### #9 Widgets / Sperrbildschirm  🔴
- **Was:** „nächste gute Stunde" als Homescreen-/Lockscreen-Widget.
- **Aufwand hoch:** nur nativ (WidgetKit) → an #3 gekoppelt. **Nutzen mittel–hoch.**

## Empfohlene Reihenfolge
1. Grüne Gruppe zuerst (billig, sofort spürbar, kein Store-Stress) — Start mit **#2**.
2. Danach 🟡 (#4, #7).
3. Rote Punkte einzeln entscheiden (externe Voraussetzungen): #1, #3, #5, #8b, #9.
