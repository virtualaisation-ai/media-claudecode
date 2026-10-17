// Registra la demo di samsara-bot (index.html: chat + agenda) con orologio e animazioni controllati.
// Uso: servire samsara-bot in locale su :8765, poi  node record_demo.js <cartella_frames>
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
const out = process.argv[2] || 'build/demo';
const FPS = 30, DUR = 21;
// [secondo, azione]: clic sul bottone che contiene il testo, oppure scrittura del nome
const ACTIONS = [
  [0.8, 'Español'], [2.2, 'Reservar cita'], [3.4, 'Masajes'], [4.6, '1 h · 45 €'], [5.8, 'Relajante'],
  [7.0, 'Continuar'], [8.3, 'mar, 20 oct'], [9.6, 'slot:pm'], [10.8, 'type:Laura'], [13.2, 'Señal 22,50 €'], [14.8, 'Simular pago'],
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 880 }, deviceScaleFactor: 1.5, locale: 'es-ES', timezoneId: 'Atlantic/Canary' });
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date('2026-10-17T10:00:00+01:00') });
  await p.goto('http://localhost:8765/', { waitUntil: 'networkidle' });
  await p.clock.runFor(1500);
  await p.waitForSelector('button:has-text("Español")');
  await p.evaluate(() => { window.__adv = dt => document.getAnimations().forEach(a => { if (a.playState !== 'paused') a.pause(); a.currentTime = (a.currentTime || 0) + dt; }); });
  let next = 0, typing = null;
  for (let i = 0; i < FPS * DUR; i++) {
    const t = i / FPS;
    while (next < ACTIONS.length && t >= ACTIONS[next][0]) {
      const a = ACTIONS[next++][1];
      if (a.startsWith('type:')) typing = { text: a.slice(5), at: t };
      else if (a === 'slot:pm') {   // primo orario libero dalle 16:00 in poi (altrimenti l'ultimo della lista)
        const slots = p.locator('#msgs button').filter({ hasText: '→' });
        const texts = await slots.allInnerTexts();
        let k = texts.findIndex(x => x.trim().slice(0, 2) >= '16'); if (k < 0) k = texts.length - 1;
        await slots.nth(k).click();
      }
      else await p.locator('#msgs button').filter({ hasText: a }).last().click();
    }
    if (typing) {   // una lettera ogni 0,15 s, poi Enviar
      const n = Math.floor((t - typing.at) / 0.15);
      const box = p.locator('#inp');
      if (n <= typing.text.length) await box.fill(typing.text.slice(0, n));
      else { await p.locator('#f button').click(); typing = null; }
    }
    await p.clock.runFor(1000 / FPS);
    await p.evaluate(dt => __adv(dt), 1000 / FPS);
    await p.screenshot({ path: `${out}/f_${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 });
  }
  await b.close();
})();
