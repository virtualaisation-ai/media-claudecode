// Renderizza una pagina HTML animata (che espone window.render(t)) in un MP4 1080x1920, fotogramma per fotogramma.
// Uso: node engine/render.js <pagina.html> <out.mp4|out.jpg> <durata_s> [fps] [--still <t>]
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const { spawn } = require('child_process');
const args = process.argv.slice(2);
const stillIdx = args.indexOf('--still');
const still = stillIdx >= 0 ? +args.splice(stillIdx, 2)[1] : null;
const [page, out, dur = '0', fps = '30'] = args;

// Le pagine con lo scroll del sito impostano window.__frame (un solo <img id="aimg">)
// oppure window.__frames = { idImmagine: percorso } per più sequenze; aspettiamo che ogni fotogramma sia decodificato.
const step = async (p, t) => p.evaluate(async t => {
  render(t);
  const frames = Object.assign({}, window.__frames || {});
  if (window.__frame) frames.aimg = window.__frame;
  for (const [id, src] of Object.entries(frames)) {
    const im = document.getElementById(id);
    if (im && src && !im.src.endsWith(src)) { im.src = src; await im.decode(); }
  }
}, t);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(page));
  await p.evaluate(() => document.fonts.ready);
  if (still !== null) { await step(p, still); await p.screenshot({ path: out, type: 'jpeg', quality: 95 }); await b.close(); return; }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', fps, '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(+dur * +fps);
  for (let i = 0; i < n; i++) {
    await step(p, i / +fps);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
})();
