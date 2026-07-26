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
  await p.clock.install({time:new Date(today+'T04:00:00Z')}); // 06:00 Berlin
  stub(p);
  // Vollständig kontrollierten Zustand seeden: EIN Gerät „Waschmaschine", Fenster 6–11,
  // ein bereits gelaufener Durchgang 7:00–9:30, Tages-Anzahl 2 (einer lief, einer offen).
  const seed={
    cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:7.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,akku_kwh:10,akku_stand:5,
      ev_an:false,ev_kw:11,fsKey:"",gl_profil_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      erledigt:{[today]:[{name:"Waschmaschine",icon:"🌀",s:7,e:9.5,k:1.1}]},
      tagAnzahl:{[today]:{"Waschmaschine":2}}, plaene:{}, verlauf:{}},
    geraete:[{typ:"wm",name:"Waschmaschine",icon:"🌀",kwh:0.9,dauer:1,von:6,bis:11}],
    meineGeraete:[],routinen:[]
  };
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  try{
  await p.goto(APP);await p.waitForTimeout(1400);
  // Geplanten Waschmaschinen-Lauf aus dem gespeicherten Plan lesen
  const plan=await p.evaluate(t=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return (s.cfg.plaene[t]||[]);},today);
  const wm=plan.find(e=>/Waschmaschine/.test(e.key));
  chk('Waschmaschine wurde (erneut) eingeplant',!!wm,JSON.stringify(plan));
  chk('Start ist 9:30 (9.5) – nicht auf 10 aufgerundet',wm&&wm.start===9.5,'start='+(wm&&wm.start));

  // UI-Gegenprobe: Tagesplan öffnen, Block-Titel zeigt 9:30
  await p.$eval('#dash-curve',e=>e.click()).catch(()=>{});await p.waitForTimeout(600);
  const titel=await p.$$eval('#blocks-layer .p-blk:not(.done)',els=>els.map(e=>e.title));
  chk('Block-Titel nennt „9:30"',titel.some(t=>/9:30/.test(t)),JSON.stringify(titel));
  const linkeKante=await p.$$eval('#blocks-layer .p-blk:not(.done)',els=>els.map(e=>e.style.left));
  chk('Block sitzt bei ~39,6 % (9,5/24)',linkeKante.some(l=>parseFloat(l)>39&&parseFloat(l)<40.5),JSON.stringify(linkeKante));
  // Anzeige in der Geräte-Liste: „9:30" statt „9.5" (v75)
  const plZeit=await p.$$eval('.pl-zeit',els=>els.map(e=>e.textContent));
  chk('Geräte-Liste zeigt 9:30 (nicht 9.5)',plZeit.some(t=>/9:30/.test(t))&&!plZeit.some(t=>/9\.5/.test(t)),JSON.stringify(plZeit));

  // − / ＋ Tasten verschieben in 15-Minuten-Schritten (v76)
  const startNach=async()=>p.evaluate(t=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return (s.cfg.plaene[t].find(e=>/Waschmaschine/.test(e.key))||{}).start;},today);
  const vorher=await startNach();
  await p.$eval('.pl-nudge [data-dir="1"]',e=>e.click());await p.waitForTimeout(400);
  const spaeter=await startNach();
  chk('＋ verschiebt 15 min später (9:30 → 9:45)',spaeter===vorher+0.25,'vorher='+vorher+' nachher='+spaeter);
  await p.$eval('.pl-nudge [data-dir="-1"]',e=>e.click());await p.waitForTimeout(400);
  const wieder=await startNach();
  chk('− verschiebt 15 min früher (9:45 → 9:30)',wieder===vorher,'nachher='+wieder);
  const zeit=await p.$eval('.pl-zeit',e=>e.textContent);
  chk('Liste weiterhin saubere Uhrzeit',/9:30/.test(zeit),zeit);
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== v74: VIERTELSTUNDEN-PLANUNG =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
})();
