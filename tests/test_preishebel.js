/* v88: Der zweite Hebel – der Preisvorteil der gewaehlten Netzstunde – wird gezaehlt.
   Bewusst OHNE Sonne (Einstrahlung 0), damit ausschliesslich der Preis wirkt. */
const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
// teuer morgens/abends, guenstig mittags (EUR/MWh)
const PREIS=[95,90,88,85,88,110,150,190,210,160,110,70,45,40,55,90,140,200,230,240,200,160,130,105];
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"result":{}}'}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const t=[];for(let i=0;i<7;i++)t.push(new Date(Date.now()+i*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10));
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:t,shortwave_radiation_sum:[10,10,10,10,10,10,10],sunshine_duration:[0,0,0,0,0,0,0],daylight_duration:[54000,54000,54000,54000,54000,54000,54000],precipitation_probability_max:[80,80,80,80,80,80,80],temperature_2m_max:[18,18,18,18,18,18,18]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(0);}});
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];
    for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:PREIS[h%24]});
    r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
const errs=[];
async function lauf(b,startStunde,tarif){
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T21:30:00Z')});   // 23:30 Berlin: alles vorbei
  stub(p);
  const g={typ:"wm",name:"Waschmaschine",icon:"🌀",kwh:2,dauer:1,von:6,bis:22};
  const seed={cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:20,schwelle:0,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif,festpreis:0.32,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:false,
      tagAnzahl:{[today]:{"Waschmaschine":1}},
      plaene:{[today]:[{key:"wm|Waschmaschine",run:0,start:startStunde,fix:true}]},
      erledigt:{},verlauf:{}},
    geraete:[g],meineGeraete:[],routinen:[]};
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  await p.goto(APP); await p.waitForTimeout(2200);
  if(await p.$eval('#sheet-faellig',e=>e.classList.contains('offen')).catch(()=>false)){
    await p.evaluate(()=>{document.querySelectorAll('#sheet-faellig input[type=checkbox]').forEach(c=>{if(!c.checked)c.click();});});
    await p.waitForTimeout(300);
    await p.$eval('#faellig-ok',e=>e.click()); await p.waitForTimeout(1200);
  }
  const e=await p.evaluate(()=>{
    const v=(JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg.verlauf||{})["Waschmaschine"]||[];
    return v[0]||null;});
  await p.$eval('.tabbar .tab[data-tag="verlauf"]',e2=>e2.click()); await p.waitForTimeout(1600);
  const hebel=await p.$eval('.wk-hebel',x=>x.textContent.trim()).catch(()=>null);
  const gesamt=await p.$eval('.wk-kachel .wk-euro',x=>x.textContent.trim()).catch(()=>null);
  await p.close();
  return {e,hebel,gesamt};
}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  try{
  // --- 1) Guenstige Mittagsstunde (13 Uhr, 40 EUR/MWh) – ohne jede Sonne ---
  const guenstig=await lauf(b,13,"dynamisch");
  chk('Lauf ohne Sonne wird trotzdem bewertet', guenstig.e!==null, JSON.stringify(guenstig.e));
  chk('Ohne Sonne ist der Sonnen-Hebel null', guenstig.e && (guenstig.e.son||0)<0.01, 'son='+(guenstig.e&&guenstig.e.son));
  chk('Frueher stand hier NICHTS – jetzt ein Preisvorteil',
      guenstig.e && guenstig.e.pspar>0, 'pspar='+(guenstig.e&&guenstig.e.pspar));
  console.log('   13 Uhr (guenstig): pspar =', guenstig.e&&guenstig.e.pspar, 'ct');

  // --- 2) Teure Abendstunde (20 Uhr, 240 EUR/MWh) ---
  const teuer=await lauf(b,20,"dynamisch");
  chk('Teure Stunde ergibt einen negativen Wert – die App beschoenigt nicht',
      teuer.e && teuer.e.pspar<0, 'pspar='+(teuer.e&&teuer.e.pspar));
  console.log('   20 Uhr (teuer):    pspar =', teuer.e&&teuer.e.pspar, 'ct');
  chk('Der guenstige Lauf steht deutlich besser da als der teure',
      guenstig.e.pspar - teuer.e.pspar > 20,
      'Unterschied '+Math.round(guenstig.e.pspar-teuer.e.pspar)+' ct auf 2 kWh');

  // --- 3) Die Bilanz weist beide Hebel getrennt aus ---
  chk('Bilanz zeigt die Aufschluesselung', guenstig.hebel!==null, String(guenstig.hebel));
  chk('… benennt den Sonnen-Hebel', /eigene Sonne statt Netz/.test(guenstig.hebel||''), guenstig.hebel);
  chk('… benennt den Preis-Hebel', /Netzstunde/.test(guenstig.hebel||''), guenstig.hebel);
  chk('Bei teurer Stunde heisst es „teurere Netzstunde"',
      /teurere Netzstunde/.test(teuer.hebel||''), teuer.hebel);

  // --- 4) Fester Tarif: jede Stunde kostet gleich – kein Preis-Hebel, keine Zeile ---
  const fest=await lauf(b,13,"fest");
  chk('Fester Tarif erzeugt keinen Preisvorteil',
      fest.e && !fest.e.pspar, 'pspar='+(fest.e&&fest.e.pspar));
  chk('Bei festem Tarif bleibt die Aufschluesselung weg', fest.hebel===null, String(fest.hebel));
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,160));

  console.log('\n===== v88: DER PREIS-HEBEL WIRD GEZAEHLT =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
