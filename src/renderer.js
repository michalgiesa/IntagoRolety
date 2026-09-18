import {finishes} from '../systems-data.js';
import {visualSpec,mechanismEnvelope} from './engine.js';
import {CabinetGeometry,GuideSystem} from './geometry.js';
const NS='http://www.w3.org/2000/svg';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=n=>Math.round(n*100)/100;
const poly=points=>points.map(p=>p.map(fmt).join(',')).join(' ');
const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
let nextId=0;
// Arc-length sampling in millimetres. Installation radii are illustrative.
export function makeRoute({width:w,height:h,depth:d,horizontal=false,path='rear',mirror=false,radius=55,ceiling=0,coil=null}){
 const points=[],r=Math.max(.1,Math.min(radius,d*.3,(horizontal?w:h)*.15));
 let entry=horizontal?[mirror?r:w-r,0,0]:[0,ceiling+r,0];
 const push=(x,y,z)=>points.push([mirror?w-x:x,y,z]);
 if(!horizontal){
  if(path==='coil'&&coil){
   // 8 mm curtain thickness is included in the supplied outer diameter.
   const rr0=coil.diameter/2-4,cy=coil.y,cz=coil.z,lead=24;
   entry=[0,cy+lead,0];
   for(let y=h;y>cy+lead;y-=8)push(0,y,0);push(...entry);
   for(let i=1;i<=32;i++){const u=i/32;push(0,cy+lead*(1-u),(cz-rr0)*(u*u*(3-2*u)));}
   const turns=Math.max(Math.PI*6,h*2.8/rr0),steps=Math.ceil(turns/.035);
   for(let i=0;i<=steps;i++){const angle=turns*i/steps,rr=rr0*(1-.6*i/steps);push(0,cy-rr*Math.sin(angle),cz-rr*Math.cos(angle));}
  }else{
   for(let y=h;y>r+ceiling;y-=8)push(0,y,0);push(0,r+ceiling,0);
   for(let i=0;i<=40;i++){const a=i*Math.PI/80;push(0,ceiling+r-r*Math.sin(a),r-r*Math.cos(a));}
   for(let z=r;z<d-r;z+=8)push(0,ceiling,z);
   for(let i=0;i<=40;i++){const a=i*Math.PI/80;push(0,ceiling+r-r*Math.cos(a),d-r+r*Math.sin(a));}
   for(let y=ceiling+r;y<h;y+=8)push(0,y,d);push(0,h,d);
  }
 }else{
  for(let x=0;x<w-r;x+=8)push(x,0,0);push(w-r,0,0);
  for(let i=0;i<=40;i++){const a=i*Math.PI/80;push(w-r+r*Math.sin(a),0,r-r*Math.cos(a));}
  for(let z=r;z<d-r;z+=8)push(w,0,z);
  for(let i=0;i<=40;i++){const a=i*Math.PI/80;push(w-r+r*Math.cos(a),0,d-r+r*Math.sin(a));}
  for(let x=w-r;x>-100;x-=8)push(x,0,d);
 }
 const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(...points[i].map((v,k)=>v-points[i-1][k])));
 const at=t=>{t=clamp(t,0,lengths.at(-1));let lo=0,hi=lengths.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(lengths[mid]<t)lo=mid;else hi=mid;}const f=(t-lengths[lo])/(lengths[hi]-lengths[lo]||1);return points[lo].map((v,k)=>v+(points[hi][k]-v)*f);};
 return {at,length:lengths.at(-1),points,entry,rearDepth:d-r};
}
export class CabinetRenderer{
 constructor(host,{onOpen=()=>{},onCommit=()=>{},onStart=()=>{},interactive=true}={}){
  Object.assign(this,{host,onOpen,onCommit,onStart,interactive});this.id='cab'+(++nextId);this.drag=null;this.dragFrame=0;
  this.svg=el('svg',{viewBox:'0 0 760 630',class:'cabinet-svg',preserveAspectRatio:'xMidYMid meet','aria-label':'Model szafki z roletą meblową'});host.replaceChildren(this.svg);
  this.svg.addEventListener('pointerdown',e=>{
   const handle=e.target.closest('[data-handle]');if(!handle||!interactive||this.drag||e.button!==0)return;
   e.preventDefault();this.onStart();
   const inv=this.svg.getScreenCTM().inverse(),p=new DOMPoint(e.clientX,e.clientY).matrixTransform(inv);
   this.drag={id:e.pointerId,inv,start:p,open:this.open,mirror:handle.dataset.handle==='mirror',target:handle,latest:this.open};
   this.svg.classList.add('is-dragging');handle.classList.add('is-grabbed');this.svg.setPointerCapture(e.pointerId);handle.focus({preventScroll:true});
  });
  this.svg.addEventListener('pointermove',e=>{
   const d=this.drag;if(!d||e.pointerId!==d.id)return;
   const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(d.inv);
   const delta=this.horizontal?(p.x-d.start.x)*(d.mirror?-1:1)*(this.mirrored?-1:1):d.start.y-p.y;
   d.latest=clamp(d.open+delta/(this.guide.travel*this.scale)*100,0,100);
   if(!this.dragFrame)this.dragFrame=requestAnimationFrame(()=>{this.dragFrame=0;if(this.drag)this.onOpen(this.drag.latest);});
  });
  const stop=e=>{const d=this.drag;if(!d||e.pointerId!==d.id)return;
   cancelAnimationFrame(this.dragFrame);this.dragFrame=0;this.onOpen(d.latest);this.drag=null;
   d.target.classList.remove('is-grabbed');this.svg.classList.remove('is-dragging');
   if(this.svg.hasPointerCapture(e.pointerId))this.svg.releasePointerCapture(e.pointerId);this.onCommit(d.latest);
  };
  this.svg.addEventListener('pointerup',stop);this.svg.addEventListener('pointercancel',stop);this.svg.addEventListener('lostpointercapture',stop);
  this.svg.addEventListener('keydown',e=>{
   const handle=e.target.closest('[data-handle]');if(!handle)return;const reverse=(handle.dataset.handle==='mirror')!==Boolean(this.mirrored);
   const keys={ArrowUp:5,ArrowDown:-5,ArrowRight:reverse?-5:5,ArrowLeft:reverse?5:-5,PageUp:20,PageDown:-20};
   if(!(e.key in keys)&&e.key!=='Home'&&e.key!=='End')return;
   e.preventDefault();this.onStart();const value=e.key==='Home'?100:e.key==='End'?0:clamp(this.open+keys[e.key],0,100);this.onOpen(value);this.onCommit(value);
  });
  this.resize=new ResizeObserver(()=>this.resizeTargets());this.resize.observe(this.svg);
 }
 dispose(){this.resize.disconnect();cancelAnimationFrame(this.dragFrame);}
 update(state,{compare=false,measure=null,showEnvelope=true}={}){
  this.showEnvelope=showEnvelope;
  this.state=state;this.spec=visualSpec(state);this.horizontal=state.orientation==='horizontal';
  this.geometry=new CabinetGeometry(state,this.spec);this.guide=new GuideSystem(this.geometry,this.spec,state);
  const c=this.geometry,g=this.guide,{width:w,height:h,depth:d,thickness:t}=c;
  Object.assign(this,{w,h,d,scale:c.scale,project:c.project,ox:c.ox,oy:c.oy});
  const id=this.id,p=c.project,q=g.point,scene=state.scene,xray=scene==='mechanism'||scene==='exploded';
  this.section=scene==='section';
  const f=finishes[state.finish]||{color:'#b8bec0',edge:'#757e82',material:'metal'},matte=f.material!=='metal';this.surface=f.color;
  const pg=(pts,fill,attrs='')=>'<polygon points="'+poly(pts.map(p))+'" fill="'+fill+'" '+attrs+'/>';
  const rect=(x,y,ww,hh,z,fill)=>pg([[x,y,z],[x+ww,y,z],[x+ww,y+hh,z],[x,y+hh,z]],fill);
  const grad=(name,stops,x2='0',y2='1')=>'<linearGradient id="'+id+'-'+name+'" x1="0" y1="0" x2="'+x2+'" y2="'+y2+'">'+stops.map(([offset,color,opacity=1])=>'<stop offset="'+offset+'" stop-color="'+color+'" stop-opacity="'+opacity+'"/>').join('')+'</linearGradient>';
  const fill=name=>'url(#'+id+'-'+name+')';
  this.svg.innerHTML='<title>Roleta '+(this.horizontal?'pozioma':'pionowa')+'</title><desc>Uchwyt: przeciągnij lub użyj strzałek. Home otwiera, End zamyka. Model poglądowy.</desc><defs>'+
   grad('slat',[[0,f.color],[.07,f.color],[.91,f.color],[1,f.edge]],this.horizontal?'1':'0',this.horizontal?'0':'1')+
   grad('reflection',[[0,'#fff',matte?.035:.15],[.38,'#fff',matte?.018:.04],[.72,'#000',0],[1,'#000',.06]],'1','0')+
   grad('side',[[0,'#555c5b'],[1,'#323938']],'1','1')+grad('top',[[0,'#a5aaa5'],[1,'#747d77']],'1','1')+
   grad('back',[[0,'#343a37'],[1,'#555c55']],'1','1')+grad('inside',[[0,'#202724'],[1,'#414941']],'1','.3')+
   grad('shelf',[[0,'#878a7c'],[1,'#5a6256']])+grad('handle',[[0,f.color],[.08,f.color],[.8,f.color],[1,f.edge]],this.horizontal?'1':'0',this.horizontal?'0':'1')+
   '<radialGradient id="'+id+'-shadow"><stop stop-color="#222b25" stop-opacity=".21"/><stop offset=".55" stop-color="#222b25" stop-opacity=".06"/><stop offset="1" stop-color="#222b25" stop-opacity="0"/></radialGradient>'+
   '<clipPath id="'+id+'-opening"><polygon points="'+poly([[0,0,0],[g.width,0,0],[g.width,g.height,0],[0,g.height,0]].map(q))+'"/></clipPath>'+
   '<clipPath id="'+id+'-stored-top"><polygon points="'+poly([[0,0,0],[g.width,0,0],[g.width,0,g.depth],[0,0,g.depth]].map(q))+'"/></clipPath>'+
   '<clipPath id="'+id+'-stored-side"><polygon points="'+poly([[g.width,0,0],[g.width,0,g.depth],[g.width,g.height,g.depth],[g.width,g.height,0]].map(q))+'"/></clipPath></defs>';
  this.layers={};const layer=(name,attrs={})=>{const n=el('g',{'data-layer':name,...attrs});this.svg.append(n);this.layers[name]=n;return n;};
  this.coil=null;
  if(this.spec.path==='coil'&&!this.horizontal){
   const envelope=mechanismEnvelope(state,this),diameter=envelope.rollDiameter;
   this.coil={diameter,y:5+diameter/2-g.top,z:17.5+diameter/2-g.z};
   g.travel=Math.max(1,g.length-g.handle-envelope.requiredHeight); // Strefa C3 nie jest wysokością listwy maskującej.
  }
  this.routes=[makeRoute({width:g.width,height:g.height,depth:g.depth,horizontal:this.horizontal,path:this.spec.path,coil:this.coil,radius:Math.max(1,c.rearReturn?Math.min(g.fascia-g.pitch,c.topBand*.35):g.fascia-g.pitch),ceiling:c.rearReturn?c.topBand*.5-g.top:0})];
  if(g.split)this.routes.push(makeRoute({width:g.width,height:g.height,depth:g.depth,horizontal:true,mirror:true,radius:Math.max(1,g.fascia-g.pitch)}));
  if(this.section){this.drawSection();this.applySceneMirror();this.setOpen(state.open);this.resizeTargets();return;}
  const ground=p([w*.5,h,d*.5]);layer('SHADOW').append(el('ellipse',{cx:ground[0],cy:p([0,h+t,0])[1]+14,rx:(w+d*.42)*c.scale*.62,ry:22,fill:fill('shadow')}));
  const body=layer('CABINET',{opacity:xray?'.18':'1'});
  body.innerHTML=pg([[0,c.backTop,c.backDepth],[w,c.backTop,c.backDepth],[w,h,c.backDepth],[0,h,c.backDepth]],fill('back'))+pg([[0,0,0],[0,0,d],[0,h,d],[0,h,0]],fill('inside'))+pg([[w,0,0],[w,0,d],[w,h,d],[w,h,0]],fill('inside'))+(c.hasBottom?pg([[0,h,0],[w,h,0],[w,h,d],[0,h,d]],fill('shelf')):'');
  body.innerHTML+=rect(0,c.backTop,w,h-c.backTop,c.backDepth-.1,fill('reflection'));
  for(const shelf of c.shelves){const {y,front:z,back,thickness:st}=shelf;body.innerHTML+=pg([[0,y,z],[w,y,z],[w,y,back],[0,y,back]],fill('shelf'))+rect(0,y,w,st,z,'#414a40')+rect(0,y,w,1.6,z,'#a3a699');}
  // C3 lead-in bends behind the front plane below the masking rail.
  // Keep that real curtain segment visible in solid views; the fascia occludes it above.
  const showCoilLead=this.spec.path==='coil'&&(scene==='front'||scene==='dimensions');
  this.back=layer('MECHANISM',{display:xray||showCoilLead?'inline':'none',...(showCoilLead?{'clip-path':fill('opening')}:{})});
  if(xray)for(const route of this.routes)this.back.append(el('polyline',{points:poly(route.points.map(point=>q(this.horizontal?[point[0],h*.55,point[2]]:[g.width*.7,point[1],point[2]]))),fill:'none',stroke:'#d2071d','stroke-width':'1.6','stroke-dasharray':'5 5',opacity:'.65'}));
  this.front=layer('SHUTTER',{'clip-path':fill('opening')});
  const shell=layer('CABINET_SHELL',{opacity:xray?'.13':'1'});
  const shellBottom=c.hasBottom?h+t:h;
  shell.innerHTML=pg([[w+t,-t,0],[w+t,-t,d+t],[w+t,shellBottom,d+t],[w+t,shellBottom,0]],fill('side'))+pg([[-t,-t,0],[w+t,-t,0],[w+t,-t,d+t],[-t,-t,d+t]],fill('top'))+rect(-t,-t,w+2*t,t,0,'#59615a')+rect(-t,0,t,shellBottom,0,'#5c665e')+rect(w,0,t,shellBottom,0,'#464f48')+(c.hasBottom?rect(0,h,w,t,0,'#454e45'):'');
  shell.append(el('polyline',{points:poly([p([-t,-t,0]),p([w+t,-t,0])]),stroke:'#c7cbc3','stroke-opacity':'.5','stroke-width':'.8',fill:'none'}));
  const rails=layer('GUIDES');
  const guideRect=(x,y,ww,hh,z,color)=>pg([[x,y,z],[x+ww,y,z],[x+ww,y+hh,z],[x,y+hh,z]],color);
  const makeGuides=(inset,z,color,top=g.top,bottom=g.bottom)=>{const l=inset,r=w-inset,face=g.face,channel=g.channel||face*.26,height=bottom-top;
   return this.horizontal?guideRect(l,top,r-l,face,z,color)+guideRect(l,bottom-face,r-l,face,z,color)+guideRect(l,top+face-channel,r-l,channel,z-1,'#202723')+guideRect(l,bottom-face,r-l,channel,z-1,'#202723'):guideRect(l,top,face,height,z,color)+guideRect(r-face,top,face,height,z,color)+guideRect(l+face-channel,top,channel,height,z-1,'#202723')+guideRect(r-face,top,channel,height,z-1,'#202723');};
  rails.innerHTML=makeGuides(g.inset,g.z-2,f.color);
  if(compare){const ghost=el('g',{'data-layer':'MOUNTING_COMPARISON'}),altOutside=g.mounting!=='outside';ghost.innerHTML=makeGuides(altOutside?-t:0,altOutside?-12:12,'none',altOutside?-t:0,altOutside?h+t:h);for(const node of ghost.children){node.setAttribute('fill','none');node.setAttribute('stroke','#d2071d');node.setAttribute('stroke-dasharray','5 4');node.setAttribute('stroke-width','1.2');}rails.append(ghost);}
  const fascia=layer('FASCIA',{opacity:scene==='exploded'?'.12':'1'});fascia.innerHTML=this.horizontal?guideRect(g.right-g.fascia,g.top,g.fascia,g.height,g.z-3,f.color)+(g.split?guideRect(g.left,g.top,g.fascia,g.height,g.z-3,f.color):''):guideRect(g.left,g.top,g.width,g.fascia,g.z-3,f.color);
  const handleLayer=layer('HANDLE'),interaction=layer('INTERACTION');this.handles=[];
  for(let k=0;k<this.routes.length;k++){
   const node=el('g',{'data-handle-visual':k,'pointer-events':'none'}),rail=el('rect',{fill:fill('handle'),stroke:f.edge,'stroke-width':'.65',rx:'.6'}),lip=el('rect',{fill:'#202724',opacity:'.68',rx:'.7'}),shine=el('rect',{fill:'#fff',opacity:'.2'});node.append(rail,lip,shine);handleLayer.append(node);
   const target=el('g',{'data-handle':k?'mirror':'main',class:'model-handle',role:'slider',tabindex:this.interactive?'0':'-1','aria-label':k?'Otwarcie lewej części rolety':'Otwarcie rolety','aria-valuemin':0,'aria-valuemax':100,'aria-orientation':this.horizontal?'horizontal':'vertical'});
   const hit=el('rect',{fill:'transparent','data-hit-area':'true'}),outline=el('rect',{fill:'none',class:'handle-outline',rx:2});target.append(hit,outline);interaction.append(target);this.handles.push({node,rail,lip,shine,target,hit,outline,k});
  }
  this.slats=[];this.pitch=g.pitch;this.curtainLength=g.length-g.handle;this.slatCount=Math.ceil(this.curtainLength/this.pitch);
  for(let k=0;k<this.routes.length;k++)for(let i=0;i<this.slatCount;i++){const front=el('polygon',{fill:fill('slat'),'data-slat':i}),back=el('polygon',{fill:f.color,stroke:f.edge,'stroke-width':'.45'});this.front.append(front);this.back.append(back);this.slats.push({front,back,i,k});}
  const aa=q([0,0,0]),bb=q([g.width,h,0]);this.reflection=el('rect',{x:aa[0],y:aa[1],width:bb[0]-aa[0],height:bb[1]-aa[1],fill:fill('reflection'),'pointer-events':'none'});this.front.append(this.reflection);
  if(scene==='dimensions')this.drawDimensions(measure);
  if(xray){const n=layer('MECHANISM_LABEL');n.innerHTML='<text x="380" y="606" text-anchor="middle" fill="#74797d" font-size="14">'+(this.spec.path==='coil'?'Zwijanie płaszcza w kasecie u góry':'Powrót płaszcza w głąb korpusu')+' · schemat drogi</text>';}
  this.applySceneMirror();this.setOpen(state.open);this.resizeTargets();
 }
 applySceneMirror(){
  this.mirrored=this.horizontal&&this.state.horizontalDirection==='left';
  if(!this.mirrored)return;
  const group=el('g',{'data-horizontal-mirror':'true',transform:'translate(760 0) scale(-1 1)'});
  for(const child of [...this.svg.children])if(!['defs','title','desc'].includes(child.tagName.toLowerCase()))group.append(child);
  this.svg.append(group);
  // Keep dimension and caption text readable in the mirrored projection.
  for(const text of group.querySelectorAll('text')){
   const x=Number(text.getAttribute('x'))||0;
   text.setAttribute('transform','translate('+2*x+' 0) scale(-1 1)');
   const anchor=text.getAttribute('text-anchor')||'start';
   if(anchor!=='middle')text.setAttribute('text-anchor',anchor==='end'?'start':'end');
  }
 }
 setOpen(value){
  this.open=clamp(value,0,100);if(this.section){this.updateSectionMotion();return;}if(!this.slats)return;
  const g=this.guide,q=g.point,offset=this.open/100*g.travel+(g.split?g.width/2:0);
  for(const {front,back,i,k}of this.slats){
   const start=offset+g.handle+i*this.pitch,end=offset+g.handle+Math.min(this.curtainLength,(i+1)*this.pitch)-.65;
   const a=this.routes[k].at(start),b=this.routes[k].at(Math.max(start,end));
   const pts=this.horizontal?[[a[0],g.face*.6,a[2]],[b[0],g.face*.6,b[2]],[b[0],g.height-g.face*.6,b[2]],[a[0],g.height-g.face*.6,a[2]]]:[[g.face*.6,a[1],a[2]],[g.width-g.face*.6,a[1],a[2]],[g.width-g.face*.6,b[1],b[2]],[g.face*.6,b[1],b[2]]];
   const stored=a[2]>.15||b[2]>.15;
   const crossesEntry=stored&&a[2]<=.15;
   front.setAttribute('visibility',!stored||crossesEntry?'visible':'hidden');
   if(crossesEntry){
    const e=this.routes[k].entry;
    const flat=this.horizontal?[[a[0],g.face*.6,0],[e[0],g.face*.6,0],[e[0],g.height-g.face*.6,0],[a[0],g.height-g.face*.6,0]]:[[g.face*.6,a[1],0],[g.width-g.face*.6,a[1],0],[g.width-g.face*.6,e[1],0],[g.face*.6,e[1],0]];
    front.setAttribute('points',poly(flat.map(q)));
   }
   back.setAttribute('visibility',stored?'visible':'hidden');
   // The rear return is revealed through the side, never through the top panel.
   const sideOnly=this.spec.path==='rear'&&(this.horizontal||Math.min(a[2],b[2])>=this.routes[k].rearDepth-.01);
   if(sideOnly)back.setAttribute('clip-path','url(#'+this.id+'-stored-side)');
   else back.removeAttribute('clip-path');
   (stored?back:front).setAttribute('points',poly(pts.map(q)));
  }
  const lower=g.height-offset,edge=this.horizontal?offset+g.handle:lower-g.handle;
  const ra=q(this.horizontal?[edge,0,0]:[0,0,0]),rb=q(this.horizontal?[g.width,g.height,0]:[g.width,Math.max(0,edge),0]);
  for(const [key,val]of Object.entries({x:ra[0],y:ra[1],width:Math.max(0,rb[0]-ra[0]),height:Math.max(0,rb[1]-ra[1])}))this.reflection.setAttribute(key,val);
  if(g.split)this.reflection.setAttribute('visibility','hidden');
  for(const handle of this.handles){
   const x=this.horizontal?(handle.k?g.width-offset-g.handle:offset):g.face*.72,y=this.horizontal?g.face*.72:lower-g.handle;
   const ww=this.horizontal?g.handle:g.width-g.face*1.44,hh=this.horizontal?g.height-g.face*1.44:g.handle,a=q([x,y,0]),width=this.geometry.mmToSvg(ww),height=this.geometry.mmToSvg(hh);
   handle.node.setAttribute('transform','translate('+a.join(' ')+')');handle.target.setAttribute('transform','translate('+a.join(' ')+')');handle.rail.setAttribute('width',width);handle.rail.setAttribute('height',height);
   const lip=this.horizontal?{x:width*.23,y:height*.37,width:Math.max(1,width*.07),height:height*.26}:{x:width*.06,y:height*.74,width:width*.88,height:Math.max(.7,height*.07)};
   for(const [key,val]of Object.entries(lip))handle.lip.setAttribute(key,val);
   const shine=this.horizontal?{x:width*.34,y:height*.37,width:.6,height:height*.26}:{x:width*.06,y:height*.84,width:width*.88,height:.6};for(const [key,val]of Object.entries(shine))handle.shine.setAttribute(key,val);
   handle.width=width;handle.height=height;handle.target.setAttribute('aria-valuenow',Math.round(this.open));handle.target.setAttribute('aria-valuetext',Math.round(this.open)+'% otwarcia');
  }
 }
 resizeTargets(){
  if(this.section){const matrix=this.svg.getScreenCTM();if(matrix)for(const n of this.svg.querySelectorAll('[data-layer=SECTION_LABELS] text'))n.setAttribute('font-size',Math.min(26,Math.max(19,12/Math.hypot(matrix.a,matrix.b))));return;}if(!this.handles)return;const matrix=this.svg.getScreenCTM();if(!matrix)return;const min=44/Math.hypot(matrix.a,matrix.b);
  for(const handle of this.handles){const {width:w,height:h,hit,outline}=handle;
   for(const [key,val]of Object.entries({x:-(Math.max(w,min)-w)/2,y:-(Math.max(h,min)-h)/2,width:Math.max(w,min),height:Math.max(h,min)}))hit.setAttribute(key,val);
   for(const [key,val]of Object.entries({x:-1,y:-1,width:w+2,height:h+2}))outline.setAttribute(key,val);
  }
 }
 drawDimensions(focus){
  const {w,h,d,project:p,geometry:c}=this,g=el('g',{'data-layer':'MEASUREMENTS'});this.svg.append(g);
  const line=(a,b,key)=>{const aa=p(a),bb=p(b),mx=(aa[0]+bb[0])/2,my=(aa[1]+bb[1])/2,color=focus===key?'#d2071d':'#686d71';return '<path d="M'+aa.join(' ')+' L'+bb.join(' ')+'" stroke="'+color+'" fill="none"/><circle cx="'+aa[0]+'" cy="'+aa[1]+'" r="2" fill="'+color+'"/><circle cx="'+bb[0]+'" cy="'+bb[1]+'" r="2" fill="'+color+'"/><text x="'+mx+'" y="'+(my-9)+'" text-anchor="middle" fill="'+color+'" class="dimension-text" font-size="16" paint-order="stroke" stroke="#f4f5f4" stroke-width="5">'+(this.state.dimensions[key]??'?')+' mm</text>';};
  const margin=32/c.scale;g.innerHTML=(!focus||focus==='width'?line([0,h+margin,0],[w,h+margin,0],'width'):'')+(!focus||focus==='height'?line([-margin,0,0],[-margin,h,0],'height'):'')+(!focus||focus==='depth'?line([w+margin,h,0],[w+margin,h,d],'depth'):'');
 }
 drawSection(){
  const g=this.guide,c=this.geometry,a=this.horizontal?g.width:c.height,d=c.depth,t=c.thickness;
  const scale=Math.min(390/(a+2*t),295/(d+2*t)),x=410,y=100;
  const raw=point=>[x+point[2]*scale,y+(this.horizontal?point[0]:point[1])*scale];
  this.secProjectRaw=raw;
  // Same physical track as the product view, with no per-edge pixel nudges.
  this.secProject=point=>raw(g.toCabinet(point));
  const body=el('g',{'data-layer':'CABINET'});this.svg.append(body);
  const box=(z,yy,depth,height,fill)=>el('rect',{x:x+z*scale,y:y+yy*scale,width:depth*scale,height:height*scale,fill});
  body.append(box(0,-t,d+t,t,'#555f57'));
  body.append(box(c.backDepth,c.backTop,t,a-c.backTop,'#555f57'));
  if(c.hasBottom||this.horizontal)body.append(box(0,a,d+t,t,'#555f57'));
  const labels=el('g',{'data-layer':'SECTION_LABELS'});this.svg.append(labels);
  const text=(xx,yy,value,anchor='start',color='#59615d',size=19)=>{const n=el('text',{x:xx,y:yy,'text-anchor':anchor,fill:color,'font-size':size});n.textContent=value;labels.append(n);return n;};
  text(x,88,'FRONT');text(x+(d+t)*scale,88,'TYŁ','end');
  const guide=el('g',{'data-layer':'GUIDES'});guide.append(el('line',{x1:x+g.z*scale-4,x2:x+g.z*scale-4,y1:y,y2:y+a*scale,stroke:'#d2071d','stroke-width':2,opacity:'.4'}));this.svg.append(guide);
  const envelope=this.showEnvelope?mechanismEnvelope(this.state,this):null;
  if(envelope){
   const clearance=el('g',{'data-layer':'MECHANISM_ENVELOPE'});this.svg.append(clearance);
   let points=envelope.points3d;
   if(c.rearReturn)points=[[0,0,0],[0,0,c.backOuter],[0,a,c.backOuter],[0,a,c.backOuter-c.rearBand],[0,c.topBand,c.backOuter-c.rearBand],[0,c.topBand,c.frontBand],[0,a,c.frontBand],[0,a,0]];
   const outline=points.map(raw);
   if(envelope.inner3d){
    const ring=arr=>'M'+arr.map(p=>p.join(' ')).join(' L')+' Z';
    clearance.append(el('path',{d:ring(outline)+' '+ring(envelope.inner3d.map(raw)),fill:'#d2071d','fill-opacity':'.16','fill-rule':'evenodd',stroke:'#d2071d','stroke-opacity':'.5','stroke-width':1}));
   }else clearance.append(el('polygon',{points:poly(outline),fill:'#d2071d','fill-opacity':'.16',stroke:'#d2071d','stroke-opacity':'.55','stroke-width':1,'stroke-dasharray':'5 4'}));
   const number=n=>fmt(n).toLocaleString('pl-PL')+' mm';
   const callout=(row,title,value,target)=>{
    const yy=158+row*106;
    text(30,yy,title,'start','#59615d',19);text(30,yy+32,value,'start','#b50920',21);
    const [tx,ty]=raw(target),elbow=370-row*14;
    labels.append(el('path',{d:'M310 '+(yy+22)+' H'+elbow+' V'+ty+' H'+tx,fill:'none',stroke:'#969e99','stroke-width':1}));
    labels.append(el('circle',{cx:tx,cy:ty,r:3,fill:'#d2071d'}));
   };
   if(envelope.mode==='rect'){
    callout(0,'Głębokość mechanizmu',number(envelope.requiredDepth),[0,envelope.bottom*.5,envelope.rear]);
    callout(1,'Wysokość mechanizmu',number(envelope.requiredHeight),[0,envelope.bottom,envelope.rear*.5]);
   }else if(c.rearReturn){
    callout(0,'Zakręt pod górą',number(c.topBand),[0,c.topBand*.5,c.backOuter*.5]);
    callout(1,'Prowadnica z przodu',number(c.frontBand),[0,a*.5,c.frontBand*.5]);
    callout(2,'Prowadnica z tyłu',number(c.rearBand),[0,a*.8,c.backOuter-c.rearBand*.5]);
   }else{
    callout(0,'Prowadnica z przodu',number(envelope.band),[c.width*.2,0,envelope.band*.5]);
    callout(1,envelope.split?'Prowadnice po bokach':'Prowadnica po prawej',number(envelope.band),[c.width-envelope.band*.5,0,c.depth*.5]);
    callout(2,'Prowadnica z tyłu',number(envelope.band),[c.width*.8,0,c.depth-envelope.band*.5]);
   }
  }
  const mechanism=el('g',{'data-layer':'MECHANISM'});this.svg.append(mechanism);
  if(this.coil){
   const center=this.secProject([0,this.coil.y,this.coil.z]);
   mechanism.append(el('circle',{cx:center[0],cy:center[1],r:this.coil.diameter/2*scale,fill:'#778079','fill-opacity':'.07',stroke:'#68756d','stroke-width':1,'stroke-dasharray':'3 3','data-roll-diameter':this.coil.diameter}));
  }
  for(const route of this.routes)mechanism.append(el('polyline',{points:poly(route.points.map(this.secProject)),fill:'none',stroke:'#d2071d','stroke-width':1.5,'stroke-dasharray':'5 5'}));
  this.sectionSlats=[];this.curtainLength=g.length-g.handle;this.pitch=g.pitch;this.slatCount=Math.ceil(this.curtainLength/g.pitch);
  for(let k=0;k<this.routes.length;k++)for(let i=0;i<this.slatCount;i++){const node=el('line',{stroke:this.surface,'stroke-width':c.mmToSvg(g.slatThickness,'x',scale)});mechanism.append(node);this.sectionSlats.push({node,i,k});}
  this.sectionHandles=[];const handles=el('g',{'data-layer':'HANDLE'});this.svg.append(handles);
  for(let k=0;k<this.routes.length;k++){const node=el('line',{stroke:'#313a33','stroke-width':c.mmToSvg(g.handleDepth,'x',scale)});handles.append(node);this.sectionHandles.push({node,k});}
  text(380,604,this.horizontal?'Przekrój z góry':'Przekrój boczny','middle','#686d71',18);
  this.svg.append(labels);
 }
 updateSectionMotion(){
  const g=this.guide,offset=this.open/100*g.travel+(g.split?g.width/2:0),line=(node,a,b)=>{const p=this.secProject(a),q=this.secProject(b);for(const [k,v]of Object.entries({x1:p[0],y1:p[1],x2:q[0],y2:q[1]}))node.setAttribute(k,v);};
  for(const {node,i,k}of this.sectionSlats)line(node,this.routes[k].at(offset+g.handle+i*g.pitch),this.routes[k].at(offset+g.handle+Math.min(this.curtainLength,(i+1)*g.pitch)-.65));
  for(const {node,k}of this.sectionHandles)line(node,this.routes[k].at(offset),this.routes[k].at(offset+g.handle));
 }
 exportSvg(){return new XMLSerializer().serializeToString(this.svg);}
}
