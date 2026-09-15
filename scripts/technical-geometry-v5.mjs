import fs from 'node:fs/promises';
const profile=`const guideProfiles={
 nobleMatt:{pitch:26.5,slatThickness:8,handle:75,handleDepth:8,face:29,guideThickness:35,bendHeight:48.5,fascia:73.2,fasciaDepth:17,profileStatus:'verified',status:'needsVerification'},
 standard:{pitch:25,slatThickness:8,handle:46,handleDepth:28,face:13,guideThickness:35,channel:9.5,lip:4,bendHeight:48.5,fascia:46,fasciaDepth:28,profileStatus:'needsVerification',status:'needsVerification'}
};
// TODO: wymiar niepotwierdzony — podziałka pojedynczego elementu E23; 45 mm dotyczy zespołu trzech elementów, zachowano dotychczasowe 25 mm.
// TODO: wymiar niepotwierdzony — przekrój TOP dla NOBLE WEW i jego listwa maskująca; zachowano wcześniejsze wartości.
// TODO: wymiar niepotwierdzony — promień osi narożnika; 48.5 mm jest obrysem, nie promieniem osi toru.
const technicalProfile=state=>state.selectedProduct==='noble-zewn'?{...guideProfiles.nobleMatt,guideThickness:29,projection:16,guideDepth:19}:String(state.selectedProduct).includes('noble')?guideProfiles.nobleMatt:guideProfiles.standard;
`;
for(const file of ['src/geometry.js','client-package/INTAGO-Rolety-Demo.html']){
 let s=await fs.readFile(file,'utf8');
 const start=s.indexOf(file.startsWith('src/')?'export const guideProfiles=':'const guideProfiles=');const end=s.indexOf('function visualDimensions',start);
 s=s.slice(0,start)+(file.startsWith('src/')?'export ':'')+profile+s.slice(end);
 s=s.replaceAll("guideProfiles[String(state.selectedProduct).includes('noble')?'nobleMatt':'standard']",'technicalProfile(state)');
 s=s.replace('this.scale=Math.min(570/(w+2*t+d*dx),530/(h+2*t+d*dy));','this.scale=Math.min(570/(w+2*t+d*dx),530/(h+2*t+d*dy));\n  this.mmToSvg=(mm,axis=\'x\',scale=this.scale)=>mm*scale*(axis===\'depthX\'?dx:axis===\'depthY\'?dy:1);');
 s=s.replace('this.face=Math.min(profile.face,w*.1,h*.1);','this.face=profile.face;');
 s=s.replace("this.z=spec.mounting==='outside'?-12:12;","this.z=spec.mounting==='outside'?-(profile.guideDepth||12):profile.guideThickness/2;");
 s=s.replace('this.handle=Math.min(profile.handle,(this.horizontal?this.width/(this.split?2:1):this.height)*.16);','this.handle=profile.handle;');
 s=s.replace('this.fascia=Math.min(profile.fascia,(this.horizontal?this.width:this.height)*.14);','this.fascia=profile.fascia;');
 await fs.writeFile(file,s);
}
for(const file of ['src/renderer.js','client-package/INTAGO-Rolety-Demo.html']){
 let s=await fs.readFile(file,'utf8');
 s=s.replace('g.fascia=envelope.requiredHeight;g.travel=Math.max(1,g.length-g.handle-g.fascia);','g.travel=Math.max(1,g.length-g.handle-envelope.requiredHeight); // Strefa C3 nie jest wysokością listwy maskującej.');
 s=s.replace('channel=face*.26','channel=g.channel||face*.26');
 s=s.replace('width=ww*this.scale,height=hh*this.scale','width=this.geometry.mmToSvg(ww),height=this.geometry.mmToSvg(hh)');
 s=s.replace("'stroke-width':Math.max(1.5,8*scale)","'stroke-width':c.mmToSvg(g.slatThickness,'x',scale)");
 s=s.replace("'stroke-width':Math.max(3,10*scale)","'stroke-width':c.mmToSvg(g.handleDepth,'x',scale)");
 await fs.writeFile(file,s);
}
