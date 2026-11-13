#!/bin/bash
# Arma `dist/` con lo único que el sitio sirve de verdad.
#
# Existe porque este repo es PÚBLICO y además guarda cosas que no se publican:
# los originales pesados (el banner de 109 MB, los `-raw.mp4`), las fotos sin
# optimizar y los documentos internos de la agencia. Hasta ahora eso se decidía
# en `.vercelignore` — una lista de lo que se EXCLUYE, que falla callada en
# cuanto alguien añade un archivo nuevo. Esto es al revés: una lista de lo que
# se INCLUYE, así que lo que no esté aquí no se publica por descuido.
#
# Lo usa Cloudflare Pages como comando de construcción (salida: `dist`).
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
mkdir -p dist/assets "dist/video banner"

# La página y los medios que `index.html` referencia.
cp index.html efectos.js robots.txt sitemap.xml dist/
# GSAP vendorizado (version exacta en la ruta, con su licencia) para efectos.js.
cp -R vendor dist/
cp -R assets/gallery assets/services dist/assets/
cp assets/liana-founder.jpg assets/liana-avatar.jpg assets/liana-founder.mp4 assets/liana-hero.mp4 assets/og-skydancer.jpg dist/assets/
cp "video banner/skydancer-poster.jpg" "video banner/skydancer-web.mp4" "dist/video banner/"

# Caché: los medios se guardan un día y se revalidan en segundo plano una
# semana; el HTML nunca se sirve viejo, para que un cambio se vea en la
# siguiente carga. Es la misma política que tenía `vercel.json`.
# Cabeceras de seguridad para todo lo que sirve Pages (el panel en /panel es un Worker
# aparte y no las recibe). La CSP va en modo informe: avisa en la consola sin bloquear,
# para no romper nada en produccion antes de verlo funcionar ahi; cuando no haya avisos
# se pasa a Content-Security-Policy. HSTS no se pone aqui: es casi irreversible durante
# un ano y se decide en la zona de Cloudflare.
cat > dist/_headers <<'CABECERAS'
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(self), gyroscope=(self)
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
/*.mp4
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/*.jpg
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/*.png
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/*.webp
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/*.svg
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/vendor/*
  Cache-Control: public, max-age=31536000, immutable
/*.woff2
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/index.html
  Cache-Control: public, max-age=0, must-revalidate
/
  Cache-Control: public, max-age=0, must-revalidate
CABECERAS

find dist -name ".DS_Store" -delete

echo "dist/ listo: $(find dist -type f | wc -l | tr -d ' ') archivos, $(du -sh dist | cut -f1)"
