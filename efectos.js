/* Efectos de «Arma tu show»: profundidad, transiciones entre vistas y scroll.
   Es mejora progresiva: si este archivo o GSAP no cargan, el sitio funciona igual,
   porque nada queda oculto esperando una animacion. Todo el CSS de efectos cuelga de
   html.fx, que solo existe con movimiento permitido (sistema y boton de pausa).
   GSAP no se pide al cargar: entra con la primera interaccion, para no competir con
   el reel ni con la foto que pinta el LCP. */
(function(){
'use strict';
const root=document.documentElement;
const GSAP_DIR='vendor/gsap/3.15.0/';
const mqReduce=matchMedia('(prefers-reduced-motion: reduce)');
const fino=matchMedia('(hover: hover) and (pointer: fine)');
/* Quieto si el sistema lo pide o si la persona pulso la pausa del reel. */
const quieto=()=>mqReduce.matches||!!(window.sdpMotionOff&&window.sdpMotionOff());
const FX=window.sdpFx={};
const vistaActiva=()=>document.querySelector('.view.active');

/* ── GSAP bajo demanda ─────────────────────────────────────────────────────── */
let G=null,ST=null,pedido=false;const cola=[];
function pedirGsap(){
  if(pedido||quieto())return;pedido=true;
  const s1=document.createElement('script'),s2=document.createElement('script');
  s1.src=GSAP_DIR+'gsap.min.js';s2.src=GSAP_DIR+'ScrollTrigger.min.js';
  s1.async=s2.async=false; /* respeta el orden: ScrollTrigger necesita gsap */
  s2.onload=()=>{if(!window.gsap||!window.ScrollTrigger)return;
    G=window.gsap;ST=window.ScrollTrigger;G.registerPlugin(ST);
    ST.config({ignoreMobileResize:true});
    while(cola.length)try{cola.shift()();}catch(e){}};
  document.head.append(s1,s2);}
function conGsap(f){if(G)f();else cola.push(f);}
FX.conGsap=conGsap;

/* ── Interruptor general ───────────────────────────────────────────────────── */
const alApagar=[],alEncender=[];
function aplicarModo(){
  const on=!quieto();
  if(on===root.classList.contains('fx'))return;
  root.classList.toggle('fx',on);
  (on?alEncender:alApagar).forEach(f=>{try{f();}catch(e){}});
  if(on)pedirGsap();}
FX.alApagar=f=>alApagar.push(f);FX.alEncender=f=>alEncender.push(f);
FX.quieto=quieto;
root.classList.toggle('fx',!quieto());
(mqReduce.addEventListener?mqReduce.addEventListener('change',aplicarModo):mqReduce.addListener(aplicarModo));
/* El boton de pausa del reel cambia motionOff en su onclick, que corre antes que esto. */
const hm=document.getElementById('heroMotion');if(hm)hm.addEventListener('click',aplicarModo);

/* GSAP llega con la primera senal de la persona (mover el raton, tocar, teclear, la
   rueda o cambiar de ruta), no en reposo: evaluado en reposo caia dentro de la ventana
   de Lighthouse y sumaba ~60 ms de bloqueo en movil. Nada lo necesita antes: la portada
   no usa GSAP y lo que ya se ve nunca espera a una animacion. */
const SENALES=['pointermove','pointerdown','touchstart','keydown','wheel','hashchange'];
const alPrimeraSenal=()=>{SENALES.forEach(t=>removeEventListener(t,alPrimeraSenal,true));pedirGsap();};
SENALES.forEach(t=>addEventListener(t,alPrimeraSenal,{capture:true,passive:true}));

/* ── Utilidades ─────────────────────────────────────────────────────────────── */
const lim=(x,a,b)=>Math.max(a,Math.min(b,x));
/* Suaviza hacia un objetivo con rAF y se para solo cuando llega: sin bucle eterno. */
function suave(aplicar,k){const cur={x:0,y:0},obj={x:0,y:0};let raf=0;
  const paso=()=>{cur.x+=(obj.x-cur.x)*k;cur.y+=(obj.y-cur.y)*k;
    const fin=Math.abs(obj.x-cur.x)<.002&&Math.abs(obj.y-cur.y)<.002;if(fin){cur.x=obj.x;cur.y=obj.y;}
    aplicar(cur.x,cur.y);raf=fin?0:requestAnimationFrame(paso);};
  return {ir(x,y){obj.x=x;obj.y=y;if(!raf)raf=requestAnimationFrame(paso);},
          cero(){obj.x=obj.y=0;cur.x=cur.y=0;if(raf){cancelAnimationFrame(raf);raf=0;}aplicar(0,0);}};}

/* ── B · Portada: el texto sigue al puntero en cuatro planos ──────────────── */
const heroIn=document.querySelector('.hero-inner');
if(heroIn){
  const s=suave((x,y)=>{heroIn.style.setProperty('--mx',x.toFixed(3));heroIn.style.setProperty('--my',y.toFixed(3));},.08);
  addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||!fino.matches||!root.classList.contains('fx')||document.body.classList.contains('no-scroll'))return;
    s.ir(lim(e.clientX/innerWidth*2-1,-1,1),lim(e.clientY/innerHeight*2-1,-1,1));},{passive:true});
  document.addEventListener('mouseleave',()=>s.ir(0,0));
  alApagar.push(()=>s.cero());}

