/**
 * Centralized SEO helpers: canonical URLs and schema.org structured data
 * (JSON-LD) for listings, providers, the organization, and the site.
 *
 * Structured data powers classic search rich results and, increasingly, the
 * answer and generative engines (AEO / GEO) that read schema and FAQ markup to
 * quote a page. Keep the facts here identical to what the page renders; never
 * assert a listing is "verified" or a boundary is surveyed (see AGENTS.md).
 *
 * All values come from the fictional seed. Nothing here is a legal claim.
 */
import { brand } from "@/lib/brand";
import { areaLabel, formatPrice, providerRatings, weightedRating } from "@/lib/listings";
import type { ProviderRating } from "@/lib/listings";
import type { Property, Provider, ProviderReview } from "@/lib/types";

/** Public origin, no trailing slash. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

/** Absolute URL for a root-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type JsonLd = Record<string, unknown>;

/** schema.org availability from a listing status. */
function availability(status: Property["status"]): string {
  switch (status) {
    case "Available":
      return "https://schema.org/InStock";
    case "Reserved":
      return "https://schema.org/LimitedAvailability";
    case "Sold":
      return "https://schema.org/SoldOut";
    default:
      return "https://schema.org/InStock";
  }
}

/** PostalAddress for a listing, from its official area when known. */
function postalAddress(property: Property): JsonLd {
  const area = property.adminArea;
  return {
    "@type": "PostalAddress",
    streetAddress: property.address,
    addressLocality: area?.city || undefined,
    addressRegion: area?.province || area?.region || undefined,
    addressCountry: "PH",
  };
}

/** The platform itself, as a real-estate service organization. */
export function organizationLd(): JsonLd {
  return {
    "@type": "RealEstateAgent",
    "@id": absoluteUrl("/#organization"),
    name: brand.name,
    alternateName: brand.shortName,
    url: absoluteUrl("/"),
    description: brand.positioning,
    areaServed: { "@type": "Country", name: "Philippines" },
    logo: absoluteUrl("/icon.svg"),
  };
}

