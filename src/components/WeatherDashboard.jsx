import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiMapPin } from 'react-icons/fi';
import { getCitySuggestions, getWeatherData, getWeatherByCoords } from '../services/weatherApi';

const WeatherDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 2) {
        const results = await getCitySuggestions(searchQuery);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async (cityName) => {
    setLoading(true);
    setError('');
    setSuggestions([]);
    setSearchQuery(cityName);

    try {
      const data = await getWeatherData(cityName);
      setWeather(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLoading(true);
          setError('');
          try {
            const data = await getWeatherByCoords(
              position.coords.latitude,
              position.coords.longitude
            );
            setWeather(data);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError('Failed to get your location. Please search by city name.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col items-center p-8 min-h-screen bg-gray-900 mb-">
      {/* Search Bar */}
      <div className="relative mb-20 w-full max-w-md">
        <div className="flex gap-2">
          <div className="flex relative flex-1 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a city..."
              className="px-4 py-2 w-full text-white bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleSearch(searchQuery)}
              className="absolute right-0 px-4 h-full text-gray-400 hover:text-white"
            >
              <FiSearch size={20} />
            </button>
          </div>
          <button
            onClick={handleLocationSearch}
            className="px-4 py-2 text-gray-400 bg-gray-800 rounded-lg border border-gray-700 transition-colors hover:text-white hover:border-gray-600"
          >
            <FiMapPin size={20} />
          </button>
        </div>
        
        {suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 mt-1 w-full bg-gray-800 rounded-lg border border-gray-700 shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSearch(suggestion.name)}
                className="px-4 py-2 text-white cursor-pointer hover:bg-gray-700"
              >
                {suggestion.displayName}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="text-white">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {weather && (
        <div className="w-full max-w-8xl">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Main Weather Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* City and Temperature */}
              <div className="text-center">
                <h1 className="mb-2 text-4xl font-bold text-white">{weather.city}</h1>
                <p className="mb-4 text-gray-400">Chance of rain: {weather.chanceOfRain}%</p>
                <div className="flex gap-4 justify-center items-center">
                  <span className="text-7xl font-bold text-white">{weather.temp}°</span>
                  <img
                    src={`http://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.description}
                    className="w-24 h-24"
                  />
                </div>
              </div>

              {/* Today's Forecast */}
              <div className="p-6 bg-gray-800 rounded-lg">
                <h2 className="mb-4 text-xl font-semibold text-white">Today's Forecast</h2>
                <div className="grid grid-cols-6 gap-4">
                  {weather.hourlyForecast.map((hour, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <span className="mb-2 text-sm text-gray-400">{formatTime(hour.time)}</span>
                      <img
                        src={`http://openweathermap.org/img/wn/${hour.icon}.png`}
                        alt="weather icon"
                        className="mb-2 w-10 h-10"
                      />
                      <span className="font-medium text-white">{hour.temp}°</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Air Conditions */}
              <div className="p-6 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Air Conditions</h2>
                  <button className="text-sm text-blue-500 hover:text-blue-400">See more</button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="mb-2 text-sm text-gray-400">Real Feel</span>
                    <span className="text-lg font-medium text-white">{weather.realFeel}°</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-2 text-sm text-gray-400">Wind</span>
                    <span className="text-lg font-medium text-white">{weather.wind} km/h</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-2 text-sm text-gray-400">Chance of rain</span>
                    <span className="text-lg font-medium text-white">{weather.chanceOfRain}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-2 text-sm text-gray-400">UV Index</span>
                    <span className="text-lg font-medium text-white">{weather.uv}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - 7-Day Forecast */}
            <div className="lg:col-span-1">
              <div className="p-6 h-full bg-gray-800 rounded-lg">
                <h2 className="mb-4 text-xl font-semibold text-white">7-Day Forecast</h2>
                <div className="space-y-5">
                  {weather.forecast?.map((day, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center p-3 bg-gray-700 rounded-lg transition-colors hover:bg-gray-600"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-28">
                          <p className="text-sm font-medium text-gray-300">
                            {index === 0 ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <img 
                          src={`http://openweathermap.org/img/wn/${day.icon}@2x.png`}
                          alt={day.description}
                          className="w-12 h-12"
                        />
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="mb-1 text-sm text-gray-300 capitalize">{day.description}</p>
                        <div className="flex gap-2 justify-center">
                          <span className="text-sm font-medium text-white">{day.temp.max}°</span>
                          <span className="text-sm text-gray-400">{day.temp.min}°</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherDashboard;
