const STORAGE_KEY = 'real-estate-map-explorer.data.v5';

export class PropertyStore {
  static async create(seedUrl = './data/data.json') {
    const response = await fetch(seedUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Sample data could not be loaded (${response.status})`);
    const seed = await response.json();
    validateDataset(seed);
    return new PropertyStore(seed);
  }

  constructor(seed) { this.seed = structuredClone(seed); this.data = this.#load(); }
  snapshot() { return structuredClone(this.data); }
  addProperty(property) { this.data.properties.push(property); this.#save(); }
  removeProperty(id) { this.data.properties = this.data.properties.filter((item) => item.id !== id); this.data.routes = this.data.routes.filter((item) => item.propertyId !== id); this.#save(); }
  saveUtilities(utilities) { this.data.utilities = utilities; this.#save(); }
  addDestination(destination) { this.data.destinations.push(destination); this.#save(); }
  removeDestination(id) { this.data.destinations = this.data.destinations.filter((item) => item.id !== id); this.data.routes = this.data.routes.filter((item) => item.destinationId !== id); this.#save(); }
  addRoute(route) { if (!this.data.routes.some((item) => item.propertyId === route.propertyId && item.destinationId === route.destinationId)) this.data.routes.push(route); this.#save(); }
  removeRoute(id) { this.data.routes = this.data.routes.filter((item) => item.id !== id); this.#save(); }
  reset() { this.data = structuredClone(this.seed); this.#save(); }
  #save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); }
  #load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      validateDataset(parsed);
      return parsed;
    } catch (error) {
      if (localStorage.getItem(STORAGE_KEY)) console.warn('Saved property data was invalid; using data/data.json.', error);
      return structuredClone(this.seed);
    }
  }
}

function validateDataset(data) {
  if (!data || !Array.isArray(data.properties) || !Array.isArray(data.destinations) || !Array.isArray(data.routes) || !data.utilities) throw new TypeError('Dataset must contain properties, utilities, destinations, and routes.');
  data.properties.forEach((property) => {
    if (!property.id || !property.title || !validPoint(property.coordinates) || !Array.isArray(property.polygon) || property.polygon.length < 3 || !property.polygon.every(validPoint)) throw new TypeError(`Invalid property record: ${property?.id || 'unknown'}`);
  });
  data.destinations.forEach((destination) => { if (!destination.id || !destination.name || !validPoint(destination.coordinates)) throw new TypeError(`Invalid destination record: ${destination?.id || 'unknown'}`); });
}

function validPoint(point) { return Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) && Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180; }
