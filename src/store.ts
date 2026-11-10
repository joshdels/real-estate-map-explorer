import type {
  DataRepository,
  Dataset,
  Destination,
  ListingReport,
  Property,
  Route,
} from "./types";
import { LocalRepository } from "./repositories/local-repository";
import { validateDataset } from "./validation";

export class PropertyStore {
  private data!: Dataset;
  constructor(private repository: DataRepository) {}
  async initialize(): Promise<void> {
    try {
      this.data = validateDataset(await this.repository.load());
    } catch (error) {
      console.warn(
        "Primary data load failed; loading validated JSON fallback.",
        error,
      );
      this.repository = new LocalRepository();
      this.data = validateDataset(await this.repository.load());
    }
  }
  snapshot(): Dataset {
    return structuredClone(this.data);
  }
  get source(): DataRepository["source"] {
    return this.repository.source;
  }

  async addProperty(property: Property): Promise<void> {
    this.data.properties.push(property);
    await this.persist();
  }
  async removeProperty(id: string): Promise<void> {
    this.data.properties = this.data.properties.filter(
      (item) => item.id !== id,
    );
    this.data.routes = this.data.routes.filter(
      (item) => item.propertyId !== id,
    );
    await this.persist();
  }
  async saveUtilities(utilities: Dataset["utilities"]): Promise<void> {
    this.data.utilities = utilities;
    await this.persist();
  }
  async addDestination(destination: Destination): Promise<void> {
    this.data.destinations.push(destination);
    await this.persist();
  }
  async removeDestination(id: string): Promise<void> {
    this.data.destinations = this.data.destinations.filter(
      (item) => item.id !== id,
    );
    this.data.routes = this.data.routes.filter(
      (item) => item.destinationId !== id,
    );
    await this.persist();
  }
  async addRoute(route: Route): Promise<void> {
    if (
      !this.data.routes.some(
        (item) =>
          item.propertyId === route.propertyId &&
          item.destinationId === route.destinationId,
      )
    )
      this.data.routes.push(route);
    await this.persist();
  }
  async removeRoute(id: string): Promise<void> {
    this.data.routes = this.data.routes.filter((item) => item.id !== id);
    await this.persist();
  }

  private readonly reportsKey = "spl-listing-reports";
  listReports(): ListingReport[] {
    try {
      const raw = localStorage.getItem(this.reportsKey);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as ListingReport[]) : [];
    } catch {
      return [];
    }
  }
  async reportListing(
    propertyId: string,
    reason: string,
    title?: string,
  ): Promise<void> {
    const reports = this.listReports();
    reports.unshift({
      id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      propertyId,
      title,
      reason,
      createdAt: new Date().toISOString(),
    });
    try {
      localStorage.setItem(this.reportsKey, JSON.stringify(reports.slice(0, 200)));
    } catch {
      /* storage unavailable; report is best-effort local only */
    }
  }
  async resolveReport(id: string): Promise<void> {
    const remaining = this.listReports().filter((report) => report.id !== id);
    try {
      localStorage.setItem(this.reportsKey, JSON.stringify(remaining));
    } catch {
      /* storage unavailable */
    }
  }

  private async persist(): Promise<void> {
    try {
      await this.repository.save(this.data);
    } catch (error) {
      console.warn(
        "Primary persistence failed; switching to browser-local storage.",
        error,
      );
      this.repository = new LocalRepository();
      await this.repository.save(this.data);
    }
  }
}
