# SkyDancer Productions — sitio público

Sitio de **SkyDancer Productions** (Coral Gables, Miami, FL): bailarines, Hora Loca, robots LED, artistas de
fuego, músicos en vivo y producciones a medida para bodas, empresas, noches y celebraciones.

En vivo: <https://skydancerproduction.com>

## Qué tiene

- **Portada** con el reel a pantalla completa, las ocasiones, los 15 servicios con foto, la galería y Liana del Toro.
- **Español e inglés**, con el idioma a un toque en toda vista.
- **Vistas por dirección** (todas bajo `#/`): `servicios` y la ficha de cada uno (`servicios/<id>`), `liana`,
  `galeria`, las ocasiones (`bodas`, `empresas`, `noches`, `celebraciones`, `planners`), `arma` y `privacidad`.
  Las direcciones sin almohadilla que se suelen compartir (`/bodas`, `/privacidad`, `/privacy`…) llevan a su vista.
- **«Arma tu show»**: tres pasos para elegir ocasión, servicios y fecha. Al enviar, la solicitud entra en el panel
  de SkyDancer y se abre WhatsApp con el resumen ya escrito.
- **Política de privacidad** en `#/privacidad`, con casilla opcional (desmarcada) para promociones por WhatsApp.
- Sin cookies ni analítica. Con «reducir movimiento» activado, ningún vídeo arranca solo.

## Cómo verlo en local

Es un sitio estático: `index.html` + `efectos.js`, sin paso de compilación. Hace falta un servidor que entienda
peticiones parciales (`Range`), o los vídeos no pueden saltar ni volver al principio:

```bash
npx serve .
```

`python3 -m http.server` **no sirve** para probar vídeo: no implementa `Range`.

## Cómo se publica

Un push a `master` dispara `.github/workflows/publicar.yml`, que corre `publicar.sh` y sube `dist/` a Cloudflare
Pages. `publicar.sh` copia **solo** lo que el sitio usa: lo que no esté en su lista no se publica.

## Estructura

```
index.html                 Todo el sitio: HTML, CSS y JS
efectos.js                 Movimiento (mejora progresiva; sin él nada queda escondido)
vendor/gsap/               GSAP, servido desde el propio sitio
assets/
  services/<id>.jpg        Foto de cada servicio, 900 × 1200 (respaldo)
  services/<id>-360.webp   La misma foto en tres anchos: 360, 640 y 900
  services/<id>.mp4        Vídeo de la ficha, donde lo hay
  gallery/                 Piezas de la galería
  liana-*.jpg / .mp4       Retrato y vídeo de Liana
video banner/              Reel de la portada y su póster
publicar.sh                Arma dist/ para Cloudflare Pages
robots.txt, sitemap.xml
```

### Añadir o cambiar la foto de un servicio

1. Guardar el JPG como `assets/services/<id>.jpg`, a 900 × 1200 (3:4).
2. Generar los tres anchos en WebP (hace falta `cwebp`):

   ```bash
   for w in 360 640 900; do cwebp -q 80 -m 6 -resize $w 0 assets/services/<id>.jpg -o assets/services/<id>-$w.webp; done
   ```

Si falta un WebP, la tarjeta de ese servicio sale sin foto en los navegadores actuales: los cuatro archivos van juntos.

Los `<id>`: `dancers, gogo, greeters, robot, fire, sax, drummer, champagne, horaloca, choreo, themed, interactive,
photobooth, custom, coord`.

### Reencodar vídeo

Siempre con `-level 4.0 -refs 2`. Un nivel más alto hace que el teléfono decodifique por software y se trabe.

## Contacto

SkyDancer Productions · Coral Gables, Miami, FL · +1 786-992-4543 · <https://skydancerproduction.com>
