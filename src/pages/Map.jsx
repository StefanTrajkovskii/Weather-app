import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, transform } from 'ol/proj';
import { FiSearch, FiMap, FiThermometer, FiCloud, FiWind, FiX } from 'react-icons/fi';
import { getCitySuggestions } from '../services/weatherApi';
import axios from 'axios';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

// Legend configurations for each layer type
const legendConfig = {
  temperature: [
    { color: '#91005B', label: '> 40°C' },
    { color: '#960B00', label: '35-40°C' },
    { color: '#C92100', label: '30-35°C' },
    { color: '#E35D00', label: '25-30°C' },
    { color: '#E68F00', label: '20-25°C' },
    { color: '#FFB300', label: '15-20°C' },
    { color: '#FFD300', label: '10-15°C' },
    { color: '#C4E109', label: '5-10°C' },
    { color: '#89E200', label: '0-5°C' },
    { color: '#47B3FF', label: '-5-0°C' },
    { color: '#4976FF', label: '-10--5°C' },
    { color: '#9524FF', label: '-15--10°C' },
    { color: '#951CFE', label: '-20--15°C' },
    { color: '#940B99', label: '< -20°C' },
  ],
  precipitation: [
    { color: '#632B88', label: '> 200 mm' },
    { color: '#4B369E', label: '150-200 mm' },
    { color: '#2F43A5', label: '100-150 mm' },
    { color: '#1B53A9', label: '75-100 mm' },
    { color: '#1167AC', label: '50-75 mm' },
    { color: '#1B7AAF', label: '25-50 mm' },
    { color: '#4B8FB1', label: '10-25 mm' },
    { color: '#7AA6B3', label: '5-10 mm' },
    { color: '#A3BEB5', label: '2-5 mm' },
    { color: '#CCD5B7', label: '1-2 mm' },
    { color: '#EEE9B9', label: '0-1 mm' },
  ],
  wind: [
    { color: '#B91C1C', label: '> 100 km/h' },
    { color: '#DC2626', label: '75-100 km/h' },
    { color: '#EF4444', label: '50-75 km/h' },
    { color: '#F87171', label: '25-50 km/h' },
    { color: '#FCA5A5', label: '10-25 km/h' },
    { color: '#FEE2E2', label: '0-10 km/h' },
  ],
};

