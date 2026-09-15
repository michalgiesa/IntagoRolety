import {getProduct,products,getVariant,orientations,mountings,availableFinishes} from '../systems-data.js';
export const STATUS={COMPATIBLE:'COMPATIBLE',INCOMPATIBLE:'INCOMPATIBLE',NEEDS_VERIFICATION:'NEEDS_VERIFICATION'};
export const dimensionLabels={width:'Szerokość',height:'Wysokość',depth:'Głębokość'};
export function validateDimension(value){
 if(value===null||value==='')return null;
 if(!Number.isFinite(Number(value))||Number(value)<=0)return 'Wpisz liczbę większą od zera albo wybierz „Nie znam wymiaru”.';
 if(Number(value)>10000)return 'Sprawdź jednostkę. Podaj mm (maks. 10 000) lub zostaw do ustalenia.';
 if(!Number.isInteger(Number(value)))return 'Podaj wymiar w pełnych milimetrach.';
 return null;
}
export function profileHeightMax(profile,width){
 if(profile==='c6')return width<=800?1050:width<=1100?700:525;
 if(profile==='c3')return width<600?1900:2200;
 return Infinity;
}
export function evaluate(product,state){
 const reasons=[],rejections=[],missing=[],evidence=[];let score=0;
 const known=v=>v&&v!=='unknown';
 if(known(state.orientation)){
  if(!product.orientations.value.includes(state.orientation))rejections.push('Ten wariant nie obsługuje ruchu poziomego.');
  else{score+=30;reasons.push('Obsługuje otwieranie '+orientations[state.orientation].toLowerCase()+'.');evidence.push(product.orientations);}
 }else missing.push('Kierunek otwierania do ustalenia.');
 if(known(state.mounting)){
  if(product.mounting.status!=='verified')missing.push('Sposób montażu wymaga potwierdzenia.');
  else if(product.mounting.value!==state.mounting)rejections.push('Wymaga montażu: '+mountings[product.mounting.value].toLowerCase()+'.');
  else{score+=20;reasons.push('Montaż: '+mountings[state.mounting].toLowerCase()+'.');evidence.push(product.mounting);}
 }else missing.push('Sposób montażu do ustalenia.');
 const v=getVariant(product,state.orientation);
 for(const key of ['width','height','depth']){
  const val=state.dimensions[key],rule=v?.dimensions[key];
  if(val===null){missing.push(dimensionLabels[key]+' nie została podana.');continue;}
  const invalid=validateDimension(val);
  if(invalid){rejections.push(dimensionLabels[key]+': '+invalid);continue;}
  if(!rule||rule.status!=='verified'){missing.push(dimensionLabels[key]+': brak potwierdzonego zakresu.');continue;}
  const {min,max}=rule.value;
  if((min!==undefined&&val<min)||(max!==undefined&&val>max))rejections.push(dimensionLabels[key]+' '+val+' mm poza ofertą ('+(min===undefined?'do '+max:max===undefined?'od '+min:min+'–'+max)+' mm).');
  else{score+=8;reasons.push(dimensionLabels[key]+' '+val+' mm mieści się w opublikowanym zakresie.');evidence.push(rule);}
 }
 if(v?.rangeProfile&&Number.isFinite(Number(state.dimensions.width))&&Number.isFinite(Number(state.dimensions.height))){
  const maxHeight=profileHeightMax(v.rangeProfile,Number(state.dimensions.width));
  if(Number(state.dimensions.height)>maxHeight)rejections.push('Dla szerokości '+state.dimensions.width+' mm maksymalna wysokość w tym systemie wynosi '+maxHeight+' mm.');
 }
 if(!v)missing.push('Szczegóły wariantu ustalimy po wyborze kierunku.');
 else{
  if(v.mechanism.status!=='verified')missing.push('Dokładny mechanizm i przebieg płaszcza do potwierdzenia.');
  if(v.clearance.status!=='verified')missing.push('Miejsce na mechanizm i odsunięcie półek do ustalenia.');
  if(v.combination.status!=='verified')missing.push(v.combination.notes+'.');
  if(v.profile.status!=='verified')missing.push('Profil szczebla do potwierdzenia.');
  if(state.finish&&state.selectedProduct===product.id){
   if(!availableFinishes(product,state.orientation).some(f=>f.id===state.finish))rejections.push('To wykończenie nie jest potwierdzone dla wybranego wariantu.');
  }else missing.push('Wykończenie do wyboru lub potwierdzenia.');
 }
 if(state.furniture==='with-bottom')reasons.push('Model uwzględnia dolną płytę korpusu.');
 if(state.furniture==='without-bottom')reasons.push('Model uwzględnia szafkę bez dolnej płyty.');
 const status=rejections.length?STATUS.INCOMPATIBLE:missing.length?STATUS.NEEDS_VERIFICATION:STATUS.COMPATIBLE;
 return {product,status,score,reasons,rejections,missing:[...new Set(missing)],evidence};
}
export function recommend(state,limit=3){return products.map(p=>evaluate(p,state)).filter(r=>r.status!==STATUS.INCOMPATIBLE).sort((a,b)=>b.score-a.score||a.product.name.localeCompare(b.product.name,'pl')).slice(0,limit);}
export function visualSpec(state){
 const product=products.find(p=>p.id===state.selectedProduct),v=getVariant(product,state.orientation);
 return {path:v?.mechanism.value==='c3'?'coil':'rear',mechanismVerified:v?.mechanism.status==='verified',
 split:Boolean(state.orientation==='horizontal'&&v?.splitAt?.status==='verified'&&state.dimensions.width>=v.splitAt.value),
 mounting:!state.mounting||state.mounting==='unknown'?(product?.mounting.value||'inside'):state.mounting,
 schematic:!v||v.mechanism.status!=='verified'};
}

