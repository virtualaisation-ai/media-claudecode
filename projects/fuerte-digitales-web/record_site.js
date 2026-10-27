// Registra lo scroll di fuertedigitales.es su desktop e telefono con le stesse tappe (scroll.json),
// orologio e animazioni CSS controllati.  Uso: node record_site.js desk|mob <cartella_frames>
const { chromium, devices } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
const [kind, out] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(__dirname + '/scroll.json', 'utf8'));
const dev = cfg[kind], FPS = cfg.fps, K = dev.stops;
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const Y = t => { for (let i = 0; i < K.length - 1; i++) { const [a, ya] = K[i], [b, yb] = K[i + 1]; if (t <= b) return ya + (yb - ya) * eio((t - a) / (b - a || 1)); } return K[K.length - 1][1]; };
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy });
  const [w, h] = dev.viewport;
  const opts = { viewport: { width: w, height: h }, deviceScaleFactor: dev.scale, locale: 'es-ES', timezoneId: 'Atlantic/Canary' };
  if (kind === 'mob') Object.assign(opts, { isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent });
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date('2026-10-27T11:00:00+00:00') });
  await p.goto(cfg.url, { waitUntil: 'networkidle', timeout: 60000 });
  // pre-scroll: carica immagini lazy e fa partire le animazioni d'ingresso, poi torna su
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 350) { await p.evaluate(y => scrollTo(0, y), y); await p.clock.runFor(250); await p.waitForTimeout(60); }
  await p.evaluate(() => { scrollTo(0, 0); document.documentElement.style.scrollBehavior = 'auto'; });
  await p.clock.runFor(2000); await p.waitForTimeout(500);
  await p.evaluate(() => { window.__adv = dt => document.getAnimations().forEach(a => { if (a.playState !== 'paused') a.pause(); a.currentTime = (a.currentTime || 0) + dt; }); });
  for (let i = 0; i < Math.round(FPS * cfg.duration); i++) {
    await p.evaluate(y => scrollTo(0, y), Math.round(Y(i / FPS)));
    await p.clock.runFor(1000 / FPS);
    await p.evaluate(dt => __adv(dt), 1000 / FPS);
    await p.screenshot({ path: `${out}/f_${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 88 });
  }
  await b.close();
})();
