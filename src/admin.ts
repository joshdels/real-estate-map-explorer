import { qs } from "./dom";
import { MapController } from "./map-controller";
import { PropertyStore } from "./store";
import type {
  Coordinate,
  Dataset,
  Destination,
  DestinationType,
  ListingStatus,
  Property,
  Route,
} from "./types";
import { parseImageUrls } from "./validation";

export class AdminConsole {
  private readonly panel = qs<HTMLElement>("#admin-panel");
  private readonly dialog = qs<HTMLElement>("#admin-dialog");
  private points: Coordinate[] = [];
  constructor(
    private readonly store: PropertyStore,
    private readonly map: MapController,
    private readonly onDataChange: (data: Dataset) => void,
  ) {
    this.bindAccess();
    this.bindTabs();
    this.bindForms();
    this.refresh();
  }
  requestAccess(): void {
    this.dialog.hidden = false;
    qs<HTMLInputElement>("#admin-passcode").focus();
  }
  close(): void {
    this.panel.classList.remove("is-open");
    this.panel.setAttribute("aria-hidden", "true");
    this.stopPinning();
    this.points = [];
    this.renderPoints();
  }
  refresh(): void {
    const data = this.store.snapshot();
    this.renderProperties(data);
    this.renderDestinations(data);
    this.renderRoutes(data);
    this.fillSelects(data);
    this.fillUtilities(data.utilities);
  }

