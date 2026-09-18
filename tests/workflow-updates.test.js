import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createState} from '../src/state.js';
import {serialize,deserialize} from '../src/persistence.js';
import {configurationId,configurationText} from '../src/quote.js';
import {renderWizard} from '../src/wizard.js';

const html=fs.readFileSync(new URL('../client-package/INTAGO-Rolety-Demo.html',import.meta.url),'utf8');
const sourceMarker=html.indexOf('/* systems-data.js */');
const scriptOpen=html.lastIndexOf('<script>',sourceMarker);
const script=html.slice(scriptOpen+8,html.indexOf('</script>',sourceMarker));
new vm.Script(script);
let requestedPriceUrl=null,requestedPriceOptions=null;
const context=vm.createContext({
 URL,AbortController,setTimeout,clearTimeout,console,
 location:{origin:'https://www.intago.com.pl',hostname:'www.intago.com.pl'},
 fetch:async(url,options)=>{
  requestedPriceUrl=url;requestedPriceOptions=options;
  return {ok:true,status:200,text:async()=>'<script>var variants=[]; variants[39]={id:614,price:664.00,user_price:664.00,prev_price:null};</script>'};
 }
});
const api=vm.runInContext(script.slice(0,script.indexOf('/* app.js */'))+';({createState,serialize,deserialize,configurationId,configurationText,renderWizard,cartSelectionFor,cartAjaxUrlFor,staticPriceFor,priceFor,parseSellyVariantPrice,fetchSellyVariantPrice,sellyProductPageUrl,SELLY_LIVE_PRICE_CACHE,SELLY_LIVE_PRICE_FAILURES});',context);
const state=()=>({...createState(),step:4,orientation:'horizontal',horizontalDirection:'left',mounting:'inside',furniture:'with-bottom',selectedProduct:'top-basic',finish:'white',dimensions:{width:800,height:700,depth:400}});

test('direction survives persistence and appears in configuration identity and summary',()=>{
 for(const lib of [{serialize,deserialize,configurationId,configurationText},api]){
  const s=state();
  assert.equal(lib.deserialize(lib.serialize(s)).horizontalDirection,'left');
  assert.notEqual(lib.configurationId(s),lib.configurationId({...s,horizontalDirection:'right'}));
  assert.match(lib.configurationText(s),/w lewo/);
 }
});
test('dimension cards retain mismatch state without the removed long guidance',()=>{
 for(const render of [renderWizard,api.renderWizard]){
  const markup=render({...state(),dimensions:{width:800,height:2500,depth:400}});
  assert.match(markup,/range-outside/);
  assert.doesNotMatch(markup,/Dlaczego o to pytamy|Podaj wymiary wewnętrzne|Nie znasz któregoś|<p class="range-error">/);
 }
});
test('native Selly request includes complete per-item cutting configuration',()=>{
 const s=state(),base=api.staticPriceFor(s);
 api.SELLY_LIVE_PRICE_CACHE.set(`${base.productId}:${base.variantId}`,{gross:929,ts:Date.now()});
 const payload=api.cartSelectionFor(s);
 assert.ok(payload,'fixture has an exact purchase variant');
 const request=new URL(api.cartAjaxUrlFor(payload));
 assert.equal(request.searchParams.get('a'),'cart.addAjax');
 assert.equal(request.searchParams.get('komentarz'),payload.orderNotes);
 for(const text of ['TOP BASIC','800 × 700 × 400 mm','Biały','w lewo','wewnętrzne'])assert.ok(payload.orderNotes.toLocaleLowerCase('pl').includes(text.toLocaleLowerCase('pl')),text);
 const second=api.cartSelectionFor({...s,dimensions:{...s.dimensions,width:810}});
 assert.notEqual(payload.orderNotes,second.orderNotes);
 assert.equal(payload.dimensions.width,800);
});
test('public Selly product page provides the exact live price without a cart mutation',async()=>{
 api.SELLY_LIVE_PRICE_CACHE.clear();
 api.SELLY_LIVE_PRICE_FAILURES.clear();
 requestedPriceUrl=null;requestedPriceOptions=null;
 const gross=await api.fetchSellyVariantPrice(6346,614);
 assert.equal(gross,664);
 assert.equal(api.parseSellyVariantPrice('variants[39]={id:614,price:663.00,user_price:664.00};',614),664);
 assert.equal(api.parseSellyVariantPrice('variants[38]={id:613,price:663.00,user_price:663.00};',614),null);
 const request=new URL(requestedPriceUrl);
 assert.equal(request.pathname,'/roleta-meblowa-na-wymiar-top-basic,id6346.html');
 assert.equal(request.searchParams.has('a'),false);
 assert.equal(request.searchParams.has('wariant_id'),false);
 assert.equal(requestedPriceOptions.method,'GET');
 assert.equal(requestedPriceOptions.cache,'no-store');
 const liveState={...createState(),step:7,orientation:'vertical',selectedProduct:'top-basic',finish:'white',dimensions:{width:500,height:900,depth:400}};
 const markup=api.renderWizard(liveState);
 assert.match(markup,/664\s*zł/);
 assert.match(markup,/data-action="add-cart"/);
});
test('stale PRICE_VARIANTS amount is never shown as the current Selly price',()=>{
 api.SELLY_LIVE_PRICE_CACHE.clear();
 api.SELLY_LIVE_PRICE_FAILURES.set('6346:614',Date.now());
 const s={...createState(),orientation:'vertical',selectedProduct:'top-basic',finish:'white',dimensions:{width:500,height:900,depth:400}};
 const price=api.priceFor(s);
 assert.equal(api.staticPriceFor(s).variantId,614);
 assert.equal(price.label,'Cena chwilowo niedostępna');
 assert.equal(price.gross,null);
 assert.notEqual(price.label,'663 zł');
 assert.match(api.renderWizard({...s,step:7}),/Cena chwilowo niedostępna/);
});
test('PRICE_VARIANTS remains only a configuration-to-variant map',()=>{
 const fixtures=[
  [{...createState(),orientation:'vertical',selectedProduct:'top-basic',finish:'silver',dimensions:{width:200,height:350,depth:300}},575,6346],
  [{...createState(),orientation:'vertical',selectedProduct:'top-basic',finish:'white',dimensions:{width:500,height:900,depth:400}},614,6346],
  [state(),998,7716]
 ];
 for(const [s,variantId,productId] of fixtures){
  const mapped=api.staticPriceFor(s);
  assert.equal(mapped.variantId,variantId);
  assert.equal(mapped.productId,productId);
  assert.equal(mapped.gross,null);
 }
 assert.equal(api.parseSellyVariantPrice('variants[0]={id:700,price:null,user_price:null};',700),null);
 const missing=api.staticPriceFor({...fixtures[0][0],dimensions:{width:5000,height:5000,depth:300}});
 assert.equal(missing.label,'Cena po wycenie');
});
test('step five opens the mechanism view in both applications',()=>{
 const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
 for(const app of [source,script]){
  let patch;
  const sandbox=vm.createContext({store:{get:()=>state(),update:p=>{patch=p;}},canNext:()=>true,validateDimension:()=>null,compare:false,previousKey:''});
  vm.runInContext(app.match(/function go\(step\)\{[\s\S]*?\n\}/)[0]+';go(5);',sandbox);
  assert.equal(patch.scene,'mechanism');
 }
});
