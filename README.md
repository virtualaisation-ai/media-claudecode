# Fuerte Digitales — Video Engine

Genera video promozionali dai siti dei clienti: **storie prima/dopo** e **reel dolore → soluzione → CTA**,
partendo da uno screenshot del vecchio sito e dallo **scroll reale** del sito nuovo.

Ogni video è una pagina HTML animata (`window.render(t)`) renderizzata fotogramma per fotogramma con Chromium
(Playwright) e codificata con ffmpeg in 1080×1920, 30 fps.

## Struttura

```
engine/
  record.js   registra lo scroll del sito in formato telefono (390×769 @2x) con animazioni CSS a tempo controllato
  render.js   renderizza una pagina HTML animata in MP4 (o un fotogramma singolo con --still)
  sfx.py      genera gli effetti sonori (thump, whoosh, pop, tick) e li mixa sugli istanti indicati
shared/
  fonts/      Anton + Inter (woff2)
  brand/      logo Fuerte Digitales (scritta bianca: pensato per sfondi scuri)
projects/
  la-pulperia/
    assets/old.jpg       screenshot del vecchio sito
    assets/scroll.mp4    scroll del nuovo sito (pulperiaftv.es), quasi-lossless
    scroll.json          URL e tappe dello scroll [secondi, scrollY]
    story_it.html        storia prima/dopo — italiano
    story_es.html        historia antes/después — español
    reel_es.html         reel dolor → solución → CTA — español
    reel_sfx.json        istanti degli effetti sonori del reel
    post_caption_ES.md   testo del post per Instagram
    build.sh             rigenera tutti i video
    output/              video finali + copertina del reel
  twinny-singlefin/
    assets/favicon.png, assets/scroll.mp4   favicon e scroll di singlefinburger.com
    reel_pov_es.html     reel POV: ricerca → risultato → giornata dal pranzo al tramonto → CTA
    reel_sfx.json, scroll.json, post_caption_ES.md, build.sh
    output/              reel + copertina
```

## Requisiti

- Node.js con `playwright` e Chromium
- ffmpeg (con libx264), Python 3

## Rigenerare i video

```bash
cd projects/la-pulperia
./build.sh            # usa lo scroll salvato in assets/scroll.mp4
./build.sh --record   # registra di nuovo lo scroll dal sito live
```

Se `playwright` non è installato globalmente: `PLAYWRIGHT_PATH=/percorso/node_modules/playwright ./build.sh`.

## Nuovo cliente

1. Copia `projects/la-pulperia` in `projects/<cliente>`.
2. Sostituisci `assets/old.jpg` con lo screenshot del vecchio sito (formato telefono).
3. In `scroll.json` metti l'URL nuovo e regola le tappe sulle sezioni del sito
   (le posizioni si ricavano dagli `offsetTop` delle sezioni, meno ~10 px).
4. Nei file HTML aggiorna i testi: nome del locale, etichette dei difetti (solo difetti **veri** del vecchio sito)
   e delle soluzioni (solo cose che il nuovo sito **ha davvero**).
5. `./build.sh --record`

## Note sull'ambiente cloud (Claude Code)

- Il dominio del sito va aggiunto agli *Allowed domains* della rete dell'ambiente.
- Chromium deve fidarsi della CA del proxy: `certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n ccr-agent-proxy -i /root/.ccr/agent-proxy-ca.crt`
  (pacchetto `libnss3-tools`). `record.js` usa automaticamente `HTTPS_PROXY` se presente.
