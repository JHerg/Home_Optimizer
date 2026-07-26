/* Kein Test, sondern eine Messung zur Frage: Haengt der RAT der App davon ab,
   dass man jeden Hintergrundverbraucher eingetragen hat?
   Derselbe Tag, dieselbe Waschmaschine – einmal ohne und einmal mit einer
   kraeftigen Waermepumpe im Hintergrund. Verglichen wird die empfohlene Startzeit. */
const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
let SONNE=6000;
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(SONNE*Math.exp(-x*x)));}
// Realistischer Tagesverlauf: teuer morgens/abends, guenstig mittags (EUR/MWh)
const PREIS=[95,90,88,85,88,110,150,190,210,160,110,70,45,40,55,90,140,200,230,240,200,160,130,105];
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"result":{}}'}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const t=[];for(let i=0;i<7;i++)t.push(new Date(Date.now()+i*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10));
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:t,shortwave_radiation_sum:[220,70,120,170,205,185,250],sunshine_duration:[40000,9000,20000,30000,38000,34000,46000],daylight_duration:[54000,54000,54000,54000,54000,54000,54000],precipitation_probability_max:[5,80,55,20,10,15,0],temperature_2m_max:[24,18,20,22,25,24,27]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(((h>=5&&h<=20)?bell(h):0)/6);}});
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];
    for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:PREIS[h%24]});
    r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
async function empfehlung(b,hintergrund,sonneMax,titel){
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  await p.clock.install({time:new Date(today+'T03:00:00Z')});  // 5 Uhr Berlin: ganzer Tag offen
  stub(p);
  const cfg={lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
    faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
    onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
    wischHintWeg:true,gl_profil_an:false,
    tagAnzahl:{[today]:{"Waschmaschine":1}},plaene:{},erledigt:{},verlauf:{}};
  if(hintergrund){   // Verbraucher, die "doch noch ansprangen" – NICHT vom Nutzer eingetragen
    cfg.schwelle=hintergrund*1000;                 // Sockel in W (grundlastKW)
    cfg.ww_an=true; cfg.ww_kwh=4.0; cfg.ww_kw=hintergrund;
    cfg.ww_l=[{an:true,z:9,auto:false},{an:true,z:12,auto:false}];
  }
  const seed={cfg,geraete:[{typ:"wm",name:"Waschmaschine",icon:"🌀",kwh:2,dauer:2,von:6,bis:22}],
    meineGeraete:[],routinen:[]};
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  await p.goto(APP); await p.waitForTimeout(2200);
  const zeile=await p.$eval('#dash-plan-card .dash-sub',e=>e.textContent.trim()).catch(()=>"(nicht gefunden)");
  const deckung=await p.$eval('#dash-plan-card .dash-pct',e=>e.textContent.trim()).catch(()=>"-");
  await p.close();
  return {zeile,deckung};
}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const faelle=[
    ["Sommertag  (9,6 kWp voll)", 6000],
    ["truebe Tag (ein Drittel) ", 2000],
    ["Wintertag  (fast nichts) ",  600]];
  const lasten=[[ "nichts eingetragen", false],
                ["3 kW Waermepumpe   ", 3.0],
                ["8 kW Waermepumpe   ", 8.0]];
  console.log("Waschmaschine 2 kWh / 2 h, Fenster 6-22 Uhr, dynamischer Tarif");
  console.log("Frage: aendert sich der RAT, wenn im Hintergrund unerwartet etwas mitlaeuft?\n");
  for(const [lbl,s] of faelle){
    SONNE=s;
    const zeilen=[];
    for(const [llbl,last] of lasten){
      SONNE=s;
      const r=await empfehlung(b,last);
      zeilen.push("   "+llbl+" -> "+r.zeile.split("·")[0].trim().padEnd(12)+" (Deckung "+r.deckung+")");
    }
    const zeiten=zeilen.map(z=>z.split("->")[1].split("(")[0].trim());
    console.log(lbl+"   "+(new Set(zeiten).size===1?"[Rat identisch]":"[Rat weicht ab]"));
    zeilen.forEach(z=>console.log(z));
    console.log("");
  }
  await b.close();
})();
