const Crawler = require('simplecrawler');
const cheerio = require('cheerio');
const truncate = require('truncate');
const { RichEmbed } = require('discord.js');

const newsSource = 'https://www.ddo.com';
const newsHubUrl = `${newsSource}/en/news`;
// Max. fetch two news on absolutely first fetch
const maxNewsOnFirstFetch = 2;

function resolveNewsPost(post) {
  return new Promise((resolve) => {
    const { link: initialLink } = post;

    const articleUrl = initialLink.indexOf('http') === 0 ?
      initialLink :
      `${newsSource}${initialLink}`;

    const crawler = new Crawler(articleUrl);

    crawler.interval = 30000;
    crawler.maxConcurrency = 3;
    crawler.maxDepth = 1;
    crawler.decodeResponses = true;

    crawler.on(
      'fetcherror',
      _ => resolve({ ...post })
    );

    crawler.on(
      'fetchcomplete',
      (_, responseBuffer) => {
        const resolvedPost = { ...post, link: articleUrl };

        const $ = cheerio.load(responseBuffer.toString('utf8'));
        const article = $('.news.content');

        if (article) {
          const headerImage = article.find('img');
          const image = headerImage.attr('src') || null;
          const desc = headerImage.parent().nextAll().map(
            (_, content) =>
              $(content).text()
                .replace(/(\r|\n|\t)/gi, ' ')
                .replace(/\s{2,}/gi, ' ')
                .replace(/(^\s{1,}|\s{1,}$)/gi, '')
          ).get().join('\n') || '';

          if (image) {
            resolvedPost.image = image;
          }

          if (desc && desc.length > 0) {
            // Truncate description to 200 characters max
            resolvedPost.desc = truncate(desc, 500);
          }
        }

        resolve(resolvedPost);
      }
    );

    crawler.start();
  });
}

module.exports.run = function run(log, store, client) {
  const channel = client.channels.find(
    ch => ch.name === process.env.DISCORD_CHANNEL
  );

  if (!channel) {
    log.error(`Capshaw cannot find Discord Channel "${process.env.DISCORD_CHANNEL}"`);
    return;
  }

  log.info('Capshaw starts looking for news ...');

  const now = Date.now();
  const crawler = new Crawler(newsHubUrl);

  crawler.interval = 30000;
  crawler.maxConcurrency = 3;
  crawler.maxDepth = 1;
  crawler.decodeResponses = true;

  crawler.on(
    'crawlstart',
    () => {
      log.info(`Capshaw started crawling ${newsHubUrl}`);
      channel.startTyping();
    }
  );

  crawler.on(
    'fetcherror',
    () => {
      log.error(`Capshaw could not crawl ${newsHubUrl}`);
      channel.stopTyping();
    }
  );

  crawler.on(
    'fetchcomplete',
    async (queueItem, responseBuffer, response) => {
      log.info(
        `Capshaw received ${responseBuffer.length} bytes (${response.headers['content-type']})`
      );

      const $ = cheerio.load(responseBuffer.toString('utf8'));

      // Find post on the news frontpage
      const posts = $('.article-item');

      if (!posts.length) {
        channel.stopTyping(true);
        log.info('Capshaw didn\'t find any news');
        return;
      }

      // Compile the necessary information
      const news = posts.map((_, post) => ({
        title: $(post).find('h5').text() || 'No title found',
        date: new Date($(post).find('time').attr('title') || 0),
        link: $(post).attr('href') || null
      })).get();

      log.debug(`Capshaw found ${news.length} news items in total`);

      // Use only new items or the two latest,
      // if none have been fetched until now
      const minimumDate = store.getLastUpdate() || news.reduce(
        (previous, current, index) => {
          const minimum = previous;
          if (index < maxNewsOnFirstFetch) {
            return current.date;
          }
          return minimum;
        },
        now
      );
      const lastNews = news.filter(post => post.date >= minimumDate);

      log.debug(`Capshaw will post ${lastNews.length} to Discord`);

      // Exit if there's nothing to post
      if (lastNews.length === 0) {
        channel.stopTyping(true);
        log.info('Capshaw did not find anything new');
        return;
      }

      lastNews.forEach(
        ({ title, date, link }) => log.debug(
          `${date.toString()} - ${title}\n${link}`
        )
      );

      const compiledNews = await Promise.all(
        lastNews.map(async (post) => {
          const resolvedPost = await resolveNewsPost(post);
          return resolvedPost;
        })
      );

      compiledNews
        .sort((a, b) => a.date > b.date ? a : b)
        .forEach((post, idx) => {
          const {
            title,
            date,
            link,
            image,
            desc
          } = post;

          log.debug(
            `#${idx + 1}:\n` +
            `${title}\n` +
            `${'='.repeat(title.length)}\n` +
            `${date.toString()}\n` +
            (image ? (image + '\n') : '') +
            (desc ? (desc + '\n') : '') +
            `==> ${link}`
          );

          const embed = new RichEmbed()
            .setAuthor(title);

          if (image) {
            embed.setImage(image);
          }

          if (desc) {
            embed.setDescription(desc);
          }

          embed.setColor('#006699');
          embed.addField('Full news:', link);

          channel.send(embed);
        });

      channel.stopTyping(true);

      // Update the store ... also, to prevent double posting news
      store.update(compiledNews);
    }
  );

  crawler.start();
};
