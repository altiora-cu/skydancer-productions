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

/* @piezas */
})();
