/**
 * Renders a schema.org JSON-LD block. Server component: the structured data is
 * in the initial HTML so crawlers and answer engines read it without running
 * scripts. Content comes only from our own seed, so it is safe to serialize.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify escapes the data; `<` is replaced so a value can never
      // close the script tag early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
