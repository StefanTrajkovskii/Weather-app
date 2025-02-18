import React, { useState, useEffect } from 'react';
import { FiTrash2, FiClock, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getWeatherData } from '../services/weatherApi';

function Places() {
  const [favorites, setFavorites] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [currentTime, setCurrentTime] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isCelsius, setIsCelsius] = useState(() => {
    const saved = localStorage.getItem('temperatureUnit');
    return saved ? saved === 'celsius' : true;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('favoritePlaces');
    if (saved) {
      const places = JSON.parse(saved);
      setFavorites(places);
      
      // Fetch weather data for each place
      places.forEach(async (place) => {
        try {
          const data = await getWeatherData(place);
          setWeatherData(prev => ({
            ...prev,
            [place]: data
          }));
        } catch (error) {
          console.error(`Error fetching weather for ${place}:`, error);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (Object.keys(weatherData).length > 0) {
      const updateTime = () => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const times = {};
        
        favorites.forEach(place => {
          if (weatherData[place]?.timezone) {
            const placeTime = new Date(utc + (weatherData[place].timezone * 1000));
            times[place] = placeTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
          }
        });
        setCurrentTime(times);
      };

      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }
  }, [favorites, weatherData]);

  const removeFavorite = (place) => {
    const newFavorites = favorites.filter(p => p !== place);
    setFavorites(newFavorites);
    localStorage.setItem('favoritePlaces', JSON.stringify(newFavorites));
  };

  const toggleUnit = () => {
    setIsCelsius(!isCelsius);
    localStorage.setItem('temperatureUnit', !isCelsius ? 'celsius' : 'fahrenheit');
  };

  const convertTemp = (temp) => {
    return isCelsius ? temp : Math.round((temp * 9/5) + 32);
  };

  const filteredPlaces = favorites.filter(place => 
    place.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlaceClick = (place) => {
    navigate(`/?search=${encodeURIComponent(place)}`);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-6">Favorite Places</h2>
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search favorite places..."
              className="w-full px-4 py-2 pl-10 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <button
            onClick={toggleUnit}
            className="px-4 py-2 text-gray-400 bg-gray-800 rounded-lg border border-gray-700 transition-colors hover:text-white hover:border-gray-600"
          >
            °{isCelsius ? 'C' : 'F'}
          </button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <p className="text-gray-400">No favorite places yet. Add some from the dashboard!</p>
      ) : filteredPlaces.length === 0 ? (
        <p className="text-gray-400">No places match your search.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((place) => (
            <div
              key={place}
              className="p-6 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => handlePlaceClick(place)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{place}</h3>
                  <div className="flex items-center text-gray-400">
                    <FiClock className="mr-1" />
                    <span>{currentTime[place]}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(place);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FiTrash2 size={20} />
                </button>
              </div>
              {weatherData[place] && (
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-3xl font-bold text-white">{convertTemp(weatherData[place].temp)}°</span>
                    <img
                      src={`http://openweathermap.org/img/wn/${weatherData[place].icon}.png`}
                      alt={weatherData[place].description}
                      className="w-12 h-12"
                    />
                  </div>
                  <p className="text-gray-400 capitalize">{weatherData[place].description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Places;
