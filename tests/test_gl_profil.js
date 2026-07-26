const path=require('path');const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{lat:"50.98",lon:"6.93",display_name:"Köln"}])}));
  p.route('**/api.forecast.solar/**',r=>{const whp={};[today,tom].forEach(t=>{for(let h=5;h<21;h++){const w=bell(h);if(w>0)whp[t+' '+String(h).padStart(2,'0')+':00:00']=w;}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({result:{watt_hours_period:whp}})});});
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:[today],shortwave_radiation_sum:[240],sunshine_duration:[45000],daylight_duration:[54000],precipitation_probability_max:[10],temperature_2m_max:[28]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(bell(h)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++){const c=[6,5,4,4,5,7,10,13,14,12,8,5,3,2,4,6,9,13,15,14,11,9,8,7][h%24];dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:c*10});}r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T08:00:00Z')});stub(p);
  await p.addInitScript(()=>localStorage.removeItem('energie-optimierer-v1'));
  await p.goto(APP);await p.waitForTimeout(800);
  try{
  await p.fill('#wk-adresse','Köln');await p.$eval('#wk-suchen',e=>e.click());await p.waitForTimeout(1200);
  await p.$eval('#wk-weiter',e=>e.click()).catch(()=>{});await p.waitForTimeout(400);
  await p.$eval('#btn-fertig',e=>e.click());await p.waitForTimeout(1200);

  // Dashboard: Geräte eingeplant trotz Profil-Grundlast?
  const blocks0=await p.$$eval('#planer-leiste .p-blk',e=>e.length).catch(()=>0);
  await p.$eval('#dash-curve',e=>e.click()).catch(()=>{});await p.waitForTimeout(500);
  const blocks=await p.$$eval('#planer-leiste .p-blk',e=>e.length).catch(()=>0);
  chk('Geräte trotz Tagesprofil eingeplant',(blocks||blocks0)>0,'Blöcke='+(blocks||blocks0));
  await p.evaluate(()=>{document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('offen'));document.getElementById('schleier').classList.remove('offen');});

  // Einstellungen öffnen
  await p.$eval('#btn-einrichten',e=>e.click());await p.waitForTimeout(500);
  chk('Profil-Toggle standardmäßig AN',await p.$eval('#rg-gl-profil',e=>e.checked));
  chk('Profil-Box sichtbar',!(await p.$eval('#gl-profil-box',e=>e.hidden)));
  const rects=await p.$$eval('#gl-spark rect',e=>e.map(r=>+r.getAttribute('height')));
  chk('Sparkline hat 24 Balken',rects.length===24,'n='+rects.length);
  // Form: Nachmittag (14 Uhr, idx13-16) höher als früher Morgen (7 Uhr, idx7)
  const morgen=rects[7]||0, nachm=rects[14]||0;
  chk('Tagesform: Nachmittag > früher Morgen',nachm>morgen,'morgen='+morgen.toFixed(1)+' nachm='+nachm.toFixed(1));
  const spanne=Math.max(...rects)-Math.min(...rects);
  chk('Balken variieren (nicht flach)',spanne>3,'Spanne='+spanne.toFixed(1));

  // Toggle AUS -> Box weg, Grundlast flach
  await p.$eval('#rg-gl-profil',e=>e.click());await p.waitForTimeout(400);
  chk('Toggle AUS: Box versteckt',await p.$eval('#gl-profil-box',e=>e.hidden));
  const glAus=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return s.cfg.gl_profil_an;});
  chk('AUS in localStorage gespeichert',glAus===false,'gl_profil_an='+glAus);

  // Wieder AN
  await p.$eval('#rg-gl-profil',e=>e.click());await p.waitForTimeout(400);
  const glAn=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return s.cfg.gl_profil_an;});
  chk('Wieder AN gespeichert',glAn===true);
  const rects2=await p.$$eval('#gl-spark rect',e=>e.length);
  chk('Sparkline nach Wiedereinschalten neu gezeichnet',rects2===24,'n='+rects2);
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|'));

  console.log('\n===== GRUNDLAST-TAGESPROFIL =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
})();
