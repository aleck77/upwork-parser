const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.upwork.com/');

  console.log('Выполни вход вручную, затем нажми Enter в консоли...');
  process.stdin.once('data', async () => {
    const cookies = await context.cookies();
    fs.writeFileSync(path.join(__dirname, 'upwork-cookies.json'), JSON.stringify(cookies, null, 2));
    console.log('Cookies сохранены в upwork-cookies.json');
    await browser.close();
    process.exit(0);
  });
})();
