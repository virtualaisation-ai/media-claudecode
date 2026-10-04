#!/usr/bin/env bash
# Rigenera tutti i video de La Pulpería.
#   ./build.sh            usa lo scroll salvato in assets/scroll.mp4
#   ./build.sh --record   registra di nuovo lo scroll dal sito live (serve accesso di rete al dominio)
set -euo pipefail
cd "$(dirname "$0")"
E=../../engine
rm -rf build && mkdir -p build/frames output
if [[ "${1:-}" == "--record" ]]; then
  node $E/record.js scroll.json build/frames
  ffmpeg -y -loglevel error -framerate 30 -i build/frames/f_%04d.jpg -c:v libx264 -crf 12 -preset slow -pix_fmt yuv444p assets/scroll.mp4
else
  ffmpeg -y -loglevel error -i assets/scroll.mp4 -q:v 2 -start_number 0 build/frames/f_%04d.jpg
fi
node $E/render.js story_it.html output/pulperia_storia_prima_dopo_IT.mp4 22.5
node $E/render.js story_es.html output/pulperia_historia_antes_despues_ES.mp4 22.5
node $E/render.js reel_es.html build/reel_video.mp4 28
python3 $E/sfx.py reel_sfx.json build/reel_sfx.wav
ffmpeg -y -loglevel error -i build/reel_video.mp4 -i build/reel_sfx.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/fuerte_digitales_reel_ES.mp4
node $E/render.js reel_es.html output/fuerte_digitales_reel_ES_portada.jpg 0 --still 2.0
echo "Fatto: $(ls output)"
