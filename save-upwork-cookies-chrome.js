const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  // Путь к профилю Chrome (замени, если у тебя другой пользователь)
  const userDataDir = 'C:/Users/Oleksandr/AppData/Local/Google/Chrome/User Data/Profile 1';

  // Путь к chrome.exe (обычно так, но проверь)
  const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

  // Запуск браузера с твоим профилем
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath,
  });

  const page = await browser.newPage();
  await page.goto('https://www.upwork.com/');

  console.log('Выполни вход вручную, пройди капчу, затем нажми Enter в консоли...');
  process.stdin.once('data', async () => {
    const cookies = await page.context().cookies();
    fs.writeFileSync(path.join(__dirname, 'upwork-cookies.json'), JSON.stringify(cookies, null, 2));
    console.log('Cookies сохранены в upwork-cookies.json');
    await browser.close();
    process.exit(0);
  });
})();
