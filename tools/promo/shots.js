const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto((process.env.SITE || 'http://127.0.0.1:8765/') + 'index.html'); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'start.png' });
  await p.click('text=Copy and edit'); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'editor.png' });
  await b.close();
})();
