const fs=require('fs');const path=require('path');const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SRC=eoPfad.resolve(__dirname,'..','index.html');
// Zweite Fassung MIT hinterlegtem Spendenziel, um beide Zustaende echt zu pruefen.
const MIT='/tmp/eo_mit_spende.html';
fs.writeFileSync(MIT, fs.readFileSync(SRC,'utf8').replace('const SPENDEN_URL="";','const SPENDEN_URL="https://paypal.me/testziel";'));
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{lat:"50.98",lon:"6.93",display_name:"Köln"}])}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({result:{}})}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:[today,tom],shortwave_radiation_sum:[220,210],sunshine_duration:[40000,38000],daylight_duration:[54000,54000],precipitation_probability_max:[10,20],temperature_2m_max:[24,23]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(((h>=5&&h<=20)?bell(h):0)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:80});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const seed={cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9,neigung:25,azimut:0,aufschlag:18,schwelle:400,
    faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
    onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
    wischHintWeg:true,gl_profil_an:false,tagAnzahl:{},plaene:{},erledigt:{},
    verlauf:{"Waschmaschine":[{d:today,s:10,k:1.1,i:"🌀",du:2,son:1.05,spar:32}]}},
  geraete:[{typ:"wm",name:"Waschmaschine",icon:"🌀",kwh:1.1,dauer:2,von:6,bis:22}],meineGeraete:[],routinen:[]};
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
async function oeffne(b,datei){
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>R.push({n:'JS-Fehler: '+e.message.slice(0,80),ok:false,e:''}));
  await p.clock.install({time:new Date(today+'T10:00:00Z')});
  stub(p);
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  await p.goto('file://'+datei);await p.waitForTimeout(1500);
  return p;
}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  try{
  // ===== A) Auslieferungszustand: KEIN Spendenziel hinterlegt =====
  const p=await oeffne(b,SRC);
  await p.evaluate(()=>document.getElementById('btn-hilfe').click());
  await p.waitForTimeout(600);

  const kern=await p.$eval('.zweck .z-kern',e=>e.textContent);
  chk('Zweck-Text steht oben im Hilfe-Blatt', /Sonne scheint/.test(kern), kern);
  const emsFrage=await p.$eval('.zweck .z-frage',e=>e.textContent);
  chk('EMS-Abgrenzung ist eine eigene Frage', /Energiemanager/.test(emsFrage), emsFrage);
  const hebel=await p.$$eval('.hebel div',els=>els.length);
  chk('Beide Hebel (Sonne + Preis) genannt', hebel===2, 'n='+hebel);

  // Aufklapper: alles Nachschlagbare startet zugeklappt
  const details=await p.$$eval('#sheet-hilfe details',els=>els.map(d=>({t:d.querySelector('summary').textContent.trim(),offen:d.open})));
  chk('Drei Aufklapper vorhanden', details.length===3, JSON.stringify(details.map(d=>d.t)));
  chk('Alle starten zugeklappt', details.every(d=>!d.offen), JSON.stringify(details));
  chk('„So funktioniert\'s" ist eingeklappt', details.some(d=>/So funktioniert/.test(d.t)), JSON.stringify(details.map(d=>d.t)));

  // Demo-Knopf sitzt oben, vor den Aufklappern
  const demoVorDetails=await p.evaluate(()=>{
    const d=document.getElementById('btn-demo-start'), det=document.querySelector('#sheet-hilfe details');
    return !!(d&&det&&(d.compareDocumentPosition(det)&Node.DOCUMENT_POSITION_FOLLOWING));
  });
  chk('Demo-Knopf steht vor den Aufklappern', demoVorDetails);

  // Spenden: ohne Ziel unsichtbar
  const spendeAus=await p.$$eval('.spenden',els=>els.map(e=>e.hidden));
  chk('Ohne hinterlegtes Ziel: Spendenblock überall verborgen',
      spendeAus.length>0 && spendeAus.every(h=>h===true), JSON.stringify(spendeAus));
  await p.close();

  // ===== B) Mit hinterlegtem Spendenziel =====
  const q=await oeffne(b,MIT);
  await q.evaluate(()=>document.getElementById('btn-hilfe').click());
  await q.waitForTimeout(600);
  const hilfeSp=await q.$eval('#spenden-hilfe',e=>({hidden:e.hidden,txt:e.textContent,href:(e.querySelector('a')||{}).href||''}));
  chk('Spendenblock im Hilfe-Blatt sichtbar', hilfeSp.hidden===false);
  chk('Text nennt „kostenlos und werbefrei"', /kostenlos und werbefrei/.test(hilfeSp.txt), hilfeSp.txt.slice(0,60));
  chk('Knopf zeigt auf das hinterlegte Ziel', /paypal\.me\/testziel/.test(hilfeSp.href), hilfeSp.href);
  chk('Knopf öffnet extern (neuer Tab)',
      await q.$eval('#spenden-hilfe a',e=>e.target==='_blank'&&/noopener/.test(e.rel)));

  // Zweiter Platz: Bilanz unter „Deine Wirkung"
  await q.evaluate(()=>{const s=document.querySelector('#schleier');if(s)s.click();});
  await q.waitForTimeout(400);
  await q.$eval('.tabbar .tab[data-tag="verlauf"]',e=>e.click());
  await q.waitForTimeout(900);
  const bilanzSp=await q.$eval('#spenden-bilanz',e=>({hidden:e.hidden,hat:!!e.querySelector('a')}));
  chk('Spendenblock auch in der Bilanz', bilanzSp.hidden===false&&bilanzSp.hat, JSON.stringify(bilanzSp));
  await q.close();
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}

  console.log('\n===== v80: ZWECK-SEITE & SPENDEN =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
