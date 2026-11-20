import Image from "next/image";
import type { Property } from "@/lib/types";

const LOT_SHAPES = [
  { points: "95,92 290,58 344,196 162,234", labelX: 210, labelY: 147 },
  { points: "305,58 552,48 576,186 344,196", labelX: 434, labelY: 125 },
  { points: "590,46 870,76 814,232 604,188", labelX: 721, labelY: 137 },
  { points: "86,258 302,222 349,424 114,458", labelX: 216, labelY: 337 },
  { points: "362,406 614,342 664,560 360,566", labelX: 507, labelY: 474 },
  { points: "654,270 878,236 912,504 675,550", labelX: 782, labelY: 382 },
] as const;

const statusClass = (status: Property["status"]) =>
  `masterplan-lot status-${status.toLowerCase()}`;

export function ProviderMasterplan({ listings }: { listings: Property[] }) {
  const visible = listings.slice(0, LOT_SHAPES.length);
  const count = (status: Property["status"]) =>
    visible.filter((listing) => listing.status === status).length;

  return (
    <section className="page-section provider-masterplan" aria-labelledby="masterplan-title">
      <div className="masterplan-heading">
        <div>
          <p className="section-kicker">Interactive lot plan</p>
          <h2 id="masterplan-title">Mati Bayside lots</h2>
          <p className="section-lead">Select a lot to see its price, area, and full listing.</p>
        </div>
        <div className="masterplan-counts" aria-label="Lot availability">
          <span className="is-available"><b>{count("Available")}</b> Available</span>
          <span className="is-reserved"><b>{count("Reserved")}</b> Reserved</span>
          <span className="is-sold"><b>{count("Sold")}</b> Sold</span>
        </div>
      </div>

      <div className="masterplan-canvas">
        <Image
          src="/images/sample-provincial-masterplan.png"
          width={1536}
          height={1024}
          sizes="(max-width: 720px) 100vw, 1160px"
          alt="Illustrative masterplan with open lots, roads, and planted green space"
        />
        <svg viewBox="0 0 1000 667" role="group" aria-label="Select a lot on the illustrative masterplan">
          {/* Plain anchors allow standard keyboard and browser navigation inside SVG. */}
          {visible.map((listing, index) => {
            const shape = LOT_SHAPES[index];
            return (
              <a
                key={listing.id}
                className={statusClass(listing.status)}
                href={`/property/${encodeURIComponent(listing.id)}`}
                aria-label={`${listing.title}, ${listing.status}, ${listing.area}`}
              >
                <polygon points={shape.points} />
                <text x={shape.labelX} y={shape.labelY} textAnchor="middle">
                  {listing.title.replace(/^Sample\s+/i, "").slice(0, 18)}
                </text>
                <text className="masterplan-status" x={shape.labelX} y={shape.labelY + 22} textAnchor="middle">
                  {listing.status}
                </text>
              </a>
            );
          })}
        </svg>
      </div>
      <p className="masterplan-note">Illustrative planning concept only. Shapes and dimensions are not surveyed boundaries.</p>
    </section>
  );
}
