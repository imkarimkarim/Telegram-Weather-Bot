import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeatherService } from '../weatherService.js';
import axios from 'axios';
import { OpenWeatherResponse } from '../../types/index.js';

vi.mock('axios');

describe('WeatherService', () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
  });

  it('should fetch and format weather data correctly', async () => {
    const mockWeatherData = {
      data: {
        main: {
          temp: 25,
          humidity: 65,
        },
        weather: [
          {
            description: 'clear sky',
          },
        ],
        wind: {
          speed: 5,
        },
      } as OpenWeatherResponse,
    };

    (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockWeatherData);

    const weather = await weatherService.getWeather();
    const message = weatherService.formatWeatherMessage(weather);

    expect(weather).toEqual({
      temperature: 25,
      humidity: 65,
      description: 'clear sky',
      windSpeed: 5,
    });

    expect(message).toContain('25°C');
    expect(message).toContain('65%');
    expect(message).toContain('clear sky');
    expect(message).toContain('5 m/s');
  });

  it('should handle API errors', async () => {
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('API Error')
    );

    await expect(weatherService.getWeather()).rejects.toThrow('Failed to fetch weather data');
  });
});
