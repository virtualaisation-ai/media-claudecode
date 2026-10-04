// Registra lo scroll di un sito in formato telefono, fotogramma per fotogramma, con tempo delle animazioni CSS controllato.
// Uso: node engine/record.js <scroll.json> <cartella_frames>
const fs = require('fs');
const { chromium, devices } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [cfgPath, outDir] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const FPS = cfg.fps || 30, DUR = cfg.duration, K = cfg.stops; // stops: [[secondi, scrollY], ...]
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
function Y(t) {
  for (let i = 0; i < K.length - 1; i++) {
    const [a, ya] = K[i], [b, yb] = K[i + 1];
    if (t <= b) { const u = (t - a) / (b - a); return ya + (yb - ya) * ((yb - ya) > 100 ? eio(u) : u); }
  }
  return K[K.length - 1][1];
}
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy });
  const ctx = await b.newContext({ viewport: { width: 390, height: 769 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: devices['iPhone 13'].userAgent, locale: cfg.locale || 'es-ES' });
  const p = await ctx.newPage();
  await p.goto(cfg.url, { waitUntil: 'networkidle', timeout: 60000 });
  // pre-scroll per caricare immagini lazy e mappe, poi torna in cima
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(150); }
  await p.evaluate(() => { scrollTo(0, 0); document.documentElement.style.scrollBehavior = 'auto'; });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__adv = dt => document.getAnimations().forEach(a => { if (a.playState !== 'paused') a.pause(); a.currentTime = (a.currentTime || 0) + dt; }); __adv(0); });
  for (let i = 0; i < FPS * DUR; i++) {
    await p.evaluate(([y, dt]) => { scrollTo(0, y); __adv(dt); }, [Math.round(Y(i / FPS)), 1000 / FPS]);
    await p.screenshot({ path: `${outDir}/f_${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  await b.close();
})();
