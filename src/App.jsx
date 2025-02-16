import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { WiDaySunny, WiDayCloudyGusts, WiWindBeaufort7 } from 'react-icons/wi';
import Weather from './pages/Weather.jsx';
import Cities from './pages/Cities.jsx';
import Map from './pages/Map.jsx';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-900">
        {/* Sidebar */}
        <nav className="w-20 bg-gray-800 p-4 flex flex-col items-center">
          <div className="mb-8">
            <WiDaySunny className="text-3xl text-blue-500" />
          </div>
          <div className="flex flex-col gap-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-gray-700'
                }`
              }
            >
              <WiDaySunny className="text-2xl" />
            </NavLink>
            <NavLink
              to="/cities"
              className={({ isActive }) =>
                `p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-gray-700'
                }`
              }
            >
              <WiDayCloudyGusts className="text-2xl" />
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-gray-700'
                }`
              }
            >
              <WiWindBeaufort7 className="text-2xl" />
            </NavLink>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Weather />} />
            <Route path="/cities" element={<Cities />} />
            <Route path="/map" element={<Map />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
