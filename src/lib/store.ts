import type {
  DataRepository,
  Dataset,
  Destination,
  ListingGroup,
  ListingReport,
  Property,
  Provider,
  ProviderReview,
  ProviderReviewStatus,
  Route,
} from "@/lib/types";
import { addReport, listReports, removeReport } from "@/lib/local-records";
import { LocalRepository } from "@/lib/repositories/local-repository";
import { isProductionMode } from "@/lib/runtime-mode";
import { validateDataset } from "@/lib/validation";

export class PropertyStore {
  private data!: Dataset;
  constructor(private repository: DataRepository) {}
  async initialize(): Promise<void> {
    try {
      this.data = validateDataset(await this.repository.load());
    } catch (error) {
      if (isProductionMode) throw error;
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

  /** Applies a partial change to one listing. Returns false if it no longer exists. */
  async updateProperty(
    id: string,
    patch: Partial<Omit<Property, "id">>,
  ): Promise<boolean> {
    const property = this.data.properties.find((item) => item.id === id);
    if (!property) return false;
    Object.assign(property, patch);
    this.data = validateDataset(this.data);
    await this.persist();
    return true;
  }

  async addProvider(provider: Provider): Promise<void> {
    this.data.providers.push(provider);
    await this.persist();
  }
  async updateProvider(
    id: string,
    patch: Partial<Omit<Provider, "id">>,
  ): Promise<void> {
    const provider = this.data.providers.find((item) => item.id === id);
    if (!provider) return;
    Object.assign(provider, patch);
    this.data = validateDataset(this.data);
    await this.persist();
  }

  async addGroup(group: ListingGroup): Promise<void> {
    this.data.groups.push(group);
    this.data = validateDataset(this.data);
    await this.persist();
  }
  /** Removes a group. Its listings stay published, just ungrouped. */
  async removeGroup(id: string): Promise<void> {
    this.data.groups = this.data.groups.filter((item) => item.id !== id);
    this.data = validateDataset(this.data);
    await this.persist();
  }

  async addReview(
    review: Pick<ProviderReview, "providerId" | "rating" | "comment" | "author">,
  ): Promise<void> {
    this.data.reviews.unshift({
      ...review,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "published",
    });
    this.data = validateDataset(this.data);
    await this.persist();
  }
  async setReviewStatus(id: string, status: ProviderReviewStatus): Promise<void> {
    const review = this.data.reviews.find((item) => item.id === id);
    if (!review) return;
    review.status = status;
    await this.persist();
  }

  // Visitor reports stay in this browser; see src/local-records.ts.
  listReports(): ListingReport[] {
    return listReports();
  }
  async reportListing(
    propertyId: string,
    reason: string,
    title?: string,
  ): Promise<void> {
    addReport(propertyId, reason, title);
  }
  async resolveReport(id: string): Promise<void> {
    removeReport(id);
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
