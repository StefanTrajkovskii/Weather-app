import axios from 'axios';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

export const getCitySuggestions = async (query) => {
  try {
    const response = await axios.get(`${GEO_URL}/direct`, {
      params: {
        q: query,
        limit: 5,
        appid: API_KEY
      }
    });
    
    return response.data.map(city => ({
      name: city.name,
      displayName: `${city.name}${city.state ? `, ${city.state}` : ''}, ${city.country}`
    }));
  } catch (error) {
    return [];
  }
};

export const getWeatherData = async (city) => {
  try {
    // First get coordinates for the city
    const geoResponse = await axios.get(`${GEO_URL}/direct`, {
      params: {
        q: city,
        limit: 1,
        appid: API_KEY
      }
    });
    const geoData = geoResponse.data;

    if (!geoData.length) {
      throw new Error('City not found');
    }

    const { lat, lon } = geoData[0];
    
    // Get current weather
    const weatherResponse = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        units: 'metric',
        appid: API_KEY
      }
    });
    const weatherData = weatherResponse.data;

    // Get 5-day forecast
    const forecastResponse = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        units: 'metric',
        appid: API_KEY
      }
    });
    const forecastData = forecastResponse.data;

    // Process forecast data to get daily values
    const dailyForecasts = forecastData.list.reduce((acc, item) => {
      const date = new Date(item.dt * 1000);
      const dateString = date.toDateString();
      
      if (!acc[dateString]) {
        acc[dateString] = {
          date,
          temp: {
            min: item.main.temp_min,
            max: item.main.temp_max
          },
          icon: item.weather[0].icon,
          description: item.weather[0].description
        };
      } else {
        // Update min/max temperatures
        acc[dateString].temp.min = Math.min(acc[dateString].temp.min, item.main.temp_min);
        acc[dateString].temp.max = Math.max(acc[dateString].temp.max, item.main.temp_max);
      }
      
      return acc;
    }, {});

    // Convert to array and take first 7 days
    const forecast = Object.values(dailyForecasts)
      .slice(0, 7)
      .map(day => ({
        ...day,
        temp: {
          min: Math.round(day.temp.min),
          max: Math.round(day.temp.max)
        }
      }));

    return {
      city: geoData[0].name,
      temp: Math.round(weatherData.main.temp),
      humidity: weatherData.main.humidity,
      wind: Math.round(weatherData.wind.speed),
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      forecast
    };
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch weather data');
  }
};

export const getWeatherByCoords = async (lat, lon) => {
  try {
    // Get current weather
    const weatherResponse = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        units: 'metric',
        appid: API_KEY
      }
    });
    const weatherData = weatherResponse.data;

    // Get 5-day forecast
    const forecastResponse = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        units: 'metric',
        appid: API_KEY
      }
    });
    const forecastData = forecastResponse.data;

    // Process forecast data to get daily values
    const dailyForecasts = forecastData.list.reduce((acc, item) => {
      const date = new Date(item.dt * 1000);
      const dateString = date.toDateString();
      
      if (!acc[dateString]) {
        acc[dateString] = {
          date,
          temp: {
            min: item.main.temp_min,
            max: item.main.temp_max
          },
          icon: item.weather[0].icon,
          description: item.weather[0].description
        };
      } else {
        // Update min/max temperatures
        acc[dateString].temp.min = Math.min(acc[dateString].temp.min, item.main.temp_min);
        acc[dateString].temp.max = Math.max(acc[dateString].temp.max, item.main.temp_max);
      }
      
      return acc;
    }, {});

    // Convert to array and take first 7 days
    const forecast = Object.values(dailyForecasts)
      .slice(0, 7)
      .map(day => ({
        ...day,
        temp: {
          min: Math.round(day.temp.min),
          max: Math.round(day.temp.max)
        }
      }));

    return {
      city: weatherData.name,
      temp: Math.round(weatherData.main.temp),
      humidity: weatherData.main.humidity,
      wind: Math.round(weatherData.wind.speed),
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      forecast
    };
  } catch (error) {
    throw new Error('Failed to fetch weather data for your location');
  }
};
