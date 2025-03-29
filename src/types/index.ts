export interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  windSpeed: number;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
  }>;
  wind: {
    speed: number;
  };
}
