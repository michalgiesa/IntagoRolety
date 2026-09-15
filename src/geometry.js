
import {getProduct,getVariant} from '../systems-data.js';

// Millimetres, one immutable cabinet coordinate system: x right, y down, z inward.
// Profile dimensions: RAUVOLET noble matt, supplied PDF pp. 5–7.
// INTAGO variant mapping and all installation offsets still need confirmation.
// Occupied track depth: 35 mm, confirmed by the client; separate from visible face width.
// bendHeight 48.5 mm is the client example, needsVerification for each system.
export const guideProfiles={
 nobleMatt:{pitch:26.5,slatThickness:8,handle:75,handleDepth:8,face:29,guideThickness:35,bendHeight:48.5,fascia:73.2,fasciaDepth:17,profileStatus:'verified',status:'needsVerification'},
 standard:{pitch:25,slatThickness:8,handle:46,handleDepth:28,face:13,guideThickness:35,channel:9.5,lip:4,bendHeight:48.5,fascia:46,fasciaDepth:28,profileStatus:'needsVerification',status:'needsVerification'}
};
// TODO: wymiar niepotwierdzony — podziałka pojedynczego elementu E23; 45 mm dotyczy zespołu trzech elementów, zachowano dotychczasowe 25 mm.
// TODO: wymiar niepotwierdzony — przekrój TOP dla NOBLE WEW i jego listwa maskująca; zachowano wcześniejsze wartości.
// TODO: wymiar niepotwierdzony — promień osi narożnika; 48.5 mm jest obrysem, nie promieniem osi toru.
const technicalProfile=state=>state.selectedProduct==='noble-zewn'?{...guideProfiles.nobleMatt,guideThickness:29,projection:16,guideDepth:19}:String(state.selectedProduct).includes('noble')?guideProfiles.nobleMatt:guideProfiles.standard;
function visualDimensions(state){
 const variant=getVariant(getProduct(state.selectedProduct),state.orientation),profile=variant?.rangeProfile;
 let width=Number(state.dimensions.width)||700,height=Number(state.dimensions.height)||1050,depth=Number(state.dimensions.depth)||400;
 if(profile==='c6'){
  width=Math.max(200,Math.min(1200,width));
  height=Math.max(350,Math.min(width<=800?1050:width<=1100?700:525,height));
 }
 if(profile==='c3'){
  width=Math.max(400,Math.min(1200,width));
  height=Math.max(650,Math.min(width<600?1900:2200,height));
 }
 return {width,height,depth};
}
export class CabinetGeometry{
 constructor(state,spec={}){
  const shown=visualDimensions(state);
  this.width=shown.width;this.height=shown.height;this.depth=Math.max(1,Math.min(10000,shown.depth));
  this.thickness=Math.min(18,this.width/8,this.height/8,this.depth/8);
  this.hasBottom=state.furniture!=='without-bottom';
  const {width:w,height:h,depth:d,thickness:t}=this;
  this.rearReturn=state.orientation!=='horizontal'&&spec.path==='rear';
  const profile=technicalProfile(state);
  this.guideThickness=profile.guideThickness;this.bendHeight=profile.bendHeight;
  this.rearBand=profile.guideThickness;this.frontBand=this.rearBand;this.topBand=Math.min(profile.bendHeight,h*.14);
  this.backOuter=d+t;this.backDepth=this.rearReturn?d-this.rearBand:d;
  this.backTop=this.rearReturn?this.topBand:0;
  this.shelves=[.46,.75].map(level=>({y:h*level,front:Math.min(62,d*.25),back:Math.max(0,this.backDepth-1),thickness:Math.min(18,h*.025)}));
  const dx=.42,dy=.22;
  this.scale=Math.min(570/(w+2*t+d*dx),530/(h+2*t+d*dy));
  this.mmToSvg=(mm,axis='x',scale=this.scale)=>mm*scale*(axis==='depthX'?dx:axis==='depthY'?dy:1);
  this.ox=(760-(w+d*dx)*this.scale)/2;
  this.oy=(605-(h+d*dy)*this.scale)/2+d*dy*this.scale;
  this.project=([x,y,z])=>[this.ox+(x+z*dx)*this.scale,this.oy+(y-z*dy)*this.scale];
 }
}
export class GuideSystem{
 constructor(cabinet,spec,state){
  const profile=technicalProfile(state);
  Object.assign(this,profile);this.horizontal=state.orientation==='horizontal';this.split=spec.split;
  const {width:w,height:h,depth:d,thickness:t}=cabinet;
  this.mounting=spec.mounting;
  // Outside guides cover the panel edge; inset guides consume the clear opening.
  this.face=profile.face;
  this.inset=spec.mounting==='outside'?-t:0;
  this.z=spec.mounting==='outside'?-(profile.guideDepth||12):profile.guideThickness/2;
  this.left=this.inset;this.right=w-this.inset;
  this.top=spec.mounting==='outside'?-t:0;
  this.bottom=spec.mounting==='outside'&&cabinet.hasBottom?h+t:h;
  this.width=this.right-this.left;this.height=this.bottom-this.top;
  this.handle=profile.handle;
  this.fascia=profile.fascia;
  this.length=this.horizontal?this.width/(this.split?2:1):this.height;
  this.travel=Math.max(1,this.length-this.handle-this.fascia);
  this.depth=Math.max(1,d-this.z-12);
  if(cabinet.rearReturn)this.depth=Math.max(1,cabinet.backOuter-cabinet.rearBand/2-this.z);
  this.toCabinet=([x,y,z])=>[x+this.left,y+this.top,z+this.z];
  this.point=point=>cabinet.project(this.toCabinet(point));
 }
}