  private bindAccess(): void {
    qs("#admin-button").addEventListener("click", () => this.requestAccess());
    qs("#cancel-admin").addEventListener("click", () => this.closeDialog());
    qs("#close-admin").addEventListener("click", () => this.close());
    qs<HTMLFormElement>("#admin-access-form").addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        const input = qs<HTMLInputElement>("#admin-passcode");
        if (input.value !== "admin") {
          qs("#admin-access-error").textContent =
            "Incorrect local access passcode.";
          return;
        }
        input.value = "";
        qs("#admin-access-error").textContent = "";
        this.closeDialog();
        this.panel.classList.add("is-open");
        this.panel.setAttribute("aria-hidden", "false");
      },
    );
  }
  private bindTabs(): void {
    document
      .querySelectorAll<HTMLElement>("[data-admin-tab]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          document
            .querySelectorAll("[data-admin-tab]")
            .forEach((item) =>
              item.classList.toggle("is-active", item === button),
            );
          document
            .querySelectorAll<HTMLElement>("[data-admin-view]")
            .forEach((view) => {
              view.hidden = view.dataset.adminView !== button.dataset.adminTab;
            });
          this.stopPinning();
        }),
      );
  }
  private bindForms(): void {
    const pinButton = qs<HTMLButtonElement>("#pin-boundary");
    pinButton.addEventListener("click", () => {
      const active = !pinButton.classList.contains("is-active");
      pinButton.classList.toggle("is-active", active);
      pinButton.textContent = active
        ? "✓ Finish boundary"
        : "＋ Start pinning on map";
      this.map.setClickMode(
        active
          ? (point) => {
              this.points.push(point);
              this.renderPoints();
              this.map.showDraft(this.points);
            }
          : null,
        active ? "Click the map to add boundary points" : undefined,
      );
    });
    qs<HTMLFormElement>("#property-form").addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();
        if (this.points.length < 3) {
          window.alert("Add at least three finite boundary points on the map.");
          return;
        }
        const formElement = event.currentTarget as HTMLFormElement;
        const form = new FormData(formElement);
        const property: Property = {
          id: crypto.randomUUID(),
          title: text(form, "title"),
          address: text(form, "address"),
          coordinates: centroid(this.points),
          polygon: [...this.points],
          area: text(form, "area"),
          price: Number(form.get("price")),
          measurements: text(form, "measurements"),
          status: text(form, "status") as ListingStatus,
          description: text(form, "description"),
          utilities: this.propertyUtilities(),
          media: {
            panoramaUrl: text(form, "panoramaUrl"),
            aerialVideoUrl: text(form, "aerialVideoUrl"),
            walkthroughVideoUrl: text(form, "walkthroughVideoUrl"),
            images: parseImageUrls(form.get("images")),
          },
        };
        await this.store.addProperty(property);
        formElement.reset();
        this.points = [];
        pinButton.classList.remove("is-active");
        pinButton.textContent = "＋ Start pinning on map";
        this.map.clearDraft();
        this.changed();
      },
    );
    qs<HTMLFormElement>("#utilities-form").addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget as HTMLFormElement);
        const utilities: Record<string, string[]> = {};
        for (const [key, value] of form)
          utilities[key] = String(value)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        await this.store.saveUtilities(utilities);
        this.changed();
      },
    );
    const locationForm = qs<HTMLFormElement>("#location-form");
    qs("#use-map-location").addEventListener("click", () =>
      this.map.setClickMode((point) => {
        const lat = locationForm.elements.namedItem("lat") as HTMLInputElement;
        const lng = locationForm.elements.namedItem("lng") as HTMLInputElement;
        lat.value = point[0].toFixed(6);
        lng.value = point[1].toFixed(6);
        this.map.showDraft([point]);
        this.map.setClickMode(null);
      }, "Click the map to choose a destination"),
    );
    locationForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(locationForm);
      const destination: Destination = {
        id: crypto.randomUUID(),
        name: text(form, "name"),
        type: text(form, "type") as DestinationType,
        coordinates: [Number(form.get("lat")), Number(form.get("lng"))],
      };
      await this.store.addDestination(destination);
      locationForm.reset();
      this.map.clearDraft();
      this.changed();
    });
    qs<HTMLFormElement>("#route-form").addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget as HTMLFormElement);
        const route: Route = {
          id: crypto.randomUUID(),
          propertyId: text(form, "propertyId"),
          destinationId: text(form, "destinationId"),
        };
        await this.store.addRoute(route);
        this.changed();
      },
    );
  }
  private renderPoints(): void {
    qs("#boundary-points").replaceChildren(
      ...this.points.map((point, index) =>
        feedPoint(point, index, () => {
          this.points.splice(index, 1);
          this.renderPoints();
          this.map.showDraft(this.points);
        }),
      ),
    );
  }
  private renderProperties(data: Dataset): void {
    qs("#property-feed").replaceChildren(
      ...data.properties.map((item) =>
        feedItem(item.title, `${item.area} · ${item.status}`, async () => {
          await this.store.removeProperty(item.id);
          this.changed();
        }),
      ),
    );
  }
  private renderDestinations(data: Dataset): void {
    qs("#location-feed").replaceChildren(
      ...data.destinations.map((item) =>
        feedItem(
          item.name,
          `${item.type} · ${item.coordinates.map((value) => value.toFixed(4)).join(", ")}`,
          async () => {
            await this.store.removeDestination(item.id);
            this.changed();
          },
        ),
      ),
    );
  }
  private renderRoutes(data: Dataset): void {
    qs("#route-feed").replaceChildren(
      ...data.routes.map((route) =>
        feedItem(
          data.properties.find((item) => item.id === route.propertyId)?.title ||
            "Missing property",
          data.destinations.find((item) => item.id === route.destinationId)
            ?.name || "Missing destination",
          async () => {
            await this.store.removeRoute(route.id);
            this.changed();
          },
        ),
      ),
    );
  }
  private fillSelects(data: Dataset): void {
    fillSelect(qs<HTMLSelectElement>("#route-property"), data.properties);
    fillSelect(qs<HTMLSelectElement>("#route-destination"), data.destinations);
  }
  private fillUtilities(utilities: Dataset["utilities"]): void {
    const form = qs<HTMLFormElement>("#utilities-form");
    Object.entries(utilities).forEach(([key, values]) => {
      const input = form.elements.namedItem(key) as HTMLInputElement | null;
      if (input) input.value = values.join(", ");
    });
  }
  private propertyUtilities(): Record<string, string> {
    return Object.fromEntries(
      Object.entries(this.store.snapshot().utilities).map(([key, values]) => [
        key,
        values.join(", "),
      ]),
    );
  }
  private changed(): void {
    this.refresh();
    this.onDataChange(this.store.snapshot());
  }
  private closeDialog(): void {
    this.dialog.hidden = true;
    qs<HTMLButtonElement>("#admin-button").focus();
  }
  private stopPinning(): void {
    const button = qs<HTMLButtonElement>("#pin-boundary");
    button.classList.remove("is-active");
    button.textContent = "＋ Start pinning on map";
    this.map.clearDraft();
  }
}

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}
function centroid(points: Coordinate[]): Coordinate {
  return [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ];
}
function fillSelect(
  select: HTMLSelectElement,
  items: Array<{ id: string; title?: string; name?: string }>,
): void {
  const current = select.value;
  select.replaceChildren(
    ...items.map((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.title ?? item.name ?? item.id;
      return option;
    }),
  );
  if ([...select.options].some((option) => option.value === current))
    select.value = current;
}
function feedItem(
  title: string,
  detail: string,
  onDelete: () => void | Promise<void>,
): HTMLElement {
  const item = document.createElement("article");
  item.className = "feed-item";
  const strong = document.createElement("strong");
  strong.textContent = title;
  const small = document.createElement("small");
  small.textContent = detail;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Remove";
  button.addEventListener("click", () => void onDelete());
  item.append(strong, small, button);
  return item;
}
function feedPoint(
  point: Coordinate,
  index: number,
  onDelete: () => void,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "point-row";
  const number = document.createElement("b");
  number.textContent = String(index + 1);
  const label = document.createElement("span");
  label.textContent = `${point[0].toFixed(6)}, ${point[1].toFixed(6)}`;
  const button = document.createElement("button");
  button.className = "mini-delete";
  button.type = "button";
  button.textContent = "×";
  button.setAttribute("aria-label", `Remove boundary point ${index + 1}`);
  button.addEventListener("click", onDelete);
  row.append(number, label, button);
  return row;
}
