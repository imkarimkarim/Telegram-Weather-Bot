import axios from 'axios';
import dotenv from 'dotenv';
import { WeatherData, Coordinates, OpenWeatherResponse } from '../types/index.js';

dotenv.config();

const GILAN_COORDINATES: Coordinates = {
  lat: 37.2809,
  lon: 49.5924,
};

export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getWeather(): Promise<WeatherData> {
    try {
      const response = await axios.get<OpenWeatherResponse>(`${this.baseUrl}/weather`, {
        params: {
          lat: GILAN_COORDINATES.lat,
          lon: GILAN_COORDINATES.lon,
          appid: this.apiKey,
          units: 'metric',
        },
      });

      return {
        temperature: Math.round(response.data.main.temp),
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        windSpeed: response.data.wind.speed,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  formatWeatherMessage(weather: WeatherData): string {
    return (
      `🌤 Weather Report for Gilan, Iran\n\n` +
      `Temperature: ${weather.temperature}°C\n` +
      `Humidity: ${weather.humidity}%\n` +
      `Conditions: ${weather.description}\n` +
      `Wind Speed: ${weather.windSpeed} m/s`
    );
  }
}
