/* v86: Die Bilanz gibt sich als Schätzung zu erkennen – ohne dass sich eine Zahl ändert. */
const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tagVor=n=>new Date(Date.now()-n*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"result":{}}'}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const t=[];for(let i=0;i<7;i++)t.push(new Date(Date.now()+i*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10));
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:t,shortwave_radiation_sum:[220,70,120,170,205,185,250],sunshine_duration:[40000,9000,20000,30000,38000,34000,46000],daylight_duration:[54000,54000,54000,54000,54000,54000,54000],precipitation_probability_max:[5,80,55,20,10,15,0],temperature_2m_max:[24,18,20,22,25,24,27]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(((h>=5&&h<=20)?bell(h):0)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:80});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
const errs=[];
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T09:00:00Z')});
  stub(p);
  const verlauf={"Waschmaschine":[
    {d:tagVor(1),s:11,k:2.0,i:"🌀",du:2,son:1.6,spar:48},
    {d:today,   s:10,k:2.0,i:"🌀",du:2,son:1.5,spar:45}]};
  const seed={cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,
      wischHintWeg:true,gl_profil_an:false,tagAnzahl:{},plaene:{},erledigt:{},verlauf},
    geraete:[{typ:"wm",name:"Waschmaschine",icon:"🌀",kwh:2,dauer:2,von:6,bis:22}],
    meineGeraete:[],routinen:[]};
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  try{
  await p.goto(APP); await p.waitForTimeout(1800);

  // --- 1) Rückblick auf gestern kennzeichnet die Zahl ---
  const rb=await p.$eval('#rueckblick-banner',e=>e.textContent.trim()).catch(()=>'');
  chk('Rückblick „Dein Gestern" zeigt ≈ vor dem Betrag', /≈\s*\d+,\d{2} €/.test(rb), rb.slice(0,110));

  // --- 2) Bilanz: die große Zahl ---
  await p.$eval('.tabbar .tab[data-tag="verlauf"]',e=>e.click()); await p.waitForTimeout(1600);
  chk('Vor der großen Zahl steht ein ≈', (await p.$eval('.wk-hero .wk-approx',e=>e.textContent.trim()))==='≈');

  // --- 2b) v87: vorn stehen die Sonnen-kWh, der Euro sitzt in einer Kachel ---
  const gross=await p.$eval('.wk-hero .wk-gross',e=>e.textContent.trim());
  chk('Die große Zahl ist jetzt eine kWh-Angabe', /^\d+(,\d+)? kWh$/.test(gross), gross);
  const lbl=await p.$eval('.wk-hero-lbl',e=>e.textContent.trim());
  chk('Beschriftung sagt „aus eigener Sonne gedeckt"', /^aus eigener Sonne gedeckt/.test(lbl), lbl);
  chk('Kein Euro-Betrag mehr im Kopf',
      !/€/.test(await p.$eval('.wk-hero',e=>e.textContent)), await p.$eval('.wk-hero',e=>e.textContent.trim()));
  const quote=await p.$eval('.wk-hero-quote',e=>e.textContent.trim()).catch(()=>'');
  chk('Der Deckungsanteil steht als Nebenzeile', /^\d+ % dessen/.test(quote), quote);
  const euroK=await p.$eval('.wk-kachel .wk-euro',e=>e.textContent.trim());
  chk('Der Euro-Betrag sitzt jetzt in einer Kachel', /^\d+,\d{2} €$/.test(euroK), euroK);
  chk('Auch dort steht ein ≈ davor', (await p.$eval('.wk-k-ca .wk-approx',e=>e.textContent.trim()))==='≈');
  chk('Die Kachel ist als geschätzt beschriftet',
      /geschätzt gespart/.test(await p.$eval('.wk-kachel .wk-k-tx',e=>e.textContent)));

  // --- 3) Die Animation läuft weiter (das ≈ darf sie nicht zerstören) ---
  chk('Die Euro-Zahl bleibt sauber (ohne ≈ im Element)', /^\d+,\d{2} €$/.test(euroK), euroK);
  // Neu laden und SOFORT lesen: waehrend der Animation muss ein kleinerer Wert stehen
  await p.reload(); await p.waitForTimeout(1500);
  await p.$eval('.tabbar .tab[data-tag="verlauf"]',e=>e.click());
  await p.waitForTimeout(120);
  const frueh=await p.$eval('.wk-hero .wk-gross',e=>e.textContent.trim()).catch(()=>null);
  const fruehE=await p.$eval('.wk-kachel .wk-euro',e=>e.textContent.trim()).catch(()=>null);
  await p.waitForTimeout(1400);
  const spaet=await p.$eval('.wk-hero .wk-gross',e=>e.textContent.trim()).catch(()=>null);
  const spaetE=await p.$eval('.wk-kachel .wk-euro',e=>e.textContent.trim()).catch(()=>null);
  chk('Die große kWh-Zahl zählt hoch (Animation intakt)', frueh!==null&&spaet!==null&&frueh!==spaet,
      'früh "'+frueh+'" → spät "'+spaet+'"');
  chk('Der Euro in der Kachel zählt weiterhin hoch', fruehE!==null&&spaetE!==null&&fruehE!==spaetE,
      'früh "'+fruehE+'" → spät "'+spaetE+'"');

  // --- 4) Der Erklärsatz benennt die Grenzen ---
  const hw=await p.$eval('.wk-hinweis',e=>e.textContent);
  chk('Erklärsatz führt mit „Schätzung, keine Messung"', /Eine Schätzung, keine Messung/.test(hw), hw.slice(0,60));
  chk('… nennt die Prognose als Quelle', /Prognose/.test(hw));
  chk('… nennt nicht eingetragene Verbraucher', /nicht eingetragen/.test(hw));
  chk('… sagt, dass die Einspeisevergütung fehlt', /Einspeisevergütung ist nicht abgezogen/.test(hw));

  // --- 5) Teilen-Text und CSV ziehen mit ---
  const teilen=await p.$eval('.wk-teilen',e=>e.textContent.trim()).catch(()=>'');
  chk('Teilen-Text trägt das ≈', /≈\s*\d+,\d{2} €/.test(teilen), teilen);
  const kopf=await p.evaluate(()=>{
    let inhalt=null; const alt=URL.createObjectURL;
    URL.createObjectURL=(bl)=>{ inhalt=bl; return alt(bl); };
    const btn=document.getElementById('btn-csv'); if(!btn)return null;
    btn.click();
    return new Promise(res=>setTimeout(()=>{ if(!inhalt){res(null);return;} inhalt.text().then(t=>res(t.split("\n")[0])); },300));
  });
  // Seit v88 ist die Ersparnis-Spalte in die zwei Hebel aufgeteilt.
  chk('CSV-Kopfzeile kennzeichnet alle Schätzspalten',
      kopf!==null && /kWh aus Sonne \(geschätzt\)/.test(kopf)
      && /Ersparnis Sonne ct \(geschätzt\)/.test(kopf)
      && /Ersparnis Netzstunde ct \(geschätzt\)/.test(kopf), kopf);

  // --- 6) Nichts läuft rechts aus dem Bild ---
  const ueber=await p.evaluate(()=>{
    const w=document.documentElement.clientWidth;
    const r=document.querySelector('.wk-hero').getBoundingClientRect();
    return {rechts:Math.round(r.right), w};});
  chk('Die Kachel bleibt im Bild', ueber.rechts<=ueber.w+1, 'rechts '+ueber.rechts+' / '+ueber.w);
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,160));

  console.log('\n===== v86/87: BILANZ ALS SCHÄTZUNG · SONNEN-kWh VORN =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
