import fs from 'node:fs/promises';
const helper=`function dimensionRangeFeedback(s){
 const candidates=products.filter(p=>(!s.orientation||s.orientation==='unknown'||p.orientations.value.includes(s.orientation))&&(!s.mounting||s.mounting==='unknown'||p.mounting.value===s.mounting));
 return candidates.map(p=>{const v=getVariant(p,s.orientation);if(!v?.rangeProfile)return '';const result=evaluate(p,{...s,finish:null});const errors=result.rejections.filter(x=>x.includes('poza ofertą')||x.includes('maksymalna wysokość')||x.startsWith('Głębokość:')||x.startsWith('Szerokość:')||x.startsWith('Wysokość:'));return '<div class="range-option'+(errors.length?' range-outside':'')+'"><strong>'+escape(p.name)+(errors.length?' — poza zakresem':'')+'</strong><p>'+escape(rangeGuidance(p,s.orientation))+'</p>'+(v.dimensions.depth?.value?.min?'<p>Głębokość: od '+v.dimensions.depth.value.min+' mm.</p>':'')+errors.map(x=>'<p class="range-error">'+escape(x)+'</p>').join('')+'</div>';}).join('');
}
`;
for(const file of ['src/wizard.js','client-package/INTAGO-Rolety-Demo.html']){
 let s=await fs.readFile(file,'utf8');
 s=s.replace('function recommendations(s){',helper+'function recommendations(s){');
 s=s.replace("+dimensionFields(s)+help(","+dimensionFields(s)+'<div id=\"range-feedback\" aria-live=\"polite\"><p><strong>Zakresy dla wybranego kierunku i montażu</strong></p>'+dimensionRangeFeedback(s)+'</div>'+help(");
 if(file.startsWith('src/'))s=s.replace('function dimensionRangeFeedback(s){','export function dimensionRangeFeedback(s){');
 await fs.writeFile(file,s);
}
for(const file of ['app.js','client-package/INTAGO-Rolety-Demo.html']){
 let s=await fs.readFile(file,'utf8');
 if(file==='app.js')s=s.replace('escape,canNext}', 'escape,canNext,dimensionRangeFeedback}');
 s=s.replace("$$('[data-scene]').forEach(n=>n.setAttribute('aria-pressed',n.dataset.scene===s.scene));", "$$('[data-scene]').forEach(n=>{n.hidden=s.step<=3?n.dataset.scene!=='front':s.step===4?!['front','dimensions'].includes(n.dataset.scene):false;n.setAttribute('aria-pressed',n.dataset.scene===s.scene);});");
 s=s.replace("$('#stage-label').textContent=compare?", "$('#stage-label').textContent=s.scene==='dimensions'?'Wymiary wewnętrzne — nie uwzględniają grubości płyt.':compare?");
 s=s.replace("stageHint.hidden=s.scene==='exploded'||(hasInteracted&&!compare&&s.scene!=='section');", "stageHint.hidden=s.scene==='dimensions'?false:s.scene==='exploded'||(hasInteracted&&!compare&&s.scene!=='section');");
 s=s.replace("stageHint.hidden=hasInteracted&&!compare&&s.scene!=='section';", "stageHint.hidden=hasInteracted&&!compare&&s.scene!=='section'&&s.scene!=='dimensions';");
 s=s.replace('hasInteracted=true;stageHint.hidden=true;',"hasInteracted=true;stageHint.hidden=store.get().scene!=='dimensions';");
 s=s.replace('if(editing){const k=oldFocus.dataset.dimension',"if(s.step===4&&$('#range-feedback'))$('#range-feedback').innerHTML='<p><strong>Zakresy dla wybranego kierunku i montażu</strong></p>'+dimensionRangeFeedback(s);\n if(editing){const k=oldFocus.dataset.dimension");
 await fs.writeFile(file,s);
}
for(const file of ['src/state.js','client-package/INTAGO-Rolety-Demo.html']){
 let s=await fs.readFile(file,'utf8');
 s=s.replace('function reconcile(state){',"function reconcile(state){\n if(state.step<=3)state.scene='front';else if(state.step===4&&!['front','dimensions'].includes(state.scene))state.scene='dimensions';");
 await fs.writeFile(file,s);
}
const css='\n.scene-tabs button[hidden]{display:none!important}.range-option{padding:12px 14px;margin:8px 0;border:1px solid #dce0e2;border-radius:6px;font-size:13px}.range-option p{margin:5px 0;line-height:1.5}.range-outside{border-color:#d2071d;background:#fff4f5}.range-error{color:#b00018;font-weight:600}.model-stage:has([data-scene-unused]){position:relative}\n.stage-label{max-width:calc(100% - 180px);line-height:1.4}\n';
await fs.appendFile('styles.css',css);
let html=await fs.readFile('client-package/INTAGO-Rolety-Demo.html','utf8');html=html.replace('</style>',css+'</style>');await fs.writeFile('client-package/INTAGO-Rolety-Demo.html',html);
