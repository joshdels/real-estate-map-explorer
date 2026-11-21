import * as maplibregl from "maplibre-gl";
import type {
  GeoJSONSource,
  LngLatBoundsLike,
  MapMouseEvent,
  StyleSpecification,
} from "maplibre-gl";
import type { Feature, FeatureCollection } from "geojson";
import { config } from "@/explorer/config";
import { phosphorIcon } from "@/explorer/dom";
import { formatCompactPrice, formatCompactPriceRange, formatPrice } from "@/lib/listings";
import type { ListingBounds } from "@/lib/listings";
import type { Coordinate, Dataset, DestinationType, Property } from "@/lib/types";

const SOURCE_IDS = {
  selection: "property-selection",
  routes: "property-routes",
  draft: "boundary-draft",
  area: "admin-area",
  lots: "lots",
} as const;

// Lots group into one bubble up to this zoom; zoom past it and every lot pin
// shows on its own. Keep it low enough that street-level views are never
// clustered.
const CLUSTER_MAX_ZOOM = 11;

maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

export class MapController {
  private readonly map: maplibregl.Map;
  private readonly readyPromise: Promise<void>;
  private readonly markers = new Map<string, maplibregl.Marker>();
  // Clustered lot markers: bubbles reused by cluster id, and the composite-keyed
  // set of markers (lot pins and cluster bubbles) currently on the map.
  private readonly clusterMarkers = new Map<number, maplibregl.Marker>();
  private markersOnScreen = new Map<string, maplibregl.Marker>();
  private activePopup?: maplibregl.Popup;
  private readonly destinationMarkers: maplibregl.Marker[] = [];
  private readonly measurementMarkers: maplibregl.Marker[] = [];
  private data!: Dataset;
  private selectedProperty?: Property;
  private peekedId?: string;
  private mapClickHandler?: (point: Coordinate) => void;
  private routePropertyId?: string;
  private measurementPropertyId?: string;
  private loaded = false;
  private areaFeature?: Feature;

