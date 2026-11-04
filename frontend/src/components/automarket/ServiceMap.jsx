import React from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { COUNTY_COORDS } from '@/lib/countyCoords';

// Map of Ireland with one numbered pin per county that has businesses; the number is how many match the current filters.
// Clicking a pin filters the list to that county (click it again to clear). The map pictures come from OpenStreetMap, so this
// component is only loaded once a visitor clicks "Show map" (see ServiceDirectory.jsx).
const pin = (n, selected) => L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  html: `<div class="w-[34px] h-[34px] rounded-full ${selected ? 'bg-orange-500' : 'bg-primary'} text-white text-sm font-bold flex items-center justify-center border-2 border-white shadow-md">${n}</div>`,
});

export default function ServiceMap({ counts, county, onPick }) {
  return (
    <div className="h-72 lg:h-[26rem] w-full rounded-lg overflow-hidden border border-border">
      <MapContainer center={[53.4, -7.7]} zoom={7} minZoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
        {Object.entries(counts).filter(([c, n]) => n > 0 && COUNTY_COORDS[c]).map(([c, n]) => (
          <Marker
            key={`${c}-${n}-${c === county}`}
            position={COUNTY_COORDS[c]}
            icon={pin(n, c === county)}
            eventHandlers={{ click: () => onPick(c === county ? '' : c) }}>
            <Tooltip direction="top" offset={[0, -16]}>{c}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
