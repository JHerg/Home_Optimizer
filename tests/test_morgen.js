/* v91: „Heute bringt das nichts mehr – leg es auf morgen."
   Prueft die Faelle, die der Betreiber genannt hat: Speicher an/aus, fester und
   dynamischer Tarif, und dass die App schweigt, wenn es nichts zu raten gibt. */
const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tagPlus=n=>new Date(Date.now()+n*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const GTI  =h=>(h>=7&&h<=19)?Math.max(0,Math.round(430*Math.exp(-Math.pow((h-13.0)/3.4,2)))):0;
const TRUEB=h=>(h>=10&&h<=15)?Math.max(0,Math.round( 25*Math.exp(-Math.pow((h-13.0)/2.2,2)))):0;
function stub(p,o){
  o=o||{};
  const gH=o.truebHeute?TRUEB:GTI, gM=o.truebMorgen?TRUEB:GTI;
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"result":{}}'}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const t=[];for(let i=0;i<7;i++)t.push(tagPlus(i));
      const regen=[20,5,20,20,20,20,20];
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:t,shortwave_radiation_sum:[150,190,150,150,150,150,150],sunshine_duration:[25000,34000,25000,25000,25000,25000,25000],daylight_duration:[54000,54000,54000,54000,54000,54000,54000],precipitation_probability_max:regen,temperature_2m_max:[18,21,18,18,18,18,18]}})});}
    else{const time=[],g=[];
      for(let h=0;h<24;h++){time.push(today+'T'+String(h).padStart(2,'0')+':00');g.push(gH(h));}
      for(let h=0;h<24;h++){time.push(tom  +'T'+String(h).padStart(2,'0')+':00');g.push(gM(h));}
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];
    for(let h=0;h<72;h++)dd.push({start_timestamp:s.getTime()+h*3600000,marketprice:120});
    r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
