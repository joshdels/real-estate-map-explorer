import type { Coordinate, MediaKind, PropertyMedia } from '@/lib/types';

export const config = Object.freeze({
  title: 'Real Estate Map Explorer', center: [6.9552, 126.2165] as Coordinate, zoom: 14, maxZoom: 22, maxNativeZoom: 18,
  tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Imagery &copy; Esri',
  // Transparent reference overlay drawn on top of the imagery: roads and road names only.
  roadsUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
});

export interface MediaAction { icon: string; label: string; type: 'media' | 'layout' | 'route'; key?: keyof PropertyMedia; mediaType?: MediaKind }
export const mediaActions: readonly MediaAction[] = Object.freeze([
  { icon: 'cube-focus', label: '360 View', type: 'media', key: 'panoramaUrl', mediaType: 'panorama' },
  { icon: 'polygon', label: 'Lot Layout', type: 'layout' },
  { icon: 'drone', label: 'Drone Aerial', type: 'media', key: 'aerialVideoUrl', mediaType: 'video' },
  { icon: 'person-simple-walk', label: 'Walkthrough', type: 'media', key: 'walkthroughVideoUrl', mediaType: 'video' },
  { icon: 'images', label: 'Photos', type: 'media', key: 'images', mediaType: 'gallery' },
  { icon: 'path', label: 'Routes', type: 'route' },
]);
