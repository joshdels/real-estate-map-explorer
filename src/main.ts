import { AdminConsole } from "./admin";
import { AuthController } from "./auth";
import { DetailsPanel } from "./details";
import { qs } from "./dom";
import { MapController } from "./map-controller";
import { MediaViewer } from "./media-viewer";
import { createRepository } from "./repositories/factory";
import { PropertyStore } from "./store";
import type { Agent, Dataset, Property } from "./types";

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
      map.render(data);
      listingPortal.current?.render(data);
    },
    () => auth.isAuthenticated(),
  );
  listingPortal.current = setupListingPortal(map, store.snapshot(), () =>
    admin.requestAccess(),
  );
  details.onClose = () => map.clearSelection();
  map.render(store.snapshot());
  const deepLinkId = new URLSearchParams(location.search).get("property");
  if (deepLinkId) {
    const match = store
      .snapshot()
      .properties.find((item) => item.id === deepLinkId);
    if (match) {
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
) {
  const list = qs<HTMLElement>("#property-list");
  const empty = qs<HTMLElement>("#property-list-empty");
  const count = qs<HTMLElement>("#listing-count");
  const search = qs<HTMLInputElement>("#property-search-input");
  const location = qs<HTMLInputElement>("#property-location-input");
  const minimumPrice = qs<HTMLSelectElement>("#property-min-price");
  const maximumPrice = qs<HTMLSelectElement>("#property-max-price");
  const panel = qs<HTMLElement>("#property-search");
  const filterButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-listing-filter]"),
  );
  let data = initialData;
  let filter = "All";

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
    if (showingMap) map.invalidateSize();
    else panel.scrollTo({ top: 0, behavior: "smooth" });
  };

  const render = (nextData: Dataset = data) => {
    data = nextData;
    const term = search.value.trim().toLocaleLowerCase();
    const locationTerm = location.value.trim().toLocaleLowerCase();
    const minimum = Number(minimumPrice.value) || 0;
    const maximum = Number(maximumPrice.value) || Number.POSITIVE_INFINITY;
    const properties = data.properties.filter((property) => {
      const matchesFilter = filter === "All" || property.status === filter;
      const searchable = `${property.title} ${property.address} ${property.area} ${property.description || ""}`.toLocaleLowerCase();
      return (
        matchesFilter &&
        (!term || searchable.includes(term)) &&
        (!locationTerm || property.address.toLocaleLowerCase().includes(locationTerm)) &&
        property.price >= minimum &&
        property.price <= maximum
      );
    });
    list.replaceChildren(
      ...properties.map((property) =>
        propertyCard(property, () => {
          window.location.href = `/property/${encodeURIComponent(property.id)}`;
        }),
      ),
    );
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

  [search, location, minimumPrice, maximumPrice].forEach((control) =>
    control.addEventListener("input", () => render()),
  );
  filterButtons.forEach((button) =>
    button.addEventListener("click", () => {
      filter = button.dataset.listingFilter || "All";
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      render();
    }),
  );
  qs("#show-list-button").addEventListener("click", () => showView("list"));
  qs("#show-map-button").addEventListener("click", () => showView("map"));
  qs("#view-list-button").addEventListener("click", () => showView("list"));
  qs("#view-map-button").addEventListener("click", () => showView("map"));
  ["#nav-list-property", "#intro-list-property"].forEach((selector) =>
    qs(selector).addEventListener("click", onListProperty),
  );
  const scrollToCard = (propertyId: string) => {
    const card = list.querySelector<HTMLElement>(
      `[data-property-id="${CSS.escape(propertyId)}"]`,
    );
    card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  render(initialData);
  return {
    render,
    select,
    scrollToCard,
    showMap: () => showView("map"),
    showList: () => showView("list"),
  };
}

function propertyCard(property: Property, onSelect: () => void): HTMLElement {
  const card = document.createElement("article");
  card.className = "property-card";
  card.dataset.propertyId = property.id;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "property-card-button";
  button.setAttribute("aria-label", `View ${property.title} on the map`);
  button.addEventListener("click", onSelect);

  const media = document.createElement("span");
  media.className = "property-card-media";
  const imageUrl = property.media?.images?.[0];
  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "";
    image.loading = "lazy";
    media.append(image);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "property-card-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.textContent = "⌂";
    media.append(placeholder);
  }
  const status = document.createElement("span");
  status.className = `card-status status-${property.status.toLocaleLowerCase()}`;
  status.textContent = property.status;
  media.append(status);

  const content = document.createElement("span");
  content.className = "property-card-content";
  const price = document.createElement("strong");
  price.className = "property-card-price";
  price.textContent = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(property.price);
  const title = document.createElement("span");
  title.className = "property-card-title";
  title.textContent = property.title;
  const address = document.createElement("span");
  address.className = "property-card-address";
  address.textContent = property.address;
  const facts = document.createElement("span");
  facts.className = "property-card-facts";
  facts.textContent = `${property.area}${property.measurements ? ` · ${property.measurements}` : ""}`;

  const action = document.createElement("span");
  action.className = "property-card-action";
  action.textContent = "View on map →";
  content.append(price, title, address, facts, action);
  button.append(media, content);
  card.append(button);
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
