import test from 'node:test';
import assert from 'node:assert/strict';
import {CabinetRenderer,makeRoute} from '../src/renderer.js';

const node=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];}});
for(const horizontal of [false,true])test(`rear curtain is revealed only through the side (${horizontal?'horizontal':'vertical'})`,()=>{
 const route=makeRoute({width:700,height:1050,depth:400,horizontal,radius:25});
 const renderer=Object.create(CabinetRenderer.prototype);
 Object.assign(renderer,{id:'test',horizontal,spec:{path:'rear'},routes:[route],handles:[],reflection:node(),pitch:25,curtainLength:1000,
  guide:{width:700,height:1050,depth:400,face:13,handle:46,travel:1000,point:p=>[p[0]+p[2]*.42,p[1]-p[2]*.22]},
  slats:Array.from({length:40},(_,i)=>({front:node(),back:node(),i,k:0}))});
 let rearCount=0,topCount=0;
 for(const open of [0,20,40,60,80,100,60,0]){
  renderer.setOpen(open);
  for(const {i,back} of renderer.slats){
   const a=route.at(open/100*1000+46+i*25);
   const b=route.at(open/100*1000+46+(i+1)*25-.65);
   if(Math.min(a[2],b[2])>399){assert.equal(back.attrs['clip-path'],'url(#test-stored-side)');rearCount++;}
   if(!horizontal&&a[2]>50&&b[2]<350&&Math.abs(a[1]-b[1])<.01){assert.equal(back.attrs['clip-path'],undefined);topCount++;}
   if(horizontal&&back.attrs.visibility==='visible')assert.equal(back.attrs['clip-path'],'url(#test-stored-side)');
  }
 }
 assert.ok(rearCount>0);
 if(!horizontal)assert.ok(topCount>0);
});
