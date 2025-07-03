const UpworkParser = require('./parsers/upwork-parser');
const GithubParser = require('./parsers/github-parser');
const upworkConfigs = require('./configs/upwork-configs');
const githubConfigs = require('./configs/github-configs');

const parserMap = {
  upwork: UpworkParser,
  github: GithubParser
};
const configMap = {
  upwork: upworkConfigs,
  github: githubConfigs
};

const site = process.argv[2]; // например, 'github'
const configName = process.argv[3]; // например, 'js_playwright'

if (!site || !configName) {
  console.log('Использование: node universal-parser.js <site> <configName>');
  process.exit(1);
}

const ParserClass = parserMap[site];
const configs = configMap[site];
const config = configs.searchConfigs[configName];
if (!ParserClass || !config) {
  console.log('Неизвестный сайт или конфиг');
  process.exit(1);
}

const parser = new ParserClass(config);

(async () => {
  await parser.init();
  await parser.navigateToSite();
  await parser.page.screenshot({ path: 'github-debug.png' });
  const results = await parser.parseResults();
  console.log(results);
  if (parser.browser) await parser.browser.close();
})(); 