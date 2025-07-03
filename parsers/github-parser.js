const { chromium } = require('playwright');
const BaseParser = require('./base-parser');

class GithubRepoParser extends BaseParser {
  constructor(config) {
    super(config);
  }

  buildSearchUrl() {
    const baseUrl = 'https://github.com/search';
    const params = new URLSearchParams();
    params.append('q', `${this.config.keywords} ${this.config.language ? 'language:' + this.config.language : ''}`.trim());
    params.append('type', 'repositories');
    return `${baseUrl}?${params.toString()}`;
  }

  async parseResults() {
    await this.page.waitForSelector('div[data-testid="results-list"]', { timeout: 30000 });
    await this.page.waitForTimeout(3000);
    const repos = await this.page.evaluate(() => {
      const resultsDiv = document.querySelector('div[data-testid="results-list"]');
      if (!resultsDiv) return [];
      return Array.from(resultsDiv.querySelectorAll('li')).map(li => {
        const h3 = li.querySelector('h3');
        const a = h3 ? h3.querySelector('a') : null;
        const title = a?.innerText.trim() || '';
        const url = a ? ('https://github.com' + a.getAttribute('href')) : '';
        let description = '';
        const p = h3 ? h3.nextElementSibling : null;
        if (p && p.tagName === 'P') description = p.innerText.trim();
        let language = '';
        const langSpan = li.querySelector('span[itemprop="programmingLanguage"]');
        if (langSpan) language = langSpan.innerText.trim();
        return { title, url, description, language };
      });
    });
    if (!repos.length) {
      console.log('Репозитории не найдены. Проверьте селектор или структуру страницы.');
    }
    return repos;
  }
}

module.exports = GithubRepoParser; 