/** The website, with a search action so engines expose an in-site search box. */
export function websiteLd(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: absoluteUrl("/"),
    name: brand.name,
    description: brand.positioning,
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/explore?query={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** A BreadcrumbList from ordered [name, path] pairs. */
export function breadcrumbLd(trail: [name: string, path: string][]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

/** A FAQPage from question/answer pairs. Strong signal for answer engines. */
export function faqLd(entries: { question: string; answer: string }[]): JsonLd {
  return {
    "@type": "FAQPage",
    mainEntity: entries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/** Plain-language FAQ for a listing, derived from its own fields (AEO). */
export function listingFaq(
  property: Property,
  provider?: Provider,
): { question: string; answer: string }[] {
  const where = areaLabel(property);
  const utilities = Object.entries(property.utilities)
    .filter(([, value]) => value && value !== "none")
    .map(([key]) => key);
  const faq = [
    {
      question: `Where is ${property.title} located?`,
      answer: `${property.title} is at ${property.address}${
        where ? ` in ${where}` : ""
      }, Philippines.`,
    },
    {
      question: `How much does ${property.title} cost?`,
      answer: `${property.title} is listed for ${formatPrice(property)}. ${
        brand.sampleNotice
      }`,
    },
    {
      question: `How large is ${property.title}?`,
      answer: `The lot is about ${property.area}. ${brand.boundaryCredit}`,
    },
  ];
  if (utilities.length) {
    faq.push({
      question: `What utilities are available at ${property.title}?`,
      answer: `Reported utilities include ${utilities.join(", ")}.`,
    });
  }
  if (provider) {
    faq.push({
      question: `Who is selling ${property.title}?`,
      answer: `${property.title} is listed by ${provider.name}${
        provider.tagline ? `, ${provider.tagline}` : ""
      }.`,
    });
  }
  return faq;
}

/** aggregateRating node for a provider, or undefined when it has no reviews. */
function providerRatingLd(rating?: ProviderRating): JsonLd | undefined {
  if (!rating || rating.count === 0) return undefined;
  return {
    "@type": "AggregateRating",
    ratingValue: Number(rating.average.toFixed(2)),
    reviewCount: rating.count,
    bestRating: 5,
    worstRating: 1,
  };
}

/** Full JSON-LD graph for a listing detail page. */
export function listingGraph(
  property: Property,
  provider: Provider | undefined,
  rating: ProviderRating | undefined,
): JsonLd {
  const url = absoluteUrl(`/property/${property.id}`);
  const images = property.media?.images?.map((image) =>
    image.startsWith("http") ? image : absoluteUrl(image),
  );
  const [lat, lng] = property.coordinates;

  const product: JsonLd = {
    "@type": "Product",
    "@id": `${url}#listing`,
    name: property.title,
    description:
      property.description ||
      `${property.area} ${property.status} lot at ${property.address}.`,
    url,
    category: "Land",
    image: images,
    offers: {
      "@type": "Offer",
      url,
      price: property.price,
      priceCurrency: "PHP",
      availability: availability(property.status),
      businessFunction:
        property.purpose === "rent"
          ? "http://purl.org/goodrelations/v1#LeaseOut"
          : "http://purl.org/goodrelations/v1#Sell",
      seller: provider ? { "@id": `${url}#seller` } : undefined,
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Area", value: property.area },
      property.landUse
        ? { "@type": "PropertyValue", name: "Land use", value: property.landUse }
        : undefined,
      property.terrain
        ? { "@type": "PropertyValue", name: "Terrain", value: property.terrain }
        : undefined,
      property.roadAccess
        ? { "@type": "PropertyValue", name: "Road access", value: property.roadAccess }
        : undefined,
    ].filter(Boolean),
  };

  const place: JsonLd = {
    "@type": "Place",
    "@id": `${url}#place`,
    name: property.title,
    address: postalAddress(property),
    geo: {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    },
  };

  const graph: JsonLd[] = [product, place];

  if (provider) {
    const seller: JsonLd = {
      "@type": "Organization",
      "@id": `${url}#seller`,
      name: provider.name,
      url: absoluteUrl(`/providers/${provider.id}`),
      description: provider.tagline,
    };
    const aggregate = providerRatingLd(rating);
    if (aggregate) seller.aggregateRating = aggregate;
    graph.push(seller);
  }

  graph.push(
    breadcrumbLd([
      ["Home", "/"],
      ["Explore lots", "/explore"],
      [property.title, `/property/${property.id}`],
    ]),
  );
  graph.push(faqLd(listingFaq(property, provider)));

  return { "@context": "https://schema.org", "@graph": graph };
}

/** JSON-LD graph for a provider profile page. */
export function providerGraph(
  provider: Provider,
  listings: Property[],
  reviews: ProviderReview[],
): JsonLd {
  const url = absoluteUrl(`/providers/${provider.id}`);
  const rating = providerRatings(reviews).get(provider.id);
  const organization: JsonLd = {
    "@type": "RealEstateAgent",
    "@id": `${url}#provider`,
    name: provider.name,
    url,
    description: provider.tagline,
    areaServed: provider.serviceArea || "Philippines",
    parentOrganization: { "@id": absoluteUrl("/#organization") },
  };
  const aggregate = providerRatingLd(rating);
  if (aggregate) organization.aggregateRating = aggregate;

  const itemList: JsonLd = {
    "@type": "ItemList",
    name: `Lots listed by ${provider.name}`,
    numberOfItems: listings.length,
    itemListElement: listings.map((property, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/property/${property.id}`),
      name: property.title,
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      itemList,
      breadcrumbLd([
        ["Home", "/"],
        ["Sellers", "/providers"],
        [provider.name, `/providers/${provider.id}`],
      ]),
    ],
  };
}

/** Organization + website graph for the homepage. */
export function homeGraph(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationLd(),
      websiteLd(),
      faqLd([
        {
          question: `What is ${brand.name}?`,
          answer: brand.positioning,
        },
        {
          question: "How do I search for land?",
          answer:
            "Open the map explorer, then search by region, province, and city, or filter by price and land type to compare lots side by side.",
        },
        {
          question: "How do I list land for sale?",
          answer:
            "Create a seller profile, then draw the lot boundary on the map and publish the listing for buyers to see.",
        },
      ]),
    ],
  };
}

// Re-exported so pages can compute a provider's display rating without pulling
// in the full listings module separately.
export { weightedRating };
