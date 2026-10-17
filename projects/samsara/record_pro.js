// Registra il report dell'Agenda Pro (agenda.html?demo=1) sezione per sezione, con una pausa su ognuna.
// Salva anche i testi dei consigli e le posizioni degli elementi da evidenziare (pro_meta.json).
// Uso: servire samsara-bot in locale su :8765, poi  node record_pro.js <cartella_frames>
const { chromium, devices } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
const out = process.argv[2] || 'build/pro';
const FPS = 30, MOVE = 0.6, TOP = 104;
const HOLD = { insights: 4.4, kpi: 2.3, chart: 2.0, services: 2.2, heat: 3.0, money: 2.2 };   // secondi di pausa per sezione
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
// sezioni del report: selettore CSS e, per le card, il titolo
const SECTIONS = [
  ['insights', '.insights', ''], ['kpi', '.hero', ''], ['chart', '.card', 'Incasso giorno per giorno'],
  ['services', '.card', 'Trattamenti più richiesti'], ['heat', '.card', 'Quando la cabina'], ['money', '.card', 'Soldi'],
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 769 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: devices['iPhone 13'].userAgent, timezoneId: 'Atlantic/Canary' });
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date('2026-10-16T12:30:00+01:00') });
  await p.goto('http://localhost:8765/agenda.html?demo=1', { waitUntil: 'networkidle' });
  await p.clock.runFor(800);
  await p.click('#tReport'); await p.clock.runFor(600);
  const meta = await p.evaluate(([secs, TOP]) => {
    const res = {};
    for (const [key, sel, title] of secs) {
      const el = [...document.querySelectorAll(sel)].find(e => !title || e.textContent.trim().startsWith(title));
      if (el) { const r = el.getBoundingClientRect(); res[key] = { y: Math.max(0, Math.round(r.top + scrollY - TOP)), h: Math.round(r.height) }; }
    }
    const ins = document.querySelector('.insights');
    const tipEls = ins ? [...ins.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim().length > 25) : [];
    res.tips = tipEls.map(e => e.textContent.trim());
    // riquadro di ogni consiglio (tutta la riga, icona compresa) nella posizione di pausa della card dei consigli
    res.tipRects = tipEls.map(e => { const r = (e.parentElement.children.length <= 3 ? e.parentElement : e).getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top + scrollY - res.insights.y), w: Math.round(r.width), h: Math.round(r.height) }; });
    return res;
  }, [SECTIONS, TOP]);
  // percorso: per ogni sezione, scorrimento + pausa
  const plan = []; let t = 0.8;
  for (const [key] of SECTIONS) { if (!meta[key]) continue; plan.push({ key, start: t, y: meta[key].y }); t += MOVE + HOLD[key]; }
  const DUR = t + 0.4;
  const Y = tt => { let y = 0, prevY = 0;
    for (const s of plan) { if (tt < s.start) break; const u = Math.min(1, (tt - s.start) / MOVE); y = prevY + (s.y - prevY) * eio(u); prevY = s.y; }
    return y; };
  for (let i = 0; i < Math.round(FPS * DUR); i++) {
    await p.evaluate(y => scrollTo(0, y), Math.round(Y(i / FPS)));
    await p.clock.runFor(1000 / FPS);
    await p.screenshot({ path: `${out}/f_${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 });
  }
  meta.plan = plan.map(s => ({ key: s.key, hold: +(s.start + MOVE).toFixed(2) })); meta.duration = +DUR.toFixed(2);
  fs.writeFileSync('pro_meta.json', JSON.stringify(meta, null, 1));
  console.log(JSON.stringify(meta, null, 1));
  await b.close();
})();
