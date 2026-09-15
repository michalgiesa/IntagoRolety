import {getProduct,getVariant,finishes,orientations,mountings,furniture,mechanisms,DATA_VERSION} from '../systems-data.js';
import {evaluate} from './engine.js';
export function configurationId(state){
 const data=JSON.stringify([state.orientation,state.mounting,state.furniture,state.dimensions,state.selectedProduct,state.finish,DATA_VERSION]);
 let a=2166136261,b=5381;for(let i=0;i<data.length;i++){a=Math.imul(a^data.charCodeAt(i),16777619);b=Math.imul(b,33)^data.charCodeAt(i);}
 return ('INT-'+(a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0')).toUpperCase();
}
export function configurationText(s){
 const p=getProduct(s.selectedProduct),v=getVariant(p,s.orientation),f=finishes[s.finish],r=p?evaluate(p,s):null;
 return ['INTAGO / KARTA KONFIGURACJI / '+configurationId(s),'Wersja danych: '+DATA_VERSION,
 'Wariant: '+(p?.name||'Dobór indywidualny'),'Otwieranie: '+(orientations[s.orientation]||'Do ustalenia'),'Montaż: '+(mountings[s.mounting]||'Do ustalenia'),'Dno szafki: '+(furniture[s.furniture]||'Do ustalenia'),
 'Wymiary wewnętrzne S × W × G: '+['width','height','depth'].map(k=>s.dimensions[k]??'?').join(' × ')+' mm',
 'Wykończenie: '+(f?f.name+(f.code?' / '+f.code:''):'Do ustalenia'),
 'Mechanizm: '+(v?.mechanism.status==='verified'?mechanisms[v.mechanism.value].name:'Do potwierdzenia'),
 'Status: '+(r?.status||'NEEDS_VERIFICATION'),'','POWODY DOBORU',...(r?.reasons||['Wymagany dobór indywidualny.']),'','DO POTWIERDZENIA',...(r?.missing||['Wariant, wykonalność, mechanizm i wykończenie.']),
 '','Rysunek poglądowy. Karta jest podstawą zapytania, nie dokumentacją cięcia.'].join('\n');
}
// Adapter przygotowuje wiadomość. Użytkownik sam ją sprawdza i wysyła.
export function quoteDraft(state,note=''){return {to:'sklep@intago.pl',subject:'Zapytanie o roletę '+configurationId(state),body:configurationText(state)+(note?'\n\nUwagi: '+note:'')};}
export function mailto(draft){return 'mailto:'+draft.to+'?subject='+encodeURIComponent(draft.subject)+'&body='+encodeURIComponent(draft.body);}
