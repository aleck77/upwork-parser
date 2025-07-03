// upwork-configs.js - Предустановленные конфигурации для разных типов поиска

// Предустановленные конфигурации для разных типов поиска
const searchConfigs = {
  // Автоматизация и интеграции
  automation: {
    keywords: 'n8n automation zapier',
    amount: '100-499',
    hourly_rate: '15-',
    duration: 'month',
    contractor_tier: '2',
    location: 'Americas,Europe',
    sort: 'recency',
    workload: 'full_time'
  },
  
  // Разработка веб-приложений
  webDevelopment: {
    keywords: 'react nodejs javascript',
    amount: '500-999',
    hourly_rate: '25-',
    duration: 'month',
    contractor_tier: '2',
    location: 'Americas,Europe',
    sort: 'recency',
    workload: 'full_time'
  },
  
  // AI и машинное обучение
  aiMachineLearning: {
    keywords: 'AI machine learning python tensorflow',
    amount: '1000-4999',
    hourly_rate: '30-',
    duration: 'month',
    contractor_tier: '2',
    location: 'Americas,Europe',
    sort: 'recency',
    workload: 'full_time'
  },
  
  // Node.js эксперт
  nodejsExpert: {
    keywords: 'nodejs express api backend',
    amount: '500-999',
    hourly_rate: '20-',
    duration: 'month',
    contractor_tier: '2',
    location: 'Americas,Europe',
    sort: 'recency',
    workload: 'full_time'
  },
  
  // React разработчик
  reactDeveloper: {
    keywords: 'react frontend javascript typescript',
    amount: '300-799',
    hourly_rate: '18-',
    duration: 'month',
    contractor_tier: '2',
    location: 'Americas,Europe',
    sort: 'recency',
    workload: 'full_time'
  },
  
  // Полный стек разработчик
  fullstackDeveloper: {
    keywords: 'fullstack full stack developer',
    amount: '500-1499',
    hourly_rate: '25-',
    duration: 'month',
    contractor_tier: '2',
    location: 'Americas,Europe',
    sort: 'recency',
    workload: 'full_time'
  },
  
  // Быстрые проекты
  quickProjects: {
    keywords: 'quick urgent immediate',
    amount: '100-499',
    hourly_rate: '20-',
    duration: 'week',
    contractor_tier: '2',
    location: 'Americas,Europe',
    sort: 'recency',
    workload: 'full_time'
  },
  
  // Долгосрочные проекты
  longTermProjects: {
    keywords: 'long term ongoing maintenance',
    amount: '500+',
    hourly_rate: '25-',
    duration: 'month',
    contractor_tier: '2',
    location: 'Americas,Europe',
    sort: 'recency',
    workload: 'full_time'
  }
};

// Функция для запуска парсинга с определенной конфигурацией
async function runSearch(configName) {
  if (!searchConfigs[configName]) {
    console.error(`Конфигурация "${configName}" не найдена`);
    console.log('Доступные конфигурации:', Object.keys(searchConfigs));
    return;
  }
  
  try {
    const UpworkJobParser = require('./upwork-parser');
    const parser = new UpworkJobParser();
    parser.updateSearchFilters(searchConfigs[configName]);
    
    console.log(`Запускаем поиск с конфигурацией: ${configName}`);
    const jobs = await parser.run();
    
    return jobs;
  } catch (error) {
    console.error('Ошибка при импорте парсера:', error);
    console.log('Убедитесь, что файл upwork-parser.js существует');
  }
}

// Функция для запуска нескольких поисков подряд
async function runMultipleSearches(configNames) {
  const allResults = {};
  
  for (const configName of configNames) {
    console.log(`\n=== Запуск поиска: ${configName} ===`);
    try {
      const jobs = await runSearch(configName);
      allResults[configName] = jobs;
      
      // Пауза между поисками
      if (configNames.indexOf(configName) < configNames.length - 1) {
        console.log('Пауза между поисками (30 секунд)...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    } catch (error) {
      console.error(`Ошибка при поиске ${configName}:`, error);
      allResults[configName] = [];
    }
  }
  
  return allResults;
}

// Функция для создания расписания автоматического поиска
function scheduleSearch(configName, intervalMinutes = 60) {
  console.log(`Настраиваем автоматический поиск каждые ${intervalMinutes} минут`);
  
  const interval = setInterval(async () => {
    console.log(`\n=== Автоматический поиск: ${new Date().toLocaleString()} ===`);
    try {
      await runSearch(configName);
    } catch (error) {
      console.error('Ошибка при автоматическом поиске:', error);
    }
  }, intervalMinutes * 60 * 1000);
  
  return interval;
}

// Функция для отображения всех доступных конфигураций
function showConfigurations() {
  console.log('\n=== Доступные конфигурации ===');
  Object.entries(searchConfigs).forEach(([key, config]) => {
    console.log(`\n${key}:`);
    console.log(`  Ключевые слова: ${config.keywords}`);
    console.log(`  Бюджет: $${config.amount}`);
    console.log(`  Почасовая ставка: $${config.hourly_rate}/час`);
    console.log(`  Продолжительность: ${config.duration}`);
    console.log(`  Локация: ${config.location}`);
  });
}

// Основная функция для демонстрации
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Использование:');
    console.log('node upwork-configs.js <config-name>');
    console.log('node upwork-configs.js multiple <config1> <config2> ...');
    console.log('node upwork-configs.js schedule <config-name> [interval-minutes]');
    console.log('node upwork-configs.js list');
    console.log('\nПримеры:');
    console.log('node upwork-configs.js automation');
    console.log('node upwork-configs.js multiple automation webDevelopment');
    console.log('node upwork-configs.js schedule automation 120');
    showConfigurations();
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      showConfigurations();
      break;
      
    case 'multiple':
      const configs = args.slice(1);
      if (configs.length === 0) {
        console.log('Укажите конфигурации для множественного поиска');
        console.log('Пример: node upwork-configs.js multiple automation webDevelopment');
        return;
      }
      
      console.log(`Запускаем множественный поиск для конфигураций: ${configs.join(', ')}`);
      const results = await runMultipleSearches(configs);
      
      // Сводка результатов
      console.log('\n=== СВОДКА РЕЗУЛЬТАТОВ ===');
      Object.entries(results).forEach(([configName, jobs]) => {
        console.log(`${configName}: ${jobs ? jobs.length : 0} вакансий`);
      });
      break;
      
    case 'schedule':
      const configName = args[1];
      const interval = parseInt(args[2]) || 60;

      if (!configName) {
        console.log('Укажите конфигурацию для расписания');
        console.log('Пример: node upwork-configs.js schedule automation 120');
        return;
      }

      if (!searchConfigs[configName]) {
        console.log(`Конфигурация "${configName}" не найдена`);
        showConfigurations();
        return;
      }

      scheduleSearch(configName, interval);
      console.log(`Автоматический поиск для конфигурации "${configName}" запущен. Для остановки используйте Ctrl+C.`);
      break;

    default:
      // Запуск поиска по одной конфигурации
      await runSearch(command);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { searchConfigs };