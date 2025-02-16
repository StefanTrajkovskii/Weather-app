import React, { useState } from 'react';
import { WiDaySunny, WiThermometer, WiHumidity, WiStrongWind } from 'react-icons/wi';
import { getWeatherData } from './services/weatherApi';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const data = await getWeatherData(city);
      setWeather(data);
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Weather Dashboard
        </h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-primary text-white rounded-lg transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
              }`}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-center mb-4">
            {error}
          </div>
        )}

        {/* Weather Display */}
        {weather && (
          <div className="weather-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">{weather.city}</h2>
              <img 
                src={`http://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                className="w-16 h-16"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <WiThermometer className="text-3xl text-red-500" />
                <span>Temperature: {weather.temp}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <WiHumidity className="text-3xl text-blue-500" />
                <span>Humidity: {weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <WiStrongWind className="text-3xl text-gray-500" />
                <span>Wind: {weather.wind} km/h</span>
              </div>
            </div>
          </div>
        )}

        {!weather && !error && (
          <div className="text-center text-gray-600">
            Enter a city name to see the weather information
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
