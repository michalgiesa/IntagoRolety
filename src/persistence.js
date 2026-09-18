import {createState,reconcile} from './state.js';
import {validateDimension} from './engine.js';
import {getProduct,finishes,furniture} from '../systems-data.js';
export const STORAGE_KEY='intago-rolety-v3';
export const serialize=state=>JSON.stringify({version:3,state});
export function deserialize(raw){
 try{
  const data=JSON.parse(raw);if(data.version!==3||!data.state||typeof data.state!=='object')return null;
  const x=data.state,s=createState();
  for(const k of ['orientation','mounting']){const valid=k==='orientation'?['vertical','horizontal','unknown']:['inside','outside','unknown'];s[k]=valid.includes(x[k])?x[k]:null;}
  s.furniture=Object.hasOwn(furniture,x.furniture)?x.furniture:null;
  s.horizontalDirection=x.horizontalDirection==='left'?'left':'right';
  for(const k of ['width','height','depth']){const n=x.dimensions?.[k];s.dimensions[k]=typeof n==='number'&&!validateDimension(n)?n:null;}
  s.selectedProduct=getProduct(x.selectedProduct)?.id||null;s.finish=Object.hasOwn(finishes,x.finish)?x.finish:null;
  s.open=typeof x.open==='number'&&Number.isFinite(x.open)?Math.max(0,Math.min(100,x.open)):35;
  s.scene=['front','interior','mechanism','dimensions','section','exploded'].includes(x.scene)?x.scene:'front';
  s.mode=x.mode==='expert'?'expert':'guided';s.step=Number.isInteger(x.step)?Math.max(1,Math.min(7,x.step)):1;
  reconcile(s);
  if(!s.orientation)s.step=1;else if(!s.mounting)s.step=Math.min(s.step,2);else if(!s.furniture)s.step=Math.min(s.step,3);
  if(s.step===6&&!s.selectedProduct)s.step=5;
  return s;
 }catch{return null;}
}
export function save(state,storage){try{storage.setItem(STORAGE_KEY,serialize(state));return true;}catch{return false;}}
export function restore(storage){try{return deserialize(storage.getItem(STORAGE_KEY));}catch{return null;}}