const Legend = ({ type }) => {
  if (type === 'default') return null;

  return (
    <div className="absolute bottom-6 right-6 bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs">
      <h3 className="text-white font-semibold mb-2 capitalize">{type} Legend</h3>
      <div className="grid gap-1">
        {legendConfig[type].map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-white text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WeatherPopup = ({ weather, onClose, position }) => {
  if (!weather) return null;

  return (
    <div 
      className="absolute z-50 bg-gray-800 rounded-lg shadow-lg p-4 text-white min-w-[300px]"
      style={{
        left: `${position[0]}px`,
        top: `${position[1]}px`,
        transform: 'translate(-50%, -120%)'
      }}
    >
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        <FiX size={20} />
      </button>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-1">{weather.name}</h3>
        <p className="text-gray-300">{weather.sys.country}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-3xl font-bold mb-2">
            {Math.round(weather.main.temp)}°C
          </p>
          <p className="text-gray-300 capitalize">
            {weather.weather[0].description}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm">
            Feels like: {Math.round(weather.main.feels_like)}°C
          </p>
          <p className="text-sm">
            Humidity: {weather.main.humidity}%
          </p>
          <p className="text-sm">
            Wind: {Math.round(weather.wind.speed * 3.6)} km/h
          </p>
        </div>
      </div>
    </div>
  );
};

function Map() {
  const mapRef = useRef();
  const mapInstanceRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('default');
  const weatherLayersRef = useRef({});
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const [popupWeather, setPopupWeather] = useState(null);
  const [popupPosition, setPopupPosition] = useState([0, 0]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length >= 2) {
        try {
          const data = await getCitySuggestions(searchQuery);
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Base map layer with English labels
      const baseLayer = new TileLayer({
        source: new XYZ({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          attributions: [' OpenStreetMap contributors'],
          maxZoom: 19
        })
      });

      const createWeatherLayer = (type) => {
        let layerType;
        switch(type) {
          case 'temperature':
            layerType = 'temp_new';
            break;
          case 'precipitation':
            layerType = 'precipitation_new';
            break;
          case 'wind':
            layerType = 'wind_new';
            break;
          default:
            layerType = type;
        }

        return new TileLayer({
          source: new XYZ({
            url: `https://tile.openweathermap.org/map/${layerType}/{z}/{x}/{y}.png?appid=${API_KEY}`,
            crossOrigin: 'anonymous',
            attributions: ['Weather data OpenWeatherMap'],
            tileLoadFunction: function(imageTile, src) {
              const img = imageTile.getImage();
              img.onerror = function() {
                console.error(`Failed to load tile: ${src}`);
              };
              img.src = src;
            }
          }),
          visible: false,
          opacity: 0.6
        });
      };

      const temperatureLayer = createWeatherLayer('temperature');
      const precipitationLayer = createWeatherLayer('precipitation');
      const windLayer = createWeatherLayer('wind');

      weatherLayersRef.current = {
        temperature: temperatureLayer,
        precipitation: precipitationLayer,
        wind: windLayer
      };

      mapInstanceRef.current = new OLMap({
        target: mapRef.current,
        layers: [
          baseLayer,
          temperatureLayer,
          precipitationLayer,
          windLayer
        ],
        view: new View({
          center: fromLonLat([21.4254, 41.9965]),
          zoom: 7,
          maxZoom: 19
        })
      });

      mapInstanceRef.current.on('error', function(event) {
        console.error('Map error:', event);
      });

      // Add click handler
      mapInstanceRef.current.on('click', async (event) => {
        const coordinate = transform(
          event.coordinate,
          'EPSG:3857',
          'EPSG:4326'
        );
        
        try {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${coordinate[1]}&lon=${coordinate[0]}&units=metric&appid=${API_KEY}`
          );
          
          setPopupWeather(response.data);
          setPopupPosition([
            event.pixel[0],
            event.pixel[1]
          ]);
        } catch (error) {
          console.error('Error fetching weather data:', error);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleLocationSelect = (lat, lon) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat([lon, lat]),
        zoom: 10,
        duration: 1000
      });
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleClosePopup = () => {
    setPopupWeather(null);
  };

  const handleLayerChange = (layerType) => {
    Object.values(weatherLayersRef.current).forEach(layer => {
      layer.setVisible(false);
    });

    if (layerType !== 'default') {
      weatherLayersRef.current[layerType].setVisible(true);
    }

    setActiveLayer(layerType);
  };

  const layerButtons = [
    { type: 'default', label: 'Map View', icon: <FiMap size={20} /> },
    { type: 'temperature', label: 'Temperature', icon: <FiThermometer size={20} /> },
    { type: 'precipitation', label: 'Precipitation', icon: <FiCloud size={20} /> },
    { type: 'wind', label: 'Wind', icon: <FiWind size={20} /> }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="flex flex-col gap-4 p-4 bg-gray-800">
        <div className="relative">
          <div className="relative flex items-center">
            <FiSearch className="absolute left-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a city..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="px-4 py-2 w-full text-left text-white hover:bg-gray-600 focus:outline-none"
                  onClick={() => handleLocationSelect(suggestion.lat, suggestion.lon)}
                >
                  {suggestion.name}
                  {suggestion.state && `, ${suggestion.state}`}
                  {suggestion.country && `, ${suggestion.country}`}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {layerButtons.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => handleLayerChange(type)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                transition-all duration-200 transform hover:scale-105
                ${activeLayer === type 
                  ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              `}
            >
              {icon}
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex-1 w-full">
        <div ref={mapRef} className="w-full h-full" />
        <Legend type={activeLayer} />
        {popupWeather && (
          <WeatherPopup
            weather={popupWeather}
            onClose={handleClosePopup}
            position={popupPosition}
          />
        )}
      </div>
    </div>
  );
}

export default Map;
