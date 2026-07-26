const path=require('path');const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{lat:"50.98",lon:"6.93",display_name:"Köln"}])}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({result:{}})}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:[today],shortwave_radiation_sum:[220],sunshine_duration:[40000],daylight_duration:[54000],precipitation_probability_max:[10],temperature_2m_max:[24]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(((h>=5&&h<=20)?bell(h):0)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:80});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T09:00:00Z')});
  stub(p);
  const seed={
    cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:7.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,akku_kwh:10,akku_stand:5,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,gl_profil_an:false},
    geraete:[{typ:"wm",name:"Waschmaschine",icon:"🌀",kwh:0.9,dauer:1,von:6,bis:11}],
    meineGeraete:[],routinen:[]
  };
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  const anyOverlay=()=>p.evaluate(()=>!!document.querySelector('.sheet.offen')||(document.getElementById('schleier')&&document.getElementById('schleier').classList.contains('offen')));
  try{
  await p.goto(APP);await p.waitForTimeout(1200);

  // 1) Sheet öffnen → Zurück schließt Sheet, App bleibt (URL bleibt auf der App)
  chk('Start: kein Overlay offen', !(await anyOverlay()));
  await p.$eval('#dash-curve',e=>e.click()).catch(()=>{});
  await p.waitForTimeout(500);
  chk('Nach Öffnen: Tagesplan-Overlay offen', await anyOverlay());
  const urlVorher=p.url();
  await p.goBack();  // Hardware-/Wisch-Zurück
  await p.waitForTimeout(500);
  chk('Zurück schließt das Sheet', !(await anyOverlay()));
  chk('App verlässt die Seite NICHT (URL unverändert)', p.url()===urlVorher, p.url());

  // 2) Sheet öffnen, per Schleier (Tap daneben) schließen → History bleibt konsistent
  await p.$eval('#dash-curve',e=>e.click()).catch(()=>{});
  await p.waitForTimeout(400);
  chk('2. Öffnen: Overlay offen', await anyOverlay());
  await p.$eval('#schleier',e=>e.click());  // programmatisches Schließen (wie ✕)
  await p.waitForTimeout(500);
  chk('Schleier-Tap räumt Overlay ab', !(await anyOverlay()));
  // eoSyncClose konsumiert den Trap-Eintrag (history.back) – wir landen wieder auf
  // der App-Seite selbst, NICHT auf about:blank davor.
  chk('Nach Schleier-Tap: App bleibt (Trap sauber konsumiert)', p.url()===urlVorher, p.url());

  // 3) Öffnen/Schließen im Wechsel (mal Zurück, mal Schleier) – History läuft nicht auf
  await p.$eval('#dash-curve',e=>e.click()).catch(()=>{});
  await p.waitForTimeout(300);
  await p.goBack();                         // per Zurück schließen
  await p.waitForTimeout(300);
  chk('Wechsel 1 (Zurück): kein Overlay', !(await anyOverlay()));
  chk('Wechsel 1 (Zurück): App bleibt', p.url()===urlVorher, p.url());
  await p.$eval('#dash-curve',e=>e.click()).catch(()=>{});
  await p.waitForTimeout(300);
  await p.$eval('#schleier',e=>e.click());  // per Schleier schließen
  await p.waitForTimeout(400);
  chk('Wechsel 2 (Schleier): kein Overlay', !(await anyOverlay()));
  chk('Wechsel 2 (Schleier): App bleibt', p.url()===urlVorher, p.url());
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== v77: ANDROID-ZURÜCK-TASTE =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
