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
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
const errs=[];
/* Wie viel freie Sonne um 11 Uhr wirklich zur Verfuegung steht, WEISS der Test nicht –
   die App rechnet Globalstrahlung ueber Anlagendaten in Watt um. Deshalb wird der
   Ueberschuss zuerst gemessen (ein Geraet mit uebergrossem Bedarf schoepft ihn aus)
   und danach geprueft, dass zwei Geraete zusammen nicht mehr bekommen als das. */
async function laufen(b,geraete){
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T16:00:00Z')});   // 18 Uhr: Fenster abgelaufen
  stub(p);
  const anz={},plan=[];
  geraete.forEach(g=>{ anz[g.name]=1; plan.push({key:g.typ+"|"+g.name,run:0,start:11,fix:true}); });
  const seed={cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:20,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:false,tagAnzahl:{[today]:anz},plaene:{[today]:plan},
      erledigt:{},verlauf:{}},
    geraete,meineGeraete:[],routinen:[]};
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  await p.goto(APP); await p.waitForTimeout(2200);
  if(await p.$eval('#sheet-faellig',e=>e.classList.contains('offen')).catch(()=>false)){
    await p.evaluate(()=>{document.querySelectorAll('#sheet-faellig input[type=checkbox]').forEach(c=>{if(!c.checked)c.click();});});
    await p.waitForTimeout(300);
    await p.$eval('#faellig-ok',e=>e.click()); await p.waitForTimeout(1200);
  }
  const v=await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg.verlauf||{});
  await p.close();
  const out={};
  Object.keys(v).forEach(n=>{ out[n]=v[n].reduce((a,e)=>a+(e.son||0),0); });
  return out;
}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  try{
  // 1) Ueberschuss ausmessen: ein Geraet, das mehr will als da ist
  const gross=await laufen(b,[{typ:"wm",name:"Schlucker",icon:"🅰️",kwh:12,dauer:1,von:6,bis:22}]);
  const S=gross["Schlucker"]||0;
  console.log("Freier Sonnenueberschuss um 11 Uhr (gemessen):", S.toFixed(3), "kWh");
  chk('Ueberschuss ist ueberhaupt messbar', S>0.5, S.toFixed(3)+' kWh');

  // 2) Zwei Geraete, die zusammen mehr wollen als der Ueberschuss hergibt
  const zwei=await laufen(b,[{typ:"wm",name:"Maschine A",icon:"🅰️",kwh:2,dauer:1,von:6,bis:22},
                             {typ:"gs",name:"Maschine B",icon:"🅱️",kwh:2,dauer:1,von:6,bis:22}]);
  const a=zwei["Maschine A"]||0, bb=zwei["Maschine B"]||0, summe=a+bb;
  console.log("Maschine A:", a.toFixed(3), "kWh · Maschine B:", bb.toFixed(3), "kWh · Summe:", summe.toFixed(3), "kWh");
  chk('Beide zusammen bekommen nicht mehr als der Ueberschuss hergibt',
      summe<=S+0.01, 'Summe '+summe.toFixed(3)+' > Ueberschuss '+S.toFixed(3));
  chk('Der Ueberschuss wird auch wirklich ausgeschoepft',
      summe>=Math.min(S,4)-0.01, 'Summe '+summe.toFixed(3)+' statt '+Math.min(S,4).toFixed(3));
  chk('Die beiden teilen sich – der zweite bekommt weniger als der erste',
      bb<a, 'A '+a.toFixed(3)+' / B '+bb.toFixed(3));
  chk('Ohne die Korrektur bekaeme jeder 2,0 kWh (Doppelzaehlung)',
      !(Math.abs(a-2)<0.001 && Math.abs(bb-2)<0.001), 'A '+a.toFixed(3)+' / B '+bb.toFixed(3));
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,160));

  console.log('\n===== v88: EINE SONNE WIRD NUR EINMAL VERGEBEN =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