  constructor() {
    this.map = new maplibregl.Map({
      container: "map",
      style: satelliteStyle(),
      center: toLngLat(config.center),
      zoom: config.zoom,
      minZoom: 3,
      maxZoom: config.maxZoom,
      attributionControl: false,
      fadeDuration: 0,
    });
    this.map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    this.readyPromise = new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallback);
        resolve();
      };
      const fallback = window.setTimeout(finish, 8_000);
      this.map.once("idle", finish);
    });
    this.map.on("load", () => {
      this.loaded = true;
      this.observeContainerSize();
      this.addOverlaySources();
      this.syncSelection();
      this.syncArea();
      // If data arrived before the style loaded, re-feed the lot source now.
      if (this.data) this.render(this.data);
    });
    this.map.on("click", (event: MapMouseEvent) =>
      this.mapClickHandler?.([event.lngLat.lat, event.lngLat.lng]),
    );
  }

  /** Resolves after the base map has finished its first render and tile requests. */
  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  invalidateSize(): void {
    // The map is hidden in list view; recompute dimensions when it reappears.
    requestAnimationFrame(() => this.map.resize());
  }

  // MapLibre only tracks window resizes, so container size changes that are not
  // tied to the window (panel width breakpoints, the header, list/map toggles)
  // leave the canvas the old size and expose blank tile gaps at the edges.
  // A ResizeObserver resizes the map whenever its own box changes.
  private observeContainerSize(): void {
    if (typeof ResizeObserver === "undefined") return;
    const container = this.map.getContainer();
    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        this.map.resize();
      });
    });
    observer.observe(container);
  }

  onViewportChange(handler: () => void): void {
    this.map.on("moveend", handler);
  }

  viewportBounds(): ListingBounds {
    const bounds = this.map.getBounds();
    return {
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    };
  }

  render(data: Dataset): void {
    this.data = data;
    this.activePopup?.remove();
    this.activePopup = undefined;
    this.clearPropertyMarkers();
    this.hideMeasurements();
    this.hideRoutes();
    data.properties.forEach((property) => {
      const element = lotMarker(property);
      const content = lotPopup(property);
      const popup = new maplibregl.Popup({
        anchor: "bottom",
        closeButton: true,
        closeOnClick: false,
        maxWidth: "320px",
        offset: 18,
      }).setDOMContent(content);
      let closeTimer: number | undefined;
      const cancelClose = () => window.clearTimeout(closeTimer);
      const closePreview = () => {
        closeTimer = window.setTimeout(() => {
          if (this.activePopup === popup) {
            popup.remove();
            this.clearSelection();
          }
        }, 180);
      };
      const showPreview = () => {
        cancelClose();
        if (this.mapClickHandler) return;
        if (this.activePopup && this.activePopup !== popup) {
          this.activePopup.remove();
        }
        this.activePopup = popup;
        this.highlight(property);
        if (!popup.isOpen()) {
          popup.setLngLat(toLngLat(property.coordinates)).addTo(this.map);
        }
      };
      element.addEventListener("pointerenter", showPreview);
      element.addEventListener("pointerleave", closePreview);
      element.addEventListener("focus", showPreview);
      element.addEventListener("blur", closePreview);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        if (this.mapClickHandler) {
          return;
        }
        showPreview();
      });
      element.addEventListener("keypress", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopImmediatePropagation();
          showPreview();
        }
      });
      content.addEventListener("pointerenter", cancelClose);
      content.addEventListener("pointerleave", closePreview);
      // Built but not added here: updateClusters() adds each pin only when it is
      // not swallowed by a cluster at the current zoom.
      const marker = new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat(toLngLat(property.coordinates))
        .setPopup(popup);
      popup.on("close", () => {
        if (this.activePopup === popup) this.activePopup = undefined;
      });
      this.markers.set(property.id, marker);
    });

    // Feed the lot points into the cluster source; the render handler turns the
    // result into bubbles and pins.
    this.setSourceData(
      SOURCE_IDS.lots,
      featureCollection(
        data.properties.map((property) => ({
          type: "Feature",
          properties: { id: property.id, price: property.price },
          geometry: { type: "Point", coordinates: toLngLat(property.coordinates) },
        })),
      ),
    );
    this.updateClusters();
  }

  // Sync lot markers to the cluster source: grouped lots show a numbered bubble,
  // single lots show their pin, and bubbles zoom in to split on click.
  private updateClusters(): void {
    if (!this.loaded) return;
    const src = this.map.getSource(SOURCE_IDS.lots) as GeoJSONSource | undefined;
    if (!src || !this.map.isSourceLoaded(SOURCE_IDS.lots)) return;
    const next = new Map<string, maplibregl.Marker>();
    for (const feature of this.map.querySourceFeatures(SOURCE_IDS.lots)) {
      if (feature.geometry.type !== "Point") continue;
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const props = feature.properties as Record<string, unknown>;

      if (props.cluster) {
        const clusterId = props.cluster_id as number;
        const count = props.point_count as number;
        const minPrice = Number(props.minPrice);
        const maxPrice = Number(props.maxPrice);
        const key = `c${clusterId}`;
        let marker = this.clusterMarkers.get(clusterId);
        if (!marker) {
          const element = lotClusterMarker(count, minPrice, maxPrice);
          element.addEventListener("click", () => {
            src
              .getClusterExpansionZoom(clusterId)
              .then((zoom) =>
                this.map.easeTo({
                  center: [lng, lat],
                  zoom: zoom ?? this.map.getZoom() + 2,
                  duration: reducedMotion() ? 0 : 500,
                }),
              )
              .catch(() => undefined);
          });
          marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat([lng, lat]);
          this.clusterMarkers.set(clusterId, marker);
        } else {
          const root = marker.getElement();
          const label = root.querySelector(".lot-cluster-count");
          if (label) label.textContent = String(count);
          const range = root.querySelector(".lot-cluster-range");
          if (range && Number.isFinite(minPrice) && Number.isFinite(maxPrice)) {
            range.textContent = formatCompactPriceRange(minPrice, maxPrice);
          }
        }
        next.set(key, marker);
        if (!this.markersOnScreen.has(key)) marker.addTo(this.map);
      } else {
        const id = String(props.id);
        const key = `p${id}`;
        const marker = this.markers.get(id);
        if (!marker) continue;
        next.set(key, marker);
        if (!this.markersOnScreen.has(key)) marker.addTo(this.map);
      }
    }
    for (const [key, marker] of this.markersOnScreen) {
      if (!next.has(key)) marker.remove();
    }
    this.markersOnScreen = next;
  }

  focus(property: Property): void {
    this.highlight(property);
    this.map.fitBounds(coordinateBounds(property.polygon), {
      padding:
        innerWidth > 900
          ? { top: 60, right: 60, bottom: 60, left: 60 }
          : { top: 30, right: 30, bottom: 260, left: 30 },
      maxZoom: 18,
      duration: reducedMotion() ? 0 : 700,
    });
  }

  openPreview(property: Property): void {
    this.focus(property);
    const marker = this.markers.get(property.id);
    const popup = marker?.getPopup();
    if (!marker || !popup) return;
    // The pin may be inside a cluster; ensure it is on the map before its popup.
    const key = `p${property.id}`;
    if (!this.markersOnScreen.has(key)) {
      marker.addTo(this.map);
      this.markersOnScreen.set(key, marker);
    }
    if (this.activePopup && this.activePopup !== popup) this.activePopup.remove();
    this.activePopup = popup;
    if (!popup.isOpen()) popup.addTo(this.map);
  }

  // Hover highlight driven by the side list. Marks a marker without selecting
  // it, so moving the pointer over a card makes its map pin stand out. Pass null
  // to clear.
  peek(propertyId: string | null): void {
    const next = propertyId ?? undefined;
    if (this.peekedId === next) return;
    if (this.peekedId)
      this.markers.get(this.peekedId)?.getElement().classList.remove("lot-label-peek");
    this.peekedId = next;
    if (this.peekedId)
      this.markers.get(this.peekedId)?.getElement().classList.add("lot-label-peek");
  }

  private highlight(property: Property): void {
    this.clearSelection();
    this.selectedProperty = property;
    this.markers
      .get(property.id)
      ?.getElement()
      .classList.add("lot-label-selected");
    this.syncSelection();
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
            ? { top: 80, right: 80, bottom: 80, left: 80 }
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

  /** Frame an arbitrary bounding box ([west, south, east, north]), e.g. the whole country. */
  frameBounds(bbox: [number, number, number, number]): void {
    this.map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      {
        padding: innerWidth > 900 ? 48 : 24,
        duration: reducedMotion() ? 0 : 700,
      },
    );
  }

  /**
   * Outlines the selected PSA/NAMRIA administrative area and frames it.
   * Pass no feature to remove the outline. `bbox` is [west, south, east, north].
   */
  showArea(feature?: Feature, bbox?: [number, number, number, number]): void {
    this.areaFeature = feature;
    this.syncArea();
    if (bbox)
      this.map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        // Roomier, slightly larger padding on the right where the controls sit,
        // so the region outline is framed with breathing room on every side.
        {
          padding: { top: 48, bottom: 48, left: 48, right: 64 },
          maxZoom: 13,
          duration: reducedMotion() ? 0 : 700,
        },
      );
  }

  private syncArea(): void {
    this.setSourceData(
      SOURCE_IDS.area,
      featureCollection(this.areaFeature ? [this.areaFeature] : []),
    );
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
    this.map.addSource(SOURCE_IDS.area, geoJsonSource());
    this.map.addLayer({
      id: "admin-area-fill",
      type: "fill",
      source: SOURCE_IDS.area,
      paint: { "fill-color": "#8b5cf6", "fill-opacity": 0.1 },
    });
    this.map.addLayer({
      id: "admin-area-line",
      type: "line",
      source: SOURCE_IDS.area,
      paint: { "line-color": "#ffffff", "line-width": 2, "line-dasharray": [3, 2] },
    });
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

    // Cluster source for the lot pins. Groups break apart above CLUSTER_MAX_ZOOM
    // so close-in views always show individual lots. The HTML markers are the
    // visible marks; this invisible probe layer just keeps the source queryable.
    this.map.addSource(SOURCE_IDS.lots, {
      type: "geojson",
      data: featureCollection([]),
      cluster: true,
      clusterRadius: 60,
      clusterMaxZoom: CLUSTER_MAX_ZOOM,
      clusterProperties: {
        minPrice: ["min", ["get", "price"]],
        maxPrice: ["max", ["get", "price"]],
      },
    });
    this.map.addLayer({
      id: "lots-probe",
      type: "circle",
      source: SOURCE_IDS.lots,
      paint: { "circle-radius": 0, "circle-opacity": 0 },
    });
    this.map.on("render", () => this.updateClusters());
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
    this.clusterMarkers.forEach((marker) => marker.remove());
    this.clusterMarkers.clear();
    this.markersOnScreen.clear();
    this.peekedId = undefined;
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
      roads: {
        type: "raster",
        tiles: [config.roadsUrl],
        tileSize: 256,
        attribution: config.attribution,
      },
    },
    layers: [
      { id: "satellite", type: "raster", source: "satellite" },
      { id: "roads", type: "raster", source: "roads", paint: { "raster-fade-duration": 0 } },
    ],
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

