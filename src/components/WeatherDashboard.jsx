import React, { useState, useEffect, useRef } from 'react';
import { WiThermometer, WiHumidity, WiStrongWind } from 'react-icons/wi';
import { FiSearch } from 'react-icons/fi';
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

  return (
    <div className="p-6">
      {/* Search Form */}
      <div className="relative mb-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={city}
                onChange={handleInputChange}
                placeholder="Search for cities..."
                className="input-field pr-10"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50"
              >
                <FiSearch className="text-xl" />
              </button>
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="suggestions-dropdown"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.name}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.displayName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={locationLoading}
              className="button-secondary flex items-center gap-2"
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
        <div className="p-4 mb-6 text-red-500 bg-red-100 bg-opacity-10 rounded-lg">
          {error}
        </div>
      )}

      {/* Weather Display */}
      {weather && (
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
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
                <div className="weather-stat">
                  <WiThermometer className="text-4xl text-blue-400" />
                  <div>
                    <p className="text-gray-400">Temperature</p>
                    <p className="text-xl text-white">{weather.temp}°C</p>
                  </div>
                </div>
                <div className="weather-stat">
                  <WiHumidity className="text-4xl text-green-400" />
                  <div>
                    <p className="text-gray-400">Humidity</p>
                    <p className="text-xl text-white">{weather.humidity}%</p>
                  </div>
                </div>
                <div className="weather-stat">
                  <WiStrongWind className="text-4xl text-purple-400" />
                  <div>
                    <p className="text-gray-400">Wind Speed</p>
                    <p className="text-xl text-white">{weather.wind} km/h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div className="w-80 bg-gray-800 rounded-lg shadow-lg h-fit">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">7-Day Forecast</h3>
            </div>
            <div className="p-4 space-y-3">
              {weather.forecast?.map((day, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {/* Day and Weather Icon */}
                  <div className="flex items-center gap-3">
                    <div className="w-14">
                      <p className="text-sm font-medium text-gray-300">
                        {index === 0 ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="relative w-12 h-12">
                      <img 
                        src={`http://openweathermap.org/img/wn/${day.icon}@2x.png`}
                        alt={day.description}
                        className="w-12 h-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      />
                    </div>
                  </div>

                  {/* Temperature and Description */}
                  <div className="flex items-end gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-300 capitalize mb-1">{day.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{day.temp.max}°</span>
                        <span className="text-sm text-gray-400">{day.temp.min}°</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
