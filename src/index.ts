import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import https from 'https';
import axios from 'axios';
import jalaali from 'jalaali-js';
import { getDefaultCity, setDefaultCity, resetDefaultCity } from './db';

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

function getJalaaliMonthName(month: number): string {
  const months = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];
  return months[month - 1];
}

interface ForecastItem {
  dt: number;
  main: {
    temp: number;
  };
  weather: Array<{
    main: string;
  }>;
}

async function getWeather(city: string = 'Astaneh-ye Ashrafiyeh') {
  console.log(`🌡️ Fetching weather for ${city}...`);
  try {
    const [currentWeather, forecast] = await Promise.all([
      axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      ),
      axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      ),
    ]);

    console.log(`✅ Weather data received for ${city}`);
    const data = currentWeather.data;
    const forecastData = forecast.data;

    // Get current date
    const now = new Date();
    const gregorianDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Convert to Jalali
    const jalaaliDate = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const jalaaliFormatted = `${jalaaliDate.jd} ${getJalaaliMonthName(jalaaliDate.jm)} ${jalaaliDate.jy}`;

    // Format hourly forecast - get 12 reports with 2-hour intervals
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const twoHoursInMs = 2 * 60 * 60 * 1000;

    const hourlyForecast = forecastData.list
      .filter((item: ForecastItem) => {
        const forecastTime = new Date(item.dt * 1000);
        return forecastTime <= endOfDay;
      })
      .reduce((acc: string[], item: ForecastItem, index: number) => {
        // Only include every 2nd forecast (2-hour intervals)
        if (index % 2 === 0) {
          const time = new Date(item.dt * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          acc.push(
            `${time}: ${Math.round(item.main.temp)}°C ${getWeatherEmoji(item.weather[0].main)}`
          );
        }
        return acc;
      }, [])
      .slice(0, 12) // Ensure we only get 12 reports
      .join('\n');

    return `📅 ${gregorianDate}
📅 ${jalaaliFormatted}

🌡️ Weather in ${data.name}:
${getWeatherEmoji(data.weather[0].main)} ${data.weather[0].description}
🌡️ Temperature: ${Math.round(data.main.temp)}°C
🤔 Feels like: ${Math.round(data.main.feels_like)}°C
💧 Humidity: ${data.main.humidity}%
💨 Wind: ${data.wind.speed} m/s
🌧️ Rain probability: ${Math.round((data.rain?.['1h'] || 0) * 100)}%

⏰ Next 24 hours:
${hourlyForecast}`;
  } catch (error: any) {
    console.error(`❌ Error fetching weather for ${city}:`, error.message);
    return '❌ Error fetching weather data. Please try again later.';
  }
}

// Add this function before the bot commands
function getWeatherEmoji(weatherMain: string): string {
  const emojis: { [key: string]: string } = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '🌨️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️',
    Smoke: '🌫️',
  };
  return emojis[weatherMain] || '🌤️';
}

// Start command
bot.command('start', async ctx => {
  if (ctx.chat.id.toString() !== process.env.CHAT_ID) {
    try {
      await ctx.reply(
        "👋 Welcome! This is a private weather bot. Reach out to @pmkarim if you'd like to join! 🌤️"
      );
    } catch (error: any) {
      if (error.description === 'Chat not found') {
        console.log('❌ Chat not found. Skipping unauthorized access message.');
      } else {
        console.error('❌ Error sending message:', error);
      }
    }
    return;
  }
  console.log(
    `👋 New user started bot: ${ctx.from.username || ctx.from.id} (Chat ID: ${ctx.chat.id})`
  );
  try {
    await ctx.reply(
      'Hello! Welcome to my weather bot 👋\nSend any message to get weather in Astaneh-ye Ashrafiyeh, or use /weather <city> for a specific city.'
    );
  } catch (error: any) {
    if (error.description === 'Chat not found') {
      console.log('❌ Chat not found. Skipping start message.');
    } else {
      console.error('❌ Error sending start message:', error);
    }
  }
});

// Help command
bot.command('help', async ctx => {
  if (ctx.chat.id.toString() !== process.env.CHAT_ID) {
    try {
      await ctx.reply(
        "👋 Hi there! This is an exclusive weather bot. If you're interested in using it, please contact @pmkarim 🌤️"
      );
    } catch (error: any) {
      if (error.description === 'Chat not found') {
        console.log('❌ Chat not found. Skipping unauthorized access message.');
      } else {
        console.error('❌ Error sending message:', error);
      }
    }
    return;
  }
  console.log(
    `❓ Help requested by: ${ctx.from.username || ctx.from.id} (Chat ID: ${ctx.chat.id})`
  );
  try {
    await ctx.reply(
      'Available commands:\n' +
        '/weather <city> - Get weather for a specific city\n' +
        '/setdefault <city> - Set your default city\n' +
        '/reset - Reset to default city (Astaneh-ye Ashrafiyeh)\n' +
        '/start - Start the bot'
    );
  } catch (error: any) {
    if (error.description === 'Chat not found') {
      console.log('❌ Chat not found. Skipping help message.');
    } else {
      console.error('❌ Error sending help message:', error);
    }
  }
});

