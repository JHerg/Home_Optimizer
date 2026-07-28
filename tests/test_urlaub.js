const path=require('path');const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function addT(k,n){return new Date(Date.parse(k+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{lat:"50.98",lon:"6.93",display_name:"Köln"}])}));
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
  await p.fill('#wk-adresse','Köln');await p.$eval('#wk-suchen',e=>e.click());await p.waitForTimeout(1200);
  await p.$eval('#wk-weiter',e=>e.click()).catch(()=>{});await p.waitForTimeout(400);
  // Routine anlegen (damit es etwas zu pausieren gibt): über localStorage nach Fertig
  await p.$eval('#btn-fertig',e=>e.click());await p.waitForTimeout(1100);
  chk('Start: kein Urlaubs-Banner',await p.$eval('#ur-banner',e=>e.hidden));

  // Urlaubs-Modus aktivieren – seit v89 direkt oben im Einrichten-Blatt,
  // ohne vorher eine Gruppe aufzuklappen.
  await p.$eval('#btn-einrichten',e=>e.click());await p.waitForTimeout(400);
  await p.$eval('#rg-ur-an',e=>e.click());await p.waitForTimeout(500);
  chk('Details erscheinen',!(await p.$eval('#ur-details',e=>e.hidden)));
  const btns=await p.$$eval('#w-urlaub button',e=>e.map(x=>x.textContent));
  chk('Dauer-Chips (WE/1Wo/2Wo)',btns.length===3&&/Woche/.test(btns[1]),JSON.stringify(btns));
  chk('Datumsfeld vorhanden',!!(await p.$('#f-ur-bis')));
  // Seit v89 steht der Urlaub nicht mehr in der Gruppe „Haushalt", sondern als eigene
  // Karte ganz oben. Der aktive Zustand ist dort direkt am Schalter ablesbar –
  // ohne dass man irgendetwas aufklappen muss.
  chk('Aktiver Urlaub ist ohne Aufklappen sichtbar',
      await p.evaluate(()=>{const k=document.getElementById('ur-karte');
        return !!k && !k.closest('details.egrp') && document.getElementById('rg-ur-an').checked;}));
  // 2 Wochen wählen
  await p.$$eval('#w-urlaub button',e=>e[2].click());await p.waitForTimeout(400);
  const cfg1=await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg);
  chk('2 Wochen gespeichert',cfg1.urlaub&&cfg1.urlaub.bis===addTclient(cfg1),'bis='+(cfg1.urlaub||{}).bis);
  function addTclient(c){return null;} // Platzhalter – echte Prüfung unten
  R.pop(); // obige Zeile ersetzen durch direkte Prüfung:
  chk('2 Wochen gespeichert (heute+14)',cfg1.urlaub&&cfg1.urlaub.bis===addT(today,14),'bis='+(cfg1.urlaub||{}).bis+' erwartet '+addT(today,14));
  chk('urlaubLog geführt',Array.isArray(cfg1.urlaubLog)&&cfg1.urlaubLog.length===1&&cfg1.urlaubLog[0].bis===addT(today,14),JSON.stringify(cfg1.urlaubLog));
  await p.$eval('#btn-fertig',e=>e.click());await p.waitForTimeout(900);

  // Startseite: Banner da, Vorschläge/Routine-Banner unterdrückt
  chk('Startseite: ✈️-Zeile sichtbar',!(await p.$eval('#ur-banner',e=>e.hidden)),await p.$eval('#ur-banner',e=>e.textContent).catch(()=>''));
  chk('Vorschlag-Box versteckt',await p.$eval('#vorschlag-box',e=>e.hidden));
  chk('Routine-Banner versteckt',await p.$eval('#routine-banner',e=>e.hidden));
  chk('Drift-Banner versteckt',await p.$eval('#dash-drift',e=>e.hidden));

  // Serie-Überbrückung: Läufe vor dem Urlaub + Urlaubslücke -> Serie zählt weiter
  await p.evaluate(o=>{const k='energie-optimierer-v1';const s=JSON.parse(localStorage.getItem(k));
    s.cfg.verlauf={'Waschmaschine':[{d:o.a3,s:10,k:0.9,son:0.8,spar:20},{d:o.t,s:10,k:0.9,son:0.8,spar:20}]};
    s.cfg.urlaubLog=[{von:o.a2,bis:o.a1}]; s.cfg.urlaub=null; s.cfg.serieRekord=99;
    localStorage.setItem(k,JSON.stringify(s));},{t:today,a3:addT(today,-3),a2:addT(today,-2),a1:addT(today,-1)});
  await p.goto(APP);await p.waitForTimeout(900);
  await p.evaluate(()=>{document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('offen'));document.getElementById('schleier').classList.remove('offen');});
  await p.$eval('.tabbar .tab[data-tag="verlauf"]',e=>e.click());await p.waitForTimeout(600);
  const serie=await p.evaluate(()=>{const k=[...document.querySelectorAll('.wk-kachel')].find(x=>x.textContent.includes('Serie'));return k?k.querySelector('b').textContent:'?';});
  chk('Serie überbrückt Urlaubstage (2 Tage Lücke → Serie 2)',/^2 /.test(serie),'Serie='+serie);

  // Beenden über die Startseiten-Zeile
  await p.evaluate(o=>{const k='energie-optimierer-v1';const s=JSON.parse(localStorage.getItem(k));
    s.cfg.urlaub={aktiv:true,von:o.a1,bis:'2099-01-01'}; s.cfg.urlaubLog=[{von:o.a1,bis:'2099-01-01'}];
    localStorage.setItem(k,JSON.stringify(s));},{a1:addT(today,-1)});
  await p.goto(APP);await p.waitForTimeout(900);
  await p.evaluate(()=>{document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('offen'));document.getElementById('schleier').classList.remove('offen');});
  chk('Banner wieder da (aktiv)',!(await p.$eval('#ur-banner',e=>e.hidden)));
  await p.$eval('#ur-ende',e=>e.click());await p.waitForTimeout(500);
  chk('Beenden: Banner weg',await p.$eval('#ur-banner',e=>e.hidden));
  const cfg2=await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg);
  chk('Beenden: aktiv=false, Log auf gestern gekürzt',cfg2.urlaub.aktiv===false&&cfg2.urlaubLog[0].bis===addT(today,-1),JSON.stringify(cfg2.urlaubLog));

  // Auto-Ende: bis=gestern -> beim Laden von selbst aus
  await p.evaluate(o=>{const k='energie-optimierer-v1';const s=JSON.parse(localStorage.getItem(k));
    s.cfg.urlaub={aktiv:true,von:o.a2,bis:o.a1};localStorage.setItem(k,JSON.stringify(s));},{a2:addT(today,-3),a1:addT(today,-1)});
  await p.goto(APP);await p.waitForTimeout(900);
  const cfg3=await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg);
  chk('Auto-Ende nach Datum',cfg3.urlaub.aktiv===false);
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== URLAUBS-MODUS (v70) =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
})();
