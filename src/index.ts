import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import https from 'https';
import axios from 'axios';

dotenv.config();

console.log('🚀 Bot starting up...');

const bot = new Telegraf(process.env.BOT_TOKEN!, {
  telegram: {
    apiRoot: 'https://api.telegram.org',
    webhookReply: true,
    // Disable proxy if you're not behind one
    agent: new https.Agent({
      rejectUnauthorized: false,
    }),
  },
});

async function getWeather(city: string = 'Astaneh-ye Ashrafiyeh') {
  console.log(`🌡️ Fetching weather for ${city}...`);
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    console.log(`✅ Weather data received for ${city}`);
    const data = response.data;
    return `🌡️ Weather in ${data.name}:
Temperature: ${Math.round(data.main.temp)}°C
Feels like: ${Math.round(data.main.feels_like)}°C
Humidity: ${data.main.humidity}%
Wind: ${data.wind.speed} m/s
${data.weather[0].description}`;
  } catch (error: any) {
    console.error(`❌ Error fetching weather for ${city}:`, error.message);
    return '❌ Error fetching weather data. Please try again later.';
  }
}

// Start command
bot.command('start', ctx => {
  console.log(`👋 New user started bot: ${ctx.from.username || ctx.from.id}`);
  ctx.reply(
    'Hello! Welcome to my weather bot 👋\nSend any message to get weather in Astaneh-ye Ashrafiyeh, or use /weather <city> for a specific city.'
  );
});

// Help command
bot.command('help', ctx => {
  console.log(`❓ Help requested by: ${ctx.from.username || ctx.from.id}`);
  ctx.reply(
    'Available commands:\n/weather <city> - Get weather for a specific city\n/start - Start the bot'
  );
});

// Weather command
bot.command('weather', async ctx => {
  const city = ctx.message.text.split(' ').slice(1).join(' ') || 'Astaneh-ye Ashrafiyeh';
  console.log(`🌍 Weather command for ${city} by ${ctx.from.username || ctx.from.id}`);
  const weather = await getWeather(city);
  ctx.reply(weather);
});

// Handle text messages
bot.on('text', async ctx => {
  if (!ctx.message.text.startsWith('/')) {
    console.log(`💬 Text message from ${ctx.from.username || ctx.from.id}: ${ctx.message.text}`);
    const weather = await getWeather();
    ctx.reply(weather);
  }
});

// Launch bot
bot.launch();
console.log('✅ Bot is running!');

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('🛑 Received SIGINT. Shutting down...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('🛑 Received SIGTERM. Shutting down...');
  bot.stop('SIGTERM');
});
