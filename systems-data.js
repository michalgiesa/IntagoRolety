
// Oferta INTAGO; źródła, ograniczenia i konflikty: docs/product-research.md.
export const DATA_VERSION='2026-09-15.1';
export const sources={
 business:{name:'Zakres biznesowy INTAGO',url:null},
 rehau:{name:'REHAU — mechanizmy i prowadnice',url:'https://interior.rehau.com/pl-pl/produkty/rauvolet/mechanizmy-i-systemy-prowadnic'},
 c3:{name:'INTAGO — TOP BASIC + C3',url:'https://www.intago.com.pl/roleta-meblowa-pionowa-na-wymiar-zawijana-na-beben-z-systemem-c3,id6350.html'},
 horizontal:{name:'INTAGO — roleta pozioma',url:'https://www.intago.com.pl/roleta-meblowa-pozioma-na-wymiar-zawijana-na-tyl-szafki-docinamy-na-wymiar,id7716.html'},
 frame:{name:'INTAGO — FRAME + C3',url:'https://www.intago.com.pl/frame-c3,p23.html'},
 nobleIn:{name:'INTAGO — NOBLE C6 TOP',url:'https://www.intago.com.pl/roleta-meblowa-noble-matt-pionowa-na-wymiar-zawijana-na-gorze-szafki-z-systemem-c6-top-docinamy-na-wymiar,id9291.html'},
 nobleOut:{name:'INTAGO — NOBLE C3',url:'https://www.intago.com.pl/roleta-meblowa-noble-matt-pionowa-na-wymiar-zawijana-na-gorze-szafki-z-systemem-c3-docinamy-na-wymiar,id9290.html'}
};
export const fact=(value,sourceReference,status='verified',notes='')=>({value,status,sourceReference,source:sourceReference==='business'?'client/business requirement':sourceReference==='rehau'?'REHAU':'INTAGO',notes,checked:'2026-09-10'});
export const unknown=notes=>fact(null,'business','unknown',notes);
export const orientations={vertical:'Pionowo',horizontal:'Poziomo',unknown:'Do ustalenia'};
export const mountings={inside:'Wewnątrz korpusu',outside:'Na krawędziach korpusu',unknown:'Do ustalenia'};
export const furniture={'with-bottom':'Z dnem w szafce','without-bottom':'Bez dna w szafce'};
export const guides={
 basic:{name:'TOP BASIC',mounting:fact('inside','rehau'),material:fact('Tworzywo','rehau')},
 frame:{name:'FRAME',mounting:fact('outside','frame'),material:fact('Aluminium','rehau')},
 top:{name:'TOP',mounting:fact('inside','nobleIn'),material:fact('Aluminium z pokrywą','rehau')},
 noble:{name:'NOBLE MATT',mounting:fact('outside','nobleOut'),material:fact('Tworzywo','rehau')}
};
export const mechanisms={
 c3:{name:'C3',path:'coil',location:'Pod górną ścianką',description:'Płaszcz nawija się na mechanizm u góry szafki.',evidence:fact('coil','rehau')},
 c6:{name:'C6',path:'rear',location:'Na tylnej ścianie',description:'Płaszcz przechodzi pod górą na tył szafki. C6 wspomaga ruch.',evidence:fact('rear','rehau')},
 rear:{name:'Prowadzenie na tył',path:'rear',location:'Wzdłuż boku i tylnej ściany',description:'Szczeble skręcają po prowadnicy i chowają się w głębi mebla.',evidence:fact('rear','horizontal')}
};
export const profiles={e23:{name:'E23',evidence:fact('E23','c3')},e9:{name:'E9',evidence:fact('E9','nobleIn')},ml25:{name:'Metallic Line 25',evidence:fact('Metallic Line 25','frame')}};
export const finishes={
 white:{id:'white',name:'Biały',code:'RAL 9010',color:'#e5e4df',edge:'#afafa9',material:'solid'},
 silver:{id:'silver',name:'Aluminium decor',code:null,color:'#b7bbbd',edge:'#767f84',material:'metal'},
 aluminium:{id:'aluminium',name:'Aluminium',code:null,color:'#bdc3c5',edge:'#7d858a',material:'metal'},
 casa:{id:'casa',name:'Casa Blanca',code:'V3552',color:'#e8e6df',edge:'#b9b5ae',material:'matte'},
 blonde:{id:'blonde',name:'Boxcar Blonde',code:'V3610',color:'#b9af9d',edge:'#8c8170',material:'matte'},
 dark:{id:'dark',name:'After Dark',code:'V3555',color:'#333738',edge:'#1d2224',material:'matte'}
};
const ranges=(w,h,d,source)=>({width:w?fact(w,source):unknown('Zakres szerokości'),height:h?fact(h,source):unknown('Zakres wysokości'),depth:d?fact(d,source):unknown('Wymagana głębokość')});
const variant=(source,mechanism,profile,limits,colors,extra={})=>({
 mechanism:mechanism?fact(mechanism,source):unknown('Mechanizm do doboru'),
 profile:profile?fact(profile,source):unknown('Profil do doboru'),
 dimensions:limits,finishes:colors?fact(colors,source):unknown('Wykończenia do potwierdzenia'),
 measurement:fact('internal','c3','verified','Wymiary wnętrza do zapytania. Nie są wymiarem cięcia.'),
 clearance:unknown('Miejsce zajmowane przez mechanizm i odsunięcie półek'),
 combination:unknown('Łączna wykonalność wymiarów i wykończenia wymaga potwierdzenia INTAGO'),
 sourceReference:source,...extra
});
const unset=()=>variant('business',null,null,ranges(null,null,null,'business'),null);
export const products=[
 {id:'top-basic',name:'TOP BASIC',short:'Płaszcz prowadzony na plecy szafki',description:'Prowadnice we wnętrzu mebla. W poziomie płaszcz chowa się na tył.',guideId:'basic',orientations:fact(['vertical','horizontal'],'business'),mounting:fact('inside','horizontal'),variants:{
 vertical:variant('horizontal','c6','e23',ranges({min:200,max:1200},{min:350,max:1050},null,'horizontal'),['silver','white'],{rangeProfile:'c6'}),
 horizontal:variant('horizontal','rear','e23',ranges({min:200,max:1200},{min:350,max:1050},null,'horizontal'),['silver','white'],{rangeProfile:'c6',profile:fact('e23','horizontal','inferred','Profil do potwierdzenia w karcie technicznej.')})
 }},
 {id:'frame',name:'FRAME',short:'Wyraźna aluminiowa rama',description:'Prowadnice nakładane na krawędzie korpusu. Pionowy wariant z mechanizmem C3.',guideId:'frame',orientations:fact(['vertical','horizontal'],'business'),mounting:fact('outside','frame'),variants:{
 vertical:variant('frame','c3','ml25',ranges({max:1200},{max:2200},null,'frame'),['aluminium']),horizontal:unset()
 }},
 {id:'top-basic-c3',name:'TOP BASIC + C3',short:'Płaszcz zwijany na bęben C3',description:'Płaszcz nawija się u góry. Prowadnice pozostają wewnątrz korpusu.',guideId:'basic',orientations:fact(['vertical'],'business'),mounting:fact('inside','c3'),variants:{
 vertical:variant('c3','c3','e23',ranges({min:400,max:1200},{min:650,max:2200},{min:300},'c3'),['silver','white'],{rangeProfile:'c3'})
 }},
 {id:'noble-wew',name:'NOBLE',short:'Matowy płaszcz prowadzony na plecy szafki',description:'Matowe szczeble E9. W pionie prowadnice TOP i mechanizm wspomagający C6.',guideId:'top',orientations:fact(['vertical'],'business'),mounting:fact('inside','nobleIn'),variants:{
 vertical:variant('nobleIn','c6','e9',ranges({min:200,max:1200},{min:350,max:1050},null,'nobleIn'),['blonde','casa','dark'],{rangeProfile:'c6'})
 }},
 {id:'noble-zewn',name:'NOBLE',short:'Matowy płaszcz zwijany na bęben C3',description:'Prowadnice na krawędziach korpusu. W pionie płaszcz zwija się na C3.',guideId:'noble',orientations:fact(['vertical'],'business'),mounting:fact('outside','nobleOut'),variants:{
 vertical:variant('nobleOut','c3','e9',ranges({min:400,max:1200},{min:650,max:2200},{min:300},'nobleOut'),['blonde','casa','dark'],{rangeProfile:'c3'})
 }}
];
export const getProduct=id=>products.find(p=>p.id===id);
export const getVariant=(product,orientation)=>product?.variants[orientation]??null;
export const availableFinishes=(product,orientation)=>{const f=getVariant(product,orientation)?.finishes;return f?.status==='verified'?f.value.map(id=>finishes[id]):[];};
