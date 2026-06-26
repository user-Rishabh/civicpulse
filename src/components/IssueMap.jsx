import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MUMBAI_COORDS = [
  [19.0760, 72.8777], [19.0596, 72.8295], [19.1136, 72.8697],
  [19.0178, 72.8478], [19.0330, 72.8397], [19.1075, 72.8263],
  [18.9548, 72.8204], [19.0882, 72.9331], [19.2183, 72.9781],
  [19.1663, 72.9961]
];

function getSeverityColor(severity) {
  const colors = { Critical: '#EF4444', High: '#F97316', Medium: '#F59E0B', Low: '#10B981' };
  return colors[severity] || '#3B82F6';
}

function createIcon(severity) {
  const color = getSeverityColor(severity);
  return L.divIcon({
    html: `<div style="width:20px;height:20px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    className: ''
  });
}

export default function IssueMap({ issues = [], height = '450px' }) {
  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden border border-[#374151]">
      <MapContainer
        center={[19.0760, 72.8777]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        {issues.map((issue, index) => {
          const coords = MUMBAI_COORDS[index % MUMBAI_COORDS.length];
          return (
            <Marker
              key={issue.id}
              position={coords}
              icon={createIcon(issue.severity)}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <div style={{ display:'flex', gap:'6px', marginBottom:'8px' }}>
                    <span style={{ background:'#3B82F6', color:'white', padding:'2px 8px', borderRadius:'999px', fontSize:'11px', fontWeight:'bold' }}>
                      {issue.category}
                    </span>
                    <span style={{ background: getSeverityColor(issue.severity) + '33', color: getSeverityColor(issue.severity), padding:'2px 8px', borderRadius:'999px', fontSize:'11px', fontWeight:'bold' }}>
                      {issue.severity}
                    </span>
                  </div>
                  <p style={{ fontSize:'12px', color:'#374151', margin:'4px 0' }}>
                    {issue.description?.slice(0, 100)}...
                  </p>
                  <p style={{ fontSize:'11px', color:'#6B7280', margin:'4px 0' }}>
                    📍 {issue.location}
                  </p>
                  <p style={{ fontSize:'11px', color:'#6B7280' }}>
                    Status: <strong>{issue.status}</strong>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
