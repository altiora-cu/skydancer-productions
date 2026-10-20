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
cp index.html dist/
cp -R assets/gallery assets/services dist/assets/
cp assets/liana-founder.jpg assets/liana-founder.mp4 assets/liana-hero.mp4 dist/assets/
cp "video banner/skydancer-poster.jpg" "video banner/skydancer-web.mp4" "dist/video banner/"

# Caché: los medios se guardan un día y se revalidan en segundo plano una
# semana; el HTML nunca se sirve viejo, para que un cambio se vea en la
# siguiente carga. Es la misma política que tenía `vercel.json`.
cat > dist/_headers <<'CABECERAS'
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
/*.woff2
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/index.html
  Cache-Control: public, max-age=0, must-revalidate
/
  Cache-Control: public, max-age=0, must-revalidate
CABECERAS

find dist -name ".DS_Store" -delete

echo "dist/ listo: $(find dist -type f | wc -l | tr -d ' ') archivos, $(du -sh dist | cut -f1)"
