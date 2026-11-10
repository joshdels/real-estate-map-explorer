"use client";

import { useState } from "react";

const REASONS = [
  "Sexual or explicit content",
  "Scam or fraudulent listing",
  "Inappropriate or offensive",
  "Other",
];

export function PropertyActions({
  id,
  title,
  address,
}: {
  id: string;
  title: string;
  address: string;
}) {
  const [showReasons, setShowReasons] = useState(false);
  const [note, setNote] = useState("");

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/property/${encodeURIComponent(id)}`
      : `/property/${id}`;

  const share = () => {
    const data = { title: `${title} — Smart Property Listing`, text: address, url: shareUrl };
    if (navigator.share) {
      navigator.share(data).catch(() => openFacebook());
      return;
    }
    openFacebook();
  };

  const openFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const opened = window.open(url, "_blank", "noopener,noreferrer,width=640,height=640");
    if (opened) {
      setNote("Opened Facebook share in a new tab.");
    } else {
      navigator.clipboard
        ?.writeText(shareUrl)
        .then(() => setNote("Pop-up blocked — property link copied to clipboard."))
        .catch(() => setNote(`Copy this link to share: ${shareUrl}`));
    }
  };

  const report = (reason: string) => {
    try {
      const key = "spl-listing-reports";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const list = Array.isArray(existing) ? existing : [];
      list.unshift({
        id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        propertyId: id,
        title,
        reason,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(list.slice(0, 200)));
    } catch {
      /* storage unavailable; best-effort local report */
    }
    setShowReasons(false);
    setNote("Thank you. This listing was flagged and will be reviewed by an admin.");
  };

  return (
    <div className="detail-action-island">
      <div className="detail-actions">
        <a className="detail-action detail-action-map" href={`/?property=${id}`}>
          <span aria-hidden="true">⌖</span> View on map
        </a>
        <button className="detail-action detail-action-share" type="button" onClick={share}>
          <span aria-hidden="true">f</span> Share
        </button>
        <button
          className="detail-action detail-action-report"
          type="button"
          aria-expanded={showReasons}
          onClick={() => setShowReasons((open) => !open)}
        >
          <span aria-hidden="true">⚑</span> Report
        </button>
      </div>
      {showReasons ? (
        <div className="detail-report-panel" role="group" aria-label="Report this listing">
          <p>Why are you reporting this listing? An admin will review it.</p>
          <div className="detail-report-reasons">
            {REASONS.map((reason) => (
              <button key={reason} type="button" onClick={() => report(reason)}>
                {reason === "Sexual or explicit content"
                  ? "Sexual / explicit"
                  : reason === "Scam or fraudulent listing"
                    ? "Scam / fraud"
                    : reason === "Inappropriate or offensive"
                      ? "Inappropriate"
                      : "Other"}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {note ? (
        <p className="detail-action-note" role="status" aria-live="polite">
          {note}
        </p>
      ) : null}
    </div>
  );
}
