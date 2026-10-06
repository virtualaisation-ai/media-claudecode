#!/usr/bin/env bash
# Rigenera il reel portfolio di Fuerte Digitales (6 casi).
# Usa gli scroll registrati di la-pulperia e twinny-singlefin e la demo dell'Agenda Pro di Samsara (assets/samsara_agenda.mp4,
# registrata con record_samsara.js da samsara-bot servito in locale su :8765 con agenda.html?demo=1)
# e lo scroll di dreambarbershop.es (assets/dream_scroll.mp4, da ../../engine/record.js scroll_dream.json).
set -euo pipefail
cd "$(dirname "$0")"
E=../../engine
rm -rf build && mkdir -p build/pul build/tw build/sam build/dream output
ffmpeg -y -loglevel error -i ../la-pulperia/assets/scroll.mp4 -q:v 2 -start_number 0 build/pul/f_%04d.jpg
ffmpeg -y -loglevel error -i ../twinny-singlefin/assets/scroll.mp4 -q:v 2 -start_number 0 build/tw/f_%04d.jpg
ffmpeg -y -loglevel error -i assets/samsara_agenda.mp4 -q:v 2 -start_number 0 build/sam/f_%04d.jpg
ffmpeg -y -loglevel error -i assets/dream_scroll.mp4 -q:v 2 -start_number 0 build/dream/f_%04d.jpg
node $E/render.js reel_portfolio_es.html build/reel_video.mp4 49.5
python3 $E/sfx.py reel_sfx.json build/reel_sfx.wav
ffmpeg -y -loglevel error -i build/reel_video.mp4 -i build/reel_sfx.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/fuerte_digitales_reel_trabajos_ES.mp4
node $E/render.js reel_portfolio_es.html output/fuerte_digitales_reel_trabajos_ES_portada.jpg 0 --still 2.2
echo "Fatto: $(ls output)"
