'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapBusiness {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  category?: string;
  avg_rating?: number;
  review_count?: number;
  short_desc_zh?: string;
  website_url?: string;
}

// NYC Flushing center as default
const NYC_CENTER: [number, number] = [40.7590, -73.8303];
const DEFAULT_ZOOM = 13;

interface Props {
  businesses: MapBusiness[];
  height?: string;
}

export default function BusinessMapView({ businesses, height = '400px' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [selectedBiz, setSelectedBiz] = useState<MapBusiness | null>(null);

  // Create numbered pin icon
  function createPinIcon(rank: number, isTop: boolean, isActive: boolean) {
    const size = isActive ? 30 : 24;
    const fontSize = isActive ? 12 : 10;
    const bg = isTop ? '#DC2626' : '#F97316';
    const border = isActive ? '2.5px solid #F97316' : '2px solid white';
    const shadow = isActive ? '0 2px 8px rgba(249,115,22,0.4)' : '0 1px 4px rgba(0,0,0,0.2)';

    return L.divIcon({
      className: 'baam-pin',
      html: `<div style="
        width: ${size}px; height: ${size}px;
        background: ${bg}; border: ${border};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: ${shadow}; cursor: pointer;
      "><span style="color: white; font-size: ${fontSize}px; font-weight: 800;">${rank}</span></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 4)],
    });
  }

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: NYC_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Mapbox tiles with fallback to CARTO
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (mapboxToken) {
      L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=' + mapboxToken, {
        attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        tileSize: 512, zoomOffset: -1, maxZoom: 20,
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd', maxZoom: 20,
      }).addTo(map);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when businesses change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    if (businesses.length === 0) return;

    const bounds = L.latLngBounds([]);

    businesses.forEach((biz, i) => {
      const isActive = selectedBiz?.id === biz.id;
      const icon = createPinIcon(i + 1, i < 3, isActive);
      const marker = L.marker([biz.latitude, biz.longitude], { icon }).addTo(map);

      bounds.extend([biz.latitude, biz.longitude]);
      markersRef.current.set(biz.id, marker);

      marker.on('click', () => {
        setSelectedBiz(biz);
      });
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [businesses, selectedBiz]);

  return (
    <div className="relative" style={{ height: height === '100%' ? '100%' : undefined }}>
      <style>{`
        .baam-pin { background: transparent !important; border: none !important; }
        .leaflet-control-zoom a { width: 34px !important; height: 34px !important; line-height: 34px !important; font-size: 18px !important; border-radius: 8px !important; }
        .leaflet-control-zoom { border-radius: 10px !important; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important; }
      `}</style>
      <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-xl overflow-hidden" />

      {/* Selected business card overlay */}
      {selectedBiz && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[1000]">
          <div className="bg-bg-card border border-border rounded-xl shadow-lg p-4">
            <button
              onClick={() => setSelectedBiz(null)}
              className="absolute top-2 right-2 text-text-muted hover:text-text-primary text-lg leading-none"
              aria-label="关闭"
            >
              ×
            </button>
            <Link href={`/businesses/${selectedBiz.slug}`} className="block group">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors pr-6">
                {selectedBiz.name}
              </h3>
              {selectedBiz.avg_rating != null && selectedBiz.avg_rating > 0 && (
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <span className="text-amber-500">{'★'.repeat(Math.round(selectedBiz.avg_rating))}</span>
                  <span className="text-text-secondary font-medium">{selectedBiz.avg_rating}</span>
                  <span className="text-text-muted">({selectedBiz.review_count || 0})</span>
                </div>
              )}
              <div className="mt-2 space-y-0.5 text-xs text-text-secondary">
                {selectedBiz.address && <p>📍 {selectedBiz.address}</p>}
                {selectedBiz.phone && <p>📞 {selectedBiz.phone}</p>}
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
