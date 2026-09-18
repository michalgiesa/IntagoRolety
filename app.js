import {createStore,createState} from './src/state.js';
import {save,restore} from './src/persistence.js';
import {CabinetRenderer} from './src/renderer.js';
import {renderWizard,stepNames,escape,canNext,dimensionRangeFeedback} from './src/wizard.js';
import {getProduct,getVariant,mountings,mechanisms} from './systems-data.js';
import {validateDimension,dimensionLabels,visualSpec,mechanismEnvelope} from './src/engine.js';
import {configurationText,configurationId,quoteDraft,mailto} from './src/quote.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const appCommerce=()=>globalThis.INTAGO_COMMERCE;
document.title='Rolety meblowe na wymiar – konfigurator | REHAU';
let storage;try{storage=window.localStorage;}catch{}
const store=createStore(restore(storage)||createState());
let compare=false,measureStep=0,measureDraft={},measureRenderer,previousKey='',previousStep=0,frame=0,animation=0,toastTimer,showEnvelope=true;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const openRange=$('#open-range'),openValue=$('#open-value'),stageHint=$('#stage-label');
let liveOpen=store.get().open,hasInteracted=false;
const model=new CabinetRenderer($('#model'),{onOpen:previewOpen,onCommit:commitOpen,onStart:beginInteraction});
function announce(text){$('#status').textContent=text;$('#status').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#status').classList.remove('visible'),3500);}
function stopMotion(){cancelAnimationFrame(animation);animation=0;$('.visual-panel')?.classList.remove('is-moving');}
function beginInteraction(){stopMotion();hasInteracted=true;stageHint.hidden=store.get().scene!=='dimensions';}
// Transient visual state: no wizard render, reconciliation or storage in a frame.
function previewOpen(value){liveOpen=Math.max(0,Math.min(100,Number(value)));model.setOpen(liveOpen);openRange.value=liveOpen;openValue.textContent=Math.round(liveOpen)+'%';}
function commitOpen(value=liveOpen){store.update({open:value});}
// Continuous acceleration and deceleration, with a gentle mechanical stop.
function premiumEase(t){return t*t*t*(t*(t*6-15)+10);}
function animateTo(target){
 beginInteraction();
 if(reduced()){previewOpen(target);commitOpen(target);return;}
 const start=liveOpen,distance=Math.abs(target-start),time=performance.now(),duration=850+distance*7;
 const panel=$('.visual-panel');panel.classList.add('is-moving');panel.style.setProperty('--motion-direction',target>start?'1':'-1');
 const tick=now=>{const t=Math.min(1,(now-time)/duration),e=premiumEase(t);previewOpen(start+(target-start)*e);if(t<1)animation=requestAnimationFrame(tick);else{animation=0;commitOpen(target);panel.classList.remove('is-moving');}};
 animation=requestAnimationFrame(tick);
}
function render(s){
 const oldFocus=document.activeElement,focusChoice=oldFocus?.dataset?.choice,focusValue=oldFocus?.dataset?.value;
 const key=JSON.stringify({...s,open:0,scene:''});
 const editing=Boolean(oldFocus?.dataset?.dimension);
 if(key!==previousKey&&!editing){
  $('#wizard').innerHTML=renderWizard(s);
  $('#step-nav').hidden=s.mode==='expert';
  $('#step-nav').innerHTML=stepNames.map((name,i)=>'<button data-step="'+(i+1)+'" aria-label="'+(i+1)+'. '+name+'" '+(s.step===i+1?'aria-current="step"':'')+' class="'+(i+1<s.step?'completed':'')+'" '+(i+1>s.step?'disabled':'')+'>0'+(i+1)+'</button>').join('');
  if(focusChoice)document.querySelector('[data-choice="'+focusChoice+'"][data-value="'+focusValue+'"]')?.focus({preventScroll:true});
  if(s.step!==previousStep&&previousStep)$('#wizard-title')?.focus({preventScroll:true});
  previousKey=key;previousStep=s.step;
 }
 $('.expert-toggle').setAttribute('aria-pressed',s.mode==='expert');
 $$('[data-scene]').forEach(n=>{n.hidden=s.step<=3?n.dataset.scene!=='front':s.step===4?!['front','dimensions'].includes(n.dataset.scene):false;n.setAttribute('aria-pressed',n.dataset.scene===s.scene);});
 if(!animation&&!model.drag)liveOpen=s.open;
 const directionButton=$('#direction-toggle');if(directionButton){directionButton.hidden=s.orientation!=='horizontal'||s.scene==='gallery';directionButton.textContent=(s.horizontalDirection==='left'?'← Otwieranie w lewo':'Otwieranie w prawo →')+' · Zmień kierunek';directionButton.setAttribute('aria-label','Zmień kierunek otwierania na '+(s.horizontalDirection==='left'?'prawy':'lewy'));}
 openRange.value=liveOpen;openValue.textContent=Math.round(liveOpen)+'%';
 const shape=JSON.stringify({...s,open:0,step:0,mode:''})+compare;
 if(model.shape!==shape){model.shape=shape;model.update({...s,open:liveOpen},{compare,showEnvelope});}else model.setOpen(liveOpen);
 const p=getProduct(s.selectedProduct),v=getVariant(p,s.orientation),spec=visualSpec(s),mechanism=mechanisms[v?.mechanism.value];
 $('#model-title').textContent=p?.name||(s.orientation&&s.orientation!=='unknown'?'Roleta '+(s.orientation==='horizontal'?'pozioma':'pionowa'):'Sprawdź, jak to działa.');
 const sceneInfo={
 front:[s.orientation==='horizontal'?'Ruch w bok. Dostęp bez otwierania drzwiczek.':'Unieś listwę. Zajrzyj do środka.',spec.split?'Dwa płaszcze otwierają się od środka na obie strony.':'Przeciągnij uchwyt lub użyj suwaka. Strzałki klawiatury także otwierają roletę.'],
 interior:['Przestrzeń za frontem.','Półki są poglądowe. Ich liczbę i odsunięcie od mechanizmu dopasuje wykonawca.'],
 mechanism:[mechanism&&v.mechanism.status==='verified'?mechanism.location:'Przykładowa droga prowadzenia',(mechanism?.description||'Dokładny mechanizm dobierzemy po potwierdzeniu wariantu.')+' Geometria oraz zajęta przestrzeń są poglądowe.'],
 dimensions:['Mierz wewnątrz korpusu.','Szerokość, wysokość i głębokość między wewnętrznymi powierzchniami. To wymiary do zapytania, nie do cięcia.'],
 section:[mountings[spec.mounting],s.orientation==='horizontal'?'Przekrój z góry. Widzisz płaszcz przechodzący z frontu w głąb mebla.':'Przekrój boczny. Pokazujemy strefę mechanizmu i odległości jej krawędzi od wewnętrznych ścianek korpusu.'],
 exploded:['Korpus. Płaszcz. Prowadnice.','Przezroczysty korpus odsłania elementy w ich miejscu montażu. Szczegóły potwierdzimy dla wybranego wariantu.']
 };
 const info=sceneInfo[s.scene],sectionEnvelope=s.scene==='section'?mechanismEnvelope(s,model):null;
 const envelopeHtml=sectionEnvelope?'<div class="envelope-details '+(showEnvelope?'':'is-hidden')+'" aria-hidden="'+(!showEnvelope)+'"><div class="context-specs" aria-label="Wymiary strefy mechanizmu">'+sectionEnvelope.items.map(item=>'<div><span>'+escape(item.label)+'</span><strong>'+escape(item.value)+'</strong></div>').join('')+'</div><p class="context-note">'+escape(sectionEnvelope.note)+'</p></div>':'',envelopeToggle=$('#envelope-toggle');
 if(envelopeToggle){
  const canToggle=Boolean(sectionEnvelope);
  envelopeToggle.hidden=!(s.scene==='section'&&canToggle);
  envelopeToggle.setAttribute('aria-pressed',String(showEnvelope));
  envelopeToggle.textContent=showEnvelope?'Ukryj zajęte miejsce':'Pokaż zajęte miejsce';
 }
 $('#model-context').innerHTML='<span class="context-icon" aria-hidden="true">'+(s.scene==='mechanism'?'↳':'↗')+'</span><div><strong>'+escape(info[0])+'</strong><p>'+escape(info[1])+'</p>'+envelopeHtml+'</div>';
 $('#stage-label').textContent=s.scene==='dimensions'?'Wymiary wewnętrzne — nie uwzględniają grubości płyt.':compare?'LINIA PRZERYWANA: DRUGI SPOSÓB MONTAŻU':s.scene==='section'?'SCHEMAT POGLĄDOWY / NIE DO CIĘCIA':s.orientation==='unknown'?'PRZYKŁADOWY RUCH PIONOWY':spec.split?'OTWIERANIE NA OBIE STRONY':'PRZECIĄGNIJ LISTWĘ UCHWYTOWĄ';
 stageHint.hidden=hasInteracted&&!compare&&s.scene!=='section'&&s.scene!=='dimensions';
 const dims=['width','height','depth'].map(k=>s.dimensions[k]??'?');
 $('#dimensions-caption').textContent=(dims.every(x=>x==='?')?'Przykładowy mebel • podaj własne wymiary':dims.join(' × ')+' mm / S × W × G'+(dims.includes('?')?' • brakujące proporcje poglądowe':''))+(s.scene==='dimensions'?' • wymiary wewnętrzne, bez grubości płyt':'');
 if(!save(s,storage)&&$('#save-note'))$('#save-note').textContent='Zapis na urządzeniu niedostępny — pobierz kartę na końcu.';
 if(s.step===4&&$('#range-feedback'))$('#range-feedback').innerHTML=''+dimensionRangeFeedback(s);
 if(editing){const k=oldFocus.dataset.dimension,error=validateDimension(s.dimensions[k]);$('#error-'+k).textContent=error||'';oldFocus.setAttribute('aria-invalid',Boolean(error));const next=$('[data-action="next"]');if(next)next.disabled=Object.values(s.dimensions).some(v=>validateDimension(v));}
 appCommerce()?.ensureLivePriceForState(s);
}
store.subscribe(s=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>render(s));});render(store.get());
function go(step){
 if(step>store.get().step&&(!canNext(store.get())||Object.values(store.get().dimensions).some(v=>validateDimension(v))))return;
 const patch={step:Math.max(1,Math.min(7,step)),mode:'guided'};
 if(step===4)patch.scene='dimensions';if(step===5)patch.scene='mechanism';if(step===6||step===7)patch.scene='front';
 compare=false;previousKey='';store.update(patch);
}
function download(name,type,text){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener('input',e=>{
 const n=e.target;
 if(n.id==='open-range'){beginInteraction();previewOpen(n.value);return;}
 if(n.dataset.dimension){store.update({dimensions:{[n.dataset.dimension]:n.value===''?null:Number(n.value)}});return;}
 if(n.id==='measure-value'){measureDraft[['width','height','depth'][measureStep]]=n.value===''?null:Number(n.value);validateMeasure();measureRenderer.update({...store.get(),scene:'dimensions',dimensions:measureDraft},{measure:['width','height','depth'][measureStep]});return;}
 if(n.id==='quote-note')$('#quote-mail').href=mailto(quoteDraft(store.get(),n.value));
});
openRange.addEventListener('change',()=>commitOpen());
document.addEventListener('click',async e=>{
 const b=e.target.closest('button,a[data-action]');if(!b)return;
 if(animation||store.get().open!==liveOpen){stopMotion();commitOpen();}
 const s=store.get();
 if(b.dataset.choice){const field=b.dataset.choice;compare=false;const patch={[field]:b.dataset.value};if(field==='orientation'&&b.dataset.value==='horizontal'){patch.mounting='inside';patch.furniture='with-bottom';}if(field==='orientation'||field==='mounting')patch.scene='front';store.update(patch);return;}
 if(b.dataset.product){store.update({selectedProduct:b.dataset.product,finish:null});return;}
 if(b.dataset.finish){store.update({finish:b.dataset.finish});return;}
 if(b.dataset.scene){compare=false;store.update({scene:b.dataset.scene});return;}
 if(b.dataset.step){go(Number(b.dataset.step));return;}
 if(b.dataset.clearDim){previousKey='';document.activeElement?.blur();store.update({dimensions:{[b.dataset.clearDim]:null}});return;}
 if(b.dataset.expert){
  const p=getProduct(b.dataset.expert),orientation=p.orientations.value.includes(s.orientation)?s.orientation:p.orientations.value[0];
  previousKey='';store.update({orientation,mounting:p.mounting.value,selectedProduct:p.id,finish:null,furniture:s.furniture||'with-bottom',step:4,scene:'dimensions',mode:'guided'});
  if(!store.get().selectedProduct)announce('Twoje wymiary wykraczają poza ofertę wybranego systemu. Możesz je poprawić.');return;
 }
 switch(b.dataset.action){
 case 'next':go(s.step+1);break;
 case 'prev':go(s.step===7?6:s.step-1);break;
 case 'edit-start':go(1);break;
 case 'manual':store.update({selectedProduct:null,finish:null,step:7,scene:'front'});break;
 case 'unknown-finish':store.update({finish:null});break;
 case 'expert':store.update({mode:s.mode==='expert'?'guided':'expert'});break;
 case 'demo':store.update({scene:'mechanism'});animateTo(s.open>50?15:85);$('.visual-panel').scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});break;
 case 'toggle-direction':store.update({horizontalDirection:s.horizontalDirection==='left'?'right':'left'});break;
 case 'add-cart':await appCommerce()?.addConfiguredProductToCart(s,b);break;
 case 'animate':animateTo(s.open>50?0:100);break;
 case 'open':animateTo(100);break;
 case 'close':animateTo(0);break;
 case 'toggle-envelope':{
  const scrollPosition=window.scrollY;
  showEnvelope=!showEnvelope;model.shape='';render(store.get());
  window.scrollTo(0,scrollPosition);
  requestAnimationFrame(()=>window.scrollTo(0,scrollPosition));
  break;
 }
 case 'compare':compare=!compare;store.update({scene:'front'});b.setAttribute('aria-pressed',compare);break;
 case 'measure':measureDraft={...s.dimensions};measureStep=0;renderMeasure();$('#measure-dialog').showModal();break;
 case 'close-measure':$('#measure-dialog').close();break;
 case 'measure-back':measureStep=Math.max(0,measureStep-1);renderMeasure();break;
 case 'measure-unknown':measureDraft[['width','height','depth'][measureStep]]=null;advanceMeasure();break;
 case 'measure-next':if(validateMeasure())advanceMeasure();break;
 case 'quote':$('#quote-note').value='';$('#quote-preview').textContent=configurationText(s);$('#quote-mail').href=mailto(quoteDraft(s));$('#quote-dialog').showModal();break;
 case 'close-quote':$('#quote-dialog').close();break;
 case 'close-copy':$('#copy-dialog').close();break;
 case 'copy':try{await navigator.clipboard.writeText(configurationText(s));announce('Konfiguracja skopiowana.');}catch{$('#copy-text').value=configurationText(s);$('#copy-dialog').showModal();$('#copy-text').select();}break;
 case 'download-text':download(configurationId(s)+'.txt','text/plain;charset=utf-8',quoteDraft(s,$('#quote-note').value).body);break;
 case 'export-svg':download(configurationId(s)+'.svg','image/svg+xml',model.exportSvg());break;
 case 'print':window.print();break;
 }
});
function validateMeasure(){const error=validateDimension(measureDraft[['width','height','depth'][measureStep]]);$('#measure-error').textContent=error||'';$('#measure-value').setAttribute('aria-invalid',Boolean(error));$('[data-action="measure-next"]').disabled=Boolean(error);return !error;}
function advanceMeasure(){if(measureStep<2){measureStep++;renderMeasure();}else{previousKey='';store.update({dimensions:measureDraft});$('#measure-dialog').close();announce('Wymiary zapisane w konfiguracji.');}}
function renderMeasure(){
 const key=['width','height','depth'][measureStep],s=store.get();
 const instructions={width:'Przyłóż miarkę do lewej wewnętrznej ścianki. Zmierz odległość do prawej wewnętrznej ścianki.',height:s.furniture==='without-bottom'?'Mierz od spodu górnej płyty do planowanej dolnej krawędzi zamknięcia rolety.':'Mierz wewnątrz: od spodu górnej płyty do górnej powierzchni dolnej płyty.',depth:'Mierz od wewnętrznej krawędzi frontu w głąb szafki, do przedniej powierzchni pleców.'};
 $('#measure-content').innerHTML='<span class="eyebrow">POMÓŻ MI ZMIERZYĆ / 0'+(measureStep+1)+' Z 03</span><h2 id="measure-title" tabindex="-1">Zmierz '+({width:'szerokość.',height:'wysokość.',depth:'głębokość.'}[key])+'</h2><div class="measurement-progress">'+[0,1,2].map(i=>'<i class="'+(i<=measureStep?'active':'')+'"></i>').join('')+'</div><div class="measurement-drawing" id="measure-model"></div><p class="measurement-hint">'+instructions[key]+'</p><label for="measure-value">'+dimensionLabels[key]+' wnętrza korpusu</label><div class="input-wrap"><input type="number" id="measure-value" min="1" max="10000" step="1" inputmode="numeric" placeholder="Wpisz wymiar" value="'+(measureDraft[key]??'')+'" aria-describedby="measure-error"><span>mm</span></div><p class="field-error" id="measure-error"></p><div class="measure-actions"><button data-action="measure-back" '+(measureStep===0?'disabled':'')+'>← Wstecz</button><button class="btn primary" data-action="measure-next">'+(measureStep===2?'Zapisz wymiary':'Dalej')+' →</button></div>';
 measureRenderer?.dispose();measureRenderer=new CabinetRenderer($('#measure-model'),{interactive:false});measureRenderer.update({...s,scene:'dimensions',dimensions:measureDraft,open:100},{measure:key});validateMeasure();$('#measure-title').focus({preventScroll:true});
}
window.addEventListener('offline',()=>announce('Jesteś offline. Możesz nadal konfigurować; wiadomość wyślesz po połączeniu.'));
window.addEventListener('beforeprint',()=>{$$('.summary-details').forEach(d=>d.open=true);});