/* ── B · Paso 1: tarjetas de ocasion que se inclinan ────────────────────────── */
const occGrid=document.getElementById('occGrid');
function inclinar(el,dx,dy,brillo){ /* dx,dy en -1..1 */
  el.style.setProperty('--rx',(-dy*7).toFixed(2)+'deg');el.style.setProperty('--ry',(dx*9).toFixed(2)+'deg');
  el.style.setProperty('--ix',(-dx*10).toFixed(1)+'px');el.style.setProperty('--iy',(-dy*10).toFixed(1)+'px');
  el.style.setProperty('--gx',(50+dx*40).toFixed(1)+'%');el.style.setProperty('--gy',(30+dy*40).toFixed(1)+'%');
  el.style.setProperty('--go',brillo);}
const VARS=['--rx','--ry','--ix','--iy','--gx','--gy','--go'];
const soltar=el=>{el.classList.remove('inclina');VARS.forEach(v=>el.style.removeProperty(v));};
if(occGrid){
  occGrid.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||!root.classList.contains('fx'))return;
    const c=e.target.closest('.occ');if(!c)return;const r=c.getBoundingClientRect();
    c.classList.add('inclina');inclinar(c,lim((e.clientX-r.left)/r.width*2-1,-1,1),lim((e.clientY-r.top)/r.height*2-1,-1,1),1);});
  occGrid.addEventListener('pointerout',e=>{const c=e.target.closest('.occ');
    if(c&&!c.contains(e.relatedTarget))soltar(c);});
  alApagar.push(()=>occGrid.querySelectorAll('.occ').forEach(soltar));

  /* En el telefono: el giroscopio inclina todas a la vez. Android lo da sin pedir;
     iOS solo tras un gesto y con permiso, asi que ahi hay un boton que lo pide. */
  let giroOn=false,base=null;
  const g=suave((x,y)=>{if(!x&&!y){occGrid.classList.remove('giro');VARS.forEach(v=>occGrid.style.removeProperty(v));return;}
    occGrid.classList.add('giro');inclinar(occGrid,x,y,.7);},.12);
  const giroActivo=()=>giroOn&&root.classList.contains('fx')&&!fino.matches&&currentView==='view-arma';
  function alGirar(e){if(e.beta==null||e.gamma==null)return;
    if(!giroActivo()){base=null;return;}
    if(!base)base={b:e.beta,g:e.gamma};
    base.b+=(e.beta-base.b)*.012;base.g+=(e.gamma-base.g)*.012; /* recentra si se cambia de postura */
    g.ir(lim((e.gamma-base.g)/22,-1,1),lim((e.beta-base.b)/22,-1,1));}
  const escuchar=()=>{if(giroOn)return;giroOn=true;addEventListener('deviceorientation',alGirar,{passive:true});};
  const DOE=window.DeviceOrientationEvent;
  if(DOE&&!fino.matches){
    if(typeof DOE.requestPermission==='function'){
      Object.assign(I18N.es,{'fx.giro':'Inclinar las tarjetas con el teléfono'});
      Object.assign(I18N.en,{'fx.giro':'Tilt the cards with your phone'});
      const b=document.createElement('button');b.type='button';b.className='fx-giro';
      b.setAttribute('data-i18n','fx.giro');b.textContent=I18N[lang]['fx.giro'];
      occGrid.after(b);
      b.addEventListener('click',()=>{DOE.requestPermission().then(st=>{if(st==='granted'){escuchar();b.hidden=true;}}).catch(()=>{b.hidden=true;});});
    }else escuchar();}
  alApagar.push(()=>{base=null;g.cero();});}

