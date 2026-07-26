const path=require('path');const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function pv(mode,h){
  const bell=()=>{const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));};
  const normal=(h>=5&&h<=20)?bell():0;
  if(mode==='pastboost')return h<6?normal+2500:normal;
  return normal;
}
const state={mode:'sonnig'};
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{lat:"50.98",lon:"6.93",display_name:"Köln"}])}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({result:{}})}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:[today],shortwave_radiation_sum:[220],sunshine_duration:[40000],daylight_duration:[54000],precipitation_probability_max:[10],temperature_2m_max:[24]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(pv(state.mode,h)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:80});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T04:00:00Z')}); // 06:00 Berlin
  stub(p);
  const zu=()=>p.evaluate(()=>{document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('offen'));const sc=document.getElementById('schleier');if(sc)sc.classList.remove('offen');});
  const kalibZahl=async()=>{
    await p.$eval('#btn-einrichten',e=>e.click());await p.waitForTimeout(400);
    await p.$eval('#grp-genau summary',e=>e.click());await p.waitForTimeout(250);
    const t=await p.$eval('#kalib-prognose',e=>e.textContent);
    await zu();
    return parseInt((t.match(/(\d+)\s*kWh/)||[])[1]||'-1',10);
  };
  try{
  await p.goto(APP);await p.evaluate(()=>localStorage.clear());await p.goto(APP);await p.waitForTimeout(700);
  await p.fill('#wk-adresse','Köln');await p.$eval('#wk-suchen',e=>e.click());await p.waitForTimeout(1200);
  await p.$eval('#wk-weiter',e=>e.click()).catch(()=>{});await p.waitForTimeout(400);
  await p.$eval('#btn-fertig',e=>e.click());await p.waitForTimeout(1100);

  const dash1=parseInt(await p.$eval('#dash-hero .zahl',e=>e.textContent),10);
  const kal1=await kalibZahl();
  chk('Startseite und Kalibrieren zeigen DIESELBE Zahl',dash1===kal1,'dash='+dash1+' kalib='+kal1);

  // Modell schreibt die Vergangenheit um (0-5 Uhr +2500 W) -> BEIDE Zahlen bleiben stehen
  state.mode='pastboost';
  await p.evaluate(()=>localStorage.removeItem('eo-om-cache'));
  await p.goto(APP);await p.waitForTimeout(1000);await zu();
  const dash2=parseInt(await p.$eval('#dash-hero .zahl',e=>e.textContent),10);
  const kal2=await kalibZahl();
  chk('Nach Revision: Startseite eingefroren',dash2===dash1,'vorher='+dash1+' nachher='+dash2);
  chk('Nach Revision: Kalibrier-Prognose ebenfalls eingefroren (der Fix)',kal2===kal1,'vorher='+kal1+' nachher='+kal2);
  chk('Beide weiterhin identisch',dash2===kal2,'dash='+dash2+' kalib='+kal2);

  // Kalibrieren: echter Ertrag nahe der gesehenen Prognose -> Eintrag mit kleiner Abweichung
  await p.$eval('#btn-einrichten',e=>e.click());await p.waitForTimeout(400);
  await p.$eval('#grp-genau summary',e=>e.click());await p.waitForTimeout(250);
  await p.evaluate(v=>{document.getElementById('f-kalib-real').value=String(v);document.getElementById('btn-kalib').click();},dash1+0.3);
  await p.waitForTimeout(500);
  const row=await p.$eval('#kalib-liste .kalib-row',e=>e.textContent);
  const diff=parseInt((row.match(/\(([+-]?\d+)\s*%\)/)||[])[1]||'99',10);
  chk('Kalibrier-Eintrag vergleicht gegen die GESEHENE Prognose (Abweichung klein)',Math.abs(diff)<=3,row.slice(0,60));
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== v72: EINE WAHRHEIT FÜR DIE PROGNOSE =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
})();
