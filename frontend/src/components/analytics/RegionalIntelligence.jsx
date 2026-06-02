import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, AlertTriangle } from 'lucide-react';

// Fix Leaflet's default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RegionalIntelligence = ({ location, assessment }) => {
  if (!location || !location.lat || !location.lng) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-dark-text-muted bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <MapPin className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Regional mapping data unavailable</p>
      </div>
    );
  }

  const position = [location.lat, location.lng];
  const isHighRisk = assessment?.adulterationRisk?.detected;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-800 relative bg-gray-900">
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Risk Radius */}
        <Circle 
          center={position} 
          pathOptions={{ 
            fillColor: isHighRisk ? '#ef4444' : '#10b981', 
            color: isHighRisk ? '#ef4444' : '#10b981', 
            fillOpacity: 0.2,
            weight: 1
          }} 
          radius={2000} 
        />

        <Marker position={position}>
          <Popup className="custom-popup">
            <div className="bg-gray-900 text-white p-1 rounded-md">
              <h4 className="font-bold text-sm mb-1">{location.district}, {location.state}</h4>
              <p className="text-xs text-gray-400 mb-2">Telemetry Node location</p>
              
              <div className="flex items-center gap-2 text-xs font-mono">
                {isHighRisk ? (
                   <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> High Risk Zone</span>
                ) : (
                   <span className="text-green-400 flex items-center gap-1">Safe Zone</span>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Overlay Status */}
      <div className="absolute bottom-4 left-4 right-4 z-[400] pointer-events-none">
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 p-3 rounded-xl shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isHighRisk ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <div>
              <p className="text-xs font-bold text-white tracking-wide uppercase">Node: {location.district}</p>
              <p className="text-[10px] text-gray-400">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalIntelligence;
