const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class UpworkJobParser {
  constructor() {
    this.browser = null;
    this.page = null;
    this.config = {
      searchFilters: {
        keywords: 'n8n',
        amount: '100-499',
        client_hires: '10-',
        contractor_tier: '2',
        duration: 'month',
        hourly_rate: '15-',
        location: 'Americas,Europe',
        sort: 'recency',
        workload: 'full_time'
      },
      browserOptions: {
        headless: process.env.HEADLESS === 'true' || false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        ]
      }
    };
  }

  async init() {
    try {
      console.log('Инициализация браузера...');
      this.browser = await chromium.launch(this.config.browserOptions);
      
      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          'DNT': '1',
          'Pragma': 'no-cache',
          'Referer': 'https://www.upwork.com/'
        }
      });
      
      this.page = await context.newPage();
      // Загружаем cookies
      const cookiesPath = path.join(__dirname, 'upwork-cookies.json');
      if (fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
        await context.addCookies(cookies);
        console.log('Cookies успешно загружены и применены');
      }
      
      // Маскировка fingerprint и антибот-детектов
      await this.page.addInitScript(() => {
        // Удаляем webdriver
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        // Маскируем плагины
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        // Маскируем языки
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        // Маскируем разрешение
        Object.defineProperty(window, 'chrome', { get: () => ({ runtime: {} }) });
        // Маскируем permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
        // Маскируем userAgentData
        Object.defineProperty(navigator, 'userAgentData', { get: () => undefined });
      });
      
      console.log('Браузер инициализирован успешно');
    } catch (error) {
      console.error('Ошибка инициализации браузера:', error);
      throw error;
    }
  }

  async navigateToUpwork() {
    try {
      console.log('Переходим на Upwork...');
      await this.page.goto('https://www.upwork.com', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await this.handleCloudflareChallenge();
      await this.humanLikeBehavior();
      
      console.log('Успешно загружена главная страница Upwork');
    } catch (error) {
      console.error('Ошибка при переходе на Upwork:', error);
      throw error;
    }
  }

  async handleCloudflareChallenge() {
    try {
      const title = await this.page.title();
      const url = this.page.url();
      
      if (title.includes('Just a moment') || title.includes('Checking') || 
          title.includes('Please wait') || url.includes('challenge')) {
        console.log('Обнаружена защита Cloudflare, ожидаем прохождения...');
        
        // Ждем прохождения проверки
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
        await this.page.waitForTimeout(5000);
        
        const newTitle = await this.page.title();
        if (newTitle.includes('Just a moment') || newTitle.includes('Checking')) {
          console.log('Требуется дополнительное время для прохождения Cloudflare...');
          await this.page.waitForTimeout(10000);
        }
        
        console.log('Cloudflare проверка пройдена');
      }
    } catch (error) {
      console.log('Возможная проблема с Cloudflare:', error.message);
    }
  }

  async humanLikeBehavior() {
    try {
      // Случайная задержка
      await this.page.waitForTimeout(Math.random() * 2000 + 1000);
      
      // Движение мыши
      await this.page.mouse.move(
        Math.random() * 800 + 100,
        Math.random() * 600 + 100
      );
      
      // Небольшая прокрутка
      await this.page.evaluate(() => {
        window.scrollTo(0, Math.random() * 300);
      });
      
      await this.page.waitForTimeout(Math.random() * 1000 + 500);
    } catch (error) {
      console.log('Ошибка при имитации поведения:', error.message);
    }
  }

  buildSearchUrl() {
    const baseUrl = 'https://www.upwork.com/nx/search/jobs/';
    const params = new URLSearchParams();
    
    Object.entries(this.config.searchFilters).forEach(([key, value]) => {
      if (value) {
        if (key === 'keywords') {
          params.append('q', value);
        } else if (key === 'duration') {
          params.append('duration_v3', value);
        } else {
          params.append(key, value);
        }
      }
    });
    
    params.append('nbs', '1');
    params.append('t', '0,1');
    
    return `${baseUrl}?${params.toString()}`;
  }

  async searchJobs() {
    try {
      const searchUrl = this.buildSearchUrl();
      console.log('Переходим к поиску вакансий...');
      console.log('URL:', searchUrl);
      
      await this.page.goto(searchUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await this.handleCloudflareChallenge();
      
      // Ждем загрузки результатов с несколькими вариантами селекторов
      const selectors = [
        '[data-test="job-tile"]',
        '[data-cy="job-tile"]',
        '.job-tile-header',
        '.air3-card'
      ];
      
      let jobsFound = false;
      for (const selector of selectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 10000 });
          jobsFound = true;
          console.log(`Найдены вакансии с селектором: ${selector}`);
          break;
        } catch (e) {
          console.log(`Селектор ${selector} не найден`);
        }
      }
      
      if (!jobsFound) {
        console.log('Не удалось найти вакансии. Возможно, изменился интерфейс Upwork.');
        // Делаем скриншот для отладки
        await this.page.screenshot({ path: 'debug.png' });
        console.log('Скриншот сохранен в debug.png');
      }
      
      return jobsFound;
    } catch (error) {
      console.error('Ошибка при поиске вакансий:', error);
      return false;
    }
  }

  async parseJobs() {
    try {
      console.log('Начинаем парсинг вакансий...');
      
      const jobs = await this.page.evaluate(() => {
        // Пробуем разные селекторы для вакансий
        const selectors = [
          '[data-test="job-tile"]',
          '[data-cy="job-tile"]',
          '.job-tile-header',
          '.air3-card'
        ];
        
        let jobTiles = [];
        for (const selector of selectors) {
          jobTiles = document.querySelectorAll(selector);
          if (jobTiles.length > 0) break;
        }
        
        if (jobTiles.length === 0) {
          console.log('Вакансии не найдены');
          return [];
        }
        
        const jobsData = [];
        
        jobTiles.forEach((tile, index) => {
          try {
            // Пробуем разные селекторы для каждого элемента
            const titleSelectors = [
              '[data-test="job-title-link"]',
              '[data-cy="job-title-link"]', 
              '.job-tile-title a',
              'h4 a'
            ];
            
            const descriptionSelectors = [
              '[data-test="job-description-text"]',
              '[data-cy="job-description-text"]',
              '.job-tile-description',
              '.text-body'
            ];
            
            const budgetSelectors = [
              '[data-test="job-budget"]',
              '[data-cy="job-budget"]',
              '.job-tile-budget',
              '.text-bold'
            ];
            
            let titleElement = null;
            let descriptionElement = null;
            let budgetElement = null;
            
            // Ищем заголовок
            for (const selector of titleSelectors) {
              titleElement = tile.querySelector(selector);
              if (titleElement) break;
            }
            
            // Ищем описание
            for (const selector of descriptionSelectors) {
              descriptionElement = tile.querySelector(selector);
              if (descriptionElement) break;
            }
            
            // Ищем бюджет
            for (const selector of budgetSelectors) {
              budgetElement = tile.querySelector(selector);
              if (budgetElement) break;
            }
            
            const skillsElements = tile.querySelectorAll('[data-test="job-skill"], .skill-tag, .badge');
            const clientInfoElement = tile.querySelector('[data-test="client-info"], .client-info');
            const postedTimeElement = tile.querySelector('[data-test="posted-time"], .posted-time, .text-muted');
            
            const job = {
              title: titleElement ? titleElement.textContent.trim() : `Job ${index + 1}`,
              description: descriptionElement ? descriptionElement.textContent.trim() : '',
              budget: budgetElement ? budgetElement.textContent.trim() : '',
              skills: Array.from(skillsElements).map(skill => skill.textContent.trim()).filter(s => s),
              clientInfo: clientInfoElement ? clientInfoElement.textContent.trim() : '',
              postedTime: postedTimeElement ? postedTimeElement.textContent.trim() : '',
              url: titleElement ? titleElement.href : '',
              parsedAt: new Date().toISOString()
            };
            
            if (job.title) {
              jobsData.push(job);
            }
          } catch (error) {
            console.log(`Ошибка при парсинге вакансии ${index}:`, error);
          }
        });
        
        return jobsData;
      });
      
      console.log(`Распарсено вакансий: ${jobs.length}`);
      return jobs;
    } catch (error) {
      console.error('Ошибка при парсинге вакансий:', error);
      return [];
    }
  }

  async saveJobsToFile(jobs, filename = null) {
    try {
      if (!filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `upwork-jobs-${timestamp}.json`;
      }
      
      const resultsDir = path.join(__dirname, 'results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      const filePath = path.join(resultsDir, filename);
      await fs.promises.writeFile(filePath, JSON.stringify(jobs, null, 2), 'utf8');
      console.log(`Результаты сохранены: ${filePath}`);
      
      // Также сохраняем в CSV
      const csvFilename = filename.replace('.json', '.csv');
      const csvPath = path.join(resultsDir, csvFilename);
      await this.saveJobsToCSV(jobs, csvPath);
      
      return filePath;
    } catch (error) {
      console.error('Ошибка при сохранении файла:', error);
    }
  }

  async saveJobsToCSV(jobs, filePath) {
    try {
      const csvHeaders = ['Title', 'Description', 'Budget', 'Skills', 'Client Info', 'Posted Time', 'URL', 'Parsed At'];
      const csvRows = jobs.map(job => [
        job.title,
        job.description.replace(/"/g, '""'),
        job.budget,
        job.skills.join('; '),
        job.clientInfo,
        job.postedTime,
        job.url,
        job.parsedAt
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      await fs.promises.writeFile(filePath, csvContent, 'utf8');
      console.log(`CSV сохранен: ${filePath}`);
    } catch (error) {
      console.error('Ошибка при сохранении CSV:', error);
    }
  }

  async run() {
    try {
      await this.init();
      await this.navigateToUpwork();
      
      const searchSuccess = await this.searchJobs();
      if (!searchSuccess) {
        console.log('Не удалось загрузить страницу поиска');
        return [];
      }
      
      const jobs = await this.parseJobs();
      
      if (jobs.length === 0) {
        console.log('Вакансии не найдены');
        return [];
      }
      
      // Убираем дубликаты
      const uniqueJobs = jobs.filter((job, index, self) =>
        index === self.findIndex(j => j.title === job.title && j.url === job.url)
      );
      
      console.log(`Найдено уникальных вакансий: ${uniqueJobs.length}`);
      
      // Сохраняем результаты
      await this.saveJobsToFile(uniqueJobs);
      
      return uniqueJobs;
    } catch (error) {
      console.error('Ошибка выполнения:', error);
      return [];
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  updateSearchFilters(newFilters) {
    this.config.searchFilters = { ...this.config.searchFilters, ...newFilters };
    console.log('Фильтры поиска обновлены:', this.config.searchFilters);
  }
}

// Обработка аргументов командной строки
async function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    headless: false,
    config: null,
    delay: 2000,
    output: null
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--headless':
        options.headless = true;
        break;
      case '--config':
        options.config = args[i + 1];
        i++;
        break;
      case '--delay':
        options.delay = parseInt(args[i + 1]) || 2000;
        i++;
        break;
      case '--output':
        options.output = args[i + 1];
        i++;
        break;
      case '--help':
        console.log(`
Использование: node upwork-parser.js [опции]

Опции:
  --headless          Запуск в фоновом режиме
  --config <name>     Использовать конфигурацию из upwork-configs.js
  --delay <ms>        Задержка между действиями (по умолчанию: 2000)
  --output <file>     Имя файла для сохранения результатов
  --help              Показать эту справку

Примеры:
  node upwork-parser.js
  node upwork-parser.js --headless
  node upwork-parser.js --config automation --headless
  node upwork-parser.js --output my-jobs.json
        `);
        process.exit(0);
        break;
    }
  }
  
  return options;
}

// Основная функция
async function main() {
  try {
    const options = await parseArgs();
    
    if (options.headless) {
      process.env.HEADLESS = 'true';
    }
    
    const parser = new UpworkJobParser();
    
    // Если указана конфигурация, пытаемся загрузить её
    if (options.config) {
      try {
        const configs = require('./upwork-configs');
        if (configs.searchConfigs[options.config]) {
          parser.updateSearchFilters(configs.searchConfigs[options.config]);
          console.log(`Используется конфигурация: ${options.config}`);
        } else {
          console.log(`Конфигурация "${options.config}" не найдена`);
          console.log('Доступные конфигурации:', Object.keys(configs.searchConfigs));
          return;
        }
      } catch (error) {
        console.log('Файл конфигурации не найден, используем настройки по умолчанию');
      }
    }
    
    const jobs = await parser.run();
    
    if (jobs && jobs.length > 0) {
      console.log('\n=== РЕЗУЛЬТАТЫ ПОИСКА ===');
      console.log(`Найдено вакансий: ${jobs.length}`);
      
      jobs.slice(0, 5).forEach((job, index) => {
        console.log(`\n${index + 1}. ${job.title}`);
        console.log(`   Бюджет: ${job.budget}`);
        console.log(`   Навыки: ${job.skills.slice(0, 3).join(', ')}`);
        console.log(`   Опубликовано: ${job.postedTime}`);
        console.log(`   URL: ${job.url}`);
      });
      
      if (jobs.length > 5) {
        console.log(`\n... и еще ${jobs.length - 5} вакансий`);
      }
    } else {
      console.log('Вакансии не найдены');
    }
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

// Запуск при вызове файла напрямую
if (require.main === module) {
  main().catch(console.error);
}

module.exports = UpworkJobParser;