/* ── Montajes por vista (ScrollTrigger vive dentro de cada .view, que es la que hace
   scroll). Se desmontan al cambiar de vista y se rehacen si la vista se repinta. ── */
const MONTAJES=[],limpiezas=[];let ctx=null;
function desmontar(){if(ctx){ctx.revert();ctx=null;}while(limpiezas.length)try{limpiezas.pop()();}catch(e){}}
function montar(entrada){desmontar();
  /* Sin vista abierta lo que se ve es la portada, que hace scroll con la ventana. */
  if(quieto()||!G)return;const v=vistaActiva()||document.getElementById('home');if(!v)return;
  ctx=G.context(()=>{MONTAJES.forEach(m=>{if(v.matches(m.sel))try{m.f(v,!!entrada);}catch(e){}});},v);
  ST.refresh();}
FX.montar=montar;
alApagar.push(desmontar);
alEncender.push(()=>conGsap(()=>montar(false)));
conGsap(()=>montar(false));
/* Repintados que cambian el DOM de una vista abierta (idioma, filtros del catalogo). */
let espera=0;const remontar=()=>{clearTimeout(espera);espera=setTimeout(()=>montar(true),80);};
['ocBody','shopGrid','hOcc'].forEach(id=>{const el=document.getElementById(id);
  if(el&&'MutationObserver'in window)new MutationObserver(remontar).observe(el,{childList:true});});

/* B · Paginas de ocasion: parallax en varios planos. */
MONTAJES.push({sel:'#view-ocasion',f(v){
  const sc={scroller:v};
  const gan=v.querySelector('.oc-gancho');
  if(gan){const ph=gan.querySelector('.ph'),arch=gan.querySelector('.arch'),img=arch&&arch.querySelector('img'),txt=gan.querySelector('.aw>div');
    let halo=ph&&ph.querySelector('.fx-halo');
    if(ph&&!halo){halo=document.createElement('span');halo.className='fx-halo';halo.setAttribute('aria-hidden','true');ph.prepend(halo);}
    const tl=G.timeline({defaults:{ease:'none'},scrollTrigger:{...sc,trigger:gan,start:'top top',end:'bottom top',scrub:.6}});
    if(img){G.set(img,{scale:1.14,transformOrigin:'50% 30%'});tl.fromTo(img,{yPercent:-5},{yPercent:7},0);}
    if(arch)tl.to(arch,{y:-46,rotationY:-7,rotationX:3,transformPerspective:1000},0);
    if(halo)tl.to(halo,{y:54,x:-10},0);
    if(txt)tl.to(txt,{y:70,opacity:.35},0);}
  v.querySelectorAll('.oc-noche .mom .ph img').forEach(img=>{
    G.set(img,{scale:1.14});
    G.fromTo(img,{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{...sc,trigger:img.parentNode,start:'top bottom',end:'bottom top',scrub:true}});});
  v.querySelectorAll('.oc-prueba .proof').forEach(p=>{
    G.fromTo(p,{rotationX:20,y:70,transformPerspective:1100,transformOrigin:'50% 100%'},
      {rotationX:0,y:0,ease:'power1.out',scrollTrigger:{...sc,trigger:p,start:'top bottom',end:'top 58%',scrub:.5}});});
}});

/* ── C · Transiciones entre vistas, con direccion ─────────────────────────────
   Orden del recorrido: arma (1) → ocasion (2) → arma/fecha (3) → arma/show (4).
   Entre dos vistas del recorrido gira la pagina (View Transitions); si el navegador
   no las tiene, o se llega desde la portada o el menu, entran los bloques con GSAP. */
const OCAS=['bodas','empresas','noches','celebraciones','planners'];
function rango(r){const [a,b]=r.split('/');
  if(a==='arma')return b==='fecha'?3:b==='show'?4:1;
  return OCAS.includes(a)?2:0;}
let rutaUlt=rutaActual();
const barraDe=v=>v&&v.querySelector('.arma-bar');
const nombrar=(v,on)=>{const b=barraDe(v);if(b)b.style.viewTransitionName=on?'fx-barra':'';};
function entrada(v,dir){
  if(!G||!v||quieto())return null;
  const aw=v.querySelector('.aw');if(!aw)return null;
  const items=[];
  [...aw.children].forEach(el=>{
    if(el.matches('.occ-grid'))items.push(...el.children);
    else if(el.tagName==='DIV'&&!el.className)items.push(...el.children);
    else items.push(el);});
  const vis=items.filter(el=>{const r=el.getBoundingClientRect();return r.height&&r.top<innerHeight;}).slice(0,10);
  if(!vis.length)return null;
  return G.from(vis,{opacity:0,y:26,x:dir==='atras'?-34:dir==='adelante'?34:0,rotationX:7,transformPerspective:900,
    duration:.8,ease:'power3.out',stagger:.055,clearProps:'opacity,transform'});}
