import React, { useState, useEffect, useRef } from 'react';
import { WiThermometer, WiHumidity, WiStrongWind } from 'react-icons/wi';
import { getWeatherData, getCitySuggestions, getWeatherByCoords } from '../services/weatherApi';

function WeatherDashboard() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setCity(value);
    
    if (value.length >= 2) {
      const cityResults = await getCitySuggestions(value);
      setSuggestions(cityResults);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setCity(suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
    handleSearch(null, suggestion.name);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const data = await getWeatherByCoords(latitude, longitude);
          setWeather(data);
          setCity(data.city);
        } catch (err) {
          setError(err.message);
          setWeather(null);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setError('Unable to retrieve your location');
        setLocationLoading(false);
      }
    );
  };

  const handleSearch = async (e, selectedCity = null) => {
    if (e) e.preventDefault();
    const searchCity = selectedCity || city;
    if (!searchCity.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const data = await getWeatherData(searchCity);
      setWeather(data);
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Search Form */}
      <div className="relative mb-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={city}
              onChange={handleInputChange}
              placeholder="Search for cities..."
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-2 bg-gray-800 rounded-lg shadow-xl"
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.name}-${index}`}
                    className="px-4 py-3 hover:bg-gray-700 cursor-pointer text-white"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={locationLoading}
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {locationLoading ? 'Getting location...' : 'Use my location'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-500 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {/* Weather Display */}
      {weather && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">{weather.city}</h2>
              <p className="text-gray-400">Current Weather</p>
            </div>
            <img 
              src={`http://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
              className="w-16 h-16"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 bg-gray-700 p-4 rounded-lg">
              <WiThermometer className="text-4xl text-blue-400" />
              <div>
                <p className="text-gray-400">Temperature</p>
                <p className="text-xl text-white">{weather.temp}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-gray-700 p-4 rounded-lg">
              <WiHumidity className="text-4xl text-green-400" />
              <div>
                <p className="text-gray-400">Humidity</p>
                <p className="text-xl text-white">{weather.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-gray-700 p-4 rounded-lg">
              <WiStrongWind className="text-4xl text-purple-400" />
              <div>
                <p className="text-gray-400">Wind Speed</p>
                <p className="text-xl text-white">{weather.wind} km/h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!weather && !error && (
        <div className="text-center text-gray-400 mt-8">
          Search for a city to see weather information
        </div>
      )}
    </div>
  );
}

export default WeatherDashboard;
