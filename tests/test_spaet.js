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
  await p.clock.install({time:new Date(today+'T18:30:00Z')}); // 20:30 Berlin
  stub(p);
  const zu=()=>p.evaluate(()=>{document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('offen'));const sc=document.getElementById('schleier');if(sc)sc.classList.remove('offen');});
  try{
  await p.goto(APP);await p.evaluate(()=>localStorage.clear());await p.goto(APP);await p.waitForTimeout(700);
  await p.fill('#wk-adresse','Köln');await p.$eval('#wk-suchen',e=>e.click());await p.waitForTimeout(1200);
  await p.$eval('#wk-weiter',e=>e.click()).catch(()=>{});await p.waitForTimeout(400);
  await p.$eval('#btn-fertig',e=>e.click());await p.waitForTimeout(1200);

  // Tagesplan öffnen: Warnung mit neuer Formulierung + 🌙-Knopf
  await p.$eval('#dash-curve',e=>e.click());await p.waitForTimeout(600);
  const warn=await p.$eval('#planer-warnung',e=>e.textContent).catch(()=>'');
  chk('Neue Formulierung: „Zeitfenster … endet um 22 Uhr"',/Zeitfenster dieses Geräts endet um\s*22 Uhr/.test(warn),warn.replace(/\s+/g,' ').slice(0,120));
  chk('Uhrzeit-Kontext in Berliner Zeit („es ist schon 20:30")',/es ist schon 20:30/.test(warn),'');
  const spaetBtns=await p.$$eval('#planer-warnung [data-spaet]',e=>e.length);
  chk('🌙-Knopf vorhanden (nur wo Lauf vor 24 Uhr fertig würde)',spaetBtns>=1,'Knöpfe='+spaetBtns);
  const blocksVor=await p.$$eval('#planer-leiste .p-blk',e=>e.length);

  // Klick: Ausnahme nur für heute -> sofort neu geplant
  await p.$eval('#planer-warnung [data-spaet]',e=>e.click());await p.waitForTimeout(700);
  const blocksNach=await p.$$eval('#planer-leiste .p-blk',e=>e.length);
  chk('Nach 🌙: Gerät ist eingeplant (Block dazugekommen)',blocksNach>blocksVor,'vorher='+blocksVor+' nachher='+blocksNach);
  const cfg1=await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg);
  chk('Ausnahme gespeichert (spaetHeute, heutiger Tag)',cfg1.spaetHeute&&cfg1.spaetHeute.tag===today&&cfg1.spaetHeute.namen.length===1,JSON.stringify(cfg1.spaetHeute));
  const spaeterStart=await p.evaluate(t=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return (s.cfg.plaene[t]||[]).map(e=>e.start);},today);
  chk('Später Start (>=20 Uhr) im Plan',spaeterStart.some(s=>s>=20),JSON.stringify(spaeterStart));

  // Ausnahme überlebt Neuladen (heute) …
  await p.goto(APP);await p.waitForTimeout(1000);await zu();
  await p.$eval('#dash-curve',e=>e.click());await p.waitForTimeout(600);
  const blocksReload=await p.$$eval('#planer-leiste .p-blk',e=>e.length);
  chk('Nach Neuladen: Plan bleibt (Ausnahme gilt heute weiter)',blocksReload===blocksNach,'Blöcke='+blocksReload);
  await zu();

  // … gilt aber NICHT für andere Tage: abgelaufene Ausnahme (Tag=gestern) wird ignoriert
  await p.evaluate(g=>{const k='energie-optimierer-v1';const s=JSON.parse(localStorage.getItem(k));
    s.cfg.spaetHeute.tag=g;s.cfg.plaene={};s.cfg.planRef={};localStorage.setItem(k,JSON.stringify(s));},new Date(Date.now()-86400000).toISOString().slice(0,10));
  await p.goto(APP);await p.waitForTimeout(1000);await zu();
  await p.$eval('#dash-curve',e=>e.click());await p.waitForTimeout(600);
  const warn2=await p.$eval('#planer-warnung',e=>e.textContent).catch(()=>'');
  chk('Abgelaufene Ausnahme (anderer Tag) wird ignoriert – Warnung wieder da',/Zeitfenster dieses Geräts endet/.test(warn2),warn2.replace(/\s+/g,' ').slice(0,80));
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== v73: HEUTE AUSNAHMSWEISE BIS 24 UHR =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
})();
