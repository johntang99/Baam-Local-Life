'use client';

import dynamic from 'next/dynamic';
import type { MapBusiness } from './BusinessMapView';

const BusinessMapView = dynamic(() => import('./BusinessMapView'), { ssr: false });

export default function BusinessMapWrapper({ businesses, height }: { businesses: MapBusiness[]; height?: string }) {
  return <BusinessMapView businesses={businesses} height={height} />;
}
