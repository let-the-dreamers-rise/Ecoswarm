import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventMap, { EventMapData } from '../components/EventMap';
import type { ImpactCategory } from '../types';
import L from 'leaflet';

// Mock Leaflet
vi.mock('leaflet', () => {
  const mockMarker = {
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    openPopup: vi.fn(),
    closePopup: vi.fn(),
  };

  const mockMap = {
    setView: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  };

  const mockTileLayer = {
    addTo: vi.fn().mockReturnThis(),
  };

  return {
    default: {
      map: vi.fn(() => mockMap),
      tileLayer: vi.fn(() => mockTileLayer),
      marker: vi.fn(() => mockMarker),
      divIcon: vi.fn((options) => options),
      Icon: {
        Default: {
          prototype: {},
          mergeOptions: vi.fn(),
        },
      },
    },
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => mockTileLayer),
    marker: vi.fn(() => mockMarker),
    divIcon: vi.fn((options) => options),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
  };
});

describe('EventMap Component', () => {
  const createMockEvent = (
    id: string,
    event_type: ImpactCategory,
    lat: number,
    lng: number,
    impact_score: number
  ): EventMapData => ({
    id,
    event_type,
    location_coordinates: { latitude: lat, longitude: lng },
    impact_score,
    timestamp: new Date().toISOString(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Marker Display with Correct Colors', () => {
    it('should display Solar event with yellow marker', async () => {
      const events: EventMapData[] = [
        createMockEvent('1', 'Solar', 40.7128, -74.006, 50),
      ];

      render(<EventMap events={events} />);

      await waitFor(() => {
        expect(L.divIcon).toHaveBeenCalled();
        const divIconCall = (L.divIcon as any).mock.calls[0][0];
        expect(divIconCall.html).toContain('#facc15'); // yellow-400
      });
    });

    it('should display River_Cleanup event with blue marker', async () => {
      const events: EventMapData[] = [
        createMockEvent('2', 'River_Cleanup', 51.5074, -0.1278, 45),
      ];

      render(<EventMap events={events} />);

      await waitFor(() => {
        expect(L.divIcon).toHaveBeenCalled();
        const divIconCall = (L.divIcon as any).mock.calls[0][0];
        expect(divIconCall.html).toContain('#60a5fa'); // blue-400
      });
    });

    it('should display Reforestation event with green marker', async () => {
      const events: EventMapData[] = [
        createMockEvent('3', 'Reforestation', 35.6762, 139.6503, 60),
      ];

      render(<EventMap events={events} />);

      await waitFor(() => {
        expect(L.divIcon).toHaveBeenCalled();
        const divIconCall = (L.divIcon as any).mock.calls[0][0];
        expect(divIconCall.html).toContain('#4ade80'); // green-400
      });
    });

    it('should display Carbon_Capture event with gray marker', async () => {
      const events: EventMapData[] = [
        createMockEvent('4', 'Carbon_Capture', -33.8688, 151.2093, 55),
      ];

      render(<EventMap events={events} />);

      await waitFor(() => {
        expect(L.divIcon).toHaveBeenCalled();
        const divIconCall = (L.divIcon as any).mock.calls[0][0];
        expect(divIconCall.html).toContain('#9ca3af'); // gray-400
      });
    });

    it('should display multiple events with correct colors', async () => {
      const events: EventMapData[] = [
        createMockEvent('1', 'Solar', 40.7128, -74.006, 50),
        createMockEvent('2', 'River_Cleanup', 51.5074, -0.1278, 45),
        createMockEvent('3', 'Reforestation', 35.6762, 139.6503, 60),
        createMockEvent('4', 'Carbon_Capture', -33.8688, 151.2093, 55),
      ];

      render(<EventMap events={events} />);

      await waitFor(() => {
        expect(L.divIcon).toHaveBeenCalledTimes(4);
        expect(L.marker).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe('Hover Shows Event Details', () => {
    it('should bind popup with event type, impact score, and timestamp', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z';
      const events: EventMapData[] = [
        {
          id: '1',
          event_type: 'Solar',
          location_coordinates: { latitude: 40.7128, longitude: -74.006 },
          impact_score: 50.5,
          timestamp,
        },
      ];

      render(<EventMap events={events} />);

      await waitFor(() => {
        const mockMarker = (L.marker as any).mock.results[0].value;
        expect(mockMarker.bindPopup).toHaveBeenCalled();
        
        const popupContent = mockMarker.bindPopup.mock.calls[0][0];
        expect(popupContent).toContain('Solar');
        expect(popupContent).toContain('50.50');
        expect(popupContent).toContain('Impact Score');
      });
    });

    it('should show popup on mouseover event', async () => {
      const events: EventMapData[] = [
        createMockEvent('1', 'Solar', 40.7128, -74.006, 50),
      ];

      render(<EventMap events={events} />);

      await waitFor(() => {
        const mockMarker = (L.marker as any).mock.results[0].value;
        expect(mockMarker.on).toHaveBeenCalledWith('mouseover', expect.any(Function));
        expect(mockMarker.on).toHaveBeenCalledWith('mouseout', expect.any(Function));
      });
    });

    it('should include location coordinates in popup', async () => {
      const events: EventMapData[] = [
        createMockEvent('1', 'Reforestation', 35.6762, 139.6503, 60),
      ];

      render(<EventMap events={events} />);

      await waitFor(() => {
        const mockMarker = (L.marker as any).mock.results[0].value;
        const popupContent = mockMarker.bindPopup.mock.calls[0][0];
        expect(popupContent).toContain('35.68');
        expect(popupContent).toContain('139.65');
      });
    });
  });

  describe('Map Updates on New Events', () => {
    it('should update map when new events are received', async () => {
      const initialEvents: EventMapData[] = [
        createMockEvent('1', 'Solar', 40.7128, -74.006, 50),
      ];

      const { rerender } = render(<EventMap events={initialEvents} />);

      await waitFor(() => {
        expect(L.marker).toHaveBeenCalledTimes(1);
      });

      const updatedEvents: EventMapData[] = [
        ...initialEvents,
        createMockEvent('2', 'River_Cleanup', 51.5074, -0.1278, 45),
      ];

      rerender(<EventMap events={updatedEvents} />);

      await waitFor(() => {
        expect(L.marker).toHaveBeenCalledTimes(2);
      });
    });

    it('should animate new markers with pulse effect', async () => {
      const initialEvents: EventMapData[] = [];
      const { rerender } = render(<EventMap events={initialEvents} />);

      const newEvents: EventMapData[] = [
        createMockEvent('1', 'Solar', 40.7128, -74.006, 50),
      ];

      rerender(<EventMap events={newEvents} />);

      await waitFor(() => {
        const divIconCall = (L.divIcon as any).mock.calls[0][0];
        expect(divIconCall.html).toContain('animation: pulse 2s');
      });
    });

    it('should update map within 500ms when new events received', async () => {
      const initialEvents: EventMapData[] = [
        createMockEvent('1', 'Solar', 40.7128, -74.006, 50),
      ];

      const { rerender } = render(<EventMap events={initialEvents} />);

      const startTime = Date.now();
      
      const updatedEvents: EventMapData[] = [
        ...initialEvents,
        createMockEvent('2', 'River_Cleanup', 51.5074, -0.1278, 45),
      ];

      rerender(<EventMap events={updatedEvents} />);

      await waitFor(() => {
        expect(L.marker).toHaveBeenCalledTimes(2);
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(500);
      });
    });

    it('should remove markers that are no longer in events', async () => {
      const initialEvents: EventMapData[] = [
        createMockEvent('1', 'Solar', 40.7128, -74.006, 50),
        createMockEvent('2', 'River_Cleanup', 51.5074, -0.1278, 45),
      ];

      const { rerender } = render(<EventMap events={initialEvents} />);

      await waitFor(() => {
        expect(L.marker).toHaveBeenCalledTimes(2);
      });

      const updatedEvents: EventMapData[] = [
        createMockEvent('1', 'Solar', 40.7128, -74.006, 50),
      ];

      rerender(<EventMap events={updatedEvents} />);

      await waitFor(() => {
        const markers = (L.marker as any).mock.results;
        expect(markers[1].value.remove).toHaveBeenCalled();
      });
    });
  });

  describe('Map Initialization', () => {
    it('should initialize Leaflet map with world view', async () => {
      render(<EventMap events={[]} />);

      await waitFor(() => {
        expect(L.map).toHaveBeenCalled();
        const mockMap = (L.map as any).mock.results[0].value;
        expect(mockMap.setView).toHaveBeenCalledWith([20, 0], 2);
      });
    });

    it('should add tile layer to map', async () => {
      render(<EventMap events={[]} />);

      await waitFor(() => {
        expect(L.tileLayer).toHaveBeenCalledWith(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          expect.objectContaining({
            maxZoom: 19,
          })
        );
      });
    });
  });
});
