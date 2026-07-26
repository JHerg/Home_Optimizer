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
- [x] ~~**Öffentliche Entwickler-Adresse**: Google zeigt eine verifizierte
      Kontaktadresse im Store öffentlich an (als Privatperson = Wohnadresse).~~
      ❌ **Diese frühere Notiz war falsch – korrigiert Juli 2026:**
      Bei einem **persönlichen** Entwicklerkonto ist öffentlich nur die
      **E-Mail-Adresse** sichtbar. Die Wohnadresse muss Google zwar
      **nachgewiesen** werden (Stromrechnung, Kontoauszug, Mietvertrag –
      Postfach und virtuelle Büros werden dafür nicht akzeptiert), sie wird
      aber **nicht veröffentlicht**.
      ⚠️ Ausnahme: Sobald **In-App-Käufe** angeboten werden, erscheinen Name
      UND vollständige Adresse öffentlich im Play-Profil. Ein Spendenknopf als
      **externer Link ist kein In-App-Kauf** und löst das nicht aus.
- [x] **Eigene Domain** – erledigt: `energie-optimierer.eu` (INWX), HTTPS aktiv,
      Asset Links veröffentlicht.

## Impressumspflicht – die eigentliche Abwägung (Stand Juli 2026)

Nicht der Play Store zwingt zur Adressveröffentlichung, sondern ggf. das
deutsche Impressumsrecht. § 5 DDG gilt für **„geschäftsmäßige"** Angebote;
**rein private ohne wirtschaftlichen Bezug sind ausgenommen**.

| | ohne Spendenknopf | mit Spendenknopf |
|---|---|---|
| Google Play (Privatkonto) | nur E-Mail öffentlich | nur E-Mail öffentlich |
| Impressum § 5 DDG | gute Chance: **keine Pflicht** | Graubereich → eher ja |

Die App ist kostenlos, werbefrei, sammelt nichts und verkauft nichts – das
spricht stark für „privat". Sobald jedoch Geld ins Spiel kommt (auch Spenden),
wird es zum Graubereich.

**Zugespitzt:** Der Spendenknopf – nicht der Store – ist es, der die
Adress-Privatsphäre kosten kann. Bei einer Hobby-App mit vermutlich
zweistelligen Jahresbeträgen ist das ein schlechtes Geschäft.

**Empfehlung:** Erst **ohne** Spendenknopf veröffentlichen. Der Knopf ist
gebaut und bleibt ausgeblendet, solange `SPENDEN_URL` leer ist – er lässt sich
jederzeit nachrüsten.

Falls Impressum doch nötig: Ein **Postfach genügt nicht**, es braucht eine
**ladungsfähige Anschrift**. Üblich und legal sind Impressumsservices von
Kanzleien/Anbietern (je nach Anbieter wenige Euro bis ~50 €/Monat).

⚠️ Das ist Recherche zur Orientierung, **keine Rechtsberatung**. Vor der
Veröffentlichung einmal fachlich prüfen lassen.

Quellen: [Google Play – Kontaktdaten](https://support.google.com/googleplay/android-developer/answer/10840893) ·
[Google Play – Kontodaten](https://support.google.com/googleplay/android-developer/answer/13634081) ·
[e-recht24 – Ladungsfähige Anschrift](https://www.e-recht24.de/impressum/13082-ladungsfaehige-anschrift.html) ·
[LFK – Leitfaden Impressumspflicht](https://www.lfk.de/service/dokumente-rechtsgrundlagen/leitfaden-zur-impressumspflicht-im-internet)

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

## Vorab testen – als Android-App, OHNE Store & OHNE 25 $ (jederzeit)
Man kann die App als echte Handy-App ausprobieren, bevor irgendetwas hochgeladen
oder bezahlt wird. Drei Stufen, von „sofort" bis „echtes Paket":
1. **Sofort & ohne Werkzeug – PWA installieren:** Website in Chrome auf Android
   öffnen → Menü ⋮ → „App installieren"/„Zum Startbildschirm hinzufügen". Läuft dann
   als Vollbild-App vom Homescreen (dank manifest `display: standalone`). Kein Store,
   kein Konto, 0 €. Ideal, um die Optik als App zu prüfen – geht schon **heute** mit v77.
2. **Als echtes App-Paket (APK/AAB) – lokal aufs eigene Handy:** Bubblewrap erzeugt
   aus der PWA ein **Android-Studio-Projekt** (Gradle). In Android Studio bauen →
   per USB aufs eigene Handy installieren („Sideloading") oder im Emulator starten.
   Kein Store, kein Konto, 0 €. Hinweis: ohne verifizierte Domain zeigt die TWA eine
   dünne Adressleiste – für Funktions-/Optikprüfung egal; für den sauberen Vollbild-
   Eindruck braucht es die Domain (Asset Links, Phase 2).
3. Erst wenn alles passt: 25 $-Konto + Upload (Phase 3).

**Kotlin / Android Studio (aus YouTube):** Unser TWA-Weg **ist** ein Android-Studio-
Projekt – Bubblewrap generiert es. Der Kotlin/Java-Anteil ist nur ein winziger
Wrapper (Start-Activity). Die App selbst wird **nicht** in Kotlin neu geschrieben –
ein kompletter Native-Neubau brächte keinen Mehrwert und würde die Ein-Codebasis
(Web-Deploy = alle aktuell) zerstören.

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
- **Spenden-Knopf**: in v80 **gebaut**, erscheint an zwei Stellen (Hilfe-Blatt,
  Bilanz nach dem Spar-Ergebnis). Bleibt **unsichtbar**, solange in `SPENDEN_URL`
  kein Ziel steht → aktuell bewusst aus.
- ⚠️ Mechanik im Play Store: Spenden **nicht** über Google Play Billing abwickeln
  (nur für registrierte gemeinnützige Orgs erlaubt), sondern per **externen Link**.
  Der ist zugleich **kein In-App-Kauf** – wichtig, siehe Impressums-Abwägung oben.
  Ein Link deckt Web, iPhone und Android ab.

### Auszahlungsweg – Recherche Juli 2026 (Entscheidung offen)

Zunächst war PayPal.me gesetzt. Beim Einrichten zeigte PayPal jedoch den
Hinweis, dass **Name, Foto, E-Mail-Adresse, Handynummer und Standort** anderen
Nutzern angezeigt werden → für ein **Privatkonto** zu viel. Abgebrochen.

Wichtige Erkenntnis: **Ko-fi allein schützt nicht** – entscheidend ist der
Auszahlungsweg dahinter.

| Weg | Was der Spender sieht |
|---|---|
| Ko-fi + PayPal **privat** | ❌ echter Name im PayPal-Beleg |
| Ko-fi + PayPal **Geschäftskonto** | ✅ frei gewählter Name (Umstellung meist kostenlos) |
| Ko-fi + **Stripe** | ✅ nur ein Bezeichner auf dem Kontoauszug |

Ko-fi-Gebühren: **0 %** auf Spenden im Gratis-Tarif – ⚠️ aber neue Konten sind
automatisch im **„Contributor"-Programm mit 5 %**; muss unter *Settings →
Payment Settings → Contributor* abgeschaltet werden. Dazu kommen immer die
Gebühren des Zahlungsdienstes (~2,9 % + 0,30 €).

**Empfehlung:** vorerst gar nichts einrichten (siehe Impressums-Abwägung).
Wenn doch: **Ko-fi + Stripe**, alternativ PayPal-Geschäftskonto.

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
