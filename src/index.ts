import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import https from 'https';
import axios from 'axios';
import jalaali from 'jalaali-js';

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

    // Format hourly forecast
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const hourlyForecast = forecastData.list
      .filter((item: ForecastItem) => {
        const forecastTime = new Date(item.dt * 1000);
        return forecastTime <= endOfDay;
      })
      .map((item: ForecastItem) => {
        const time = new Date(item.dt * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return `${time}: ${Math.round(item.main.temp)}°C ${getWeatherEmoji(item.weather[0].main)}`;
      })
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
bot.command('start', ctx => {
  console.log(
    `👋 New user started bot: ${ctx.from.username || ctx.from.id} (Chat ID: ${ctx.chat.id})`
  );
  ctx.reply(
    'Hello! Welcome to my weather bot 👋\nSend any message to get weather in Astaneh-ye Ashrafiyeh, or use /weather <city> for a specific city.'
  );
});

// Help command
bot.command('help', ctx => {
  console.log(
    `❓ Help requested by: ${ctx.from.username || ctx.from.id} (Chat ID: ${ctx.chat.id})`
  );
  ctx.reply(
    'Available commands:\n/weather <city> - Get weather for a specific city\n/start - Start the bot'
  );
});

// Weather command
bot.command('weather', async ctx => {
  const city = ctx.message.text.split(' ').slice(1).join(' ') || 'Astaneh-ye Ashrafiyeh';
  console.log(
    `🌍 Weather command for ${city} by ${ctx.from.username || ctx.from.id} (Chat ID: ${ctx.chat.id})`
  );
  const weather = await getWeather(city);
  ctx.reply(weather);
});

// Handle text messages
bot.on('text', async ctx => {
  if (!ctx.message.text.startsWith('/')) {
    console.log(
      `💬 Text message from ${ctx.from.username || ctx.from.id} (Chat ID: ${ctx.chat.id}): ${ctx.message.text}`
    );
    const weather = await getWeather();
    ctx.reply(weather);
  }
});

// Launch bot
bot.launch();
console.log('✅ Bot is running!');

// Send weather report to specified chat ID on startup
if (process.env.CHAT_ID) {
  console.log('📱 Sending startup weather report...');
  getWeather().then(weather => {
    bot.telegram.sendMessage(process.env.CHAT_ID!, weather);
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
