export type Coordinate = [latitude: number, longitude: number];
export type ListingStatus = "Available" | "Reserved" | "Sold";
export type DestinationType = "school" | "bank" | "store" | "landmark";

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
  status: ListingStatus;
  description?: string;
  utilities: Record<string, string>;
  media?: PropertyMedia;
  routeLabels?: string[];
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
