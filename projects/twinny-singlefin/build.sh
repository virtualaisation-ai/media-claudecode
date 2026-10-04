#!/usr/bin/env bash
# Rigenera il reel POV di Twinny & Single Fin.
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
node $E/render.js reel_pov_es.html build/reel_video.mp4 30
python3 $E/sfx.py reel_sfx.json build/reel_sfx.wav
ffmpeg -y -loglevel error -i build/reel_video.mp4 -i build/reel_sfx.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/twinny_singlefin_reel_POV_ES.mp4
node $E/render.js reel_pov_es.html output/twinny_singlefin_reel_POV_ES_portada.jpg 0 --still 2.9
echo "Fatto: $(ls output)"
