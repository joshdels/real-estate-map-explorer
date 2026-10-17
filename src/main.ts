import "leaflet/dist/leaflet.css";
import "../css/tokens.css";
import "../css/components.css";
import "../css/layout.css";
import { AdminConsole } from "./admin";
import { config } from "./config";
import { DetailsPanel } from "./details";
import { qs } from "./dom";
import { MapController } from "./map-controller";
import { MediaViewer } from "./media-viewer";
import { createRepository } from "./repositories/factory";
import { PropertyStore } from "./store";
import type { Agent } from "./types";

document.title = config.title;
const status = qs<HTMLElement>("#app-status");
start().catch((error: unknown) => {
  console.error(error);
  status.hidden = false;
  status.textContent =
    "The application could not start. Check the console and the validated fallback dataset.";
});

async function start(): Promise<void> {
  const repositoryResult = await createRepository();
  const store = new PropertyStore(repositoryResult.repository);
  await store.initialize();
  if (repositoryResult.message) console.info(repositoryResult.message);
  renderAgent(store.snapshot().agent);
  const details = new DetailsPanel();
  const media = new MediaViewer();
  const map = new MapController((property) => {
    const data = store.snapshot();
    const routeLabels = data.routes
      .filter((route) => route.propertyId === property.id)
      .map(
        (route) =>
          data.destinations.find((item) => item.id === route.destinationId)
            ?.name,
      )
      .filter((name): name is string => Boolean(name));
    details.open(
      { ...property, routeLabels },
      () => map.toggleRoutes(property),
      () => map.toggleMeasurements(property),
      (item) => media.open(item),
    );
  });
  const admin = new AdminConsole(store, map, (data) => {
    details.close();
    map.render(data);
  });
  details.onClose = () => map.clearSelection();
  map.render(store.snapshot());
  qs("#home-button").addEventListener("click", () => {
    admin.close();
    details.close();
    map.showAll();
  });
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
