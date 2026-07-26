const path=require('path');const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
function bell(h){const x=(h-13)/4.2;return Math.max(0,Math.round(5200*Math.exp(-x*x)));}
function d(o){return new Date(Date.parse(today+'T12:00:00Z')+o*86400000).toISOString().slice(0,10);}
function stub(p){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{lat:"50.98",lon:"6.93",display_name:"Köln"}])}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({result:{}})}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const DAY=54000;const time=[],rad=[],sun=[],day=[],regen=[],tmax=[];
      for(let i=0;i<7;i++){time.push(d(i));rad.push(220);sun.push(40000);day.push(DAY);regen.push(10);tmax.push(6);} // kalte Woche: Tmax 6 °C
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time,shortwave_radiation_sum:rad,sunshine_duration:sun,daylight_duration:day,precipitation_probability_max:regen,temperature_2m_max:tmax}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(bell(h)/6);}});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];for(let h=0;h<72;h++){const c=[6,5,4,4,5,7,10,13,14,12,8,5,3,2,4,6,9,13,15,14,11,9,8,7][h%24];dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:c*10});}r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T08:00:00Z')});stub(p);
  await p.addInitScript(()=>localStorage.removeItem('energie-optimierer-v1'));
  await p.goto(APP);await p.waitForTimeout(800);
  try{
  await p.fill('#wk-adresse','Köln');await p.$eval('#wk-suchen',e=>e.click());await p.waitForTimeout(1200);
  await p.$eval('#wk-weiter',e=>e.click()).catch(()=>{});await p.waitForTimeout(400);

  // ===== Einrichten: Hintergrund-Bausteine =====
  chk('Sockel-Regler vorhanden (alte Zonen weg)', !(await p.$('#gl-zonen')) && !!(await p.$('#rg-last')));
  // WW einschalten
  await p.$eval('#rg-ww-an',e=>e.click());await p.waitForTimeout(300);
  chk('WW: Details sichtbar', !(await p.$eval('#ww-details',e=>e.hidden)));
  chk('WW: 3 Läufe, Lauf 2 = ☀️ auto', (await p.$eval('#rg-wwl1-z-val',e=>e.textContent))==='☀️ auto');
  const info1=await p.$eval('#ww-info',e=>e.textContent);
  chk('WW: 2,0 kWh auf 3 Läufe = je 0,7', /je 0,7 kWh/.test(info1), info1.slice(0,80));
  // Lauf 2 aus -> je 1,0
  await p.$eval('#rg-wwl1-an',e=>e.click());await p.waitForTimeout(250);
  const info2=await p.$eval('#ww-info',e=>e.textContent);
  chk('WW: nach Lauf-Aus je 1,0 kWh (verteilt, nicht vervielfacht)', /je 1,0 kWh/.test(info2), info2.slice(0,80));
  await p.$eval('#rg-wwl1-an',e=>e.click());await p.waitForTimeout(250);
  // Lauf 3 auf 20:00 schieben
  await p.$eval('#rg-wwl2-z',e=>{e.value=20;e.dispatchEvent(new Event('input'))});await p.waitForTimeout(200);
  chk('WW: Lauf-3-Zeit frei einstellbar (20:00)', (await p.$eval('#rg-wwl2-z-val',e=>e.textContent)).includes('20:00'));
  // Lauf 2: auto abschalten -> Zeit-Slider erscheint
  await p.$eval('#rg-wwl1-auto',e=>e.click());await p.waitForTimeout(200);
  chk('WW: ☀️-auto abschaltbar → Zeit-Slider sichtbar', !(await p.$eval('#wwl1-z-box',e=>e.hidden)));
  await p.$eval('#rg-wwl1-auto',e=>e.click());await p.waitForTimeout(200);
  // Heizung einschalten (kalte Stub-Woche: Tmax 6 °C)
  await p.$eval('#rg-hz-an',e=>e.click());await p.waitForTimeout(400);
  chk('Heizung: Details sichtbar', !(await p.$eval('#hz-details',e=>e.hidden)));
  const hzInfo=await p.$eval('#hz-info',e=>e.textContent);
  chk('Heizung: rechnet Heizlast aus Wetter (Tmax ~6°)', /Ø ~\d+ W/.test(hzInfo), hzInfo.slice(0,90));
  await p.$eval('#btn-fertig',e=>e.click());await p.waitForTimeout(1300);

  // ===== Tagesplan: Hintergrund-Spur =====
  await p.$eval('#dash-curve',e=>e.click());await p.waitForTimeout(600);
  chk('Tagesplan: Hintergrund-Spur vorhanden', !!(await p.$('#hg-lane')));
  const pins=await p.$$eval('#hg-lane .hg-ww',e=>e.map(x=>x.textContent));
  chk('Tagesplan: 3 WW-Pins', pins.length===3, JSON.stringify(pins));
  chk('Tagesplan: Pin mit 20 Uhr (verschobener Lauf)', pins.some(t=>/🚿 20\b/.test(t)), '');
  chk('Tagesplan: ☀️-auto-Pin in Sonnenstunde', pins.some(t=>t.includes('☀️')), '');
  chk('Tagesplan: Heiz-Band sichtbar', !!(await p.$('#hg-lane .hg-hzband')));
  const blocks=await p.$$eval('#planer-leiste .p-blk',e=>e.length);
  chk('Tagesplan: Geräte trotz Hintergrund eingeplant', blocks>0, 'Blöcke='+blocks);

  // ===== s.hg wirkt: freie Sonne kleiner mit WW+Heizung =====
  const frei1=await p.evaluate(()=>{const m=document.querySelector('.budget-tx');return m?m.textContent:'';});
  await p.evaluate(()=>{document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('offen'));document.getElementById('schleier').classList.remove('offen');});
  await p.$eval('#btn-einrichten',e=>e.click());await p.waitForTimeout(400);
  await p.$eval('#rg-ww-an',e=>e.click());await p.$eval('#rg-hz-an',e=>e.click());await p.waitForTimeout(300);
  await p.$eval('#btn-fertig',e=>e.click());await p.waitForTimeout(1100);
  await p.$eval('#dash-curve',e=>e.click());await p.waitForTimeout(500);
  const frei2=await p.evaluate(()=>{const m=document.querySelector('.budget-tx');return m?m.textContent:'';});
  const f1=parseFloat((frei1.match(/~([\d,]+) kWh/)||[])[1]?.replace(',','.')||0);
  const f2=parseFloat((frei2.match(/~([\d,]+) kWh/)||[])[1]?.replace(',','.')||0);
  chk('freie Sonne: ohne Bausteine größer als mit', f2>f1, 'mit='+f1+' ohne='+f2);
  chk('Tagesplan: Spur weg, wenn Bausteine aus', !(await p.$('#hg-lane')));

  // ===== Persistenz =====
  const saved=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('energie-optimierer-v1'));return s.cfg;});
  chk('Persistenz: ww_l[2].z=20 gespeichert', saved.ww_l && saved.ww_l[2] && saved.ww_l[2].z===20, JSON.stringify(saved.ww_l));
  chk('Persistenz: hz-Felder vorhanden', saved.hz_grenze===15 && saved.hz_p0===1.2);
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler', errs.length===0, errs.join('|').slice(0,200));

  console.log('\n===== HINTERGRUND-VERBRAUCH (v66) =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
})();