export function mechanismEnvelope(state,renderer){
 const product=getProduct(state.selectedProduct),variant=getVariant(product,state.orientation),mechanismId=variant?.mechanism?.value;
 if(!product||!variant)return null;
 const cabinetHeight=Math.max(1,Number(state.dimensions.height)||renderer?.geometry?.height||1050);
 const cabinetDepth=Math.max(1,Number(state.dimensions.depth)||renderer?.geometry?.depth||400);
 const cabinetWidth=Math.max(1,Number(state.dimensions.width)||renderer?.geometry?.width||700);
 const guide=renderer?.guide||{};
 const face=Math.max(18,Math.round(guide.face||(String(product.id).includes('noble')?29:20)));
 const fascia=Math.max(face,Math.round(guide.fascia||(String(product.id).includes('noble')?73.2:45)));
 const label='Zajęte miejsce wewnątrz szafki';
 const outsideNote=((state.mounting&&state.mounting!=='unknown'?state.mounting:product.mounting.value)==='outside')?' Prowadnice są nakładane na korpus, więc obrys pokazuje tylko pole pracy widoczne w świetle szafki.':'';
 if(state.orientation==='horizontal'){
  const sideBand=guide.guideThickness||35;
  const rearBand=sideBand;
  const split=Boolean(guide.split);
  return {
   key:'rear-envelope-horizontal',
   label,
   mode:'horizontal-l',band:sideBand,split,
   // Jeden płaszcz biegnie przy froncie, prawej stronie i z tyłu.
   // Przy dwóch płaszczach zajęte są obie strony.
   points3d:split
    ?[[0,0,0],[cabinetWidth,0,0],[cabinetWidth,0,cabinetDepth],[0,0,cabinetDepth]]
    :[[0,0,0],[cabinetWidth,0,0],[cabinetWidth,0,cabinetDepth],[0,0,cabinetDepth],[0,0,cabinetDepth-rearBand],[cabinetWidth-sideBand,0,cabinetDepth-rearBand],[cabinetWidth-sideBand,0,sideBand],[0,0,sideBand]],
   inner3d:split?[[sideBand,0,sideBand],[cabinetWidth-sideBand,0,sideBand],[cabinetWidth-sideBand,0,cabinetDepth-sideBand],[sideBand,0,cabinetDepth-sideBand]]:null,
   items:[
    {label:'Grubość każdego pasa',value:sideBand+' mm — grubość prowadnicy'},
    {label:split?'Prowadnice po bokach':'Prowadnica po prawej',value:sideBand+' mm'},
    {label:'Tylna krawędź pola',value:'0 mm od tylnej ścianki'},
    {label:'Wewnętrzna krawędź pasa tylnego',value:Math.max(0,cabinetDepth-rearBand)+' mm od frontu korpusu'}
   ],
   note:'Poglądowy obrys pokazuje wyłącznie strony, po których porusza się roleta: front, '+(split?'oba boki':'prawy bok')+' i tył. Każdy pas ma 35 mm.'+outsideNote
  };
 }
 if(mechanismId==='c3'){
  const requiredHeight=cabinetHeight<600?120:cabinetHeight<=1000?140:cabinetHeight<=1500?160:190;
  const requiredDepth=330;
  const rollDiameter=requiredHeight-10;
  return {
   key:'c3-envelope',
   label,
   mode:'rect',
   top:0,
   bottom:Math.min(cabinetHeight,requiredHeight),
   front:0,
   rear:Math.min(cabinetDepth,requiredDepth),
   requiredHeight,
   requiredDepth,rollDiameter,diameterStatus:"approximate",
   heightClipped:cabinetHeight<requiredHeight,
   depthClipped:cabinetDepth<requiredDepth,
   points3d:[[0,0,0],[0,0,Math.min(cabinetDepth,requiredDepth)],[0,Math.min(cabinetHeight,requiredHeight),Math.min(cabinetDepth,requiredDepth)],[0,Math.min(cabinetHeight,requiredHeight),0]],
   items:[
    {label:'Górna krawędź',value:'0 mm od górnej ścianki'},
    {label:'Dolna krawędź',value:requiredHeight+' mm od górnej ścianki'},
    {label:'Przednia krawędź',value:'0 mm od frontu korpusu'},
    {label:'Tylna krawędź',value:requiredDepth+' mm od frontu korpusu'}
   ],
   note:'Strefa C3 i przybliżona średnica pełnego zwoju według tabeli klienta (do 2200 mm wysokości korpusu).'+(cabinetDepth<requiredDepth?' Ta konfiguracja potrzebuje minimum '+requiredDepth+' mm głębokości.':'')+(cabinetHeight<requiredHeight?' Ta konfiguracja potrzebuje minimum '+requiredHeight+' mm wysokości w świetle korpusu.':'')+outsideNote
  };
 }
 const rearBand=renderer?.geometry?.rearBand??Math.max(18,Math.round(face));
 const topBand=renderer?.geometry?.topBand??Math.max(rearBand,Math.round(fascia));
 const rearOuter=renderer?.geometry?.backOuter??cabinetDepth;
 const rearInner=rearOuter-rearBand;
 return {
  key:'rear-envelope-vertical',
  label,
  mode:'vertical-l',
  points3d:[[0,0,0],[0,0,rearOuter],[0,cabinetHeight,rearOuter],[0,cabinetHeight,rearInner],[0,Math.min(cabinetHeight,topBand),rearInner],[0,Math.min(cabinetHeight,topBand),rearBand],[0,cabinetHeight,rearBand],[0,cabinetHeight,0]],
  items:[
   {label:'Górna krawędź',value:'0 mm od górnej ścianki'},
   {label:'Dolna krawędź pasa górnego',value:Math.min(cabinetHeight,topBand)+' mm od górnej ścianki'},
   {label:'Pas przedni i tylny',value:rearBand+' mm — grubość prowadnicy'},
   {label:'Wewnętrzna krawędź pasa tylnego',value:rearBand+' mm od zewnętrznej krawędzi pleców'},
   {label:'Tylna krawędź pola',value:'Zewnętrzna krawędź korpusu'}
  ],
  note:'Poglądowy obrys pokazuje miejsce, które zajmuje mechanizm z powrotem płaszcza: pas od spodu górnej płyty w dół oraz pas od zewnętrznej krawędzi pleców do wnętrza. Plecy są przesunięte przed strefę i skrócone od góry. Wymiary pasów są poglądowe, do potwierdzenia dla systemu.'+outsideNote
 };
}
