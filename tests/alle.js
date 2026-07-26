#!/usr/bin/env node
/* Laeuft alle Regressionstests der Reihe nach und fasst zusammen.
   Aufruf:  node tests/alle.js            (alles)
            node tests/alle.js routinen   (nur passende Namen)
   Browser: EO_CHROMIUM=/pfad/zu/chrome node tests/alle.js */
const { execFileSync }=require("child_process");
const fs=require("fs"), path=require("path");

const filter=process.argv[2]||"";
const dateien=fs.readdirSync(__dirname)
  .filter(f=>f.startsWith("test_")&&f.endsWith(".js"))
  .filter(f=>!filter||f.includes(filter))
  .sort();

if(!dateien.length){ console.log("Keine passenden Tests gefunden."); process.exit(0); }

let summeOk=0, summeAlle=0, kaputt=[];
for(const f of dateien){
  process.stdout.write(f.replace(/\.js$/,"").padEnd(22));
  let out="";
  try{ out=execFileSync("node",[path.join(__dirname,f)],{encoding:"utf8",timeout:300000,stdio:["ignore","pipe","pipe"]}); }
  catch(e){ out=(e.stdout||"")+(e.stderr||""); }
  const m=out.match(/(\d+)\/(\d+) Checks bestanden/);
  if(m){
    const ok=+m[1], alle=+m[2];
    summeOk+=ok; summeAlle+=alle;
    if(ok===alle) console.log("✅ "+ok+"/"+alle);
    else{
      console.log("❌ "+ok+"/"+alle);
      kaputt.push(f);
      out.split("\n").filter(z=>z.startsWith("❌")).forEach(z=>console.log("     "+z));
    }
  } else {
    console.log("💥 abgebrochen");
    kaputt.push(f);
    const letzte=out.trim().split("\n").slice(-1)[0]||"(keine Ausgabe)";
    console.log("     "+letzte.slice(0,120));
  }
}
console.log("\n"+"─".repeat(40));
console.log(dateien.length+" Dateien · "+summeOk+"/"+summeAlle+" Checks bestanden");
if(kaputt.length){ console.log("Nicht in Ordnung: "+kaputt.join(", ")); process.exit(1); }
console.log("Alles grün.");
