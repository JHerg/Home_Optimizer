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
const lese=p=>p.evaluate(t=>{
  const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));
  return {verlauf:(s.cfg.verlauf&&s.cfg.verlauf["Bunt 40°"])||[], erledigt:(s.cfg.erledigt&&s.cfg.erledigt[t])||[]};
},today);

(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T18:00:00Z')}); // 20:00 Berlin – beide Läufe liegen in der Vergangenheit
  stub(p);
  // Genau der gemeldete Fall: ZWEI Durchgaenge desselben Geraets am selben Tag,
  // direkt hintereinander (11:45–14:45 und 14:45–17:15) – so wie im Screenshot.
  const seed={
    cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:7.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:false,
      erledigt:{[today]:[
        {name:"Bunt 40°",icon:"🌈",s:11.75,e:14.75,k:0.7},
        {name:"Bunt 40°",icon:"🌈",s:14.75,e:17.25,k:0.7}
      ]},
      tagAnzahl:{}, plaene:{}, verlauf:{}},
    geraete:[{typ:"wm",name:"Bunt 40°",icon:"🌈",kwh:0.7,dauer:3,von:6,bis:22}],
    meineGeraete:[],routinen:[]
  };
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  try{
  await p.goto(APP);await p.waitForTimeout(1500);

  // --- 1) Reparatur beim Laden: beide Laeufe muessen in der Lern-Historie stehen ---
  let d=await lese(p);
  chk('Erledigt-Liste hat weiterhin 2 Durchgänge', d.erledigt.length===2, 'n='+d.erledigt.length);
  chk('Lern-Historie rekonstruiert BEIDE Läufe', d.verlauf.length===2,
      'n='+d.verlauf.length+' → '+JSON.stringify(d.verlauf.map(e=>e.s)));
  chk('Startzeiten stimmen (11:45 und 14:45)',
      d.verlauf.length===2 && d.verlauf[0].s===11.75 && d.verlauf[1].s===14.75,
      JSON.stringify(d.verlauf.map(e=>e.s)));

  // --- 2) Bilanz-Ansicht listet beide Laeufe ---
  await p.$eval('.tabbar .tab[data-tag="verlauf"]',e=>e.click()).catch(()=>{});
  await p.waitForTimeout(900);
  const zeilen=await p.$$eval('#verlauf-inhalt .vl-zeile, #verlauf-inhalt tr, #verlauf-inhalt .vl-row',
      els=>els.map(e=>e.textContent.replace(/\s+/g,' ').trim()));
  const buntZeilen=zeilen.filter(t=>/Bunt/.test(t));
  chk('Bilanz „Letzte Läufe" zeigt 2× Bunt 40°', buntZeilen.length===2,
      'gefunden '+buntZeilen.length+': '+JSON.stringify(buntZeilen));

  // --- 3) DREI Laeufe am selben Tag: eigene Seite mit eigenem Startzustand,
  //        weil addInitScript den Zustand bei jedem Neuladen zurücksetzen würde. ---
  const seed3=JSON.parse(JSON.stringify(seed));
  seed3.cfg.erledigt[today].push({name:"Bunt 40°",icon:"🌈",s:18,e:20,k:0.7});
  const p3=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p3.on('pageerror',e=>errs.push(e.message));
  await p3.clock.install({time:new Date(today+'T20:30:00Z')}); // 22:30 Berlin – auch der 3. Lauf ist vorbei
  stub(p3);
  await p3.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed3));
  await p3.goto(APP);await p3.waitForTimeout(1500);
  let d3=await lese(p3);
  chk('Drei Läufe am Tag: alle drei in der Lern-Historie', d3.verlauf.length===3,
      'n='+d3.verlauf.length+' → '+JSON.stringify(d3.verlauf.map(e=>e.s)));

  // --- 4) Rueckgaengig entfernt NUR den einen Durchgang ---
  await p3.$eval('#dash-curve',e=>e.click()).catch(()=>{});
  await p3.waitForTimeout(900);
  const undoKnoepfe=await p3.$$('[data-erl-undo]');
  chk('Rückgängig-Knöpfe vorhanden (3 Durchgänge)', undoKnoepfe.length===3, 'n='+undoKnoepfe.length);
  if(undoKnoepfe.length===3){
    await undoKnoepfe[0].click();            // ersten Durchgang zurücknehmen
    await p3.waitForTimeout(800);
    d3=await lese(p3);
    chk('Nach „zurück": nur noch 2 Durchgänge erledigt', d3.erledigt.length===2, 'n='+d3.erledigt.length);
    chk('Nach „zurück": Lern-Historie behält die anderen 2 Läufe', d3.verlauf.length===2,
        'n='+d3.verlauf.length+' → '+JSON.stringify(d3.verlauf.map(e=>e.s)));
    chk('Nach „zurück": genau der zurückgenommene Lauf fehlt (11:45 weg)',
        d3.verlauf.length===2 && !d3.verlauf.some(e=>e.s===11.75),
        JSON.stringify(d3.verlauf.map(e=>e.s)));
  }
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== v78: MEHRERE LÄUFE PRO GERÄT & TAG =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
