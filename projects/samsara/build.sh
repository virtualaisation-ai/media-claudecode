#!/usr/bin/env bash
# Rigenera reel e storia del caso Samsara.
#   ./build.sh            usa le registrazioni salvate in assets/
#   ./build.sh --record   registra di nuovo dalla demo di samsara-bot (serve il repo servito in locale su :8765)
set -euo pipefail
cd "$(dirname "$0")"
E=../../engine
rm -rf build && mkdir -p build/demo build/agenda output
if [[ "${1:-}" == "--record" ]]; then
  node record_demo.js build/demo && node record_agenda.js build/agenda
  ffmpeg -y -loglevel error -framerate 30 -i build/demo/f_%04d.jpg -c:v libx264 -crf 14 -preset slow -pix_fmt yuv444p assets/demo_chat_agenda.mp4
  ffmpeg -y -loglevel error -framerate 30 -i build/agenda/f_%04d.jpg -c:v libx264 -crf 12 -preset slow -pix_fmt yuv444p assets/agenda_pro.mp4
else
  ffmpeg -y -loglevel error -i assets/demo_chat_agenda.mp4 -q:v 2 -start_number 0 build/demo/f_%04d.jpg
  ffmpeg -y -loglevel error -i assets/agenda_pro.mp4 -q:v 2 -start_number 0 build/agenda/f_%04d.jpg
fi
node $E/render.js samsara_es.html build/reel.mp4 39.5
node $E/render.js "samsara_es.html#story" build/story.mp4 17.5
python3 $E/sfx.py reel_sfx.json build/reel_sfx.wav
python3 $E/sfx.py story_sfx.json build/story_sfx.wav
ffmpeg -y -loglevel error -i build/reel.mp4 -i build/reel_sfx.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/samsara_reel_ES.mp4
ffmpeg -y -loglevel error -i build/story.mp4 -i build/story_sfx.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/samsara_historia_ES.mp4
node $E/render.js samsara_es.html output/samsara_reel_ES_portada.jpg 0 --still 2.2
echo "Fatto: $(ls output)"
