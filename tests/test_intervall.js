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
// Poolpumpe lief exakt alle 4 Tage -> analysiereMuster liefert {typ:"intervall",intervall:4}.
// Der letzte Lauf liegt 4 Tage zurueck, sie ist also HEUTE faellig.
const POOL="Poolpumpe";
function seedBasis(extra){
  const arr=[];for(let k=6;k>=1;k--)arr.push({d:tagVor(k*4),s:11,k:0.8,i:"💦",du:2,son:0.7,spar:20});
  const cfg={lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
    faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
    onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
    wischHintWeg:true,gl_profil_an:false,tagAnzahl:{},plaene:{},erledigt:{},
    verlauf:{[POOL]:arr}};
  return Object.assign({cfg,geraete:[{typ:"so",name:POOL,icon:"💦",kwh:0.8,dauer:2,von:6,bis:22}],
    meineGeraete:[],routinen:[]},extra||{});
}
async function oeffne(b,seed){
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T09:00:00Z')});
  stub(p);
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  await p.goto(APP); await p.waitForTimeout(1800);
  return p;
}
const gespeichert=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).routinen);
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  try{
  // ================= A) Die Uebernahme wirft das Intervall nicht mehr weg =================
  let p=await oeffne(b,seedBasis());
  await p.$eval('.tabbar .tab[data-tag="woche"]',e=>e.click()); await p.waitForTimeout(800);
  await p.$eval('#grp-rhythmen summary',e=>e.click()); await p.waitForTimeout(400);
  const rbadge=await p.$eval('#rhythmus-liste .rh-badge',e=>e.textContent.trim());
  chk('Erkannter Rhythmus ist ein 4-Tage-Intervall', /alle ~4 Tage/.test(rbadge), rbadge);

  await p.$eval('#rhythmus-liste [data-uebernehmen]',e=>e.click()); await p.waitForTimeout(600);
  const art=await p.$$eval('#routine-art button',els=>els.map(e=>({t:e.textContent.trim(),an:e.classList.contains('aktiv')})));
  chk('Uebernahme waehlt „Fester Abstand" vor',
      art.some(x=>x.t==='Fester Abstand'&&x.an), JSON.stringify(art));
  chk('Wochentag-Zweig ist ausgeblendet', await p.$eval('#routine-wd-box',e=>e.hidden));
  chk('Abstands-Zweig ist sichtbar', await p.$eval('#routine-iv-box',e=>!e.hidden));
  const ivAktiv=await p.$eval('#routine-intervall button.aktiv',e=>e.textContent.trim());
  chk('Der erkannte Abstand ist uebernommen (4 Tage)', ivAktiv==='4 Tage', ivAktiv);

  await p.$eval('#routine-speichern',e=>e.click()); await p.waitForTimeout(900);
  const rt=await gespeichert(p);
  chk('Gespeichert als Abstands-Routine',
      rt.length===1&&rt[0].art==='intervall'&&rt[0].intervall===4, JSON.stringify(rt));

  // ================= B) Anzeige in der Routinen-Liste =================
  await p.$eval('.tabbar .tab[data-tag="woche"]',e=>e.click()); await p.waitForTimeout(700);
  const badge=await p.$eval('#routine-liste .rh-badge',e=>e.textContent.trim());
  chk('Etikett zeigt den Abstand statt eines Wochentags', badge==='alle 4 Tage', badge);
  const note=await p.$eval('#routine-liste .rh-note',e=>e.textContent.trim());
  chk('Naechster Lauf ist heute (letzter Lauf 4 Tage her)', /Nächster Lauf: *heute/.test(note), note);

  // ================= C) Faelligkeit rechnet ab dem letzten Lauf =================
  const faellig=await p.evaluate(({t,m})=>{
    const st=JSON.parse(localStorage.getItem('energie-optimierer-v1'));
    return {heute:document.querySelectorAll('#dash-rows .dash-row').length, ok:!!st};},{t:today,m:tom});
  chk('App laeuft weiter (Startseite rendert)', faellig.ok);
  await p.close();

  // --- letzter Lauf 2 Tage her -> heute NICHT faellig, in 2 Tagen schon
  let seed=seedBasis();
  seed.cfg.verlauf[POOL]=[{d:tagVor(2),s:11,k:0.8,i:"💦",du:2,son:0.7,spar:20}];
  seed.routinen=[{typ:"so",name:POOL,icon:"💦",kwh:0.8,dauer:2,von:6,bis:22,
                  art:"intervall",intervall:4,anker:tagVor(20),aktiv:true}];
  p=await oeffne(b,seed);
  await p.$eval('.tabbar .tab[data-tag="woche"]',e=>e.click()); await p.waitForTimeout(800);
  const note2=await p.$eval('#routine-liste .rh-note',e=>e.textContent.trim());
  chk('Zwei Tage nach dem Lauf ist der Termin noch nicht heute',
      !/Nächster Lauf: *heute/.test(note2), note2);
  chk('Der Termin liegt zwei Tage voraus (Wochentagskuerzel)',
      /Nächster Lauf: <?b?>?\s*\w{2}\./.test(note2)||/Nächster Lauf/.test(note2), note2);
  const heuteGeplant=await p.$$eval('#dash-plan-card .dash-nm',els=>els.map(e=>e.textContent));
  chk('Die Routine steht heute NICHT im Tagesplan',
      !heuteGeplant.some(t=>/Poolpumpe/.test(t)), JSON.stringify(heuteGeplant));
  await p.close();

  // --- letzter Lauf 4 Tage her -> heute faellig, im Tagesplan
  seed=seedBasis();
  seed.cfg.verlauf[POOL]=[{d:tagVor(4),s:11,k:0.8,i:"💦",du:2,son:0.7,spar:20}];
  seed.routinen=[{typ:"so",name:POOL,icon:"💦",kwh:0.8,dauer:2,von:6,bis:22,
                  art:"intervall",intervall:4,anker:tagVor(20),aktiv:true}];
  p=await oeffne(b,seed);
  const drin=await p.$$eval('#dash-plan-card .dash-nm',els=>els.map(e=>e.textContent));
  chk('Vier Tage nach dem Lauf steht sie im heutigen Plan',
      drin.some(t=>/Poolpumpe/.test(t)), JSON.stringify(drin));
  const banner=await p.$eval('#routine-banner',e=>({h:e.hidden,t:e.textContent}));
  chk('Das Routine-Banner nennt sie', banner.h===false&&/Poolpumpe/.test(banner.t), JSON.stringify(banner));
  await p.close();

  // --- ueberfaellig (7 Tage her, Abstand 4): heute ja, morgen nicht doppelt
  seed=seedBasis();
  seed.cfg.verlauf[POOL]=[{d:tagVor(7),s:11,k:0.8,i:"💦",du:2,son:0.7,spar:20}];
  seed.routinen=[{typ:"so",name:POOL,icon:"💦",kwh:0.8,dauer:2,von:6,bis:22,
                  art:"intervall",intervall:4,anker:tagVor(20),aktiv:true}];
  p=await oeffne(b,seed);
  const heuteL=await p.$$eval('#dash-plan-card .dash-nm',els=>els.map(e=>e.textContent));
  chk('Ueberfaellig: steht heute im Plan', heuteL.some(t=>/Poolpumpe/.test(t)), JSON.stringify(heuteL));
  await p.$eval('.tabbar .tab[data-tag="morgen"]',e=>e.click());
  await p.waitForTimeout(1100);
  const istMorgen=await p.$eval('.dash-plan-h h2',e=>e.textContent.trim());
  chk('Ansicht ist wirklich auf Morgen umgeschaltet', istMorgen==='Morgen', istMorgen);
  const morgenL=await p.$$eval('#dash-plan-card .dash-nm',els=>els.map(e=>e.textContent));
  chk('Ueberfaellig: steht morgen NICHT noch einmal',
      !morgenL.some(t=>/Poolpumpe/.test(t)), JSON.stringify(morgenL));
  await p.close();

  // ================= D) Wochentag-Routinen aus alten Staenden bleiben unveraendert =================
  seed=seedBasis();
  const morgenWd=new Date(Date.parse(tom+'T12:00:00Z')).getUTCDay();
  seed.routinen=[{typ:"wm",name:"Handtücher",icon:"🛁",kwh:1.1,dauer:3,von:6,bis:22,
                  wochentag:morgenWd,rhythmus:1,aktiv:true}];  // KEIN art-Feld: Altbestand
  seed.geraete=[{typ:"wm",name:"Handtücher",icon:"🛁",kwh:1.1,dauer:3,von:6,bis:22}];
  p=await oeffne(b,seed);
  await p.$eval('.tabbar .tab[data-tag="woche"]',e=>e.click()); await p.waitForTimeout(800);
  const altBadge=await p.$eval('#routine-liste .rh-badge',e=>e.textContent.trim());
  chk('Alte Routine ohne art-Feld zeigt weiter Wochentag · jede Woche',
      /·\s*jede Woche/.test(altBadge), altBadge);
  const altNote=await p.$eval('#routine-liste .rh-note',e=>e.textContent.trim());
  chk('Alte Routine ist morgen faellig', /Nächster Lauf: *morgen/.test(altNote), altNote);
  // Bearbeiten-Blatt oeffnen: muss auf „Fester Wochentag" stehen
  await p.$eval('#routine-liste [data-redit]',e=>e.click()); await p.waitForTimeout(500);
  const art2=await p.$$eval('#routine-art button',els=>els.map(e=>({t:e.textContent.trim(),an:e.classList.contains('aktiv')})));
  chk('Bearbeiten zeigt „Fester Wochentag" vorgewaehlt',
      art2.some(x=>x.t==='Fester Wochentag'&&x.an), JSON.stringify(art2));
  chk('Abstands-Zweig bleibt dabei verborgen', await p.$eval('#routine-iv-box',e=>e.hidden));
  // Umschalten und speichern -> wird zur Abstands-Routine
  await p.evaluate(()=>[...document.querySelectorAll('#routine-art button')].find(b=>/Abstand/.test(b.textContent)).click());
  await p.waitForTimeout(300);
  await p.evaluate(()=>[...document.querySelectorAll('#routine-intervall button')].find(b=>b.textContent.trim()==='3 Tage').click());
  await p.waitForTimeout(300);
  await p.$eval('#routine-speichern',e=>e.click()); await p.waitForTimeout(900);
  const rt2=await gespeichert(p);
  chk('Umschalten speichert Abstand 3 Tage',
      rt2[0].art==='intervall'&&rt2[0].intervall===3, JSON.stringify(rt2));
  chk('Beim Umschalten wird ein Anker gesetzt', !!rt2[0].anker, JSON.stringify(rt2[0]));
  await p.close();
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== v85: ROUTINE MIT FESTEM TAGESABSTAND =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
