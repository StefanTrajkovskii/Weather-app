import React, { useState, useEffect } from 'react';
import { FiTrash2, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getWeatherData } from '../services/weatherApi';

function Cities() {
  const [favorites, setFavorites] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [currentTime, setCurrentTime] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('favoriteCities');
    if (saved) {
      const cities = JSON.parse(saved);
      setFavorites(cities);
      
      // Fetch weather data for each city
      cities.forEach(async (city) => {
        try {
          const data = await getWeatherData(city);
          setWeatherData(prev => ({
            ...prev,
            [city]: data
          }));
        } catch (error) {
          console.error(`Error fetching weather for ${city}:`, error);
        }
      });
    }
  }, []);

  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000); // Current time in UTC milliseconds
      const times = {};
      
      favorites.forEach(city => {
        if (weatherData[city]?.timezone) {
          // Convert UTC to city's local time using the timezone offset
          const cityTime = new Date(utc + (weatherData[city].timezone * 1000));
          times[city] = cityTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      });
      setCurrentTime(times);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [favorites, weatherData]);

  const removeFavorite = (city) => {
    const newFavorites = favorites.filter(c => c !== city);
    setFavorites(newFavorites);
    localStorage.setItem('favoriteCities', JSON.stringify(newFavorites));
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Favorite Cities</h2>
      {favorites.length === 0 ? (
        <p className="text-gray-400">No favorite cities yet. Add some from the dashboard!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((city) => (
            <div
              key={city}
              className="p-6 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{city}</h3>
                  <div className="flex items-center text-gray-400">
                    <FiClock className="mr-1" />
                    <span>{currentTime[city]}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(city);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FiTrash2 size={20} />
                </button>
              </div>
              {weatherData[city] && (
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-3xl font-bold text-white">{weatherData[city].temp}°</span>
                    <img
                      src={`http://openweathermap.org/img/wn/${weatherData[city].icon}@2x.png`}
                      alt={weatherData[city].description}
                      className="w-16 h-16"
                    />
                  </div>
                  <p className="text-gray-400 capitalize">{weatherData[city].description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Cities;
