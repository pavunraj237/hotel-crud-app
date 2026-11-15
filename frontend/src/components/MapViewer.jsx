import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Use the standard Leaflet marker images.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ChangeView = (props) => {
  const center = props.center;
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
};

const MapViewer = (props) => {
  const latitude = props.latitude;
  const longitude = props.longitude;
  const title = props.title;
  const lat = parseFloat(latitude) || 0;
  const lng = parseFloat(longitude) || 0;
  const position = [lat, lng];

  return (
    <div className="map-wrapper" role="region" aria-label={`Location map for ${title}`}>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div style={{ textAlign: 'center', padding: '4px' }}>
              <strong>{title}</strong>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapViewer;
