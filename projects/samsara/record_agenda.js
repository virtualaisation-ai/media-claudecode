// Registra l'Agenda Pro di samsara-bot in modalità demo (agenda.html?demo=1): agenda → report → grafici → mappa occupazione.
// Uso: servire samsara-bot in locale su :8765, poi  node record_agenda.js <cartella_frames>
const { chromium, devices } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
const out = process.argv[2] || 'build/agenda';
const FPS = 30, DUR = 7;
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 769 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: devices['iPhone 13'].userAgent, timezoneId: 'Atlantic/Canary' });
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date('2026-10-16T12:30:00+01:00') });   // venerdì: agenda del giorno piena
  await p.goto('http://localhost:8765/agenda.html?demo=1', { waitUntil: 'networkidle' });
  await p.clock.runFor(1000);
  // posizioni delle sezioni del report, misurate una volta
  await p.click('#tReport'); await p.clock.runFor(500);
  const pos = await p.evaluate(() => {
    const find = re => { const e = [...document.querySelectorAll('.card *')].find(x => x.children.length < 3 && re.test(x.innerText)); return e ? Math.round(e.getBoundingClientRect().top + scrollY) - 110 : 0; };
    return { chart: find(/Incasso giorno per giorno/), heat: find(/Quando la cabina/) };
  });
  await p.click('#tAgenda'); await p.clock.runFor(300);
  const K = [[3.8, 0], [4.5, pos.chart], [5.3, pos.chart], [6.0, pos.heat]];
  const Y = t => { if (t <= K[0][0]) return 0; for (let i = 0; i < K.length - 1; i++) { const [a, ya] = K[i], [c, yc] = K[i + 1]; if (t <= c) return ya + (yc - ya) * (yc !== ya ? eio((t - a) / (c - a)) : 1); } return pos.heat; };
  const done = {};
  for (let i = 0; i < FPS * DUR; i++) {
    const t = i / FPS;
    if (t >= 1.3 && !done.w) { done.w = 1; await p.locator('button', { hasText: 'Settimana' }).first().click(); }
    if (t >= 2.6 && !done.r) { done.r = 1; await p.click('#tReport'); }
    await p.evaluate(y => scrollTo(0, y), Math.round(Y(t)));
    await p.clock.runFor(1000 / FPS);
    await p.screenshot({ path: `${out}/f_${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 });
  }
  console.log(JSON.stringify(pos));
  await b.close();
})();
