/* Backup sichern und wiederherstellen – der Weg mit dem hoechsten Einsatz:
   Geht er kaputt, verliert man alle Geraete, Routinen und die gelernte Historie.
   Bis v94 war er von keinem Test beruehrt. */
const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tagPlus=n=>new Date(Date.now()+n*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tagVor=n=>new Date(Date.now()-n*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"result":{}}'}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const t=[];for(let i=0;i<7;i++)t.push(tagPlus(i));
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:t,shortwave_radiation_sum:[220,70,120,170,205,185,250],sunshine_duration:[40000,9000,20000,30000,38000,34000,46000],daylight_duration:[54000,54000,54000,54000,54000,54000,54000],precipitation_probability_max:[5,80,55,20,10,15,0],temperature_2m_max:[24,18,20,22,25,24,27]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(((h>=5&&h<=20)?bell(h):0)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:80});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
const errs=[];
const ORIGINAL={
  cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:400,
    faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:true,akku_kwh:12,
    onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
    wischHintWeg:true,gl_profil_an:true,tagAnzahl:{},plaene:{},erledigt:{},
    verlauf:{"Waschmaschine":[{d:tagVor(3),s:11,k:1.2,i:"🌈",du:2,son:1.0,spar:32,pspar:9},
                              {d:tagVor(9),s:10,k:1.2,i:"🌈",du:2,son:0.9,spar:29}]}},
  geraete:[{typ:"wm",name:"Waschmaschine",icon:"🌈",kwh:1.2,dauer:2.5,von:6,bis:22},
           {typ:"gs",name:"Spülmaschine",icon:"🍽️",kwh:1.0,dauer:2,von:6,bis:23}],
  meineGeraete:[{typ:"wm",icon:"🛏️",name:"Bettwäsche 60°",kwh:1.1,dauer:3,von:6,bis:22}],
  routinen:[{typ:"wm",name:"Waschmaschine",icon:"🌈",kwh:1.2,dauer:2.5,von:6,bis:22,
             art:"intervall",intervall:4,anker:tagVor(20),aktiv:true}]};
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  let p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T09:00:00Z')});
  stub(p);
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(ORIGINAL));
  try{
  await p.goto(APP); await p.waitForTimeout(1900);

  // --- 1) Sichern: die Datei entsteht und enthaelt alles ---
  const json=await p.evaluate(()=>{
    let blob=null; const alt=URL.createObjectURL;
    URL.createObjectURL=b=>{ blob=b; return alt(b); };
    document.getElementById('btn-einrichten').click();
    return new Promise(res=>setTimeout(()=>{
      const g=document.getElementById('grp-daten'); if(g)g.open=true;
      const btn=document.getElementById('btn-backup-sichern');
      if(!btn){res(null);return;}
      btn.click();
      setTimeout(()=>{ if(!blob){res(null);return;} blob.text().then(res); },400);
    },700));});
  chk('Backup-Datei entsteht', !!json, json?('Länge '+json.length):'keine Datei');
  let j=null; try{ j=JSON.parse(json); }catch(_){}
  chk('… ist gültiges JSON', !!j);
  chk('… trägt Kennung und Version', j && j.app==="energie-optimierer" && j.version>0,
      j?JSON.stringify({app:j.app,version:j.version}):'-');
  chk('… enthält beide Geräte', j && j.geraete.length===2, j?('n='+j.geraete.length):'-');
  // Die App legt beim ersten Start eigene Vorlagen an (seedPresets) – die Anzahl
  // ist daher groesser als eins. Geprueft wird, dass MEIN Eintrag dabei ist.
  chk('… enthält „Meine Geräte"',
      j && j.meineGeraete.some(g=>g.name==='Bettwäsche 60°'),
      j?JSON.stringify(j.meineGeraete.map(g=>g.name)):'-');
  chk('… enthält die Routine mit ihrem Abstand',
      j && j.routinen.length===1 && j.routinen[0].art==='intervall' && j.routinen[0].intervall===4,
      j?JSON.stringify(j.routinen):'-');
  chk('… enthält die gelernte Historie',
      j && j.cfg.verlauf && j.cfg.verlauf["Waschmaschine"] && j.cfg.verlauf["Waschmaschine"].length===2,
      j?JSON.stringify(Object.keys(j.cfg.verlauf||{})):'-');
  chk('… merkt sich das Backup-Datum',
      await p.evaluate(()=>!!JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg.letztesBackup));

  await p.close();

  /* --- 2) NEUE Seite mit ANDEREM Startzustand ---
     Bewusst eine zweite Seite: addInitScript saet bei JEDEM Laden neu, ein
     Loeschen per localStorage waere nach dem naechsten goto() sofort wieder
     ueberschrieben – dann pruefte man die Wiederherstellung gar nicht. */
  p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T09:00:00Z')});
  stub(p);
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify({
    cfg:{lat:52.5,lon:13.4,adresse:"Berlin",kwp:1.0,neigung:30,azimut:90,aufschlag:22,schwelle:100,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"fest",festpreis:0.40,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:false,tagAnzahl:{},plaene:{},erledigt:{},verlauf:{}},
    geraete:[],meineGeraete:[],routinen:[]}));
  await p.goto(APP); await p.waitForTimeout(1700);
  const leer=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));
    return {g:s.geraete.length,r:s.routinen.length,kwp:s.cfg.kwp,adresse:s.cfg.adresse,
            laeufe:Object.keys(s.cfg.verlauf||{}).length};});
  chk('Zwischenschritt: fremder Startzustand (Berlin, 1 kWp, nichts drin)',
      leer.g===0&&leer.r===0&&leer.kwp===1&&leer.adresse==='Berlin'&&leer.laeufe===0, JSON.stringify(leer));

  // --- 3) Wiederherstellen ueber die echte Datei-Auswahl ---
  await p.$eval('#btn-einrichten',e=>e.click()); await p.waitForTimeout(600);
  await p.evaluate(()=>{const g=document.getElementById('grp-daten'); if(g)g.open=true;});
  await p.waitForTimeout(300);
  await p.setInputFiles('#backup-datei',{name:'backup.json',mimeType:'application/json',buffer:Buffer.from(json)});
  await p.waitForTimeout(900);
  // Rueckfrage bestaetigen
  const frage=await p.evaluate(()=>{const d=document.getElementById('sheet-frage');
    return d&&d.classList.contains('offen')?d.textContent.replace(/\s+/g,' ').slice(0,80):null;});
  chk('Es wird vorher gefragt', !!frage, String(frage));
  await p.evaluate(()=>{const b=document.querySelector('#sheet-frage .fertig, #frage-ja'); if(b)b.click();});
  await p.waitForTimeout(1500);

  const her=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));
    return {g:s.geraete.length,mg:s.meineGeraete.length,
            mgName:s.meineGeraete.some(x=>x.name==='Bettwäsche 60°'),r:s.routinen.length,
            art:(s.routinen[0]||{}).art,iv:(s.routinen[0]||{}).intervall,
            kwp:s.cfg.kwp,adresse:s.cfg.adresse,
            laeufe:((s.cfg.verlauf||{})["Waschmaschine"]||[]).length};});
  chk('Geräte sind zurück', her.g===2, JSON.stringify(her));
  chk('„Meine Geräte" sind zurück', her.mgName===true, JSON.stringify(her));
  chk('Routine ist zurück – samt Abstand', her.r===1&&her.art==='intervall'&&her.iv===4, JSON.stringify(her));
  chk('Anlagendaten sind zurück', her.kwp===9.6&&her.adresse==='Köln', JSON.stringify(her));
  chk('Gelernte Historie ist zurück', her.laeufe===2, JSON.stringify(her));

  // --- 4) Eine fremde Datei wird abgelehnt ---
  await p.$eval('#btn-einrichten',e=>e.click()).catch(()=>{}); await p.waitForTimeout(500);
  await p.evaluate(()=>{const g=document.getElementById('grp-daten'); if(g)g.open=true;});
  await p.setInputFiles('#backup-datei',{name:'fremd.json',mimeType:'application/json',
    buffer:Buffer.from('{"irgendwas":123}')});
  await p.waitForTimeout(800);
  const status=await p.evaluate(()=>{const e=document.getElementById('backup-status');return e?e.textContent:'';});
  chk('Fremde Datei wird abgelehnt', /Keine gültige Backup-Datei/.test(status), status);
  const heil=await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).geraete.length);
  chk('… und die Daten bleiben unangetastet', heil===2, 'Geräte: '+heil);
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== BACKUP: SICHERN UND WIEDERHERSTELLEN =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