let bajoMenu=false;
FX.transicion=function(ir,fin){
  /* El menu es un panel sobre la vista: ni al abrirlo ni al cerrarlo sobre la misma
     ruta se anima o se remonta lo que hay debajo. */
  if(rutaActual()==='menu'){bajoMenu=true;ir();fin();return;}
  const de=rutaUlt,a=rutaActual();rutaUlt=a;
  if(bajoMenu){bajoMenu=false;if(de===a){ir();fin();return;}}
  const r1=rango(de),r2=rango(a);
  const dir=r2>r1?'adelante':r2<r1?'atras':(OCAS.indexOf(a.split('/')[0])>=OCAS.indexOf(de.split('/')[0])?'adelante':'atras');
  if(quieto()||de===a){ir();montar(false);fin();return;}
  if(document.startViewTransition&&r1>0&&r2>0&&vistaActiva()){
    root.dataset.dir=dir;root.classList.add('vt');desmontar();nombrar(vistaActiva(),true);
    let t;
    try{t=document.startViewTransition(()=>{nombrar(vistaActiva(),false);ir();nombrar(vistaActiva(),true);});}
    catch(e){root.classList.remove('vt');ir();montar(false);fin();return;}
    const cerrar=()=>{root.classList.remove('vt');delete root.dataset.dir;nombrar(vistaActiva(),false);montar(false);fin();};
    t.finished.then(cerrar,cerrar);return;}
  ir();
  const v=vistaActiva(),tw=entrada(v,r1>0&&r2>0?dir:'');
  montar(true);
  if(tw)tw.eventCallback('onComplete',fin);else fin();};

/* ── D · Scroll ────────────────────────────────────────────────────────────────
   Revelado: solo lo que esta por debajo del borde al montar; lo que ya se ve no se
   esconde nunca (ni siquiera un instante). */
const bajoElBorde=el=>el.getBoundingClientRect().top>innerHeight;
function revelar(v,items){
  items=items.filter(bajoElBorde);if(!items.length)return;
  G.set(items,{opacity:0,y:42,rotationX:9,transformPerspective:900,transformOrigin:'50% 0%',transition:'none'});
  ST.batch(items,{scroller:v.id==='home'?window:v,start:'top bottom-=20',once:true,
    onEnter:els=>G.to(els,{opacity:1,y:0,rotationX:0,duration:.9,ease:'power3.out',stagger:.08,overwrite:true,clearProps:'opacity,transform,transition'})});}

