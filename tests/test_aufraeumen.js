const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"result":{}}'}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const t=[];for(let i=0;i<7;i++)t.push(new Date(Date.now()+i*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10));
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:t,
        shortwave_radiation_sum:[220,70,120,170,205,185,250],sunshine_duration:[40000,9000,20000,30000,38000,34000,46000],
        daylight_duration:[54000,54000,54000,54000,54000,54000,54000],
        precipitation_probability_max:[5,80,55,20,10,15,0],temperature_2m_max:[24,18,20,22,25,24,27]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(((h>=5&&h<=20)?bell(h):0)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:80});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
const errs=[];
const NAMEN=["Waschmaschine","Trockner","Spülmaschine","Poolpumpe","Backofen","E-Auto"];
function basis(nErl){
  const erl=[],verlauf={};
  for(let i=0;i<nErl;i++){
    const nm=NAMEN[i%NAMEN.length]+(i>=NAMEN.length?" "+(i+1):"");
    erl.push({name:nm,icon:"🌀",s:7+i,e:8+i,k:1.0});
    verlauf[nm]=[{d:today,s:7+i,k:1.0,i:"🌀",du:1,son:0.8,spar:25}];
  }
  return {cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:false,tagAnzahl:{},plaene:{},
      erledigt:{[today]:erl},verlauf},
    geraete:[],meineGeraete:[],routinen:[]};
}
async function oeffne(b,seed){
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T18:00:00Z')});
  stub(p);
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  await p.goto(APP); await p.waitForTimeout(1800);
  return p;
}
const zustand=p=>p.evaluate(()=>{
  const box=document.querySelector('.erledigt-box');
  if(!box)return null;
  const det=box.querySelector('.erl-mehr');
  return {gesamt:box.querySelectorAll('.erledigt-zeile').length,
          offen:[...box.querySelectorAll('.erledigt-zeile')].filter(z=>!z.closest('.erl-mehr')).length,
          hatDetails:!!det, summary:det?det.querySelector('summary').textContent.trim():null,
          titel:box.querySelector('.erledigt-titel').textContent.trim()};
});
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  try{
  // --- A) Vier Durchgänge: nichts wird versteckt (Aufklapper brächte nichts) ---
  let p=await oeffne(b,basis(4)); let z=await zustand(p);
  chk('4 Läufe: alle vier stehen offen da', z&&z.offen===4&&z.gesamt===4, JSON.stringify(z));
  chk('4 Läufe: kein Aufklapper', z&&z.hatDetails===false, JSON.stringify(z));
  chk('4 Läufe: Titel ohne Zähler', z&&z.titel==='✓ Heute schon gelaufen', z&&z.titel);
  await p.close();

  // --- B) Sechs Durchgänge: die drei jüngsten offen, drei frühere im Aufklapper ---
  p=await oeffne(b,basis(6)); z=await zustand(p);
  chk('6 Läufe: nur drei stehen offen', z&&z.offen===3, JSON.stringify(z));
  chk('6 Läufe: keiner geht verloren', z&&z.gesamt===6, JSON.stringify(z));
  chk('6 Läufe: Aufklapper nennt drei frühere', z&&/3 frühere Läufe/.test(z.summary||''), z&&z.summary);
  chk('6 Läufe: Titel zeigt die Gesamtzahl', z&&/\(6\)/.test(z.titel), z&&z.titel);

  // Reihenfolge: der Aufklapper steht ÜBER den offenen Zeilen
  const reihenfolge=await p.evaluate(()=>{
    const box=document.querySelector('.erledigt-box');
    const det=box.querySelector('.erl-mehr');
    const ersteOffen=[...box.querySelectorAll('.erledigt-zeile')].find(z=>!z.closest('.erl-mehr'));
    return det.compareDocumentPosition(ersteOffen)&Node.DOCUMENT_POSITION_FOLLOWING?'davor':'danach';});
  chk('Aufklapper steht über den offenen Zeilen', reihenfolge==='davor', reihenfolge);

  // Der zuletzt getickte Durchgang bleibt sichtbar
  const letzte=await p.$$eval('.erledigt-box .erledigt-zeile',els=>{
    const off=els.filter(z=>!z.closest('.erl-mehr'));
    return off[off.length-1].textContent;});
  chk('Der jüngste Durchgang bleibt sichtbar', /12–13 Uhr/.test(letzte), letzte.trim());

  // --- C) „zurück" trifft den richtigen Durchgang, auch aus dem Aufklapper ---
  await p.$eval('.erl-mehr summary',e=>e.click()); await p.waitForTimeout(300);
  const vorher=await p.$$eval('.erledigt-box .erledigt-zeile',e=>e.map(x=>x.textContent));
  await p.$eval('.erl-mehr .erl-undo',e=>e.click()); await p.waitForTimeout(700);
  const nachher=await p.$$eval('.erledigt-box .erledigt-zeile',e=>e.map(x=>x.textContent));
  chk('„zurück" entfernt genau einen Eintrag', nachher.length===vorher.length-1, vorher.length+' → '+nachher.length);
  chk('„zurück" trifft den angeklickten (7–8 Uhr ist weg)',
      !nachher.some(t=>/7–8 Uhr/.test(t)) && nachher.some(t=>/8–9 Uhr/.test(t)), JSON.stringify(nachher.map(t=>t.trim().slice(0,40))));
  z=await zustand(p);
  chk('Nach dem Zurückholen (5) bleibt der Aufklapper', z&&z.hatDetails===true&&z.offen===3, JSON.stringify(z));
  await p.close();

  // --- D) Fünf Durchgänge: die Schwelle greift ---
  p=await oeffne(b,basis(5)); z=await zustand(p);
  chk('5 Läufe: zwei wandern in den Aufklapper', z&&z.offen===3&&/2 frühere Läufe/.test(z.summary||''), JSON.stringify(z));
  await p.close();

  // --- E) Bilanz: die grosse Zahl rundet nicht mehr anders als der Text darunter ---
  p=await oeffne(b,basis(3));
  await p.$eval('.tabbar .tab[data-tag="verlauf"]',e=>e.click()); await p.waitForTimeout(1500);
  const gr=await p.$eval('.wk-euro',e=>e.textContent.trim());
  const kl=await p.$eval('.wk-teilen',e=>e.textContent.trim()).catch(()=>'');
  chk('Grosse Zahl hat zwei Nachkommastellen', /^\d+,\d{2} €$/.test(gr), gr);
  const m=kl.match(/(\d+,\d{2}) €/);
  chk('Grosse Zahl und Teilen-Text sind identisch', m&&m[1]+' €'===gr, 'oben "'+gr+'" · unten "'+(m?m[1]+' €':kl)+'"');
  // Kacheln behalten ihre eine Nachkommastelle
  // Anordnung seit v87: Sonnen-kWh im Kopf, Euro/CO2/Serie als Kacheln.
  // Geprueft wird weiter dasselbe: die Animation behaelt je Element die Stellenzahl.
  const gross=await p.$eval('.wk-hero .wk-gross',e=>e.textContent.trim());
  chk('Sonnen-kWh im Kopf bleibt einstellig hinterm Komma', /^\d+(,\d)? kWh$/.test(gross), gross);
  const kach=await p.$$eval('.wk-kachel b',e=>e.map(x=>x.textContent.trim()));
  chk('Serie-Kachel bleibt ganzzahlig', /^\d+ Tage?$/.test(kach[2]||''), JSON.stringify(kach));
  await p.close();
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== v84: ERLEDIGT-LISTE & BILANZ-RUNDUNG =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
