# Универсальный парсер вакансий/репозиториев на Playwright

## Структура проекта

```
upwork-parser/
  parsers/
    base-parser.js           # Базовый класс парсера (инициализация, cookies, поведение)
    upwork-parser.js         # Парсер для Upwork
    github-parser.js         # Парсер для GitHub (пример ниже)
  configs/
    upwork-configs.js        # Фильтры и параметры для Upwork
    github-configs.js        # Фильтры и параметры для GitHub
  results/                   # Сюда сохраняются результаты
  utils/
    cookies.js               # Работа с cookies
    human-behavior.js        # Имитация поведения пользователя
  universal-parser.js        # Главный файл запуска
  package.json
  README.md
  .gitignore
```

---

## Пример шаблона парсера для нового сайта (GitHub)

**parsers/github-parser.js**
```js
const { chromium } = require('playwright');
const BaseParser = require('./base-parser');

class GithubRepoParser extends BaseParser {
  constructor(config) {
    super(config);
  }

  buildSearchUrl() {
    // Пример: https://github.com/search?q=playwright+language:JavaScript&type=repositories
    const baseUrl = 'https://github.com/search';
    const params = new URLSearchParams();
    params.append('q', `${this.config.keywords} ${this.config.language ? 'language:' + this.config.language : ''}`.trim());
    params.append('type', 'repositories');
    return `${baseUrl}?${params.toString()}`;
  }

  async parseResults() {
    // Ждём появления результатов
    await this.page.waitForSelector('ul.repo-list li');
    // Собираем данные
    return await this.page.evaluate(() => {
      return Array.from(document.querySelectorAll('ul.repo-list li')).map(li => {
        const title = li.querySelector('a.v-align-middle')?.innerText || '';
        const url = li.querySelector('a.v-align-middle')?.href || '';
        const description = li.querySelector('p.mb-1')?.innerText || '';
        const language = li.querySelector('[itemprop="programmingLanguage"]')?.innerText || '';
        return { title, url, description, language };
      });
    });
  }
}

module.exports = GithubRepoParser;
```

**configs/github-configs.js**
```js
module.exports = {
  searchConfigs: {
    js_playwright: {
      keywords: 'playwright',
      language: 'JavaScript'
    },
    py_fastapi: {
      keywords: 'fastapi',
      language: 'Python'
    }
  }
};
```

**universal-parser.js** (фрагмент)
```js
const UpworkParser = require('./parsers/upwork-parser');
const GithubParser = require('./parsers/github-parser');
const configs = require('./configs/github-configs');

const parserMap = {
  upwork: UpworkParser,
  github: GithubParser
};

const site = process.argv[2]; // например, 'github'
const configName = process.argv[3]; // например, 'js_playwright'

const ParserClass = parserMap[site];
const config = configs.searchConfigs[configName];
const parser = new ParserClass(config);

(async () => {
  await parser.init();
  await parser.navigateToSite();
  const results = await parser.parseResults();
  console.log(results);
})();
```

---

## Интеграция с n8n, MCP, Docker, Traefik

- **Docker:**
  - Создай Dockerfile для universal-parser.js (установи playwright, скопируй проект, настрой CMD).
  - Пример:
    ```Dockerfile
    FROM mcr.microsoft.com/playwright:v1.53.2-jammy
    WORKDIR /app
    COPY . .
    RUN npm install
    CMD ["node", "universal-parser.js"]
    ```
- **Traefik:**
  - Проксируй порт universal-parser (например, через HTTP API или WebSocket).
- **n8n:**
  - Создай кастомный HTTP Request node или MCP-интеграцию, чтобы отправлять задачи парсеру и получать результаты.
  - Можно реализовать REST API-обёртку вокруг universal-parser.js для управления из n8n.
- **MCP:**
  - Используй MCP-инструменты для запуска браузера, навигации, кликов, получения HTML и т.д. (всё, что поддерживает твой universal-parser через Playwright).

---

## Какие MCP-инструменты реально использовались?
- Навигация по URL (mcp_playwright_browser_navigate)
- Ввод текста (mcp_playwright_browser_type)
- Клик по элементу (mcp_playwright_browser_click)
- Получение снапшота/HTML (mcp_playwright_browser_snapshot)
- Ожидание элементов (mcp_playwright_browser_wait_for)
- Скриншоты (mcp_playwright_browser_take_screenshot)

**Что не использовалось, но можно:**
- Drag&Drop, выбор в выпадающих списках, работа с несколькими вкладками, эмуляция мобильных устройств, прокси, cookie-менеджмент через MCP, автоматизация загрузки/выгрузки файлов, интеграция с внешними API.

---

## Как сделать парсер максимально универсальным для автоматизации и интеграции
- Вынести все специфичные для сайта селекторы и фильтры в отдельные файлы.
- Сделать универсальный интерфейс запуска (через аргументы, REST API или MCP).
- Использовать Docker для изоляции и Traefik для проксирования.
- Для n8n — реализовать HTTP API или MCP endpoint, чтобы управлять парсером как внешним сервисом.

---

**Готово! Теперь твой парсер легко расширять, интегрировать и запускать в любой инфраструктуре.**