const errs=[];
const WM={typ:"wm",name:"Waschmaschine",icon:"🌈",kwh:1.2,dauer:2.5,von:6,bis:22};
async function seite(b,o){
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T'+(o.utc||'17')+':05:00Z')});
  stub(p,o);
  const cfg={lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:350,
    faktor:1.0,kalib:[],pvQuelle:"om",tarif:o.tarif||"dynamisch",festpreis:0.32,
    akku_an:!!o.akku,akku_kwh:10,akku_stand:o.akkuStand!=null?o.akkuStand:0,
    onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
    wischHintWeg:true,gl_profil_an:true,tagAnzahl:{[today]:{}},plaene:{},erledigt:{},verlauf:{}};
  const geraete=[]; const routinen=[];
  if(o.routine){ routinen.push(Object.assign({},WM,{wochentag:new Date(today+'T12:00:00Z').getUTCDay(),rhythmus:1,aktiv:true})); }
  else { geraete.push(WM); cfg.tagAnzahl[today]["Waschmaschine"]=1; }
  await p.addInitScript(s=>localStorage.setItem('energie-optimierer-v1',s),
    JSON.stringify({cfg,geraete,meineGeraete:[],routinen}));
  await p.goto(APP); await p.waitForTimeout(2300);
  return p;
}
const kasten=p=>p.evaluate(()=>{const e=document.querySelector('.mgn');
  return e?{da:true,txt:e.textContent.replace(/\s+/g,' ').trim(),
            btn:(e.querySelector('.mgn-btn')||{}).textContent}:{da:false};});
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  try{
  // ===== 1) Abends, kein Speicher, dynamisch: Vorschlag erscheint =====
  let p=await seite(b,{});
  let k=await kasten(p);
  chk('Abends erscheint der Vorschlag', k.da, JSON.stringify(k).slice(0,150));
  chk('Beide Zeiten stehen da', /heute .*Uhr/.test(k.txt||'')&&/morgen .*Uhr/.test(k.txt||''), (k.txt||'').slice(0,120));
  chk('Beide Preise stehen da', ((k.txt||'').match(/\d+ ct/g)||[]).length>=2, k.txt);
  chk('Der Knopf nennt die Ersparnis', /spart \d+ ct/.test(k.btn||''), k.btn);
  await p.close();

  // ===== 2) Der Knopf haengt das Geraet auf morgen um und springt hinueber =====
  p=await seite(b,{});
  await p.$eval('.mgn-btn',e=>e.click()); await p.waitForTimeout(1400);
  const nachher=await p.evaluate(()=>{
    const st=JSON.parse(localStorage.getItem('energie-optimierer-v1'));
    const an=document.querySelector('.tabbar .tab.on');
    return {tab:an?an.dataset.tag:null, tage:st.cfg.tagAnzahl};});
  chk('App springt auf den Reiter „Morgen"', nachher.tab==='morgen', JSON.stringify(nachher.tab));
  chk('Heute ist das Gerät weg', !(nachher.tage[today]||{})["Waschmaschine"], JSON.stringify(nachher.tage));
  chk('Morgen ist es eingeplant', (nachher.tage[tom]||{})["Waschmaschine"]===1, JSON.stringify(nachher.tage));
  await p.close();

  // ===== 3) „Heute lassen" blendet ihn aus =====
  p=await seite(b,{});
  await p.$eval('.mgn-nein',e=>e.click()); await p.waitForTimeout(900);
  chk('„Heute lassen" blendet den Vorschlag aus', !(await kasten(p)).da);
  const gespeichert=await p.evaluate(()=>JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg);
  chk('… und merkt sich das NICHT dauerhaft',
      !JSON.stringify(gespeichert).includes('morgenWeg'), 'kein Eintrag in cfg');
  await p.close();

  // ===== 4) Speicher an und voll: der Abend ist schon geloest -> kein Vorschlag =====
  p=await seite(b,{akku:true,akkuStand:9});
  chk('Mit vollem Speicher schweigt die App', !(await kasten(p)).da,
      JSON.stringify(await kasten(p)).slice(0,140));
  await p.close();

  // ===== 5) Speicher an, aber truebe: er laedt sich tagsueber nicht voll =====
  // (Bei Sonne laedt der Ueberschuss den Speicher, dann IST der Abend gedeckt –
  //  die App schweigt dann zu Recht. Erst ohne Ladung kommt der Rat zurueck.)
  p=await seite(b,{akku:true,akkuStand:0,truebHeute:true});
  chk('Speicher an, aber trüber Tag: Rat kommt zurück', (await kasten(p)).da,
      JSON.stringify(await kasten(p)).slice(0,140));
  await p.close();

  // ===== 6) Fester Tarif: zaehlt nur die Sonne, Vorschlag trotzdem =====
  p=await seite(b,{tarif:"fest"});
  k=await kasten(p);
  chk('Fester Tarif: Vorschlag erscheint', k.da, JSON.stringify(k).slice(0,140));
  chk('Fester Tarif: mit Betrag (jede Stunde bekannt)', /spart \d+ ct/.test(k.btn||''), k.btn);
  await p.close();

  // ===== 7) Mittags ist heute selbst gut -> nichts zu raten =====
  p=await seite(b,{utc:'08'});     // 10 Uhr Berlin
  chk('Mittags schweigt die App', !(await kasten(p)).da, JSON.stringify(await kasten(p)).slice(0,140));
  await p.close();

  // ===== 8) Morgen truebe -> nichts zu gewinnen, also kein Vorschlag =====
  p=await seite(b,{truebMorgen:true});
  chk('Ist morgen trüb, schweigt die App', !(await kasten(p)).da, JSON.stringify(await kasten(p)).slice(0,140));
  await p.close();

  // ===== 9) Mehrere schlecht geplante Geraete: nur EIN Vorschlag, der lohnendste =====
  p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T17:05:00Z')});
  stub(p,{});
  {
    const namen=["Klein","Mittel","Gross"], kwh=[0.6,1.2,2.4];
    const anz={}; namen.forEach(n=>anz[n]=1);
    await p.addInitScript(v=>localStorage.setItem('energie-optimierer-v1',v),JSON.stringify({
      cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:18,schwelle:350,
        faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:false,
        onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
        wischHintWeg:true,gl_profil_an:true,tagAnzahl:{[today]:anz},plaene:{},erledigt:{},verlauf:{}},
      geraete:namen.map((n,i)=>({typ:"so",name:n,icon:"🌀",kwh:kwh[i],dauer:2,von:6,bis:22})),
      meineGeraete:[],routinen:[]}));
    await p.goto(APP); await p.waitForTimeout(2300);
    const n=await p.evaluate(()=>document.querySelectorAll('.mgn').length);
    chk('Bei drei Geräten steht nur EIN Vorschlag', n===1, 'gezeigt: '+n);
    const bei=await p.evaluate(()=>{
      const k=document.querySelector('.mgn');
      let e=k&&k.previousElementSibling;
      return e?e.textContent.replace(/\s+/g,' ').trim().slice(0,30):null;});
    chk('… und zwar beim Gerät mit dem größten Gewinn', /Gross/.test(bei||''), bei);
  }
  await p.close();

  // ===== 10) Routinen bleiben aussen vor =====
  p=await seite(b,{routine:true});
  chk('Routinen bekommen keinen Vorschlag', !(await kasten(p)).da, JSON.stringify(await kasten(p)).slice(0,140));
  await p.close();
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,200));

  console.log('\n===== v91: HEUTE NICHTS MEHR – LEG ES AUF MORGEN =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
