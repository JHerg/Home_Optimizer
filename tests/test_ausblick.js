const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function stub(p,rad,pp,tx){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"result":{}}'}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const t=[];for(let i=0;i<7;i++)t.push(new Date(Date.now()+i*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10));
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:t,shortwave_radiation_sum:rad,
        sunshine_duration:rad.map(x=>Math.round(x*180)),daylight_duration:[54000,54000,54000,54000,54000,54000,54000],
        precipitation_probability_max:pp,temperature_2m_max:tx}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(((h>=5&&h<=20)?bell(h):0)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:80});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
const seed=off=>({cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
    faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
    onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
    wischHintWeg:true,gl_profil_an:false,ausblickOffen:!!off,
    tagAnzahl:{[today]:{"Waschmaschine":1,"Spülmaschine":1}},plaene:{},erledigt:{},verlauf:{}},
  geraete:[{typ:"wm",name:"Waschmaschine",icon:"🌀",kwh:0.9,dauer:2,von:6,bis:22},
           {typ:"gs",name:"Spülmaschine",icon:"🍽️",kwh:1.0,dauer:2,von:6,bis:22}],meineGeraete:[],routinen:[]});
const errs=[];
async function seite(b,rad,pp,tx,offen){
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T07:00:00Z')});
  stub(p,rad,pp,tx);
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed(offen)));
  await p.goto(APP);await p.waitForTimeout(1900);
  return p;
}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  try{
  // --- 1) Die vier Textfälle ---
  const F=[
    ["Morgen Regen → heute vorziehen", [220,70,120,170,205,185,250],[5,80,55,20,10,15,0],[24,18,20,22,25,24,27], /Morgen wird es nass/],
    ["Alle Tage ähnlich → neutraler Satz", [200,205,198,210,202,196,208],[10,10,15,10,10,10,10],[23,23,22,23,23,22,23], /ähnlich sonnig.*kein Grund zu warten/],
    ["Besserer Tag kommt → warten lohnt", [120,140,160,200,230,250,260],[30,25,20,10,5,0,0],[19,20,21,23,25,26,27], /beste Tag.*warten/],
    ["Heute am stärksten → Gelegenheit", [260,230,210,190,170,150,140],[0,5,10,15,20,25,30],[27,26,25,23,22,21,20], /Heute.*stärkste Tag/]
  ];
  for(const [name,rad,pp,tx,re] of F){
    const p=await seite(b,rad,pp,tx,false);
    const s=await p.$eval('.dash-aus-tx',e=>e.textContent.trim()).catch(()=>'');
    chk(name, re.test(s), s);
    const h=await p.evaluate(()=>document.body.scrollHeight);
    chk('  ↳ passt ohne Scrollen (≤852 px)', h<=852, h+' px');
    await p.close();
  }

  // --- 2) Zugeklappt ist die Voreinstellung, Grafik erscheint erst auf Tipp ---
  const p=await seite(b,[220,70,120,170,205,185,250],[5,80,55,20,10,15,0],[24,18,20,22,25,24,27],false);
  chk('Voreinstellung: Grafik verborgen', (await p.$$('.dash-aus .wa-tag')).length===0);
  await p.$eval('#dash-aus-btn',e=>e.click()); await p.waitForTimeout(400);
  chk('Nach Tipp: 7 Tage sichtbar', (await p.$$('.dash-aus .wa-tag')).length===7,
      'n='+(await p.$$('.dash-aus .wa-tag')).length);
  chk('Bester Tag ist hervorgehoben', (await p.$$('.dash-aus .wa-tag.best')).length===1);
  chk('Heute ist markiert', (await p.$$('.dash-aus .wa-tag.heute')).length===1);

  // --- 3) Zustand wird gemerkt (überlebt Neuladen) ---
  const gespeichert=await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg.ausblickOffen);
  chk('Aufgeklappt wird gespeichert', gespeichert===true, 'ausblickOffen='+gespeichert);
  await p.$eval('#dash-aus-btn',e=>e.click()); await p.waitForTimeout(400);
  chk('Zuklappen blendet die Grafik wieder aus', (await p.$$('.dash-aus .wa-tag')).length===0);
  chk('Zugeklappt wird ebenfalls gespeichert',
      (await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg.ausblickOffen))===false);
  await p.close();

  // --- 4) Mit gemerktem „offen" startet die App aufgeklappt ---
  const q=await seite(b,[220,70,120,170,205,185,250],[5,80,55,20,10,15,0],[24,18,20,22,25,24,27],true);
  chk('Start mit gemerktem „offen": Grafik gleich da', (await q.$$('.dash-aus .wa-tag')).length===7);

  // --- 5) Auch auf dem Morgen-Reiter vorhanden ---
  await q.$eval('.tabbar .tab[data-tag="morgen"]',e=>e.click()); await q.waitForTimeout(900);
  chk('Ausblick auch auf „Morgen"', (await q.$$('.dash-aus-tx')).length===1);
  await q.close();
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,160));

  console.log('\n===== v81: AUSBLICK AUF DER STARTSEITE =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
