import * as maplibregl from "maplibre-gl";
import type {
  GeoJSONSource,
  LngLatBoundsLike,
  MapMouseEvent,
  StyleSpecification,
} from "maplibre-gl";
import type { Feature, FeatureCollection } from "geojson";
import { config } from "./config";
import type { Coordinate, Dataset, DestinationType, Property } from "./types";

const SOURCE_IDS = {
  selection: "property-selection",
  routes: "property-routes",
  draft: "boundary-draft",
} as const;

maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

export class MapController {
  private readonly map: maplibregl.Map;
  private readonly markers = new Map<string, maplibregl.Marker>();
  private readonly destinationMarkers: maplibregl.Marker[] = [];
  private readonly measurementMarkers: maplibregl.Marker[] = [];
  private data!: Dataset;
  private selectedProperty?: Property;
  private mapClickHandler?: (point: Coordinate) => void;
  private routePropertyId?: string;
  private measurementPropertyId?: string;
  private loaded = false;

  constructor(
    private readonly onPropertySelect: (
      property: Property,
      trigger?: HTMLElement,
    ) => void,
  ) {
    this.map = new maplibregl.Map({
      container: "map",
      style: satelliteStyle(),
      center: toLngLat(config.center),
      zoom: config.zoom,
      minZoom: 3,
      maxZoom: config.maxZoom,
      attributionControl: false,
    });
    this.map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    this.map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    this.map.on("load", () => {
      this.loaded = true;
      this.addOverlaySources();
      this.syncSelection();
    });
    this.map.on("click", (event: MapMouseEvent) =>
      this.mapClickHandler?.([event.lngLat.lat, event.lngLat.lng]),
    );
  }

  invalidateSize(): void {
    // The map is hidden in list view; recompute dimensions when it reappears.
    requestAnimationFrame(() => this.map.resize());
  }

