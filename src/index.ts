import { WeatherService } from './services/weatherService.js';
import { TelegramService } from './services/telegramService.js';
import dotenv from 'dotenv';

dotenv.config();

class WeatherNotifier {
  private readonly weatherService: WeatherService;
  private readonly telegramService: TelegramService;

  constructor() {
    this.weatherService = new WeatherService();
    this.telegramService = new TelegramService();
  }

  async sendWeatherReport(): Promise<void> {
    try {
      const weather = await this.weatherService.getWeather();
      const message = this.weatherService.formatWeatherMessage(weather);
      await this.telegramService.sendMessage(message);
    } catch (error) {
      console.error(
        'Error sending weather report:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}

// Create and export the notifier instance
export const weatherNotifier = new WeatherNotifier();

// If running directly (not imported as a module)
if (process.argv[1] === new URL(import.meta.url).pathname) {
  weatherNotifier.sendWeatherReport();
}
