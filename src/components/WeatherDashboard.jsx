import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiSearch, FiMapPin, FiHeart, FiClock } from 'react-icons/fi';
import { getCitySuggestions, getWeatherData, getWeatherByCoords } from '../services/weatherApi';
import { useLocation } from 'react-router-dom';

const WeatherDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaceSelected, setIsPlaceSelected] = useState(false);
  const [currentBackground, setCurrentBackground] = useState('');
  const [nextBackground, setNextBackground] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favoritePlaces');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentTime, setCurrentTime] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);
  const suggestionsRef = useRef(null);
  const location = useLocation();

  const weatherBackgrounds = useMemo(() => ({
    'clear sky': 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=1920&q=80',
    'scattered clouds': 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1920&q=80',
    'broken clouds': 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1920&q=80',
    'overcast clouds': 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1920&q=80',
    'light rain': 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=1920&q=80',
    'moderate rain': 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=1920&q=80',
    'heavy rain': 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=1920&q=80',
    'light snow': 'https://images.unsplash.com/photo-1516431883344-a3b08b0140bc?w=1920&q=80',
    'snow': 'https://images.unsplash.com/photo-1516431883344-a3b08b0140bc?w=1920&q=80',
    'thunderstorm': 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1920&q=80',
    'mist': 'https://images.unsplash.com/photo-1543968996-ee822b8176ba?w=1920&q=80',
    'fog': 'https://images.unsplash.com/photo-1543968996-ee822b8176ba?w=1920&q=80',
    default: 'https://images.unsplash.com/photo-1553901753-215db344677a?w=1920&q=80'
  }), []); // Empty dependency array since the backgrounds never change

  const updateBackground = useCallback((description) => {
    const condition = description?.toLowerCase();
    const newBackground = condition ? (weatherBackgrounds[condition] || weatherBackgrounds.default) : weatherBackgrounds.default;
    
    if (newBackground !== currentBackground) {
      setNextBackground(newBackground);
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentBackground(newBackground);
        setIsTransitioning(false);
      }, 1000);
    }
  }, [currentBackground, weatherBackgrounds]);

  useEffect(() => {
    if (weather?.description) {
      updateBackground(weather.description);
    }
  }, [weather?.description, updateBackground]);

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
      if (searchQuery.length > 2 && !isPlaceSelected) {
        const results = await getCitySuggestions(searchQuery);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isPlaceSelected]);

  useEffect(() => {
    localStorage.setItem('favoritePlaces', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (weather?.timezone) {
      const updateTime = () => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const cityTime = new Date(utc + (weather.timezone * 1000));
        setCurrentTime(cityTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }));
      };

      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }
  }, [weather?.timezone]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      const decodedSearch = decodeURIComponent(searchParam);
      setSearchQuery(decodedSearch);
      handleSearch(decodedSearch);
      setSuggestions([]); 
    }
  }, [location.search]);

  const handleSearch = async (cityName) => {
    setLoading(true);
    setError('');
    setSuggestions([]);
    setIsPlaceSelected(true);
    
    try {
      const data = await getWeatherData(cityName);
      console.log('Weather data:', data);
      setWeather(data);
      setSearchQuery(cityName); 
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

  const toggleFavorite = (city) => {
    setFavorites(prev => {
      if (prev.includes(city)) {
        return prev.filter(c => c !== city);
      }
      return [...prev, city];
    });
  };

  const toggleUnit = () => {
    setIsCelsius(!isCelsius);
  };

  const convertTemp = (temp) => {
    return isCelsius ? temp : Math.round((temp * 9/5) + 32);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
    });
  };

  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${currentBackground || weatherBackgrounds.default})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: isTransitioning ? 0 : 1,
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${nextBackground || weatherBackgrounds.default})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: isTransitioning ? 1 : 0,
        }}
      />
      <div className="relative flex flex-col items-center p-8 min-h-screen">
        {/* Search Bar */}
        <div className="relative mb-20 w-full max-w-md">
          <div className="flex gap-2">
            <button
              onClick={toggleUnit}
              className="px-4 py-2 text-gray-400 bg-gray-800 rounded-lg border border-gray-700 transition-colors hover:text-white hover:border-gray-600"
            >
              °{isCelsius ? 'C' : 'F'}
            </button>
            <div className="flex relative flex-1 items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsPlaceSelected(false);
                }}
                placeholder="Search for a place..."
                className="px-4 py-2 w-full text-white bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
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

        {error && <div className="text-red-500">{error}</div>}

        {weather && (
          <div className={`w-full max-w-8xl transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column - Main Weather Info */}
              <div className="space-y-6 lg:col-span-2">
                {/* City and Temperature */}
                <div className="text-center">
                  <div className="flex gap-3 justify-center items-center mb-2">
                    <h1 className="text-4xl font-bold text-white">{weather.city}</h1>
                    <button
                      onClick={() => toggleFavorite(weather.city)}
                      className={`p-2 rounded-full transition-colors ${
                        favorites.includes(weather.city)
                          ? 'text-red-500 hover:text-red-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <FiHeart
                        size={24}
                        className={favorites.includes(weather.city) ? 'fill-current' : ''}
                      />
                    </button>
                  </div>
                  <div className="flex gap-2 justify-center items-center mb-4 text-gray-400">
                    <FiClock size={16} />
                    <span>{currentTime}</span>
                  </div>
                  <p className="mb-4 text-gray-400">Chance of rain: {weather.chanceOfRain}%</p>
                  <div className="flex gap-4 justify-center items-center">
                    <span className="text-7xl font-bold text-white">{convertTemp(weather.temp)}°</span>
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
                        <span className="font-medium text-white">{convertTemp(hour.temp)}°</span>
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
                      <span className="text-lg font-medium text-white">{convertTemp(weather.realFeel)}°</span>
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
                  <div className="space-y-7">
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
                            <span className="text-sm font-medium text-white">{convertTemp(day.temp.max)}°</span>
                            <span className="text-sm text-gray-400">{convertTemp(day.temp.min)}°</span>
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
    </div>
  );
};

export default WeatherDashboard;
