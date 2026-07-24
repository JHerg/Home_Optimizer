# Play-Store-Plan: Energie-Optimierer als Android-App

Ziel: Die bestehende PWA als echte Android-App in den Google Play Store bringen.
Gewählter Weg: **TWA (Trusted Web Activity)** – die App im Store zeigt innen die
bestehende Web-App. Kein Umschreiben, EINE Codebasis, inhaltliche Updates weiterhin
per Web-Deploy (main pushen = alle Nutzer aktuell, ohne Store-Review).

## Phase 0 – Entscheidungen (Betreiber)
- [ ] **Google-Play-Entwicklerkonto** anlegen: 25 $ einmalig, Identitätsprüfung.
      ⚠️ Neue PRIVATkonten (seit Nov 2023): vor Produktions-Freigabe ist ein
      **geschlossener Test mit ≥12 Testern über 14 Tage** Pflicht → Tester-Liste
      früh sammeln (Familie, Freunde, Kollegen).
- [ ] **Öffentliche Entwickler-Adresse**: Google zeigt eine verifizierte
      Kontaktadresse im Store öffentlich an (als Privatperson = Wohnadresse).
      Bewusst entscheiden.
- [ ] **Eigene Domain** (~10 €/Jahr, z. B. energie-optimierer.de) – empfohlen:
      professioneller, unabhängig von github.io und vereinfacht die Asset Links
      (sonst Zusatz-Repo `jherg.github.io` fürs Wurzelverzeichnis nötig).

## Phase 1 – Web-App „store-fit" machen (Entwicklung, 2–3 Releases) ✅ erledigt (v77)
- [x] **Android-Zurück-Taste** ⭐ wichtigster Umbau: Sheets/Overlays/Dialoge in die
      Browser-History integriert (History-Trap), „Zurück"/Wisch-zurück schließt erst
      Blätter statt die App zu beenden. Playwright-Test `test_back.js` (12/12).
- [x] **Manifest-Vollausbau**: id, lang=de, dir, description, categories,
      `purpose: maskable`-Icons mit Safe-Zone (icon-maskable-192/512, Rand über
      fortgesetzten Verlauf), background_color/theme_color, 2 Screenshots.
- [x] **Datenschutzerklärung + Impressum** als eigene Seite `datenschutz.html`
      (verlinkt aus „Datenquellen & Rechtliches"). Benennt alle API-Abrufe
      (Nominatim, Open-Meteo, Forecast.Solar, aWATTar), betont lokal/kein Konto.
      ⚠️ Impressum enthält Platzhalter für Name + ladungsfähige Anschrift –
      **vor Store-Veröffentlichung ausfüllen** (§ 5 DDG).
- [x] Statusbar-/Theme-Farben: theme-color-Meta jetzt medien-gescopt (hell/dunkel)
      und per JS mit dem Farbmodus synchron; Test mit Android-Chromium (Playwright).

## Phase 2 – Verpacken & Signieren (Werkzeugarbeit)
- [ ] AAB mit **Bubblewrap/PWABuilder** erzeugen; Play App Signing.
- [ ] **Digital Asset Links** (`/.well-known/assetlinks.json` im Wurzelverzeichnis
      der Domain) mit SHA-256 des Play-Signing-Keys – sonst zeigt die App eine
      Browser-Leiste. (Grund für die Domain-Empfehlung.)
- [ ] targetSdk aktuell halten (Googles Jahresregel) – betrifft nur den Wrapper.

## Phase 3 – Play Console (Formulare Betreiber, Inhalte aus der Entwicklung)
- [ ] Store-Eintrag: Kurz-/Langbeschreibung, Icon 512, Feature-Grafik 1024×500,
      min. 2 echte Screenshots (liefert die Entwicklung).
- [ ] **Data-Safety-Formular**: dank „100 % lokal, kein Konto, kein Tracking"
      fast überall „Nein" – Architektur zahlt sich aus.
- [ ] IARC-Alterseinstufung (Fragebogen ~10 min), Kategorie House & Home.
- [ ] Interner Test → geschlossener Test (12 Tester / 14 Tage) → Produktion
      (Review meist wenige Tage).

## Monetarisierung – Entscheidung (Juli 2026)
- App bleibt **kostenlos** (kein Kaufpreis, keine Werbung) → bleibt **nicht-kommerziell**
  → alle Datenquellen (Open-Meteo, Forecast.Solar, aWATTar, Nominatim) bleiben gratis.
  Bezahlen würde die kommerziellen Stufen auslösen (Open-Meteo ~29 $/Monat etc.).
- **Spenden-Knopf** (dezent, optional) als einzige Einnahmequelle – Idee: kleine
  „Trinkgeld"-Stufen, z. B. 1 € / 3 € / 5 € + freier Betrag.
- ⚠️ **Erst in der Store-App umsetzen, NICHT in der aktuellen Web-Version.**
- ⚠️ Mechanik im Play Store: Spenden **nicht** über Google Play Billing abwickeln
  (nur für registrierte gemeinnützige Orgs erlaubt), sondern per Link auf einen
  externen Dienst: Ko-fi / Buy Me a Coffee / PayPal.me / Liberapay / GitHub Sponsors.
  Hält es gebührenarm und store-konform. (Für die iOS-/Web-Version genügt ebenfalls
  ein externer Link.)

## Phase 4 – Betrieb
- Inhaltliche Updates wie bisher (vXX live schalten – Store-App zeigt sie sofort).
- ~1×/Jahr Wrapper-Update wegen targetSdk-Pflicht.

## Phase 5 – Ausbau (nach Veröffentlichung)
- Umstieg des Wrappers auf **Capacitor** öffnet: **lokale Erinnerungen ohne
  Server** („dein Sonnenfenster beginnt in 30 min" – passt zur Privatsphäre-Story,
  Roadmap #1) und Widgets (#9).

## Aufwand / Kosten (Schätzung)
- Phase 1: 2–3 Abende · Phase 2: 1 Abend · Phase 3: 2–3 h Formulare
  + **14 Tage Pflicht-Testphase** → realistisch **~4–6 Wochen bis zum Store**.
- Kosten: 25 $ einmalig + optional ~10 €/Jahr Domain.