function lotClusterMarker(count: number, minPrice: number, maxPrice: number): HTMLButtonElement {
  const hasRange = Number.isFinite(minPrice) && Number.isFinite(maxPrice);
  const rangeText = hasRange ? formatCompactPriceRange(minPrice, maxPrice) : "";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "lot-cluster";
  button.setAttribute(
    "aria-label",
    `${count} lots here${rangeText ? `, ${rangeText}` : ""}. Zoom in to separate them.`,
  );

  const bubble = document.createElement("span");
  bubble.className = "lot-cluster-bubble";
  const size = count < 10 ? 50 : count < 50 ? 58 : 66;
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  const value = document.createElement("span");
  value.className = "lot-cluster-count";
  value.textContent = String(count);
  const label = document.createElement("span");
  label.className = "lot-cluster-label";
  label.textContent = count === 1 ? "lot" : "lots";
  bubble.append(value, label);
  button.append(bubble);

  if (rangeText) {
    const range = document.createElement("span");
    range.className = "lot-cluster-range";
    range.textContent = rangeText;
    button.append(range);
  }
  return button;
}

function lotMarker(property: Property): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "lot-label";
  button.title = `${formatPrice(property)}, ${property.title}`;
  button.setAttribute(
    "aria-label",
    `Preview ${property.title}, ${formatPrice(property)}`,
  );
  const summary = document.createElement("span");
  summary.className = "lot-label-summary";
  const price = document.createElement("span");
  price.className = "lot-label-fact lot-label-price";
  price.textContent = formatCompactPrice(property);
  summary.append(price);
  button.append(summary);
  return button;
}

