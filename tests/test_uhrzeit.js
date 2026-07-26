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
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T06:00:00Z')});
  stub(p);
  // Warmwasser-Läufe bewusst auf VOLLE Stunde (5) und halbe (19:30) legen –
  // genau der gemeldete Fall aus dem Screenshot.
  const seed={cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:true,
      ww_an:true,ww_kwh:2.0,ww_kw:2.0,hz_an:false,
      ww_l:[{an:true,z:5,auto:false},{an:true,z:19.5,auto:false}],
      tagAnzahl:{},plaene:{},erledigt:{},
      verlauf:{"Waschmaschine":[{d:today,s:9,k:1.1,i:"🌀",du:2,son:1.0,spar:30},
                                {d:today,s:14.5,k:0.9,i:"🌀",du:1.5,son:0.8,spar:24}]}},
    geraete:[{typ:"wm",name:"Waschmaschine",icon:"🌀",kwh:1.1,dauer:2,von:6,bis:22}],
    meineGeraete:[],routinen:[]};
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  try{
  await p.goto(APP);await p.waitForTimeout(1800);

  // --- 1) Hintergrund-Pins im Tagesplan ---
  await p.$eval('#dash-curve',e=>e.click()).catch(()=>{});
  await p.waitForTimeout(900);
  const pins=await p.$$eval('.hg-ww',els=>els.map(e=>e.textContent.trim()));
  chk('Zwei Warmwasser-Pins vorhanden', pins.length===2, JSON.stringify(pins));
  chk('Volle Stunde zeigt „5:00" statt „5"', pins.some(t=>/5:00/.test(t)), JSON.stringify(pins));
  chk('Halbe Stunde bleibt „19:30"', pins.some(t=>/19:30/.test(t)), JSON.stringify(pins));
  chk('Keine nackte Zahl ohne Minuten mehr',
      !pins.some(t=>/(^|\s)\d{1,2}(\s|$)/.test(t.replace(/\d{1,2}:\d{2}/g,''))), JSON.stringify(pins));

  // --- 2) Zeitspannen behalten die kurze Form (dort wären :00 nur Ballast) ---
  const spannen=await p.$$eval('.pl-zeit',els=>els.map(e=>e.textContent)).catch(()=>[]);
  chk('Zeitspannen bleiben kurz („9–11 Uhr")',
      spannen.length===0 || spannen.some(t=>/\d+–\d+ Uhr/.test(t)), JSON.stringify(spannen));

  // --- 3) Der Ausblick-Hinweis führt nicht mehr mit dem Börsenpreis ---
  await p.evaluate(()=>{const s=document.getElementById('schleier'); if(s)s.click();});
  await p.waitForTimeout(500);
  await p.$eval('#dash-aus-btn',e=>e.click()); await p.waitForTimeout(400);
  const info=await p.$eval('.dash-aus-info',e=>e.textContent.trim());
  chk('Hinweis beginnt mit der Erklärung der Grafik', /^Balken = erwartete Sonnenstärke/.test(info), info.slice(0,50));
  chk('Börsenpreis steht als Begründung dahinter', /Weiter als morgen gibt es keine Börsenpreise/.test(info), info);
  chk('Betonung liegt auf „nur Sonne & Wetter"',
      await p.$eval('.dash-aus-info b',e=>/nur Sonne/.test(e.textContent)));
  chk('Hinweis ist kürzer als vorher (unter 170 Zeichen)', info.length<170, info.length+' Zeichen');

  // --- 4) CSV-Export: Zeitspalten immer mit Minuten ---
  const csv=await p.evaluate(()=>{
    let inhalt=null;
    const alt=URL.createObjectURL;
    URL.createObjectURL=(bl)=>{ inhalt=bl; return alt(bl); };
    document.querySelector('.tabbar .tab[data-tag="verlauf"]').click();
    return new Promise(res=>setTimeout(()=>{
      const btn=document.getElementById('btn-csv');
      if(!btn){res(null);return;}
      btn.click();
      setTimeout(()=>{ if(!inhalt){res(null);return;} inhalt.text().then(res); },300);
    },900));
  });
  if(csv){
    const zeilen=csv.split("\n").filter(z=>z.includes(";")).slice(1);
    const startSpalte=zeilen.map(z=>z.split(";")[2]).filter(Boolean);
    chk('CSV: Startzeiten immer mit Minuten',
        startSpalte.length>0 && startSpalte.every(t=>/^\d{1,2}:\d{2}$/.test(t)), JSON.stringify(startSpalte));
  } else chk('CSV: Startzeiten immer mit Minuten', false, 'CSV nicht auslesbar');
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,160));

  console.log('\n===== v83: UHRZEITEN & AUSBLICK-HINWEIS =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
