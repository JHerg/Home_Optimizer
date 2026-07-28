/* v89: Der Urlaubs-Modus ist aus der Gruppe „Haushalt" heraus nach ganz oben gewandert,
   und die Zusatztexte der Schalterzeilen sind wieder als solche erkennbar. */
const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tagPlus=n=>new Date(Date.now()+n*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"result":{}}'}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const t=[];for(let i=0;i<7;i++)t.push(tagPlus(i));
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:t,shortwave_radiation_sum:[220,70,120,170,205,185,250],sunshine_duration:[40000,9000,20000,30000,38000,34000,46000],daylight_duration:[54000,54000,54000,54000,54000,54000,54000],precipitation_probability_max:[5,80,55,20,10,15,0],temperature_2m_max:[24,18,20,22,25,24,27]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(((h>=5&&h<=20)?bell(h):0)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:80});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
const errs=[];
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T09:00:00Z')});
  stub(p);
  const seed={cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:true,akku_kwh:10,
      ev_an:true,ww_an:true,ww_kwh:3,ww_kw:2,ww_l:[{an:true,z:5,auto:false}],hz_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:true,tagAnzahl:{},plaene:{},erledigt:{},verlauf:{}},
    geraete:[],meineGeraete:[],routinen:[]};
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  try{
  await p.goto(APP); await p.waitForTimeout(1800);
  await p.$eval('#btn-einrichten',e=>e.click()); await p.waitForTimeout(800);

  // --- 1) Nicht mehr in einer Klappgruppe ---
  chk('Urlaubs-Schalter steckt in keiner Klappgruppe mehr',
      await p.$eval('#rg-ur-an',e=>!e.closest('details.egrp')));
  chk('Er sitzt in einer eigenen Karte', await p.$eval('#rg-ur-an',e=>!!e.closest('.ur-karte')));

  // --- 2) Ohne Aufklappen und ohne Scrollen sichtbar ---
  const sichtbar=await p.evaluate(()=>{
    const zu=[...document.querySelectorAll('#sheet-einrichten details.egrp')].every(d=>!d.open);
    const sh=document.getElementById('sheet-einrichten');
    const k=document.getElementById('ur-karte');
    const y=k.getBoundingClientRect().top - sh.getBoundingClientRect().top + sh.scrollTop;
    return {alleZu:zu, y:Math.round(y), sichtbarHoehe:Math.round(sh.getBoundingClientRect().height)};});
  chk('Alle Gruppen sind noch zugeklappt', sichtbar.alleZu, JSON.stringify(sichtbar));
  chk('Die Karte liegt im ersten Bildschirm', sichtbar.y<300,
      'y='+sichtbar.y+' px (früher 2110)');

  // --- 3) Die Gruppe „Haushalt" wirbt nicht mehr damit ---
  const st=await p.$eval('#eg-st-haushalt',e=>e.textContent);
  chk('Haushalt-Status ohne ✈️-Hinweis', !/✈️/.test(st), st);

  // --- 4) Zusatztexte der Schalter sind wieder Zusatztexte ---
  const opts=await p.$$eval('.switch-zeile .fk-opt',els=>els.map(e=>{
    const c=getComputedStyle(e);
    return {t:e.textContent.slice(0,20),d:c.display,col:c.color,size:parseFloat(c.fontSize)};}));
  chk('Vier Schalter tragen einen Zusatztext', opts.length===4, 'n='+opts.length);
  chk('Jeder steht auf eigener Zeile', opts.every(o=>o.d==='block'), JSON.stringify(opts.map(o=>o.d)));
  chk('Jeder ist kleiner als der Titel', opts.every(o=>o.size<=12.5), JSON.stringify(opts.map(o=>o.size)));
  const titelFarbe=await p.$eval('.switch-zeile',e=>getComputedStyle(e).color);
  chk('Keiner hat mehr die Farbe des Titels', opts.every(o=>o.col!==titelFarbe),
      'Titel '+titelFarbe+' vs '+JSON.stringify(opts.map(o=>o.col)));

  // --- 5) Der Schalter funktioniert an seinem neuen Platz ---
  chk('Die Details sind zunächst verborgen', await p.$eval('#ur-details',e=>e.hidden));
  await p.$eval('#rg-ur-an',e=>e.click()); await p.waitForTimeout(700);
  chk('Einschalten öffnet die Datumswahl', await p.$eval('#ur-details',e=>!e.hidden));
  const wahl=await p.$$eval('#w-urlaub button',els=>els.map(e=>e.textContent.trim()));
  chk('Die Schnellwahl ist da', wahl.length>=3, JSON.stringify(wahl));
  const gespeichert=await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg.urlaub);
  chk('Der Urlaub ist gespeichert', !!(gespeichert&&gespeichert.aktiv), JSON.stringify(gespeichert));

  // --- 6) Und die Startseite zeigt ihn wie gehabt ---
  await p.$eval('#sheet-einrichten .sheet-schliessen',e=>e.click()); await p.waitForTimeout(1000);
  const ban=await p.$eval('#rueckblick-banner,#ur-banner',()=>null).catch(()=>null);
  const banner=await p.evaluate(()=>{const e=document.querySelector('.ur-banner');return e?{h:e.hidden,t:e.textContent.slice(0,40)}:null;});
  chk('Startseite zeigt die Urlaubs-Zeile', banner&&banner.h===false, JSON.stringify(banner));
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,160));

  console.log('\n===== v89: URLAUBS-MODUS FINDBAR + SCHALTER-BESCHRIFTUNG =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
