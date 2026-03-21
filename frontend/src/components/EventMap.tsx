import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeploymentProfile, ImpactCategory, Coordinates, UrgencyLevel } from '../types';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface EventMapData {
  id: string;
  event_type: ImpactCategory;
  location_coordinates: Coordinates;
  impact_score: number;
  timestamp: string;
  project_name?: string;
  community_name?: string;
  region?: string;
  country?: string;
  households_supported?: number;
  funding_gap_usd?: number;
  cost_per_impact_unit_usd?: number;
  verification_confidence?: number;
  urgency_level?: UrgencyLevel;
  verification_source?: string;
  proof_hash?: string;
  sdg_tags?: string[];
  priority_score?: number;
  location_label?: string;
  sponsor_name?: string;
  verifier_name?: string;
  local_operator_name?: string;
  buyer_signal?: string;
  beneficiary_metric?: string;
  deployment_profile?: DeploymentProfile;
}

interface EventMapProps {
  events: EventMapData[];
}

const EventMap: React.FC<EventMapProps> = ({ events }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const lastEventCountRef = useRef<number>(0);

  // Color mapping for event categories
  const getCategoryColor = (category: ImpactCategory): string => {
    const colors: Record<ImpactCategory, string> = {
      Solar: '#facc15', // yellow-400
      River_Cleanup: '#60a5fa', // blue-400
      Reforestation: '#4ade80', // green-400
      Carbon_Capture: '#9ca3af', // gray-400
    };
    return colors[category];
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map with world view
    const map = L.map(mapContainerRef.current).setView([20, 0], 2);
    mapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const currentMarkers = markersRef.current;

    // Check if new events were added
    const newEventsAdded = events.length > lastEventCountRef.current;
    lastEventCountRef.current = events.length;

    // Remove markers that are no longer in events
    const currentEventIds = new Set(events.map(e => e.id));
    for (const [id, marker] of currentMarkers.entries()) {
      if (!currentEventIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Add or update markers
    events.forEach((event, index) => {
      const isNewEvent = !currentMarkers.has(event.id) && newEventsAdded && index === events.length - 1;
      
      if (!currentMarkers.has(event.id)) {
        const color = getCategoryColor(event.event_type);
        
        // Create custom icon with category color
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 24px;
            height: 24px;
            background-color: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ${isNewEvent ? 'animation: pulse 2s ease-in-out;' : ''}
          "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(
          [event.location_coordinates.latitude, event.location_coordinates.longitude],
          { icon }
        );

        // Add popup with event details
        const popupContent = `
          <div style="font-family: sans-serif; min-width: 150px;">
            <div style="font-weight: bold; margin-bottom: 4px; color: ${color};">
              ${event.project_name || event.event_type.replace('_', ' ')}
            </div>
            <div style="font-size: 12px; color: #666;">
              <div><strong>Category:</strong> ${event.event_type.replace('_', ' ')}</div>
              <div><strong>Impact Score:</strong> ${event.impact_score.toFixed(2)}</div>
              <div><strong>Priority:</strong> ${(event.priority_score ?? 0).toFixed(2)}</div>
              <div><strong>Households:</strong> ${event.households_supported ?? 0}</div>
              <div><strong>Urgency:</strong> ${event.urgency_level || 'stable'}</div>
              <div><strong>Release:</strong> ${event.deployment_profile?.release_readiness || 'hold'}</div>
              <div><strong>Payout:</strong> $${(event.deployment_profile?.payout_recommendation_usd ?? 0).toLocaleString()}</div>
              <div><strong>Time:</strong> ${new Date(event.timestamp).toLocaleTimeString()}</div>
              <div><strong>Location:</strong> ${event.location_coordinates.latitude.toFixed(2)}, ${event.location_coordinates.longitude.toFixed(2)}</div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        
        // Show popup on hover
        marker.on('mouseover', function(this: L.Marker) {
          this.openPopup();
        });
        
        marker.on('mouseout', function(this: L.Marker) {
          this.closePopup();
        });

        marker.addTo(map);
        currentMarkers.set(event.id, marker);
      }
    });
  }, [events]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-lg overflow-hidden" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 text-xs text-slate-200 backdrop-blur">
        <div className="font-semibold uppercase tracking-[0.18em] text-slate-400">Map Legend</div>
        <div className="mt-3 space-y-2">
          {[
            ['Solar', '#facc15'],
            ['River Cleanup', '#60a5fa'],
            ['Reforestation', '#4ade80'],
            ['Carbon Capture', '#9ca3af']
          ].map(([label, swatch]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: swatch }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.7;
          }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
};

export default EventMap;
