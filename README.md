# Capshaw The Crier

A Discord Bot that keeps you updated with DDO news.

# Setup

Capshaw requires [node js](https://nodejs.org/en/download/).

Clone this repo (or download the zip), set up the required settings (see below), run `npm install` to install all the required dependencies and `npm start` to start up the bot.

If you do not want to host the bot youself, you might also [remix on Glitch](https://glitch.com/help/remix/).

You have two provide a Token and a channel name so that Capshaw knows where to post any news he finds, see [How to set up a Bot Account for Discord](https://anidiotsguide_old.gitbooks.io/discord-js-bot-guide/content/getting-started/the-long-version.html) on how to obtain the Token for your Discord server. The channel name is simply the name of the Discord server's channel.  
These credentials have to be put into a file called `.env` in the bot's directory.

Sample `.env` file:

```
DISCORD_TOKEN=Ohsz20KSp9HDahdOklf02Jmn.Zha-lW.hs8JDk7jdKseov34jd-iaDq_ubW
DISCORD_CHANNEL=ddo-stuff
BOT_AUTORUN=3
```

The `BOT_AUTORUN` setting is optional. It specifies the duration in hours, after which Capshaw will automatically search for news again. The default is 1 hour.
