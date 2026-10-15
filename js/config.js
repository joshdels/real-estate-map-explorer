export const config = Object.freeze({
  title: 'Real Estate Map Explorer',
  center: [6.9552, 126.2165],
  zoom: 14,
  maxZoom: 22,
  // Esri level 19 returns "Map data not yet available" around this area.
  // Leaflet enlarges the valid level-18 imagery for closer zoom levels.
  maxNativeZoom: 18,
  tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Imagery &copy; Esri',
});

export const mediaActions = Object.freeze([
  { icon: '360°', label: '360 View', type: 'media', key: 'panoramaUrl', mediaType: 'panorama' },
  { icon: '⌞', label: 'Lot Layout', type: 'layout' },
  { icon: '◉', label: 'Drone Aerial', type: 'media', key: 'aerialVideoUrl', mediaType: 'video' },
  { icon: '↟', label: 'Walkthrough', type: 'media', key: 'walkthroughVideoUrl', mediaType: 'video' },
  { icon: '⌖', label: 'Routes', type: 'route' },
]);
