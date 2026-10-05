#!/usr/bin/env bash
# Rigenera il reel brand di Fuerte Digitales (usa lo scroll registrato di Twinny & Single Fin).
set -euo pipefail
cd "$(dirname "$0")"
E=../../engine
rm -rf build && mkdir -p build/frames output
ffmpeg -y -loglevel error -i ../twinny-singlefin/assets/scroll.mp4 -q:v 2 -start_number 0 build/frames/f_%04d.jpg
node $E/render.js reel_brand_es.html build/reel_video.mp4 33
python3 $E/sfx.py reel_sfx.json build/reel_sfx.wav
ffmpeg -y -loglevel error -i build/reel_video.mp4 -i build/reel_sfx.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/fuerte_digitales_reel_marca_ES.mp4
node $E/render.js reel_brand_es.html output/fuerte_digitales_reel_marca_ES_portada.jpg 0 --still 2.2
echo "Fatto: $(ls output)"
