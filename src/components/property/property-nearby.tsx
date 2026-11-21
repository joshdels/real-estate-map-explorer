"use client";

import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  Bus,
  ForkKnife,
  Coffee,
  ShoppingCart,
  FirstAidKit,
  Bank,
  type Icon,
} from "@phosphor-icons/react";
import {
  NEARBY_CATEGORIES,
  fetchNearbyPlaces,
  formatDistance,
  samplePlaces,
  type NearbyCategory,
  type NearbyPlace,
} from "@/lib/nearby";
import { PropertyMiniMap, type BasemapKey } from "@/components/property/property-mini-map";
import type { Coordinate } from "@/lib/types";

const CATEGORY_ICON: Record<NearbyCategory, Icon> = {
  school: GraduationCap,
  transport: Bus,
  dining: ForkKnife,
  cafe: Coffee,
  groceries: ShoppingCart,
  health: FirstAidKit,
  finance: Bank,
};

const CATEGORY_LABEL = new Map(NEARBY_CATEGORIES.map((c) => [c.category, c.label]));

const BASEMAPS: { key: BasemapKey; label: string }[] = [
  { key: "imagery", label: "Satellite" },
  { key: "roads", label: "Roads" },
  { key: "osm", label: "Street map" },
];

type Status = "loading" | "ready" | "error";

export function PropertyNearby({
  id,
  coordinates,
  polygon,
}: {
  id: string;
  coordinates: Coordinate;
  polygon: Coordinate[];
}) {
  const [basemap, setBasemap] = useState<BasemapKey>("imagery");
  const [active, setActive] = useState<NearbyCategory | null>(null);
  // Start with the illustrative sample so the section renders immediately, then
  // replace it with real OpenStreetMap data once the lookup returns.
  const [places, setPlaces] = useState<NearbyPlace[]>(() => samplePlaces({ id, coordinates }));
  const [source, setSource] = useState<"osm" | "sample">("sample");
  const [status, setStatus] = useState<Status>("loading");
  const mapWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchNearbyPlaces({ id, coordinates }, controller.signal)
      .then((result) => {
        if (cancelled) return;
        setPlaces(result.places);
        setSource(result.source);
        setStatus(result.source === "osm" ? "ready" : "error");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id, coordinates]);

  const toggleCategory = (category: NearbyCategory) => {
    setActive((current) => (current === category ? null : category));
    // Bring the map into view so the pan to the chosen places is visible.
    mapWrapRef.current?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "nearest" });
  };

  // Group for the premium two-column list, in the configured category order.
  const groups = NEARBY_CATEGORIES.map(({ category }) => ({
    category,
    items: places.filter((place) => place.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="detail-nearby">
      <div className="detail-map-toolbar" role="group" aria-label="Map layer">
        {BASEMAPS.map((option) => (
          <button
            key={option.key}
            type="button"
            className="detail-map-layer"
            aria-pressed={basemap === option.key}
            onClick={() => setBasemap(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div ref={mapWrapRef}>
        <PropertyMiniMap
          coordinates={coordinates}
          polygon={polygon}
          nearby={places}
          activeCategory={active}
          basemap={basemap}
        />
      </div>

      {/* Legend and filter: the important neighbourhood categories. */}
      <div className="detail-nearby-chips" role="group" aria-label="Filter nearby places by category">
        <button
          type="button"
          className="detail-nearby-chip"
          aria-pressed={active === null}
          onClick={() => setActive(null)}
        >
          All
        </button>
        {NEARBY_CATEGORIES.map(({ category, label }) => {
          const Glyph = CATEGORY_ICON[category];
          const count = places.filter((place) => place.category === category).length;
          return (
            <button
              key={category}
              type="button"
              className={`detail-nearby-chip detail-nearby-chip-${category}`}
              aria-pressed={active === category}
              disabled={count === 0}
              onClick={() => toggleCategory(category)}
            >
              <Glyph aria-hidden="true" /> {label}
              {count > 0 ? <span className="detail-nearby-chip-count">{count}</span> : null}
            </button>
          );
        })}
      </div>

      <p className="detail-note" role="status" aria-live="polite">
        {status === "loading"
          ? "Finding nearby places from OpenStreetMap…"
          : source === "osm"
            ? "Nearby places from OpenStreetMap, by straight-line distance from the lot."
            : "Could not reach OpenStreetMap. Showing illustrative sample places only, not verified amenities."}
      </p>

      <div className="detail-nearby-groups">
        {(active ? groups.filter((group) => group.category === active) : groups).map((group) => {
          const Glyph = CATEGORY_ICON[group.category];
          return (
            <section key={group.category} className={`detail-nearby-group detail-nearby-group-${group.category}`} aria-label={CATEGORY_LABEL.get(group.category)}>
              <h3 className="detail-nearby-group-head">
                <span className="detail-nearby-group-icon" aria-hidden="true"><Glyph /></span>
                {CATEGORY_LABEL.get(group.category)}
                <span className="detail-nearby-group-count">{group.items.length} nearby</span>
              </h3>
              <ul className="detail-nearby-group-list">
                {group.items.map((place) => (
                  <li key={place.id} className="detail-nearby-row">
                    <span className="detail-nearby-row-name">{place.name}</span>
                    <span className="detail-nearby-row-meta">
                      {formatDistance(place.distanceM)} · {place.subtype}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