/* La noche de ejemplo, fijada mientras pasan sus tres momentos. */
function noche(v){
  const sec=v.querySelector('.oc-noche'),linea=sec&&sec.querySelector('.linea');
  if(!linea)return;const moms=[...linea.querySelectorAll('.mom')];if(moms.length<2)return;
  const barra=(v.querySelector('.arma-bar')||{}).offsetHeight||64,hueco=innerHeight-barra-28;
  const pila=getComputedStyle(linea).gridTemplateColumns.split(' ').length<2;
  sec.style.setProperty('--fx-barra',barra+'px');
  sec.classList.add('fx-pin');if(pila)sec.classList.add('fx-pila');
  if(linea.offsetHeight>hueco){sec.classList.remove('fx-pin','fx-pila');return;} /* no cabe: sin fijar */
  const tramo=document.createElement('div');tramo.className='fx-tramo';tramo.setAttribute('aria-hidden','true');
  const largo=Math.round(innerHeight*(pila?.75:.55)*(moms.length-1)+innerHeight*.25);
  tramo.style.height=largo+'px';
  /* Escena propia (linea + tramo): el sticky se suelta al acabar el tramo y no pisa lo
     que viene detras (la nota «Opcional en bodas…» se montaba sobre la ultima carta). */
  const escena=document.createElement('div');escena.className='fx-escena';
  linea.before(escena);escena.append(linea,tramo);
  const fijo=barra+14+linea.offsetHeight;
  const tl=G.timeline({defaults:{ease:'power2.out'},scrollTrigger:{scroller:v,trigger:tramo,start:'top '+fijo+'px',end:'bottom '+fijo+'px',scrub:.6}});
  const marcas=moms.map(m=>m.querySelector('.marca')).filter(Boolean);
  if(pila){
    G.set(moms.slice(1),{yPercent:104});
    moms.slice(1).forEach((m,i)=>{
      tl.to(moms[i],{scale:.9,rotationX:7,transformPerspective:900,duration:1},i*1.2) /* tapada: retrocede, sin transparencia */
        .to(m,{yPercent:0,duration:1},i*1.2)
        .from(m.querySelector('.marca'),{scale:0,opacity:0,duration:.4,ease:'back.out(2)'},i*1.2+.7);});
  }else{
    sec.style.setProperty('--fx-linea',0);
    G.set(moms.slice(1),{opacity:.22,y:34,rotationX:-10,transformPerspective:900,transformOrigin:'50% 100%'});
    G.set(marcas.slice(1),{scale:0,opacity:0});
    tl.to(sec,{'--fx-linea':1/(moms.length-1)*.5,duration:.5,ease:'none'},0);
    moms.slice(1).forEach((m,i)=>{const t=.5+i*1.1;
      tl.to(sec,{'--fx-linea':(i+1)/(moms.length-1),duration:.6,ease:'none'},t)
        .to(m,{opacity:1,y:0,rotationX:0,duration:.8},t+.3)
        .to(marcas[i+1]||{},{scale:1,opacity:1,duration:.35,ease:'back.out(2)'},t+.8);});
  }
  /* El tramo y las clases se quitan al desmontar (ctx.revert no conoce el DOM nuevo). */
  return ()=>{escena.before(linea);escena.remove();sec.classList.remove('fx-pin','fx-pila');sec.style.removeProperty('--fx-linea');sec.style.removeProperty('--fx-barra');};}

MONTAJES.push({sel:'#view-ocasion',f(v){
  const fin=noche(v);if(fin)limpiezas.push(fin);
  revelar(v,[...v.querySelectorAll('.oc-noche .a-eyebrow,.oc-noche h2,.oc-noche .nota,.oc-noche .opcion,.oc-accion .liana,.oc-accion .box,.oc-accion .viaje,.oc-otras .a-eyebrow,.oc-otras .row a,.cierre .row,.cierre .pie')]);}});
/* Liana, galeria y catalogo (tanda 3): lo que queda bajo el borde se revela al bajar. */
MONTAJES.push({sel:'#view-about',f(v){
  revelar(v,[...v.querySelectorAll('.li-bio p,.li-cols>div,.li-equipo .aw>*,.cierre .row,.cierre .pie')]);}});
MONTAJES.push({sel:'#view-gallery',f(v){
  revelar(v,[...v.querySelectorAll('.gal,.cat-note,.cierre .row,.cierre .pie')]);}});
MONTAJES.push({sel:'#view-services',f(v){
  revelar(v,[...v.querySelectorAll('.cat-note,.cierre .row,.cierre .pie')]);}});

/* Portada (tanda 4): cada tramo se revela al llegar; la carta de servicios, fila a fila. */
MONTAJES.push({sel:'#home',f(v){
  revelar(v,[...v.querySelectorAll('.tr-h,.tr .occ,.tr .a-links,.carta li,.tr-go,.tr-li .lead,.tr-li .a-link,.tr-li .ph,.mosaico,.tr-fin .hero-steps li,.cierre .row,.cierre .pie')]);}});

/* El catalogo se arma al bajar: cada ficha llega desde atras, girada, y se asienta. */
MONTAJES.push({sel:'#view-services',f(v,entra){
  let fichas=[...v.querySelectorAll('#shopGrid .svc-card')];
  if(!entra)fichas=fichas.filter(bajoElBorde);
  if(!fichas.length)return;
  G.set(fichas,{opacity:0,y:80,z:-140,rotationX:-30,rotationY:(i)=>i%2?9:-9,transformOrigin:'50% 0%',transition:'none'});
  ST.batch(fichas,{scroller:v,start:'top bottom-=10',once:true,
    onEnter:els=>G.to(els,{opacity:1,y:0,z:0,rotationX:0,rotationY:0,duration:1,ease:'power3.out',stagger:.07,overwrite:true,clearProps:'opacity,transform,transition'})});}});

/* Al cambiar el tamano de la ventana cambian el modo de la noche y las medidas. */
let rz=0;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(ctx)montar(false);},250);});

/* @piezas */
})();
