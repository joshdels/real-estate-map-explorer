import L, { type LeafletMouseEvent } from "leaflet";
import { config } from "./config";
import type { Coordinate, Dataset, DestinationType, Property } from "./types";

export class MapController {
  private readonly map: L.Map;
  private readonly layers = L.layerGroup();
  private readonly measurements = L.layerGroup();
  private readonly routes = L.layerGroup();
  private readonly destinations = L.layerGroup();
  private readonly draft = L.layerGroup();
  private readonly markers = new Map<string, L.Marker>();
  private data!: Dataset;
  private selectedProperty?: Property;
  private selectedPolygon?: L.Polygon;
  private mapClickHandler?: (point: Coordinate) => void;
  private routePropertyId?: string;
  private measurementPropertyId?: string;

  constructor(
    private readonly onPropertySelect: (
      property: Property,
      trigger?: HTMLElement,
    ) => void,
  ) {
    this.map = L.map("map", {
      zoomControl: true,
      minZoom: 3,
      maxZoom: config.maxZoom,
    }).setView(config.center, config.zoom);
    this.map.attributionControl.setPrefix(false);
    L.tileLayer(config.tileUrl, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom,
    }).addTo(this.map);
    [
      this.layers,
      this.measurements,
      this.routes,
      this.destinations,
      this.draft,
    ].forEach((layer) => layer.addTo(this.map));
    this.map.on("click", (event: LeafletMouseEvent) =>
      this.mapClickHandler?.([event.latlng.lat, event.latlng.lng]),
    );
  }

  render(data: Dataset): void {
    this.data = data;
    this.layers.clearLayers();
    this.hideMeasurements();
    this.hideRoutes();
    this.markers.clear();
    data.properties.forEach((property) => {
      const marker = L.marker(property.coordinates, {
        icon: lotIcon(property),
        title: `${property.title}, ${property.status}`,
        keyboard: true,
      }).addTo(this.layers);
      marker.on("click", (event: LeafletMouseEvent) => {
        if (!this.mapClickHandler)
          this.select(
            property,
            event.originalEvent?.target as HTMLElement | undefined,
          );
      });
      this.markers.set(property.id, marker);
    });
  }

  select(property: Property, trigger?: HTMLElement): void {
    this.clearSelection();
    this.selectedProperty = property;
    this.markers.get(property.id)?.setIcon(lotIcon(property, true));
    this.selectedPolygon = L.polygon(property.polygon, {
      color: "#4d8dff",
      weight: 3,
      fillColor: "#629aff",
      fillOpacity: 0.22,
    }).addTo(this.layers);
    const padding =
      innerWidth > 900
        ? {
            paddingTopLeft: [40, 40] as L.PointTuple,
            paddingBottomRight: [510, 40] as L.PointTuple,
          }
        : {
            paddingTopLeft: [30, 30] as L.PointTuple,
            paddingBottomRight: [30, 260] as L.PointTuple,
          };
    this.map.fitBounds(this.selectedPolygon.getBounds(), {
      ...padding,
      maxZoom: 18,
      animate: !reducedMotion(),
    });
    this.onPropertySelect(property, trigger);
  }

  clearSelection(): void {
    this.selectedPolygon?.remove();
    this.selectedPolygon = undefined;
    this.hideMeasurements();
    this.hideRoutes();
    if (this.selectedProperty)
      this.markers
        .get(this.selectedProperty.id)
        ?.setIcon(lotIcon(this.selectedProperty));
    this.selectedProperty = undefined;
  }
  showAll(): void {
    this.clearSelection();
    const coords = this.data.properties.map((item) => item.coordinates);
    if (coords.length)
      this.map.fitBounds(coords, { padding: [80, 80], maxZoom: config.zoom });
    else this.map.setView(config.center, config.zoom);
  }
  setClickMode(
    handler: ((point: Coordinate) => void) | null,
    message?: string,
  ): void {
    this.mapClickHandler = handler ?? undefined;
    this.map.getContainer().style.cursor = handler ? "crosshair" : "";
    this.hint(message);
  }
  showDraft(points: Coordinate[]): void {
    this.draft.clearLayers();
    points.forEach((point, index) =>
      L.circleMarker(point, {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#5286e6",
        fillOpacity: 1,
      })
        .bindTooltip(String(index + 1), {
          permanent: true,
          direction: "center",
          className: "point-number",
        })
        .addTo(this.draft),
    );
    if (points.length > 1)
      L.polyline([...points, ...(points.length > 2 ? [points[0]] : [])], {
        color: "#5286e6",
        weight: 3,
        dashArray: "7 6",
      }).addTo(this.draft);
  }
  clearDraft(): void {
    this.draft.clearLayers();
    this.setClickMode(null);
  }

  toggleRoutes(property: Property): boolean {
    if (this.routePropertyId === property.id) {
      this.hideRoutes();
      return false;
    }
    this.hideRoutes();
    const bounds = L.latLngBounds([property.coordinates]);
    this.data.routes
      .filter((route) => route.propertyId === property.id)
      .forEach((route) => {
        const destination = this.data.destinations.find(
          (item) => item.id === route.destinationId,
        );
        if (!destination) return;
        L.marker(destination.coordinates, {
          icon: destinationIcon(destination.type),
          title: destination.name,
        })
          .bindTooltip(destination.name)
          .addTo(this.destinations);
        L.polyline([property.coordinates, destination.coordinates], {
          color: "#0ca6d8",
          weight: 4,
          dashArray: "8 7",
        }).addTo(this.routes);
        bounds.extend(destination.coordinates);
      });
    if (!this.routes.getLayers().length) return false;
    this.routePropertyId = property.id;
    this.map.fitBounds(bounds, {
      padding: [80, 80],
      maxZoom: 16,
      animate: !reducedMotion(),
    });
    return true;
  }
  hideRoutes(): void {
    this.routes.clearLayers();
    this.destinations.clearLayers();
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
    this.measurements.clearLayers();
    this.measurementPropertyId = undefined;
  }

  private showPerimeter(points: Coordinate[]): void {
    if (points.length < 3 || !this.selectedPolygon) return;
    let total = 0;
    points.forEach((point, index) => {
      const next = points[(index + 1) % points.length];
      const distance = this.map.distance(point, next);
      total += distance;
      const midpoint: Coordinate = [
        (point[0] + next[0]) / 2,
        (point[1] + next[1]) / 2,
      ];
      L.marker(midpoint, {
        interactive: false,
        icon: measurementIcon(formatDistance(distance), "measurement-edge"),
      }).addTo(this.measurements);
    });
    L.marker(this.selectedPolygon.getBounds().getCenter(), {
      interactive: false,
      icon: measurementIcon(
        `Perimeter ${formatDistance(total)}`,
        "measurement-total",
      ),
    }).addTo(this.measurements);
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

function lotIcon(property: Property, selected = false): L.DivIcon {
  const span = document.createElement("span");
  span.textContent = property.title;
  return L.divIcon({
    className: `lot-label${selected ? " lot-label-selected" : ""}`,
    html: span.outerHTML,
    iconSize: [80, 30],
    iconAnchor: [40, 15],
  });
}
function destinationIcon(type: DestinationType): L.DivIcon {
  const icons: Record<DestinationType, string> = {
    school: "🏫",
    bank: "🏦",
    store: "🛒",
    landmark: "◆",
  };
  return L.divIcon({
    className: "destination-icon",
    html: icons[type] || "●",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}
function measurementIcon(label: string, variant: string): L.DivIcon {
  const span = document.createElement("span");
  span.textContent = label;
  return L.divIcon({
    className: `measurement-label ${variant}`,
    html: span.outerHTML,
    iconSize: [110, 28],
    iconAnchor: [55, 14],
  });
}
function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(2)} km`
    : `${meters.toFixed(1)} m`;
}
function reducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
