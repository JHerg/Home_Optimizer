const path=require('path');const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{lat:"50.98",lon:"6.93",display_name:"Altbaumburgweg 2, 50739 Köln, Deutschland"}])}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({result:{}})}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:[today],shortwave_radiation_sum:[220],sunshine_duration:[40000],daylight_duration:[54000],precipitation_probability_max:[10],temperature_2m_max:[24]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(bell(h)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:80});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T06:00:00Z')});stub(p);
  await p.goto(APP);await p.evaluate(()=>localStorage.clear());await p.goto(APP);await p.waitForTimeout(700);
  try{
  // Onboarding
  await p.fill('#wk-adresse','Köln');await p.$eval('#wk-suchen',e=>e.click());await p.waitForTimeout(1200);
  await p.$eval('#wk-weiter',e=>e.click()).catch(()=>{});await p.waitForTimeout(500);

  // Erststart: 6 Gruppen, Basis OFFEN, Rest zu
  chk('6 Schubladen gesamt',await p.$$eval('#sheet-einrichten details.egrp',e=>e.length)===6,'n='+await p.$$eval('#sheet-einrichten details.egrp',e=>e.length));
  chk('Erststart: Basis-Gruppen offen',await p.evaluate(()=>['grp-adresse','grp-anlage','grp-tarif'].every(id=>document.getElementById(id).open)));
  chk('Erststart: optionale Gruppen zu',await p.evaluate(()=>['grp-haushalt','grp-genau','grp-daten'].every(id=>!document.getElementById(id).open)));
  chk('kWp-Feld jetzt in Dach & Anlage',await p.evaluate(()=>document.getElementById('grp-anlage').contains(document.getElementById('f-kwp'))));
  chk('Kein manueller Faktor mehr',!(await p.$('#f-faktor')));
  await p.$eval('#btn-fertig',e=>e.click());await p.waitForTimeout(1200);

  // Zweites Öffnen: alles zu + Status-Köpfe
  await p.$eval('#btn-einrichten',e=>e.click());await p.waitForTimeout(400);
  chk('Nach „Fertig": ALLE Gruppen zu',await p.$$eval('#sheet-einrichten details.egrp',e=>e.every(d=>!d.open)));
  chk('Status Adresse zeigt Ort',/Köln/.test(await p.$eval('#eg-st-adresse',e=>e.textContent)),await p.$eval('#eg-st-adresse',e=>e.textContent));
  chk('Status Anlage: Richtung+Grad+kWp',/Süd.*25.*7,6 kWp/.test(await p.$eval('#eg-st-anlage',e=>e.textContent)),await p.$eval('#eg-st-anlage',e=>e.textContent));
  chk('Status Tarif',/dynamisch.*18/.test(await p.$eval('#eg-st-tarif',e=>e.textContent)),await p.$eval('#eg-st-tarif',e=>e.textContent));

  // Kalibrier-Transparenz: 2 Tage eintragen
  await p.$eval('#grp-genau summary',e=>e.click());await p.waitForTimeout(200);
  await p.evaluate(()=>{document.getElementById('f-kalib-real').value='45';document.getElementById('btn-kalib').click();});
  await p.waitForTimeout(400);
  chk('Transparenz-Box erscheint',!(await p.$eval('#kalib-transparenz',e=>e.hidden)));
  const rects=await p.$$eval('#kalib-chart rect',e=>e.length);
  chk('Grafik: Doppelbalken (2 je Tag)',rects===2,'rects='+rects);
  const st=await p.$eval('#kalib-status',e=>e.textContent);
  chk('Faktor-Zeile vorhanden',/Faktor/.test(st),st.slice(0,70));
  const liste=await p.$eval('#kalib-liste',e=>e.textContent);
  chk('Detail-Liste: Prognose → echt',/→.*45,0 kWh/.test(liste),liste.slice(0,60));
  // Tag löschen -> Box verschwindet, Faktor zurück auf 1
  await p.$eval('#kalib-liste .kalib-del',e=>e.click());await p.waitForTimeout(400);
  chk('Tag löschen: Box wieder weg',await p.$eval('#kalib-transparenz',e=>e.hidden));
  const fak=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return s.cfg.faktor;});
  chk('Faktor nach Löschen zurückgesetzt',fak===1,'faktor='+fak);
  await p.evaluate(()=>{document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('offen'));document.getElementById('schleier').classList.remove('offen');});

  // Bilanz: 5 Läufe erzeugen -> 3 sichtbar + Aufklapper mit 2
  await p.evaluate(t=>{const k='energie-optimierer-v1';const s=JSON.parse(localStorage.getItem(k));
    s.cfg.verlauf={'Waschmaschine':[]};
    for(let i=1;i<=5;i++){const d=new Date(Date.parse(t+'T12:00:00Z')-i*86400000).toISOString().slice(0,10);
      s.cfg.verlauf['Waschmaschine'].push({d,s:10,k:0.9,i:'🌀',du:3,son:0.8,spar:20});}
    localStorage.setItem(k,JSON.stringify(s));},today);
  await p.goto(APP);await p.waitForTimeout(1000);
  await p.evaluate(()=>{document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('offen'));document.getElementById('schleier').classList.remove('offen');});
  await p.$eval('.tabbar .tab[data-tag="verlauf"]',e=>e.click());await p.waitForTimeout(600);
  const sichtbar=await p.$$eval('.vl-tab-wrap:not(details .vl-tab-wrap) tbody tr',e=>e.length).catch(()=>-1);
  chk('Bilanz: 3 Läufe sichtbar',sichtbar===3,'sichtbar='+sichtbar);
  const mehr=await p.$eval('.vl-mehr summary',e=>e.textContent).catch(()=>'');
  chk('Bilanz: Aufklapper „2 weitere Läufe"',/2 weitere/.test(mehr),mehr);
  await p.$eval('.vl-mehr summary',e=>e.click());await p.waitForTimeout(200);
  const archiv=await p.$$eval('.vl-mehr tbody tr',e=>e.length);
  chk('Aufklapper enthält Rest',archiv===2,'archiv='+archiv);
  chk('CSV-Knopf weiterhin da',!!(await p.$('#btn-csv')));
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== v69: BASIS-SCHUBLADEN + KALIB-TRANSPARENZ + BILANZ-ARCHIV =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
})();
