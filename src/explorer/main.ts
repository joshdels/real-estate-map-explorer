import { AdminConsole } from "@/explorer/admin";
import { AuthController } from "@/explorer/auth";
import { DetailsPanel } from "@/explorer/details";
import { phosphorIcon, qs } from "@/explorer/dom";
import { MapController } from "@/explorer/map-controller";
import { MediaViewer } from "@/explorer/media-viewer";
import { createRepository } from "@/lib/repositories/factory";
import { PropertyStore } from "@/lib/store";
import type { Feature } from "geojson";
import { boundaries, type BoundaryIndex } from "@/lib/geo/boundaries";
import {
  PURPOSE_LABELS,
  TYPE_LABELS,
  areaLabel,
  filterListings,
  formatPrice,
  providerRatings,
  type ListingCriteria,
  type ListingSort,
  type ProviderRating,
} from "@/lib/listings";
import { REPORT_REASONS } from "@/lib/local-records";
import { shareListing } from "@/lib/share";
import type { Agent, Dataset, Property, Provider } from "@/lib/types";

let initialization: Promise<void> | undefined;

export function initializeApp(): Promise<void> {
  initialization ??= start().catch((error: unknown) => {
    console.error(error);
    const status = qs<HTMLElement>("#app-status");
    status.hidden = false;
    status.textContent =
      "The application could not start. Check the console and the validated fallback dataset.";
    throw error;
  });
  return initialization;
}

async function start(): Promise<void> {
  const repositoryResult = await createRepository();
  const auth = new AuthController();
  await auth.initialize();
  const store = new PropertyStore(repositoryResult.repository);
  await store.initialize();
  if (repositoryResult.message) console.info(repositoryResult.message);
  renderAgent(store.snapshot().agent);
  const details = new DetailsPanel();
  const media = new MediaViewer();
  const listingPortal: {
    current?: ReturnType<typeof setupListingPortal>;
  } = {};
  // Clicking a marker goes straight to the full property detail page.
  const map = new MapController((property) => {
    window.location.href = `/property/${encodeURIComponent(property.id)}`;
  });
  const admin = new AdminConsole(
    store,
    map,
    (data) => {
      details.close();
      // The portal re-renders both the list and the matching map markers.
      listingPortal.current?.render(data);
    },
    () => auth.isAuthenticated(),
  );
  listingPortal.current = setupListingPortal(
    map,
    store.snapshot(),
    () => admin.requestAccess(),
    (property, reason) =>
      void store.reportListing(property.id, reason, property.title),
  );
  details.onClose = () => map.clearSelection();
  const query = new URLSearchParams(location.search);
  if (query.get("view") === "map") listingPortal.current.showMap();
  if (query.has("workspace") || location.pathname === "/list-property") {
    listingPortal.current.showMap();
    admin.requestAccess();
  }
  const deepLinkId = query.get("property");
  if (deepLinkId) {
    const match = store
      .snapshot()
      .properties.find((item) => item.id === deepLinkId);
    if (match) {
      listingPortal.current?.cancelPendingFrame();
      listingPortal.current?.showMap();
      listingPortal.current?.select(match.id);
      listingPortal.current?.scrollToCard(match.id);
      map.focus(match);
    }
  }
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" && !qs<HTMLElement>("#media-dialog").hidden)
      media.nextGallery(-1);
    else if (
      event.key === "ArrowRight" &&
      !qs<HTMLElement>("#media-dialog").hidden
    )
      media.nextGallery(1);
    else if (event.key === "Escape") {
      if (!qs<HTMLElement>("#media-dialog").hidden) media.close();
      else if (!qs<HTMLElement>("#admin-dialog").hidden)
        qs<HTMLButtonElement>("#cancel-admin").click();
      else if (qs("#admin-panel").classList.contains("is-open")) admin.close();
      else details.close();
    }
  });
}

