const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class BaseParser {
  constructor(config) {
    this.browser = null;
    this.page = null;
    this.config = config || {};
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    const context = await this.browser.newContext();
    this.page = await context.newPage();
  }

  async navigateToSite() {
    const url = this.buildSearchUrl();
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  }

  // buildSearchUrl и parseResults реализуются в наследниках
}

module.exports = BaseParser; 