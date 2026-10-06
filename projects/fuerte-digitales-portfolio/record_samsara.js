const { chromium, devices } = require('/opt/node-tools/node_modules/playwright');
const FPS=30, DUR=7;
const eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const scrollAt=t=>{const k=[[3.8,0],[4.5,1110],[5.3,1110],[6.0,2060]];
  if(t<=3.8)return 0; for(let i=0;i<k.length-1;i++){const[a,ya]=k[i],[b,yb]=k[i+1]; if(t<=b){const u=(t-a)/(b-a);return ya+(yb-ya)*(yb!==ya?eio(u):u)}} return 2060};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:769}, deviceScaleFactor:2, isMobile:true, hasTouch:true, userAgent: devices['iPhone 13'].userAgent });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8765/agenda.html?demo=1', { waitUntil:'networkidle' }); await p.waitForTimeout(1000);
  let done={};
  for(let i=0;i<FPS*DUR;i++){
    const t=i/FPS;
    if(t>=1.3&&!done.w){done.w=1; await p.locator('text=Settimana').first().click(); await p.waitForTimeout(300);}
    if(t>=2.6&&!done.r){done.r=1; await p.click('#tReport'); await p.waitForTimeout(400);}
    await p.evaluate(y=>scrollTo(0,y), Math.round(scrollAt(t)));
    await p.screenshot({ path:`frames/f_${String(i).padStart(4,'0')}.jpg`, type:'jpeg', quality:92 });
  }
  await b.close();
})();
