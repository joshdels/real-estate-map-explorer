import type { Coordinate, MediaKind, PropertyMedia } from './types';

export const config = Object.freeze({
  title: 'Real Estate Map Explorer', center: [6.9552, 126.2165] as Coordinate, zoom: 14, maxZoom: 22, maxNativeZoom: 18,
  tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Imagery &copy; Esri',
});

export interface MediaAction { icon: string; label: string; type: 'media' | 'layout' | 'route'; key?: keyof PropertyMedia; mediaType?: MediaKind }
export const mediaActions: readonly MediaAction[] = Object.freeze([
  { icon: '360°', label: '360 View', type: 'media', key: 'panoramaUrl', mediaType: 'panorama' },
  { icon: '⌞', label: 'Lot Layout', type: 'layout' },
  { icon: '◉', label: 'Drone Aerial', type: 'media', key: 'aerialVideoUrl', mediaType: 'video' },
  { icon: '↟', label: 'Walkthrough', type: 'media', key: 'walkthroughVideoUrl', mediaType: 'video' },
  { icon: '▧', label: 'Photos', type: 'media', key: 'images', mediaType: 'gallery' },
  { icon: '⌖', label: 'Routes', type: 'route' },
]);
