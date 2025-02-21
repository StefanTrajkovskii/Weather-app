import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { FiSearch } from 'react-icons/fi';
import { getCitySuggestions } from '../services/weatherApi';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

function Map() {
  const mapRef = useRef();
  const mapInstanceRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('default');
  const weatherLayersRef = useRef({});
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
        return new TileLayer({
          source: new XYZ({
            url: `https://tile.openweathermap.org/map/${type}/{z}/{x}/{y}.png?appid=${API_KEY}`,
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

      const temperatureLayer = createWeatherLayer('temp_new');
      const precipitationLayer = createWeatherLayer('precipitation_new');
      const windLayer = createWeatherLayer('wind_new');

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
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleLayerChange = (layerType) => {
    Object.values(weatherLayersRef.current).forEach(layer => {
      layer.setVisible(false);
    });

    if (layerType !== 'default') {
      weatherLayersRef.current[layerType].setVisible(true);
    }

    setActiveLayer(layerType);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="flex flex-col gap-4 p-4 bg-gray-800">
        {/* Search Bar */}
        <div className="relative w-full max-w-md mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a city..."
              className="w-full px-4 py-2 pl-10 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FiSearch className="absolute left-3 text-gray-400" size={20} />
          </div>
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 focus:outline-none"
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

        {/* Layer Controls */}
        <div className="flex justify-center gap-4">
          <button 
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              activeLayer === 'default' ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={() => handleLayerChange('default')}
          >
            Default
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              activeLayer === 'temperature' ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={() => handleLayerChange('temperature')}
          >
            Temperature
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              activeLayer === 'precipitation' ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={() => handleLayerChange('precipitation')}
          >
            Precipitation
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              activeLayer === 'wind' ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={() => handleLayerChange('wind')}
          >
            Wind
          </button>
        </div>
      </div>
      <div 
        ref={mapRef} 
        className="flex-1 w-full"
      />
    </div>
  );
}

export default Map;
