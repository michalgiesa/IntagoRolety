import {getProduct,availableFinishes} from '../systems-data.js';
export function createState(){return {version:3,step:1,orientation:null,horizontalDirection:'right',mounting:null,furniture:null,dimensions:{width:null,height:null,depth:null},selectedProduct:null,finish:null,scene:'front',open:35,mode:'guided'};}
export function reconcile(state){
 if(state.step<=3)state.scene='front';else if(state.step===4&&!['front','dimensions'].includes(state.scene))state.scene='dimensions';
 if(state.orientation==='horizontal'){state.mounting='inside';state.furniture='with-bottom';}
 const p=getProduct(state.selectedProduct);
 const wrongOrientation=p&&state.orientation&&state.orientation!=='unknown'&&!p.orientations.value.includes(state.orientation);
 const wrongMounting=p&&state.mounting&&state.mounting!=='unknown'&&p.mounting.status==='verified'&&p.mounting.value!==state.mounting;
 if(!p||wrongOrientation||wrongMounting){state.selectedProduct=null;state.finish=null;}
 else if(!availableFinishes(p,state.orientation).some(f=>f.id===state.finish))state.finish=null;
 return state;
}
export function reduce(state,patch){return reconcile({...state,...patch,dimensions:{...state.dimensions,...patch.dimensions}});}
export function createStore(initial=createState()){
 let state=reconcile(initial);const listeners=new Set();
 return {get:()=>state,update(patch){state=reduce(state,patch);for(const f of listeners)f(state);return state;},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
}
