export type Coordinate = [latitude: number, longitude: number];
export type ListingStatus = "Available" | "Reserved" | "Sold";
export type DestinationType = "school" | "bank" | "store" | "landmark";
export type ListingPurpose = "sale" | "rent";
export type PropertyType = "lot" | "house" | "condo" | "farm" | "commercial";
/**
 * Staff review state. `pending` and `reviewed` listings are public;
 * `suspended` listings are hidden from every public surface.
 * `reviewed` means a staff member looked at the listing. It is not a
 * verification of ownership, price, or boundaries.
 */
export type ReviewState = "pending" | "reviewed" | "suspended";
export type ProviderKind = "owner" | "broker" | "developer";
export type ProviderReviewStatus = "published" | "flagged" | "removed";

/** PSA/NAMRIA administrative area that contains the listing's map point. */
export interface AdminArea {
  regionCode: string;
  region: string;
  provinceCode: string;
  province: string;
  cityCode?: string;
  city?: string;
  /** True when the point fell outside the simplified outlines and the nearest area was used. */
  approximate?: boolean;
}

export interface PropertyMedia {
  panoramaUrl?: string;
  aerialVideoUrl?: string;
  walkthroughVideoUrl?: string;
  images?: string[];
}

export interface Property {
  id: string;
  title: string;
  address: string;
  coordinates: Coordinate;
  polygon: Coordinate[];
  area: string;
  price: number;
  measurements?: string;
  /** Plain-language land facts supplied by the seller. */
  landUse?: string;
  terrain?: string;
  roadAccess?: string;
  status: ListingStatus;
  description?: string;
  utilities: Record<string, string>;
  media?: PropertyMedia;
  routeLabels?: string[];
  /** Optional listing-management fields. Validation fills the defaults. */
  purpose?: ListingPurpose;
  propertyType?: PropertyType;
  providerId?: string;
  groupId?: string;
  /** Provider-chosen highlight, shown first on the provider's page. */
  featured?: boolean;
  createdAt?: string;
  review?: ReviewState;
  /** Display name of the staff member who entered the listing for a client. */
  assistedBy?: string;
  adminArea?: AdminArea;
}

/** A client of the platform: an owner, broker, or developer who lists land. */
export interface Provider {
  id: string;
  name: string;
  kind: ProviderKind;
  tagline?: string;
  serviceArea?: string;
  /** Staff looked at the profile. Not a licence or identity verification. */
  staffReviewed: boolean;
  joinedAt?: string;
}

/** A provider-defined collection of listings, such as a subdivision or project. */
export interface ListingGroup {
  id: string;
  providerId: string;
  name: string;
  description?: string;
}

export interface ProviderReview {
  id: string;
  providerId: string;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
  status: ProviderReviewStatus;
}

export interface ListingReport {
  id: string;
  propertyId: string;
  title?: string;
  reason: string;
  createdAt: string;
}

export type StaffRole = "admin" | "employee";
export type SessionRole = StaffRole | "client";

export type AssistedStatus = "new" | "in-progress" | "published" | "closed";
/**
 * A listing that staff prepare on behalf of a client. Kept in this browser
 * only. `clientLabel` is a working reference, never private contact details.
 */
export interface AssistedCase {
  id: string;
  clientLabel: string;
  providerId?: string;
  notes: string;
  status: AssistedStatus;
  assignedTo: string;
  propertyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  actor: string;
  role: SessionRole;
  action: string;
  createdAt: string;
}

export interface Destination {
  id: string;
  name: string;
  type: DestinationType;
  coordinates: Coordinate;
}

export interface Route {
  id: string;
  propertyId: string;
  destinationId: string;
}

export interface Agent {
  initials?: string;
  name?: string;
  role?: string;
  phoneDisplay?: string;
  phoneHref?: string;
  messengerUrl?: string;
}

export interface Dataset {
  metadata: {
    name: string;
    version: number;
    isSample: boolean;
    notice: string;
  };
  agent?: Agent;
  utilities: Record<string, string[]>;
  properties: Property[];
  destinations: Destination[];
  routes: Route[];
  providers: Provider[];
  groups: ListingGroup[];
  reviews: ProviderReview[];
}

export interface DataRepository {
  readonly source: "supabase" | "local";
  load(): Promise<Dataset>;
  save(data: Dataset): Promise<void>;
}

export type MediaKind = "panorama" | "video" | "image" | "gallery";
export interface MediaRequest {
  title: string;
  type: MediaKind;
  url?: string;
  urls?: string[];
  isExample: boolean;
}
