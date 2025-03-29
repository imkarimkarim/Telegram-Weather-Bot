import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN!, {
  telegram: {
    apiRoot: 'https://api.telegram.org',
    webhookReply: true,
    // Disable proxy if you're not behind one
    agent: new https.Agent({
      rejectUnauthorized: false
    })
  }
});

// Start command
bot.command('start', (ctx) => {
  ctx.reply('Hello! Welcome to my bot 👋');
});

// Help command
bot.command('help', (ctx) => {
  ctx.reply('This is a simple hello world bot!');
});

// Echo command
bot.command('echo', (ctx) => {
  const message = ctx.message.text.split(' ').slice(1).join(' ');
  if (!message) {
    ctx.reply('Please provide a message to echo');
    return;
  }
  ctx.reply(message);
});

// Handle text messages
bot.on('text', (ctx) => {
  if (!ctx.message.text.startsWith('/')) {
    ctx.reply('Hello! You can use /help to see available commands');
  }
});

// Launch bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 