// Weather command
bot.command('weather', async ctx => {
  if (ctx.chat.id.toString() !== process.env.CHAT_ID) {
    try {
      await ctx.reply(
        "👋 Hi there! This is an exclusive weather bot. If you're interested in using it, please contact @pmkarim 🌤️"
      );
    } catch (error: any) {
      if (error.description === 'Chat not found') {
        console.log('❌ Chat not found. Skipping unauthorized access message.');
      } else {
        console.error('❌ Error sending message:', error);
      }
    }
    return;
  }
  const city =
    ctx.message.text.split(' ').slice(1).join(' ') || getDefaultCity(ctx.chat.id.toString());
  console.log(
    `🌍 Weather command for ${city} by ${ctx.from.username || ctx.from.id} (Chat ID: ${ctx.chat.id})`
  );
  const weather = await getWeather(city);
  try {
    await ctx.reply(weather);
  } catch (error: any) {
    if (error.description === 'Chat not found') {
      console.log('❌ Chat not found. Skipping weather report.');
    } else {
      console.error('❌ Error sending weather report:', error);
    }
  }
});

// Set default city command
bot.command('setdefault', async ctx => {
  if (ctx.chat.id.toString() !== process.env.CHAT_ID) {
    try {
      await ctx.reply(
        "👋 Hi there! This is an exclusive weather bot. If you're interested in using it, please contact @pmkarim 🌤️"
      );
    } catch (error: any) {
      if (error.description === 'Chat not found') {
        console.log('❌ Chat not found. Skipping unauthorized access message.');
      } else {
        console.error('❌ Error sending message:', error);
      }
    }
    return;
  }
  const city = ctx.message.text.split(' ').slice(1).join(' ');
  if (!city) {
    try {
      await ctx.reply('Please provide a city name. Example: /setdefault Tehran');
    } catch (error: any) {
      if (error.description === 'Chat not found') {
        console.log('❌ Chat not found. Skipping error message.');
      } else {
        console.error('❌ Error sending message:', error);
      }
    }
    return;
  }
  setDefaultCity(ctx.chat.id.toString(), city);
  try {
    await ctx.reply(`✅ Default city set to ${city}`);
    const weather = await getWeather(city);
    await ctx.reply(weather);
  } catch (error: any) {
    if (error.description === 'Chat not found') {
      console.log('❌ Chat not found. Skipping setdefault messages.');
    } else {
      console.error('❌ Error sending setdefault messages:', error);
    }
  }
});

// Reset default city command
bot.command('reset', async ctx => {
  if (ctx.chat.id.toString() !== process.env.CHAT_ID) {
    try {
      await ctx.reply(
        "👋 Hi there! This is an exclusive weather bot. If you're interested in using it, please contact @pmkarim 🌤️"
      );
    } catch (error: any) {
      if (error.description === 'Chat not found') {
        console.log('❌ Chat not found. Skipping unauthorized access message.');
      } else {
        console.error('❌ Error sending message:', error);
      }
    }
    return;
  }
  resetDefaultCity(ctx.chat.id.toString());
  try {
    await ctx.reply('✅ Default city reset to Astaneh-ye Ashrafiyeh');
    const weather = await getWeather('Astaneh-ye Ashrafiyeh');
    await ctx.reply(weather);
  } catch (error: any) {
    if (error.description === 'Chat not found') {
      console.log('❌ Chat not found. Skipping reset messages.');
    } else {
      console.error('❌ Error sending reset messages:', error);
    }
  }
});

// Handle text messages
bot.on('text', async ctx => {
  if (ctx.chat.id.toString() !== process.env.CHAT_ID) {
    try {
      await ctx.reply(
        "👋 Hi there! This is an exclusive weather bot. If you're interested in using it, please contact @pmkarim 🌤️"
      );
    } catch (error: any) {
      if (error.description === 'Chat not found') {
        console.log('❌ Chat not found. Skipping unauthorized access message.');
      } else {
        console.error('❌ Error sending message:', error);
      }
    }
    return;
  }
  if (!ctx.message.text.startsWith('/')) {
    console.log(
      `💬 Text message from ${ctx.from.username || ctx.from.id} (Chat ID: ${ctx.chat.id}): ${ctx.message.text}`
    );
    const weather = await getWeather(getDefaultCity(ctx.chat.id.toString()));
    try {
      await ctx.reply(weather);
    } catch (error: any) {
      if (error.description === 'Chat not found') {
        console.log('❌ Chat not found. Skipping weather report.');
      } else {
        console.error('❌ Error sending weather report:', error);
      }
    }
  }
});

// Launch bot
bot.launch();
console.log('✅ Bot is running!');

// Send weather report to specified chat ID on startup
if (process.env.CHAT_ID) {
  console.log('📱 Sending startup weather report...');
  getWeather().then(weather => {
    bot.telegram.sendMessage(process.env.CHAT_ID!, weather).catch(error => {
      if (error.description === 'Chat not found') {
        console.log('❌ Chat not found. Skipping startup weather report.');
      } else {
        console.error('❌ Error sending startup weather report:', error);
      }
    });
  });
}

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('🛑 Received SIGINT. Shutting down...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('🛑 Received SIGTERM. Shutting down...');
  bot.stop('SIGTERM');
});
