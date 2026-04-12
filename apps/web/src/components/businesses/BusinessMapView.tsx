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
}

// Fix Leaflet default icon issue with Next.js bundling
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// NYC Flushing center as default
const NYC_CENTER: [number, number] = [40.7590, -73.8303];
const DEFAULT_ZOOM = 13;

interface Props {
  businesses: MapBusiness[];
}

export default function BusinessMapView({ businesses }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedBiz, setSelectedBiz] = useState<MapBusiness | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: NYC_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

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
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    if (businesses.length === 0) return;

    const bounds = L.latLngBounds([]);

    businesses.forEach((biz) => {
      const marker = L.marker([biz.latitude, biz.longitude], { icon: defaultIcon })
        .addTo(map);

      bounds.extend([biz.latitude, biz.longitude]);

      marker.on('click', () => {
        setSelectedBiz(biz);
      });
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [businesses]);

  function renderStars(rating: number): string {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty);
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[500px] sm:h-[600px] rounded-xl border border-border overflow-hidden z-0" />

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
              {selectedBiz.category && (
                <span className="inline-block mt-1 text-xs bg-border-light text-text-secondary rounded-full px-2 py-0.5">
                  {selectedBiz.category}
                </span>
              )}
              {selectedBiz.avg_rating != null && selectedBiz.avg_rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-500 text-xs">{renderStars(selectedBiz.avg_rating)}</span>
                  <span className="text-xs text-text-secondary">{selectedBiz.avg_rating.toFixed(1)}</span>
                  <span className="text-xs text-text-muted">({selectedBiz.review_count || 0})</span>
                </div>
              )}
              <div className="mt-2 space-y-0.5 text-xs text-text-muted">
                {selectedBiz.address && (
                  <p className="flex items-center gap-1">📍 {selectedBiz.address}</p>
                )}
                {selectedBiz.phone && (
                  <p className="flex items-center gap-1">📞 {selectedBiz.phone}</p>
                )}
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Map legend */}
      <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
        <span>共 {businesses.length} 家商家在地图上</span>
        <span>点击标记查看详情</span>
      </div>
    </div>
  );
}
