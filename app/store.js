const fs = require('fs');
const { resolve } = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

let log = console;
let currentStore = {};

module.exports.init = async function init(logger) {
  if (logger !== undefined) {
    log = logger;
  }

  const file = resolve(process.cwd(), '.data/store.json');
  log.debug('file ->', file);

  let data;

  try {
    data = await readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      log.info('Capshaw could not load previous store on initialization');
    } else {
      throw Error(`Could not access previous store: "${err}"`);
    }
  }

  if (data) {
    currentStore = JSON.parse(data);
  }

  log.debug('current store:', JSON.stringify(currentStore, null, '  '));
};

module.exports.update = async function update(news = []) {
  if (!news.length) {
    return;
  }

  const latestNews = news.reduce(
    (previous, current) => {
      if (!previous) {
        return current;
      }
      return (current.date > previous.date) ?
        current :
        previous;
    }
  );

  currentStore = {
    latestNews,
    lastUpdate: Date.now()
  };

  const file = resolve(process.cwd(), '.data/store.json');

  try {
    await writeFile(file, JSON.stringify(currentStore, null, '  '), 'utf8');
  } catch (err) {
    log.error(`Could not write current store: ${err}`);
  }
};

module.exports.getLastUpdate = function getLastUpdate() {
  return currentStore && currentStore.lastUpdate ?
    currentStore.lastUpdate :
    0;
};
