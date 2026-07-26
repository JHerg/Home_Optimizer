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
  const geraete=[
    {typ:"wm",name:"Waschmaschine Bunt 40°",icon:"🌈",kwh:0.9,dauer:2.5,von:6,bis:22},
    {typ:"wm",name:"Waschmaschine Handtücher 60°",icon:"🛁",kwh:1.1,dauer:3,von:6,bis:22},
    {typ:"gs",name:"Spülmaschine",icon:"🍽️",kwh:1.0,dauer:2,von:6,bis:22},
    {typ:"tr",name:"Trockner",icon:"🌀",kwh:2.4,dauer:1.5,von:6,bis:22}];
  const verlauf={};
  geraete.forEach((g,i)=>{const arr=[];const iv=[2,3,7,4][i];
    for(let k=1;k<=6;k++)arr.push({d:tagVor(k*iv),s:9+i%4,k:g.kwh,i:g.icon,du:g.dauer,son:g.kwh*0.8,spar:25});
    verlauf[g.name]=arr.reverse();});
  const seed={cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:false,tagAnzahl:{},plaene:{},erledigt:{},verlauf},
    geraete,meineGeraete:[],
    routinen:[{typ:"gs",name:"Spülmaschine",icon:"🍽️",kwh:1.0,dauer:2,von:6,bis:22,wochentag:3,rhythmus:1,aktiv:true},
              {typ:"wm",name:"Waschmaschine Bunt 40°",icon:"🌈",kwh:0.9,dauer:2.5,von:6,bis:22,wochentag:6,rhythmus:1,aktiv:true}]};
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  try{
  await p.goto(APP);await p.waitForTimeout(1900);

  // --- 1) Der Reiter heißt jetzt „Routinen" ---
  chk('Reiter-Beschriftung ist „Routinen"',
      (await p.$eval('.tabbar .tab[data-tag="woche"] span',e=>e.textContent.trim()))==='Routinen');
  await p.$eval('.tabbar .tab[data-tag="woche"]',e=>e.click()); await p.waitForTimeout(900);
  chk('Seitentitel ist „Routinen"', (await p.$eval('#titel',e=>e.textContent.trim()))==='Routinen');
  chk('Interner Schlüssel bleibt „woche"',
      (await p.$eval('.tabbar .tab.on',e=>e.dataset.tag))==='woche');

  // --- 2) Kein Sonnen-Ausblick mehr im Reiter ---
  chk('Ausblick ist aus dem Reiter verschwunden', (await p.$$('#karte-woche .wa-strip')).length===0);
  chk('Auch kein „Bester Sonnentag"-Kasten', (await p.$$('#karte-woche .wa-best')).length===0);

  // --- 3) Zwei Klappgruppen mit Anzahl ---
  const grp=await p.$$eval('#karte-woche details.rgrp',els=>els.map(d=>({t:d.querySelector('summary').textContent.trim(),offen:d.open})));
  chk('Zwei Gruppen vorhanden', grp.length===2, JSON.stringify(grp.map(g=>g.t)));
  chk('Routinen offen, Rhythmen zugeklappt', grp[0]&&grp[0].offen===true&&grp[1]&&grp[1].offen===false, JSON.stringify(grp));
  chk('Anzahl steht im Kopf (2 Routinen)', /\(2\)/.test(grp[0].t), grp[0].t);
  chk('Anzahl steht im Kopf (2 Rhythmen)', /\(2\)/.test(grp[1].t), grp[1].t);

  // --- 4) Der wiederholte Satz steht nur noch EINMAL ---
  await p.$eval('#grp-rhythmen summary',e=>e.click()); await p.waitForTimeout(400);
  const proZeile=await p.$$eval('#rhythmus-liste .rh-note',els=>els.map(e=>e.textContent));
  chk('Kein Eintrag wiederholt „Vorschlag auf der Startseite"',
      !proZeile.some(t=>/Vorschlag auf der Startseite/.test(t)), JSON.stringify(proZeile));
  chk('Der Hinweis steht einmal über der Liste',
      /Vorschlag auf der Startseite/.test(await p.$eval('#grp-rhythmen .rgrp-hinweis',e=>e.textContent)));

  // --- 5) Großer Knopf ist einem Symbol gewichen ---
  chk('Kein großer „Als feste Routine übernehmen"-Knopf mehr', (await p.$$('.rh-uebernehmen')).length===0);
  const pins=await p.$$('#rhythmus-liste [data-uebernehmen]');
  chk('Stattdessen ein 📌 je Rhythmus', pins.length===2, 'n='+pins.length);
  chk('Das 📌 sitzt in der Kopfzeile',
      await p.$eval('#rhythmus-liste [data-uebernehmen]',e=>!!e.closest('.rh-head')));

  // --- 6) Vermutungen sind optisch als solche erkennbar ---
  const stil=await p.$eval('#rhythmus-liste .rh-block',e=>getComputedStyle(e).borderStyle);
  chk('Rhythmus-Einträge haben gestrichelten Rand', /dashed/.test(stil), stil);

  // --- 7) Namen haben Vorrang vor den Etiketten ---
  const breiten=await p.$eval('#routine-liste .rh-block',e=>({
    nm:e.querySelector('.rh-nm').getBoundingClientRect().width,
    bd:e.querySelector('.rh-badge').getBoundingClientRect().width}));
  chk('Name ist breiter als das Etikett', breiten.nm>breiten.bd,
      'Name '+Math.round(breiten.nm)+'px vs Etikett '+Math.round(breiten.bd)+'px');

  // --- 8) Nichts läuft rechts aus dem Bild ---
  const ueber=await p.evaluate(()=>{
    const w=document.documentElement.clientWidth; let max=0;
    document.querySelectorAll('#karte-woche .rh-block, #karte-woche .rgrp-inhalt').forEach(e=>{
      const r=e.getBoundingClientRect(); if(r.right>max)max=r.right; });
    return {max:Math.round(max), w};});
  chk('Kein Überlauf nach rechts', ueber.max<=ueber.w+1, 'rechts '+ueber.max+' > Breite '+ueber.w);

  // --- 9) Die gerettete Grafik-Erklärung steht am neuen Ort ---
  await p.$eval('.tabbar .tab[data-tag="heute"]',e=>e.click()); await p.waitForTimeout(800);
  await p.$eval('#dash-aus-btn',e=>e.click()); await p.waitForTimeout(400);
  chk('Erklärung zur Grafik ist beim Ausblick gelandet',
      /Globalstrahlung/.test(await p.$eval('.dash-aus-info',e=>e.textContent)));
  chk('Auch der Hinweis zu den Börsenpreisen',   // Wortlaut seit v83 umgestellt
      /keine Börsenpreise/.test(await p.$eval('.dash-aus-info',e=>e.textContent)));

  // --- 10) Die Punkte-Legende ist gerettet ---
  await p.$eval('.tabbar .tab[data-tag="woche"]',e=>e.click()); await p.waitForTimeout(800);
  await p.$eval('#grp-routinen .rgrp-info summary',e=>e.click()); await p.waitForTimeout(300);
  chk('Punkte-Legende steckt im ⓘ der Routinen',
      /So liest du die Punkte/.test(await p.$eval('#grp-routinen .rgrp-info-tx',e=>e.textContent)));
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,160));

  console.log('\n===== v82: REITER „ROUTINEN" =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