function setupListingPortal(
  map: MapController,
  initialData: Dataset,
  onListProperty: () => void,
  onReport: (property: Property, reason: string) => void,
) {
  const list = qs<HTMLElement>("#property-list");
  const empty = qs<HTMLElement>("#property-list-empty");
  const count = qs<HTMLElement>("#listing-count");
  const note = qs<HTMLElement>("#listing-action-note");
  const areaStatus = qs<HTMLElement>("#area-status");
  const search = qs<HTMLInputElement>("#property-search-input");
  const location = qs<HTMLInputElement>("#property-location-input");
  const minimumPrice = qs<HTMLSelectElement>("#property-min-price");
  const maximumPrice = qs<HTMLSelectElement>("#property-max-price");
  const region = qs<HTMLSelectElement>("#filter-region");
  const province = qs<HTMLSelectElement>("#filter-province");
  const city = qs<HTMLSelectElement>("#filter-city");
  const purpose = qs<HTMLSelectElement>("#filter-purpose");
  const propertyType = qs<HTMLSelectElement>("#filter-type");
  const sort = qs<HTMLSelectElement>("#filter-sort");
  const panel = qs<HTMLElement>("#property-search");
  const filterButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-listing-filter]"),
  );
  let data = initialData;
  let filter = "All";
  let index: BoundaryIndex | undefined;
  // The map is hidden in list view, so framing waits until it is visible.
  let pendingFrame: (() => void) | undefined;

  const mapVisible = () => document.body.classList.contains("show-map-view");
  const frame = (action: () => void) => {
    if (mapVisible()) action();
    else pendingFrame = action;
  };

  const showView = (view: "list" | "map") => {
    const showingMap = view === "map";
    document.body.classList.toggle("show-map-view", showingMap);
    const pressed: [string, boolean][] = [
      ["#show-list-button", !showingMap],
      ["#show-map-button", showingMap],
      ["#view-list-button", !showingMap],
      ["#view-map-button", showingMap],
    ];
    pressed.forEach(([selector, isPressed]) => {
      const button = document.querySelector<HTMLButtonElement>(selector);
      if (!button) return;
      button.setAttribute("aria-pressed", String(isPressed));
      button.classList.toggle("is-active", isPressed);
    });
    if (showingMap) {
      map.invalidateSize();
      const action = pendingFrame;
      pendingFrame = undefined;
      // Wait for the resize so the bounds are fitted to the real map size.
      if (action) requestAnimationFrame(() => requestAnimationFrame(action));
    } else panel.scrollTo({ top: 0, behavior: "smooth" });
  };

  const criteria = (): ListingCriteria => ({
    term: search.value,
    location: location.value,
    status: filter,
    purpose: purpose.value as ListingCriteria["purpose"],
    propertyType: propertyType.value as ListingCriteria["propertyType"],
    minPrice: Number(minimumPrice.value) || undefined,
    maxPrice: Number(maximumPrice.value) || undefined,
    regionCode: region.value || undefined,
    provinceCode: province.value || undefined,
    cityCode: city.value || undefined,
    sort: sort.value as ListingSort,
  });

  const render = (nextData: Dataset = data) => {
    data = nextData;
    const properties = filterListings(data, criteria());
    const ratings = providerRatings(data.reviews);
    const providers = new Map(data.providers.map((item) => [item.id, item]));
    list.replaceChildren(
      ...properties.map((property) =>
        propertyCard(property, {
          provider: providers.get(property.providerId ?? ""),
          rating: ratings.get(property.providerId ?? ""),
          onShowOnMap: () => {
            showView("map");
            select(property.id);
            requestAnimationFrame(() => map.focus(property));
          },
          onShare: async () => {
            note.textContent = await shareListing(
              property.id,
              property.title,
              areaLabel(property),
            );
          },
          onReport: (reason) => {
            onReport(property, reason);
            note.textContent = `Thank you. ${property.title} was flagged for staff review.`;
          },
        }),
      ),
    );
    // Keep the map in step with the list: only matching listings get markers.
    map.render({ ...data, properties });
    count.textContent = `${properties.length} ${properties.length === 1 ? "property" : "properties"}`;
    empty.hidden = properties.length > 0;
  };

  const select = (propertyId: string) => {
    list.querySelectorAll<HTMLElement>("[data-property-id]").forEach((card) => {
      const selected = card.dataset.propertyId === propertyId;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-current", selected ? "true" : "false");
    });
  };

  const fillOptions = (
    select: HTMLSelectElement,
    placeholder: string,
    entries: { code: string; name: string }[],
    value = "",
  ) => {
    select.replaceChildren(
      new Option(placeholder, ""),
      ...entries.map((entry) => new Option(entry.name, entry.code)),
    );
    select.value = entries.some((entry) => entry.code === value) ? value : "";
  };

  const syncAreaOptions = () => {
    if (!index) return;
    fillOptions(
      province,
      "All provinces",
      index.provinces.filter((item) => !region.value || item.region === region.value),
      province.value,
    );
    fillOptions(
      city,
      "All cities",
      province.value
        ? index.cities.filter((item) => item.province === province.value)
        : [],
      city.value,
    );
    city.disabled = !province.value;
  };

  const showSelectedArea = async () => {
    if (!index) return;
    const provinceEntry = index.provinces.find((item) => item.code === province.value);
    const cityEntry = index.cities.find((item) => item.code === city.value);
    const target = cityEntry ?? provinceEntry;
    if (!target || !provinceEntry) {
      areaStatus.textContent = "";
      frame(() => {
        map.showArea();
        map.showAll();
      });
      return;
    }
    areaStatus.textContent = `Showing listings inside ${target.name}. Outline is simplified, not a surveyed boundary.`;
    try {
      const outline = await boundaries.outline(provinceEntry.code, cityEntry?.code);
      // Ignore the result if the selection changed while the outline loaded.
      if ((city.value || province.value) !== target.code) return;
      frame(() => map.showArea(outline as Feature | undefined, target.bbox));
    } catch {
      areaStatus.textContent = `Showing listings inside ${target.name}. The outline could not be loaded.`;
    }
  };

  const onAreaChange = (changed: HTMLSelectElement) => {
    if (changed === region) {
      province.value = "";
      city.value = "";
    } else if (changed === province) {
      city.value = "";
      const entry = index?.provinces.find((item) => item.code === province.value);
      if (entry) region.value = entry.region;
    }
    syncAreaOptions();
    render();
    void showSelectedArea();
  };

  [search, location, minimumPrice, maximumPrice, purpose, propertyType, sort].forEach(
    (control) => control.addEventListener("input", () => render()),
  );
  [region, province, city].forEach((control) =>
    control.addEventListener("change", () => onAreaChange(control)),
  );
  const setStatusFilter = (value: string) => {
    filter = value;
    filterButtons.forEach((item) => {
      const active = item.dataset.listingFilter === value;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  };
  filterButtons.forEach((button) =>
    button.addEventListener("click", () => {
      setStatusFilter(button.dataset.listingFilter || "All");
      render();
    }),
  );
  qs("#clear-filters").addEventListener("click", () => {
    [search, location, minimumPrice, maximumPrice, purpose, propertyType, region, province, city].forEach(
      (control) => (control.value = ""),
    );
    sort.value = "recommended";
    setStatusFilter("All");
    syncAreaOptions();
    render();
    void showSelectedArea();
  });
  qs("#show-list-button").addEventListener("click", () => showView("list"));
  qs("#show-map-button").addEventListener("click", () => showView("map"));
  qs("#view-list-button").addEventListener("click", () => showView("list"));
  qs("#view-map-button").addEventListener("click", () => showView("map"));
  qs("#nav-list-property").addEventListener("click", onListProperty);
  const scrollToCard = (propertyId: string) => {
    const card = list.querySelector<HTMLElement>(
      `[data-property-id="${CSS.escape(propertyId)}"]`,
    );
    card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // Filters can arrive in the URL from the homepage search.
  const params = new URLSearchParams(window.location.search);
  search.value = params.get("q") ?? "";
  purpose.value = params.get("purpose") ?? "";
  propertyType.value = params.get("type") ?? "";
  if (params.get("sort")) sort.value = params.get("sort") ?? "recommended";
  render(initialData);
  pendingFrame = () => map.showAll();

  areaStatus.textContent = "Loading official area list…";
  boundaries
    .index()
    .then((loaded) => {
      index = loaded;
      fillOptions(region, "All regions", index.regions, params.get("region") ?? "");
      province.replaceChildren(
        new Option("All provinces", ""),
        ...index.provinces.map((entry) => new Option(entry.name, entry.code)),
      );
      province.value = params.get("province") ?? "";
      const provinceEntry = index.provinces.find((item) => item.code === province.value);
      if (provinceEntry) region.value = provinceEntry.region;
      syncAreaOptions();
      city.value = params.get("city") ?? "";
      areaStatus.textContent = "";
      if (region.value || province.value) {
        render();
        void showSelectedArea();
      }
    })
    .catch(() => {
      [region, province, city].forEach((control) => (control.disabled = true));
      areaStatus.textContent =
        "Official area search is unavailable right now. Keyword and price filters still work.";
    });

  return {
    render,
    select,
    scrollToCard,
    showMap: () => showView("map"),
    showList: () => showView("list"),
    /** Replaces any queued framing, e.g. when a deep link focuses one listing. */
    cancelPendingFrame: () => {
      pendingFrame = undefined;
    },
  };
}

interface CardOptions {
  provider?: Provider;
  rating?: ProviderRating;
  onShowOnMap: () => void;
  onShare: () => void | Promise<void>;
  onReport: (reason: string) => void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function propertyCard(property: Property, options: CardOptions): HTMLElement {
  const card = el("article", "property-card");
  card.dataset.propertyId = property.id;
  const link = el("a", "property-card-button");
  link.href = `/property/${encodeURIComponent(property.id)}`;
  link.setAttribute("aria-label", `View details for ${property.title}`);

  const media = el("span", "property-card-media");
  const imageUrl = property.media?.images?.[0];
  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "";
    image.loading = "lazy";
    media.append(image);
  } else {
    const placeholder = phosphorIcon("house-line", "property-card-placeholder");
    media.append(placeholder);
  }
  media.append(
    el("span", `card-status status-${property.status.toLocaleLowerCase()}`, property.status),
  );

  const content = el("span", "property-card-content");
  const badges = el("span", "property-card-badges");
  badges.append(
    el("span", "card-badge", `${PURPOSE_LABELS[property.purpose ?? "sale"]} · ${TYPE_LABELS[property.propertyType ?? "lot"]}`),
  );
  if (property.review === "reviewed")
    badges.append(el("span", "card-badge card-badge-reviewed", "Staff reviewed"));
  if (property.assistedBy)
    badges.append(el("span", "card-badge", "Assisted listing"));
  content.append(
    badges,
    el("strong", "property-card-price", formatPrice(property)),
    el("span", "property-card-title", property.title),
    el("span", "property-card-address", areaLabel(property)),
    el("span", "property-card-facts", `${property.area}${property.measurements ? ` · ${property.measurements}` : ""}`),
  );
  if (options.provider)
    content.append(
      el(
        "span",
        "property-card-provider",
        `${options.provider.name} · ${options.rating ? `★ ${options.rating.average.toFixed(1)} (${options.rating.count})` : "No reviews yet"}`,
      ),
    );
  link.append(media, content);

  const tools = el("div", "property-card-tools");
  const toolButton = (iconName: string, label: string, accessibleName: string) => {
    const button = el("button", "card-tool");
    button.type = "button";
    button.setAttribute("aria-label", `${accessibleName}: ${property.title}`);
    button.append(phosphorIcon(iconName), document.createTextNode(label));
    return button;
  };
  const mapButton = toolButton("map-pin", "Map", "Show on map");
  mapButton.addEventListener("click", options.onShowOnMap);
  const shareButton = toolButton("share-network", "Share", "Share listing");
  shareButton.addEventListener("click", () => void options.onShare());
  const reportButton = toolButton("flag", "Report", "Report listing");
  reportButton.setAttribute("aria-expanded", "false");
  const reasons = el("div", "card-report-reasons");
  reasons.hidden = true;
  reasons.setAttribute("role", "group");
  reasons.setAttribute("aria-label", `Reason for reporting ${property.title}`);
  REPORT_REASONS.forEach((reason) => {
    const button = el("button", "card-report-reason", reason);
    button.type = "button";
    button.addEventListener("click", () => {
      options.onReport(reason);
      reasons.hidden = true;
      reportButton.setAttribute("aria-expanded", "false");
      reportButton.replaceChildren(phosphorIcon("flag"), document.createTextNode("Reported"));
      reportButton.disabled = true;
    });
    reasons.append(button);
  });
  reportButton.addEventListener("click", () => {
    reasons.hidden = !reasons.hidden;
    reportButton.setAttribute("aria-expanded", String(!reasons.hidden));
  });
  tools.append(mapButton, shareButton, reportButton);
  card.append(link, tools, reasons);
  return card;
}

function renderAgent(agent?: Agent): void {
  if (!agent) return;
  qs("#agent-initials").textContent = agent.initials || "EC";
  qs("#agent-name").textContent = agent.name || "Property specialist";
  qs("#agent-role").textContent = agent.role || "Property Specialist";
  qs("#agent-phone").textContent =
    `Call: ${agent.phoneDisplay || "Not supplied"}`;
  qs<HTMLAnchorElement>("#agent-call").href = agent.phoneHref
    ? `tel:${agent.phoneHref}`
    : "#";
  qs<HTMLAnchorElement>("#agent-message").href = agent.messengerUrl || "#";
}
