import fs from 'node:fs/promises';
import vm from 'node:vm';
const current=await fs.readFile('client-package/INTAGO-Rolety-Demo.html','utf8');
const original=await fs.readFile('qa/INTAGO-Rolety-before-technical-geometry.html','utf8');
const script=s=>s.slice(s.indexOf('<script>')+8,s.indexOf('</script>',s.indexOf('<script>')));
new vm.Script(script(current));
const sections=[['catalogue','const products=','/* pricing-data'],['prices','const PRICE_VERSION=', '/* src/geometry.js */'],['wizard','/* src/wizard.js */','/* app.js */'],['application','/* app.js */','</script>']];
// The price-to-geometry span also contains unchanged engine, state, persistence and component sets.
const result=sections.map(([name,start,end])=>({name,unchanged:original.slice(original.indexOf(start),original.indexOf(end,original.indexOf(start)))===current.slice(current.indexOf(start),current.indexOf(end,current.indexOf(start)))}));
if(result.some(x=>!x.unchanged))throw new Error(JSON.stringify(result));
await fs.writeFile('qa/technical-geometry-integrity.json',JSON.stringify({syntax:'valid',protectedSections:result,visualQA:'blocked by browser local URL policy'},null,2));
console.log(JSON.stringify(result));
