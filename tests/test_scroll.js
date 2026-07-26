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
    if(u.includes('daily=')){r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:[today,tom],shortwave_radiation_sum:[220,210],sunshine_duration:[40000,38000],daylight_duration:[54000,54000],precipitation_probability_max:[10,20],temperature_2m_max:[24,23]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(((h>=5&&h<=20)?bell(h):0)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:80});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T05:00:00Z')}); // 07:00 Berlin – alles noch in der Zukunft
  stub(p);
  // SIEBEN Geräte: mehr als die 4 offenen -> Aufklapper muss erscheinen
  const namen=["Waschmaschine","Spülmaschine","Trockner","E-Auto","Pool","Boiler","Bügeleisen"];
  const seed={
    cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9,neigung:25,azimut:0,aufschlag:18,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:false,
      tagAnzahl:{[today]:Object.fromEntries(namen.map(n=>[n,1]))}, plaene:{}, verlauf:{}, erledigt:{}},
    geraete:namen.map((n,i)=>({typ:"so",name:n,icon:"🔌",kwh:0.6,dauer:1,von:6,bis:22})),
    meineGeraete:[],routinen:[]
  };
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),JSON.stringify(seed));
  try{
  await p.goto(APP);await p.waitForTimeout(1600);

  // --- 1) Kein verschachtelter Scrollkasten mehr ---
  const box=await p.$eval('.dash-rows',el=>{const cs=getComputedStyle(el);
    return {overflowY:cs.overflowY, maxH:cs.maxHeight, scrollH:el.scrollHeight, clientH:el.clientHeight};});
  chk('Geräteliste hat keinen eigenen Scrollbereich', box.overflowY!=='auto'&&box.overflowY!=='scroll', 'overflow-y='+box.overflowY);
  chk('Keine Höhenbegrenzung mehr (kein 172px-Kasten)', box.maxH==='none', 'max-height='+box.maxH);
  chk('Inhalt wird nicht abgeschnitten', box.scrollH<=box.clientH+2, 'scroll='+box.scrollH+' client='+box.clientH);

  // --- 2) touch-action erlaubt senkrechtes Scrollen ---
  const ta=await p.$eval('.dash-row',el=>getComputedStyle(el).touchAction);
  chk('Zeilen erlauben senkrechtes Scrollen (touch-action: pan-y)', /pan-y/.test(ta), 'touch-action='+ta);

  // --- 3) Aufklapper statt Scrollkasten: 4 offen, Rest eingeklappt ---
  const offen=await p.$$eval('.dash-plan > .dash-rows .dash-row',els=>els.length);
  chk('Vier Geräte direkt sichtbar', offen===4, 'n='+offen);
  const summary=await p.$eval('.dash-mehr summary',e=>e.textContent.trim()).catch(()=>null);
  chk('Aufklapper nennt die restlichen 3 Geräte', summary&&/3 weitere Geräte/.test(summary), String(summary));
  const zu=await p.$eval('.dash-mehr',e=>e.open===false).catch(()=>null);
  chk('Aufklapper startet zugeklappt', zu===true, 'open='+(zu===false));

  // --- 4) Gestenerkennung am ECHTEN Verhalten prüfen: Wir feuern richtige
  //        Touch-Ereignisse auf eine Zeile. Verschiebt sie sich (translateX),
  //        wurde die Bewegung als Wischen gewertet – sonst als Scrollen.
  const geste=(dx,dy)=>p.evaluate(({dx,dy})=>{
    const row=document.querySelector('.dash-row[data-plan]');
    if(!row)return 'KEINE ZEILE';
    const r=row.getBoundingClientRect();
    const x0=Math.round(r.left+r.width/2), y0=Math.round(r.top+r.height/2);
    const t=(x,y)=>new Touch({identifier:1,target:row,clientX:x,clientY:y});
    const ev=(typ,x,y)=>new TouchEvent(typ,{bubbles:true,cancelable:true,
      touches:typ==='touchend'?[]:[t(x,y)], targetTouches:typ==='touchend'?[]:[t(x,y)], changedTouches:[t(x,y)]});
    row.style.transform='';
    row.dispatchEvent(ev('touchstart',x0,y0));
    row.dispatchEvent(ev('touchmove',x0+dx,y0+dy));
    const verschoben=/translateX/.test(row.style.transform||'');
    row.dispatchEvent(ev('touchend',x0+dx,y0+dy));
    row.style.transform='';
    return verschoben?'wischen':'scrollen';
  },{dx,dy});

  chk('Leicht schräg (10 seitlich / 7 runter) → scrollen', (await geste(10,7))==='scrollen');
  chk('Schräg (12/8) → scrollen', (await geste(12,8))==='scrollen');
  chk('Klar senkrecht (2/20) → scrollen', (await geste(2,20))==='scrollen');
  chk('Winzige Bewegung (3/2) → noch nichts passiert', (await geste(3,2))==='scrollen');
  chk('Klar waagerecht (30/3) → wischen', (await geste(30,3))==='wischen');
  chk('Großer Wisch mit Drift (40/12) → wischen', (await geste(40,12))==='wischen');
  chk('Waagerecht nach links (-30/4) → wischen', (await geste(-30,4))==='wischen');

  // --- 5) Wischen zum Löschen funktioniert weiterhin ---
  const vorher=await p.$$eval('.dash-row[data-plan]',els=>els.length);
  const r=await p.$('.dash-row[data-plan]');
  const bb=await r.boundingBox();
  const y=bb.y+bb.height/2;
  await p.touchscreen.tap(bb.x+bb.width/2,y).catch(()=>{});
  await p.waitForTimeout(300);
  // Sheet ggf. wieder schliessen (Tippen oeffnet den Tagesplan)
  await p.evaluate(()=>{const s=document.querySelector('.sheet.offen');if(s)document.getElementById('schleier').click();});
  await p.waitForTimeout(400);
  chk('Zeilen bleiben nach Antippen erhalten',
      (await p.$$eval('.dash-row[data-plan]',els=>els.length))===vorher, 'n='+vorher);
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== v79: SCROLLEN & GESTENERKENNUNG =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
