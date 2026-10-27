#!/usr/bin/env bash
# Rigenera i reel di fuertedigitales.es: browser + telefono in sincrono, e versione solo desktop.
#   ./build.sh            usa le registrazioni salvate in assets/
#   ./build.sh --record   registra di nuovo dal sito live (serve accesso di rete a www.fuertedigitales.es)
set -euo pipefail
cd "$(dirname "$0")"
E=../../engine
rm -rf build && mkdir -p build/desk build/mob output
if [[ "${1:-}" == "--record" ]]; then
  node record_site.js desk build/desk & node record_site.js mob build/mob; wait
  ffmpeg -y -loglevel error -framerate 30 -i build/desk/f_%04d.jpg -c:v libx264 -crf 14 -preset slow -pix_fmt yuv444p assets/scroll_desk.mp4
  ffmpeg -y -loglevel error -framerate 30 -i build/mob/f_%04d.jpg -c:v libx264 -crf 14 -preset slow -pix_fmt yuv444p assets/scroll_mob.mp4
else
  ffmpeg -y -loglevel error -i assets/scroll_desk.mp4 -q:v 2 -start_number 0 build/desk/f_%04d.jpg
  ffmpeg -y -loglevel error -i assets/scroll_mob.mp4 -q:v 2 -start_number 0 build/mob/f_%04d.jpg
fi
node $E/render.js reel_web_es.html build/reel.mp4 29
python3 $E/sfx.py reel_sfx.json build/reel_sfx.wav
ffmpeg -y -loglevel error -i build/reel.mp4 -i build/reel_sfx.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/fuerte_digitales_web_reel_ES.mp4
node $E/render.js reel_web_es.html output/fuerte_digitales_web_reel_ES_portada.jpg 0 --still 2.6
# versione solo desktop (stessi tempi, stessi effetti sonori)
node $E/render.js "reel_web_es.html#desk" build/reel_desk.mp4 29
ffmpeg -y -loglevel error -i build/reel_desk.mp4 -i build/reel_sfx.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/fuerte_digitales_web_reel_desktop_ES.mp4
node $E/render.js "reel_web_es.html#desk" output/fuerte_digitales_web_reel_desktop_ES_portada.jpg 0 --still 2.6
echo "Fatto: $(ls output)"
