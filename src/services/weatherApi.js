import axios from 'axios';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

export const getCitySuggestions = async (searchText) => {
  if (!searchText.trim() || searchText.length < 2) return [];
  
  try {
    const response = await axios.get(`${GEO_URL}/direct`, {
      params: {
        q: searchText,
        limit: 5,
        appid: API_KEY
      }
    });

    return response.data.map(city => ({
      name: city.name,
      country: city.country,
      state: city.state,
      lat: city.lat,
      lon: city.lon,
      displayName: `${city.name}${city.state ? `, ${city.state}` : ''}, ${city.country}`
    }));
  } catch (error) {
    console.error('Error fetching city suggestions:', error);
    return [];
  }
};

export const getWeatherData = async (city) => {
  try {
    console.log('API Key:', API_KEY); // Debug log
    console.log('Fetching weather for:', city); // Debug log
    
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric' // This will return temperature in Celsius
      }
    });

    console.log('API Response:', response.data); // Debug log

    const { data } = response;
    return {
      city: data.name,
      temp: Math.round(data.main.temp),
      humidity: data.main.humidity,
      wind: Math.round(data.wind.speed),
      description: data.weather[0].main,
      icon: data.weather[0].icon
    };
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message); // Debug log
    throw new Error(error.response?.data?.message || 'Failed to fetch weather data');
  }
};