  render(data: Dataset): void {
    this.data = data;
    this.clearPropertyMarkers();
    this.hideMeasurements();
    this.hideRoutes();
    data.properties.forEach((property) => {
      const element = lotMarker(property);
      const select = () => {
        if (!this.mapClickHandler) this.select(property, element);
      };
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        select();
      });
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
      const marker = new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat(toLngLat(property.coordinates))
        .addTo(this.map);
      this.markers.set(property.id, marker);
    });
  }

  focus(property: Property): void {
    this.clearSelection();
    this.selectedProperty = property;
    this.markers
      .get(property.id)
      ?.getElement()
      .classList.add("lot-label-selected");
    this.syncSelection();
    this.map.fitBounds(coordinateBounds(property.polygon), {
      padding:
        innerWidth > 900
          ? { top: 40, right: 470, bottom: 40, left: 60 }
          : { top: 30, right: 30, bottom: 260, left: 30 },
      maxZoom: 18,
      duration: reducedMotion() ? 0 : 700,
    });
  }

  select(property: Property, trigger?: HTMLElement): void {
    this.focus(property);
    this.onPropertySelect(property, trigger);
  }

  clearSelection(): void {
    this.hideMeasurements();
    this.hideRoutes();
    if (this.selectedProperty)
      this.markers
        .get(this.selectedProperty.id)
        ?.getElement()
        .classList.remove("lot-label-selected");
    this.selectedProperty = undefined;
    this.setSourceData(SOURCE_IDS.selection, featureCollection([]));
  }

  showAll(): void {
    this.clearSelection();
    const coords = this.data.properties.map((item) => item.coordinates);
    if (coords.length)
      this.map.fitBounds(coordinateBounds(coords), {
        padding:
          innerWidth > 900
            ? { top: 80, right: 510, bottom: 80, left: 80 }
            : 80,
        maxZoom: config.zoom,
        duration: reducedMotion() ? 0 : 700,
      });
    else
      this.map.easeTo({
        center: toLngLat(config.center),
        zoom: config.zoom,
        duration: reducedMotion() ? 0 : 700,
      });
  }

  setClickMode(
    handler: ((point: Coordinate) => void) | null,
    message?: string,
  ): void {
    this.mapClickHandler = handler ?? undefined;
    this.map.getCanvas().style.cursor = handler ? "crosshair" : "";
    this.hint(message);
  }

  showDraft(points: Coordinate[]): void {
    const features: Feature[] = points.map((point, index) => ({
      type: "Feature",
      properties: { label: String(index + 1) },
      geometry: { type: "Point", coordinates: toLngLat(point) },
    }));
    if (points.length > 1) {
      const line = [...points, ...(points.length > 2 ? [points[0]] : [])];
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: line.map(toLngLat) },
      });
    }
    this.setSourceData(SOURCE_IDS.draft, featureCollection(features));
  }

  clearDraft(): void {
    this.setSourceData(SOURCE_IDS.draft, featureCollection([]));
    this.setClickMode(null);
  }

  toggleRoutes(property: Property): boolean {
    if (this.routePropertyId === property.id) {
      this.hideRoutes();
      return false;
    }
    this.hideRoutes();
    const features: Feature[] = [];
    const points = [property.coordinates];
    this.data.routes
      .filter((route) => route.propertyId === property.id)
      .forEach((route) => {
        const destination = this.data.destinations.find(
          (item) => item.id === route.destinationId,
        );
        if (!destination) return;
        const element = destinationMarker(destination.type, destination.name);
        this.destinationMarkers.push(
          new maplibregl.Marker({ element, anchor: "center" })
            .setLngLat(toLngLat(destination.coordinates))
            .setPopup(
              new maplibregl.Popup({ offset: 22 }).setText(destination.name),
            )
            .addTo(this.map),
        );
        features.push({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [property.coordinates, destination.coordinates].map(
              toLngLat,
            ),
          },
        });
        points.push(destination.coordinates);
      });
    if (!features.length) return false;
    this.setSourceData(SOURCE_IDS.routes, featureCollection(features));
    this.routePropertyId = property.id;
    this.map.fitBounds(coordinateBounds(points), {
      padding: 80,
      maxZoom: 16,
      duration: reducedMotion() ? 0 : 700,
    });
    return true;
  }

  hideRoutes(): void {
    this.destinationMarkers.splice(0).forEach((marker) => marker.remove());
    this.setSourceData(SOURCE_IDS.routes, featureCollection([]));
    this.routePropertyId = undefined;
  }

  toggleMeasurements(property: Property): boolean {
    if (this.measurementPropertyId === property.id) {
      this.hideMeasurements();
      return false;
    }
    this.hideMeasurements();
    this.showPerimeter(property.polygon);
    this.measurementPropertyId = property.id;
    return true;
  }

  hideMeasurements(): void {
    this.measurementMarkers.splice(0).forEach((marker) => marker.remove());
    this.measurementPropertyId = undefined;
  }

  private addOverlaySources(): void {
    this.map.addSource(SOURCE_IDS.selection, geoJsonSource());
    this.map.addLayer({
      id: "property-selection-fill",
      type: "fill",
      source: SOURCE_IDS.selection,
      paint: { "fill-color": "#629aff", "fill-opacity": 0.22 },
    });
    this.map.addLayer({
      id: "property-selection-line",
      type: "line",
      source: SOURCE_IDS.selection,
      paint: { "line-color": "#4d8dff", "line-width": 3 },
    });
    this.map.addSource(SOURCE_IDS.routes, geoJsonSource());
    this.map.addLayer({
      id: "property-routes-line",
      type: "line",
      source: SOURCE_IDS.routes,
      paint: {
        "line-color": "#0ca6d8",
        "line-width": 4,
        "line-dasharray": [2, 1.75],
      },
    });
    this.map.addSource(SOURCE_IDS.draft, geoJsonSource());
    this.map.addLayer({
      id: "boundary-draft-line",
      type: "line",
      source: SOURCE_IDS.draft,
      paint: {
        "line-color": "#5286e6",
        "line-width": 3,
        "line-dasharray": [2.3, 2],
      },
      filter: ["==", ["geometry-type"], "LineString"],
    });
    this.map.addLayer({
      id: "boundary-draft-points",
      type: "circle",
      source: SOURCE_IDS.draft,
      paint: {
        "circle-radius": 7,
        "circle-color": "#5286e6",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
      filter: ["==", ["geometry-type"], "Point"],
    });
  }

  private syncSelection(): void {
    const polygon = this.selectedProperty?.polygon;
    this.setSourceData(
      SOURCE_IDS.selection,
      polygon
        ? featureCollection([
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [[...polygon, polygon[0]].map(toLngLat)],
              },
            },
          ])
        : featureCollection([]),
    );
  }

  private setSourceData(id: string, data: FeatureCollection): void {
    if (!this.loaded) return;
    (this.map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
  }

  private clearPropertyMarkers(): void {
    this.markers.forEach((marker) => marker.remove());
    this.markers.clear();
  }

  private showPerimeter(points: Coordinate[]): void {
    if (points.length < 3 || !this.selectedProperty) return;
    let total = 0;
    points.forEach((point, index) => {
      const next = points[(index + 1) % points.length];
      const distance = geodesicDistance(point, next);
      total += distance;
      const midpoint: Coordinate = [
        (point[0] + next[0]) / 2,
        (point[1] + next[1]) / 2,
      ];
      this.measurementMarkers.push(
        labelMarker(
          midpoint,
          formatDistance(distance),
          "measurement-edge",
          this.map,
        ),
      );
    });
    this.measurementMarkers.push(
      labelMarker(
        boundsCenter(points),
        `Perimeter ${formatDistance(total)}`,
        "measurement-total",
        this.map,
      ),
    );
  }

  private hint(message?: string): void {
    document.querySelector(".map-pin-hint")?.remove();
    if (!message) return;
    const hint = document.createElement("div");
    hint.className = "map-pin-hint";
    hint.textContent = message;
    document.body.append(hint);
  }
}

function satelliteStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      satellite: {
        type: "raster",
        tiles: [config.tileUrl],
        tileSize: 256,
        attribution: config.attribution,
        maxzoom: config.maxNativeZoom,
      },
    },
    layers: [{ id: "satellite", type: "raster", source: "satellite" }],
  };
}

function geoJsonSource(): maplibregl.GeoJSONSourceSpecification {
  return { type: "geojson", data: featureCollection([]) };
}

function featureCollection(
  features: Feature[],
): FeatureCollection {
  return { type: "FeatureCollection", features };
}

function lotMarker(property: Property): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "lot-label";
  button.title = `${property.title}, ${property.status}`;
  button.setAttribute("aria-label", `View ${property.title}, ${property.status}`);
  const span = document.createElement("span");
  span.textContent = property.title;
  button.append(span);
  return button;
}

function destinationMarker(type: DestinationType, name: string): HTMLElement {
  const icons: Record<DestinationType, string> = {
    school: "🏫",
    bank: "🏦",
    store: "🛒",
    landmark: "◆",
  };
  const element = document.createElement("div");
  element.className = "destination-icon";
  element.textContent = icons[type] || "●";
  element.title = name;
  element.setAttribute("aria-label", name);
  return element;
}

function labelMarker(
  point: Coordinate,
  label: string,
  variant: string,
  map: maplibregl.Map,
): maplibregl.Marker {
  const element = document.createElement("div");
  element.className = `measurement-label ${variant}`;
  const span = document.createElement("span");
  span.textContent = label;
  element.append(span);
  return new maplibregl.Marker({ element, anchor: "center" })
    .setLngLat(toLngLat(point))
    .addTo(map);
}

function toLngLat(point: Coordinate): [number, number] {
  return [point[1], point[0]];
}

function coordinateBounds(points: Coordinate[]): LngLatBoundsLike {
  const bounds = new maplibregl.LngLatBounds();
  points.forEach((point) => bounds.extend(toLngLat(point)));
  return bounds;
}

function boundsCenter(points: Coordinate[]): Coordinate {
  const latitudes = points.map(([latitude]) => latitude);
  const longitudes = points.map(([, longitude]) => longitude);
  return [
    (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  ];
}

function geodesicDistance(a: Coordinate, b: Coordinate): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6_371_008.8;
  const latitudeDelta = radians(b[0] - a[0]);
  const longitudeDelta = radians(b[1] - a[1]);
  const latitudeA = radians(a[0]);
  const latitudeB = radians(b[0]);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(2)} km`
    : `${meters.toFixed(1)} m`;
}

function reducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
