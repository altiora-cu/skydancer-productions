/* Efectos de «Arma tu show»: profundidad, transiciones entre vistas y scroll.
   Es mejora progresiva: si este archivo o GSAP no cargan, el sitio funciona igual,
   porque nada queda oculto esperando una animacion. Todo el CSS de efectos cuelga de
   html.fx, que solo existe con movimiento permitido (sistema y boton de pausa).
   GSAP no se pide al cargar: entra en reposo tras el evento load, para no competir
   con el reel ni con la foto que pinta el LCP. */
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

const arrancar=()=>{const go=()=>pedirGsap();
  if('requestIdleCallback'in window)requestIdleCallback(go,{timeout:2500});else setTimeout(go,1200);};
if(document.readyState==='complete')arrancar();else addEventListener('load',arrancar,{once:true});

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
const MONTAJES=[];let ctx=null;
function desmontar(){if(ctx){ctx.revert();ctx=null;}}
function montar(entrada){desmontar();
  if(quieto()||!G)return;const v=vistaActiva();if(!v)return;
  ctx=G.context(()=>{MONTAJES.forEach(m=>{if(v.matches(m.sel))try{m.f(v,!!entrada);}catch(e){}});},v);
  ST.refresh();}
FX.montar=montar;
alApagar.push(desmontar);
alEncender.push(()=>conGsap(()=>montar(false)));
conGsap(()=>montar(false));
/* Repintados que cambian el DOM de una vista abierta (idioma, filtros del catalogo). */
let espera=0;const remontar=()=>{clearTimeout(espera);espera=setTimeout(()=>montar(false),80);};
['ocBody','shopGrid'].forEach(id=>{const el=document.getElementById(id);
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

/* Hasta la pieza de navegacion: montar tras cada cambio de ruta. */
addEventListener('hashchange',()=>requestAnimationFrame(()=>montar(true)));

/* @piezas */
})();
