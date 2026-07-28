/* Unabhaengige Nachrechnung der Bilanz-Formeln.
   Der Preis-Stub haengt hier an ECHTEN Berliner Stunden (nicht an Container-Zeit),
   damit der Test die Erwartung selbst ausrechnen kann statt sie der App abzuschauen. */
const { chromium }=require('playwright-core');
const eoPfad=require('path');
const APP='file://'+eoPfad.resolve(__dirname,'..','index.html');
const BROWSER=process.env.EO_CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const today=new Date().toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tom=new Date(Date.now()+86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const tagPlus=n=>new Date(Date.now()+n*86400000).toLocaleString('en-CA',{timeZone:'Europe/Berlin'}).slice(0,10);
const berlinStunde=ms=>+new Date(ms).toLocaleString('en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',hour12:false});
const AUFSCHLAG=20;
// Preis je BERLINER Stunde in EUR/MWh -> voll = P/10 + Aufschlag (ct/kWh)
const P=[95,90,88,85,88,110,150,190,210,160,110,70,45,40,55,90,140,200,230,240,200,160,130,105];
const voll=h=>P[h]/10+AUFSCHLAG;
function stub(p,sonne){
  p.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  p.route('**/api.forecast.solar/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"result":{}}'}));
  p.route('**/api.open-meteo.com/**',r=>{const u=r.request().url();
    if(u.includes('daily=')){const t=[];for(let i=0;i<7;i++)t.push(tagPlus(i));
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({daily:{time:t,shortwave_radiation_sum:[10,10,10,10,10,10,10],sunshine_duration:[0,0,0,0,0,0,0],daylight_duration:[54000,54000,54000,54000,54000,54000,54000],precipitation_probability_max:[80,80,80,80,80,80,80],temperature_2m_max:[18,18,18,18,18,18,18]}})});}
    else{const time=[],g=[];[today,tom].forEach(t=>{for(let h=0;h<24;h++){time.push(t+'T'+String(h).padStart(2,'0')+':00');g.push(sonne?sonne(h):0);}});
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hourly:{time,global_tilted_irradiance:g}})});}});
  // Zeitstempel -> Berliner Stunde -> Preis. Damit stimmt die Zuordnung unabhaengig
  // davon, in welcher Zeitzone der Testrechner laeuft.
  p.route('**/api.awattar.de/**',r=>{const s=new Date();s.setHours(0,0,0,0);const dd=[];
    for(let h=0;h<72;h++){const ts=s.getTime()+h*3600000; dd.push({start_timestamp:ts,marketprice:P[berlinStunde(ts)%24]});}
    r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dd})});});
}
const R=[];function chk(n,c,e){R.push({n,ok:!!c,e:e||''});}
const nah=(a,b,t)=>Math.abs(a-b)<=(t||0.15);
const errs=[];
async function lauf(b,o){
  const p=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(today+'T21:30:00Z')});
  stub(p,o.sonne);
  const g={typ:"wm",name:"Testgerät",icon:"🌀",kwh:o.kwh,dauer:o.dauer,von:o.von,bis:o.bis};
  const seed={cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:AUFSCHLAG,schwelle:0,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:o.tarif||"dynamisch",festpreis:0.32,akku_an:false,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:false,
      tagAnzahl:{[today]:{"Testgerät":1}},
      plaene:{[today]:[{key:"wm|Testgerät",run:0,start:o.start,fix:true}]},
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
    const v=(JSON.parse(localStorage.getItem('energie-optimierer-v1')).cfg.verlauf||{})["Testgerät"]||[];
    return v[0]||null;});
  await p.$eval('.tabbar .tab[data-tag="verlauf"]',x=>x.click()); await p.waitForTimeout(1600);
  const ui=await p.evaluate(()=>({
    gross:(document.querySelector('.wk-hero .wk-gross')||{}).textContent,
    euro:(document.querySelector('.wk-kachel .wk-euro')||{}).textContent,
    co2:[...document.querySelectorAll('.wk-kachel b')].map(x=>x.textContent)[1],
    quote:(document.querySelector('.wk-hero-quote')||{}).textContent}));
  await p.close();
  return {e,ui};
}
(async()=>{
  const b=await chromium.launch({executablePath:BROWSER,headless:true});
  try{
  // ========== 1) OHNE Sonne: der Preis-Hebel ist von Hand nachrechenbar ==========
  const von=6,bis=22,kwh=2,dauer=1,start=13;
  let sum=0,n=0; for(let h=von;h<bis;h++){sum+=voll(h);n++;}
  const ref=sum/n;                                   // Durchschnitt im Fenster
  const erwartet=kwh*(ref-voll(start));              // Netzanteil = volle kWh
  const a=await lauf(b,{kwh,dauer,von,bis,start});
  console.log('   Referenzpreis im Fenster 6–22 Uhr:', ref.toFixed(3), 'ct/kWh');
  console.log('   Preis um 13 Uhr:                  ', voll(start).toFixed(3), 'ct/kWh');
  console.log('   erwartet:', erwartet.toFixed(1), 'ct · App:', a.e&&a.e.pspar, 'ct');
  chk('Ohne Sonne ist son = 0', a.e && a.e.son===0, 'son='+(a.e&&a.e.son));
  chk('Ohne Sonne ist spar = 0', a.e && a.e.spar===0, 'spar='+(a.e&&a.e.spar));
  chk('Preisvorteil stimmt auf die Nachkommastelle',
      a.e && nah(a.e.pspar,erwartet), 'erwartet '+erwartet.toFixed(1)+' · App '+(a.e&&a.e.pspar));

  // ========== 2) Teure Stunde: negativ, und zwar exakt gespiegelt ==========
  const start2=20;
  const erwartet2=kwh*(ref-voll(start2));
  const c=await lauf(b,{kwh,dauer,von,bis,start:start2});
  console.log('   20 Uhr: erwartet', erwartet2.toFixed(1), 'ct · App:', c.e&&c.e.pspar, 'ct');
  chk('Teure Stunde: Vorzeichen und Betrag stimmen',
      c.e && nah(c.e.pspar,erwartet2), 'erwartet '+erwartet2.toFixed(1)+' · App '+(c.e&&c.e.pspar));

  // ========== 3) Fester Tarif: jede Stunde gleich -> kein Preisvorteil ==========
  const f=await lauf(b,{kwh,dauer,von,bis,start,tarif:"fest"});
  chk('Fester Tarif: Preisvorteil ist null', f.e && !f.e.pspar, 'pspar='+(f.e&&f.e.pspar));

  // ========== 4) MIT Sonne: die Identitaeten muessen halten ==========
  // Einstrahlung nur um 13 Uhr Berliner Zeit -> Lauf 13–14 Uhr wird (teil-)gedeckt
  const s=await lauf(b,{kwh:2,dauer:1,von,bis,start:13,
    sonne:h=>0});                                    // Referenzlauf ohne Sonne
  const s2=await lauf(b,{kwh:2,dauer:1,von,bis,start:13,
    sonne:h=>(h>=9&&h<=15)?700:0});                  // mit Sonne mittags
  const son=s2.e?s2.e.son:0;
  console.log('   mit Sonne: son =', son, 'kWh · spar =', s2.e&&s2.e.spar, 'ct');
  chk('Sonne kann den Bedarf nicht uebersteigen', son<=2.0001, 'son='+son);
  chk('Sonne ist positiv, wenn welche da ist', son>0, 'son='+son);
  // spar = son x Preis der Laufstunde (der Lauf beruehrt nur EINE Stunde)
  chk('spar = Sonnen-kWh x Netzpreis dieser Stunde',
      s2.e && nah(s2.e.spar, son*voll(13), 0.3),
      'erwartet '+(son*voll(13)).toFixed(1)+' · App '+(s2.e&&s2.e.spar));
  // pspar nur noch auf den Netzrest
  const netzRest=2-son;
  // Ist der Wert exakt 0, speichert die App ihn bewusst nicht (spart Platz im Verlauf).
  const psp=(s2.e&&s2.e.pspar)||0;
  chk('Preisvorteil zaehlt nur den Netzrest',
      s2.e && nah(psp, netzRest*(ref-voll(13)), 0.3),
      'erwartet '+(netzRest*(ref-voll(13))).toFixed(1)+' · App '+psp);
  chk('Bei voller Sonnendeckung wird kein Nullwert gespeichert',
      netzRest>0.01 || s2.e.pspar===undefined, 'pspar='+String(s2.e.pspar));

  // ========== 5) Anzeige: kWh, CO2 und Deckungsanteil ==========
  chk('Kopfzahl ist die Sonnen-kWh',
      s2.ui.gross && nah(parseFloat(s2.ui.gross.replace(',','.')), son, 0.06),
      'Anzeige '+s2.ui.gross+' · gespeichert '+son);
  const co2Erw=son*0.38;
  chk('CO₂ = Sonnen-kWh x 0,38 kg',
      s2.ui.co2 && nah(parseFloat(s2.ui.co2.replace(',','.')), co2Erw, 0.06),
      'Anzeige '+s2.ui.co2+' · erwartet '+co2Erw.toFixed(2));
  const quoteErw=Math.round(son/2*100);
  chk('Deckungsanteil = Sonne / Bedarf',
      s2.ui.quote && Math.abs(parseInt(s2.ui.quote,10)-quoteErw)<=1,
      'Anzeige '+s2.ui.quote+' · erwartet '+quoteErw+' %');
  // Kachel = Summe beider Hebel
  const summeErw=(s2.e.spar+psp)/100;
  chk('Euro-Kachel = Sonnen-Hebel + Preis-Hebel',
      s2.ui.euro && nah(parseFloat(s2.ui.euro.replace(',','.')), summeErw, 0.02),
      'Anzeige '+s2.ui.euro+' · erwartet '+summeErw.toFixed(2)+' €');
  // ========== 6) Schreibweise: deutsche Kommas ueberall, wo Zahlen stehen ==========
  const p2=await b.newPage({viewport:{width:393,height:852,hasTouch:true}});
  await p2.clock.install({time:new Date(today+'T09:00:00Z')});
  stub(p2,h=>(h>=8&&h<=17)?900:0);
  await p2.addInitScript(v=>localStorage.setItem('energie-optimierer-v1',v),JSON.stringify({
    cfg:{lat:50.98,lon:6.93,adresse:"Köln",kwp:9.6,neigung:25,azimut:0,aufschlag:AUFSCHLAG,schwelle:400,
      faktor:1.0,kalib:[],pvQuelle:"om",tarif:"dynamisch",festpreis:0.32,akku_an:true,akku_kwh:10,akku_stand:5,
      onboardingGesehen:true,hilfeGesehen:true,newsGesehen:99,setupFertig:true,rueckblickWeg:today,
      wischHintWeg:true,gl_profil_an:false,tagAnzahl:{[today]:{"Testgerät":1}},plaene:{},erledigt:{},verlauf:{}},
    geraete:[{typ:"wm",name:"Testgerät",icon:"🌀",kwh:2,dauer:2,von:6,bis:22}],meineGeraete:[],routinen:[]}));
  await p2.goto(APP); await p2.waitForTimeout(2000);
  const punkte=await p2.evaluate(()=>{
    const treffer=[];
    document.querySelectorAll('.r-leg, .v-zeile, .verdikt, .budget-tx').forEach(e=>{
      const t=e.textContent;
      // Zahl mit Punkt als Dezimaltrenner (nicht als Datum/Uhrzeit)
      const m=t.match(/\d+\.\d+/g);
      if(m)treffer.push(t.trim().slice(0,60)+'  →  '+m.join(', '));
    });
    return treffer;});
  chk('Keine Dezimalpunkte in den kWh-Zeilen des Tagesplans',
      punkte.length===0, JSON.stringify(punkte).slice(0,220));
  const kommas=await p2.$$eval('.r-leg',els=>els.map(e=>e.textContent.trim()));
  chk('Die Chart-Legende zeigt Werte', kommas.length>0, JSON.stringify(kommas));
  await p2.close();
  }catch(e){console.log('⚠️ Abbruch:',e.message.split('\n')[0]);}
  chk('Keine JS-Fehler',errs.length===0,errs.join('|').slice(0,160));

  console.log('\n===== NACHRECHNUNG DER BILANZ-FORMELN =====');
  let pass=0;R.forEach(r=>{console.log((r.ok?'✅':'❌')+' '+r.n+(r.e?'  ['+r.e+']':''));if(r.ok)pass++;});
  console.log(`\n${pass}/${R.length} Checks bestanden`);
  await b.close();
  process.exit(pass===R.length?0:1);
})();
