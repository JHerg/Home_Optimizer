const path=require('path');const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function d(o){return new Date(Date.parse(today+'T12:00:00Z')+o*86400000).toISOString().slice(0,10);}
// PV je Modus (W): sonnig = Glocke um 13; pastboost = wie sonnig, aber 0-7 Uhr ×5;
// wolkig = vormittags/mittags dicht (300 W), Sonne erst 15-19 Uhr.
function pv(mode,h){
  const bell=x0=>{const x=(h-x0)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));};
  if(mode==='sonnig')return (h>=5&&h<=20)?bell(13):0;
  if(mode==='pastboost')return h<6?bell(13)+2500:((h>=5&&h<=20)?bell(13):0);
  if(mode==='wolkig'){ if(h>=15&&h<=19){const x=(h-17)/1.6;return Math.round(4800*Math.exp(-x*x));} return (h>=8&&h<=14)?300:0; }
  return 0;
}
const state={mode:'sonnig'};
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{lat:"50.98",lon:"6.93",display_name:"Köln"}])}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({result:{}})}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const DAY=54000;const time=[],rad=[],sun=[],day=[],regen=[],tmax=[];
      for(let i=0;i<7;i++){time.push(d(i));rad.push(220);sun.push(40000);day.push(DAY);regen.push(10);tmax.push(24);}
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time,shortwave_radiation_sum:rad,sunshine_duration:sun,daylight_duration:day,precipitation_probability_max:regen,temperature_2m_max:tmax}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(pv(state.mode,h)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++){const c=[6,5,4,4,5,7,10,13,14,12,8,5,3,2,4,6,9,13,15,14,11,9,8,7][h%24];dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:c*10});}r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T04:00:00Z')}); // 06:00 Berlin
  stub(p);
  const reload=async(mode)=>{ state.mode=mode;
    await p.evaluate(()=>localStorage.removeItem('eo-om-cache'));
    await p.goto(APP); await p.waitForTimeout(1100);
    await p.evaluate(()=>{document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('offen'));const sc=document.getElementById('schleier');if(sc)sc.classList.remove('offen');});
    await p.waitForTimeout(200);
  };
  try{
  // ---- Boot 1: sauber onboarden bei Sonne ----
  await p.goto(APP);await p.evaluate(()=>localStorage.clear());
  await p.goto(APP);await p.waitForTimeout(700);
  await p.fill('#wk-adresse','Köln');await p.$eval('#wk-suchen',e=>e.click());await p.waitForTimeout(1200);
  await p.$eval('#wk-weiter',e=>e.click()).catch(()=>{});await p.waitForTimeout(400);
  await p.$eval('#btn-fertig',e=>e.click());await p.waitForTimeout(1300);
  const k1=await p.$eval('#dash-hero .zahl',e=>e.textContent);
  chk('Basis: Ertrag angezeigt',parseInt(k1,10)>0,'kWh='+k1);
  chk('Basis: kein Drift-Banner',await p.$eval('#dash-drift',e=>e.hidden));
  const refs0=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return s.cfg.planRef;});
  chk('Referenz-Sonne je Lauf gespeichert',refs0&&refs0[Object.keys(refs0)[0]]&&Object.keys(refs0[Object.keys(refs0)[0]]).length>0,JSON.stringify(refs0).slice(0,90));

  // ---- Feature 2: Vergangenheit (0-7 Uhr) ×5 -> Zahl darf sich NICHT ändern ----
  await reload('pastboost');
  const k2=await p.$eval('#dash-hero .zahl',e=>e.textContent);
  chk('Eingefroren: Vergangenheits-Boost ändert Tageszahl nicht',k2===k1,'vorher='+k1+' nachher='+k2);

  // ---- Feature 1: Wolken ziehen auf -> Drift-Banner ----
  await reload('wolkig');
  const k3=await p.$eval('#dash-hero .zahl',e=>e.textContent);
  chk('Wolkig: Tageszahl sinkt (Zukunft zählt weiter)',parseInt(k3,10)<parseInt(k1,10),k1+'->'+k3);
  const banner=await p.$eval('#dash-drift',e=>({hidden:e.hidden,txt:e.textContent}));
  chk('Drift-Banner erscheint',!banner.hidden,banner.txt.slice(0,90));
  chk('Banner nennt besseres Fenster (15-19)',/1[5-9]/.test(banner.txt),'');
  chk('Banner mit Verschieben+Behalten',!!(await p.$('#drift-mv'))&&!!(await p.$('#drift-x')));

  // ---- Behalten: Hinweis verschwindet und bleibt weg ----
  const dev1=banner.txt.match(/geändert:\s*(\S+)/);
  await p.$eval('#drift-x',e=>e.click());await p.waitForTimeout(300);
  chk('Behalten: Banner weg',await p.$eval('#dash-drift',e=>e.hidden));
  // Beim nächsten Refresh darf das ANDERE Gerät gemeldet werden -> alle behalten, dann muss Ruhe sein
  let runden=0;
  while(runden<4){ await reload('wolkig'); if(await p.$eval('#dash-drift',e=>e.hidden))break; await p.$eval('#drift-x',e=>e.click());await p.waitForTimeout(250); runden++; }
  chk('Behalten überlebt Neuladen (alle Läufe gemerkt)',await p.$eval('#dash-drift',e=>e.hidden),'Extra-Runden='+runden);

  // ---- Verschieben: driftWeg löschen, dann Banner nutzen ----
  await p.evaluate(()=>{const k='energie-optimierer-v1';const s=JSON.parse(localStorage.getItem(k));delete s.cfg.driftWeg;localStorage.setItem(k,JSON.stringify(s));});
  await reload('wolkig');
  chk('Nach Reset: Banner wieder da',!(await p.$eval('#dash-drift',e=>e.hidden)));
  const planVor=await p.evaluate(t=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return (s.cfg.plaene[t]||[]).map(e=>e.start);},today);
  await p.$eval('#drift-mv',e=>e.click());await p.waitForTimeout(600);
  const planNach=await p.evaluate(t=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return (s.cfg.plaene[t]||[]).map(e=>e.start);},today);
  chk('Verschieben: Startzeit in die neue Sonne (>=14) verlegt',planNach.some((s,i)=>s!==planVor[i]&&s>=14),JSON.stringify(planVor)+' -> '+JSON.stringify(planNach));
  const refN=await p.evaluate(t=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return s.cfg.planRef[t];},today);
  chk('Referenz nach Verschieben aktualisiert',Object.values(refN||{}).some(e=>e.start>=14),JSON.stringify(refN).slice(0,90));
  await reload('wolkig');
  chk('Nach Verschieben+Neuladen: kein Banner mehr für verschobenen Lauf',
    (await p.$eval('#dash-drift',e=>e.hidden)) || !(await p.$eval('#dash-drift',e=>e.textContent)).includes((dev1&&dev1[1])||'###'), '');
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== DRIFT-HINWEIS + EINGEFRORENE VERGANGENHEIT (v67) =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
})();
