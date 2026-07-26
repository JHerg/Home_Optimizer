const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
// Sonne NUR um 11 Uhr, und zwar 2400 W -> 2,4 kW freier Ueberschuss in dieser einen Stunde.
function pvW(h){ return h===11 ? 2400 : 0; }
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"result":{}}'}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const t=[];for(let i=0;i<7;i++)t.push(new Date(Date.now()+i*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10));
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:t,shortwave_radiation_sum:[220,70,120,170,205,185,250],sunshine_duration:[40000,9000,20000,30000,38000,34000,46000],daylight_duration:[54000,54000,54000,54000,54000,54000,54000],precipitation_probability_max:[5,80,55,20,10,15,0],temperature_2m_max:[24,18,20,22,25,24,27]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(pvW(h)/6);}});
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  // Netzpreis konstant 100 EUR/MWh = 10 ct/kWh Spot; + Aufschlag 20 => voll = 30 ct/kWh
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:100});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T16:00:00Z')});  // 18 Uhr Berlin: beide Fenster abgelaufen
  stub(p);
  // Zwei Geraete, je 2 kWh in 1 h (= 2 kW), BEIDE fest auf 11:00 verankert.
  const geraete=[{typ:"wm",name:"Maschine A",icon:"🅰️",kwh:2,dauer:1,von:6,bis:22},
                 {typ:"gs",name:"Maschine B",icon:"🅱️",kwh:2,dauer:1,von:6,bis:22}];
  const seed={cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:20,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:false,          // KEIN Hintergrundverbrauch -> hg=0
      tagAnzahl:{[today]:{"Maschine A":1,"Maschine B":1}},
      plaene:{[today]:[{key:"wm|Maschine A",run:0,start:11,fix:true},
                       {key:"gs|Maschine B",run:0,start:11,fix:true}]},
      erledigt:{},verlauf:{}},
    geraete,meineGeraete:[],routinen:[]};
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  await p.goto(APP);
  await p.waitForTimeout(2200);

  const sheetDa=await p.$eval('#sheet-faellig',e=>e.classList.contains('offen')).catch(()=>false);
  console.log('Fällig-Blatt offen:', sheetDa);
  if(sheetDa){
    const zeilen=await p.$$eval('#faellig-liste *',()=>[]).catch(()=>[]);
    // alle Häkchen setzen
    await p.evaluate(()=>{document.querySelectorAll('#sheet-faellig input[type=checkbox]').forEach(c=>{if(!c.checked)c.click();});});
    await p.waitForTimeout(300);
    const gesetzt=await p.$$eval('#sheet-faellig input[type=checkbox]',els=>els.map(e=>e.checked));
    console.log('Häkchen:', JSON.stringify(gesetzt));
    await p.$eval('#faellig-ok',e=>e.click());
    await p.waitForTimeout(1200);
  }
  const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')));
  const v=st.cfg.verlauf||{};
  let sonSum=0,sparSum=0;
  Object.keys(v).forEach(n=>v[n].forEach(e=>{console.log('  ',n,'→ son',e.son,'kWh · spar',e.spar,'ct · start',e.s);sonSum+=e.son||0;sparSum+=e.spar||0;}));
  console.log('---');
  console.log('Freier Sonnenüberschuss um 11 Uhr : 2,400 kWh');
  console.log('Von der App gutgeschrieben       :', sonSum.toFixed(3), 'kWh');
  console.log('Ersparnis                        :', sparSum.toFixed(1), 'ct  (bei 30 ct/kWh)');
  console.log('JS-Fehler:', errs.length?errs.join('|'):'keine');
  await b.close();
})();
