const express = require('express');
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

const app = express();
app.use(express.json());

app.post('/parse', async (req, res) => {
  const { site, configName } = req.body;
  const ParserClass = parserMap[site];
  const configs = configMap[site];
  const config = configs?.searchConfigs?.[configName];
  if (!ParserClass || !config) {
    return res.status(400).json({ error: 'Unknown site or config' });
  }
  const parser = new ParserClass(config);
  try {
    await parser.init();
    await parser.navigateToSite();
    const results = await parser.parseResults();
    if (parser.browser) await parser.browser.close();
    res.json({ results });
  } catch (e) {
    if (parser.browser) await parser.browser.close();
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`REST API server started on port ${PORT}`);
}); 