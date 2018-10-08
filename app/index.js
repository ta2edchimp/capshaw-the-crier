// @ts-check
const http = require('http');

const util = require('util');
const delay = util.promisify(setTimeout);

const Discord = require('discord.js');
const client = new Discord.Client();

const humanize = require('tiny-human-time');

const log = require('./log');

const store = require('./store');
const crawler = require('./crawler');

const {
  displayName: BOT_NAME,
  version: BOT_VERSION,
  homepage: BOT_HOMEPAGE
} = require('../package.json');

const launchDate = new Date();

/**
 * Sets up the bot, its config, etc.
 */
async function setup() {
  log.info(`${BOT_NAME} v${BOT_VERSION}`);

  // Check loosely for required environment variables
  if (!checkEnvironment()) {
    // Try loading the `.env` file into `process.env` via module
    require('dotenv').config();

    if (!checkEnvironment()) {
      throw Error(
        'Capshaw could not load required settings!\n' +
        'Please ensure DISCORD_TOKEN and DISCORD_CHANNEL are set.\n' +
        `See ${BOT_HOMEPAGE} for more information.`
      );
    }
  }

  await store.init(log);
}

/**
 * Sets up the server environment for uptime control
 */
function setupUptimeServer() {
  http.createServer(function uptimeServer(request, response) {
    const uptime = humanize(launchDate, new Date());
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end(`Capshaw bot is active since ${uptime}\n`);
  }).listen(3000);
  log.info('Capshaw set up the uptime server');
}

/**
 * Checks for the required environment
 * @returns {Boolean} Success or failure of the check
 */
function checkEnvironment() {
  return (
    process && process.env &&
    process.env.DISCORD_TOKEN &&
    process.env.DISCORD_CHANNEL
  );
}

/**
 * Logs Capshaw into Discord
 */
async function login() {
  log.info('Capshaw connects to Discord ...');

  try {
    await client.login(process.env.DISCORD_TOKEN);

    log.info('Capshaw logged in to Discord ...');
  } catch (ex) {
    log.error(`Capshaw could not log in due to: ${ex}`);
    scheduleRelog();
  }
}

/**
 * Schedules a retry to log into Discord after a given timeout in seconds
 * @param {Number} timeout timeout until retry in seconds
 */
function scheduleRelog(timeout = 10) {
  log.info(`Capshaw will try to connect again in ${timeout} seconds`);
  delay(Math.max(1, timeout) * 1000)
    .then(() => login())
    .catch((reason) => {
      log.error(`Capshaw could not try again due to: ${reason}`);
      process.exit(1);
    });
}

/**
 * Handles the bot's successfull connection to Discord
 */
function onReady() {
  crawler.run(log, store, client);

  const msPerHour = 60 * 60 * 1000;
  // Look up optional env var for the interval, in hours ...
  const envInterval = parseInt(process.env.BOT_AUTORUN, 10);
  // ... fallback is one hour
  const interval = (isNaN(envInterval) ? 1 : envInterval) * msPerHour;

  log.info(`Capshaw autorun interval set to ${interval / msPerHour} hrs`);

  // Set an interval that will be automatically cancelled
  // if the client gets destroyed
  client.setInterval(
    () => crawler.run(log, store, client),
    interval
  );
}

// Register for necessary events ...
process.on(
  'exit',
  () => {
    log.info('Capshaw leaves now ...');
    client.destroy();
  }
);

client.on(
  'ready',
  onReady
);

client.on(
  'error',
  (error) => {
    log.error(error);
    client.destroy();
    process.exit(1);
  }
);

client.on(
  'disconnect',
  _ => log.info('Capshaw has been disconnected')
);

async function main() {
  try {
    // Do the setup (news storage)
    await setup();

    // Response for Uptime Robot
    setupUptimeServer();

    // Log in to Discord using the provided token
    login();
  } catch (ex) {
    log.error(`Capshaw could not get to work due to: ${ex}`);
  }
}

main();