function lotPopup(property: Property): HTMLElement {
  const card = document.createElement("article");
  card.className = "lot-popup";

  // Always show a lot image. Fall back to the shared aerial plan when a listing
  // has no media of its own, so every popup reads as a card like the list view.
  const images = property.media?.images?.filter(Boolean) ?? [];
  const figure = document.createElement("div");
  figure.className = "lot-popup-media";
  const image = document.createElement("img");
  image.className = "lot-popup-image";
  image.src = images[0] ?? "/images/sample-aerial-lot-plan.webp";
  image.alt = "";
  image.loading = "lazy";
  const status = document.createElement("span");
  status.className = "lot-popup-tag";
  status.textContent = property.status;
  figure.append(image, status);
  card.append(figure);

  const body = document.createElement("div");
  body.className = "lot-popup-body";
  const price = document.createElement("strong");
  price.className = "lot-popup-price";
  price.textContent = formatPrice(property);
  const title = document.createElement("h2");
  title.textContent = property.title;
  const address = document.createElement("p");
  address.className = "lot-popup-address";
  address.textContent = property.address;
  const facts = document.createElement("p");
  facts.className = "lot-popup-facts";
  facts.textContent = property.area;
  const link = document.createElement("a");
  link.className = "lot-popup-link";
  link.href = `/property/${encodeURIComponent(property.id)}`;
  link.append(document.createTextNode("View lot"), phosphorIcon("arrow-right"));
  body.append(price, title, address, facts, link);
  card.append(body);
  return card;
}

function destinationMarker(type: DestinationType, name: string): HTMLElement {
  const icons: Record<DestinationType, string> = {
    school: "graduation-cap",
    bank: "bank",
    store: "storefront",
    landmark: "map-pin",
  };
  const element = phosphorIcon(icons[type], "destination-icon");
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
