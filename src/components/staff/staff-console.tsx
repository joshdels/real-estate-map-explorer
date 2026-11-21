"use client";

import Link from "next/link";
import { useState } from "react";
import { SealCheck } from "@phosphor-icons/react";
import { KIND_LABELS, areaLabel, formatPrice } from "@/lib/listings";
import {
  ASSISTED_STATUS_LABELS,
  addAssistedCase,
  listActivity,
  listAssistedCases,
  listReports,
  logActivity,
  removeReport,
  removeReportsFor,
  updateAssistedCase,
} from "@/lib/local-records";
import {
  ROLE_LABELS,
  can,
  clearSession,
  isStaff,
  roleForPasscode,
  setSession,
  type StaffAction,
} from "@/lib/session";
import type {
  ActivityEntry,
  AssistedCase,
  AssistedStatus,
  ListingReport,
  Property,
  ProviderKind,
} from "@/lib/types";
import { useDataset } from "@/hooks/use-dataset";
import { useSession } from "@/hooks/use-session";
import { isProductionMode } from "@/lib/runtime-mode";

type Tab = "queue" | "flags" | "assisted" | "suspended" | "providers" | "activity";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

export function StaffConsole() {
  const { data, ready, mutate } = useDataset();
  const [session, refreshSession] = useSession();
  const [tab, setTab] = useState<Tab>("queue");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  // Browser-only records. They are read on mount and after every staff action.
  const [reports, setReports] = useState<ListingReport[]>(listReports);
  const [cases, setCases] = useState<AssistedCase[]>(listAssistedCases);
  const [activity, setActivity] = useState<ActivityEntry[]>(listActivity);

  const reloadLocal = () => {
    setReports(listReports());
    setCases(listAssistedCases());
    setActivity(listActivity());
  };

  if (isProductionMode && !isStaff(session)) {
    return (
      <section className="page-section" aria-labelledby="staff-access-title">
        <p className="section-kicker">Admin and employee access</p>
        <h1 id="staff-access-title">Sign in to open the staff console</h1>
        <p className="section-lead">Review listings, handle reports, and assist providers.</p>
        <Link className="primary-action" href="/login">Sign in</Link>
      </section>
    );
  }

  if (!isStaff(session))
    return (
      <section className="page-section" aria-labelledby="staff-access-title">
        <p className="section-kicker">Admin and employee access</p>
        <h1 id="staff-access-title">Staff console</h1>
        <p className="section-lead">Review new listings, handle reports, and prepare assisted listings for clients.</p>
        <p className="demo-warning" role="note">
          Demo access only. The passcodes are public (“admin” for administrators, “staff” for employees) and are not security. Do not store real private data here.
        </p>
        <form
          className="panel-form"
          onSubmit={(event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const role = roleForPasscode(String(values.get("passcode")));
            if (!role) {
              setError("That passcode is not recognised. Use “admin” or “staff”.");
              return;
            }
            setError("");
            setSession({ role, name: String(values.get("name")).trim() || ROLE_LABELS[role] });
            reloadLocal();
            refreshSession();
          }}
        >
          <label>Your display name<input name="name" required maxLength={60} autoComplete="name" placeholder="Shown on assisted listings and the activity log" /></label>
          <label>Passcode<input name="passcode" type="password" required autoComplete="current-password" aria-describedby="staff-access-error" /></label>
          <p id="staff-access-error" className="form-error" role="alert">{error}</p>
          <button className="primary-action" type="submit">Open staff console</button>
        </form>
      </section>
    );

  const staff = session!;
  const allowed = (action: StaffAction) => can(staff, action);
  const record = (message: string) => {
    logActivity(staff.name, staff.role, message);
    setNote(message);
    reloadLocal();
  };
  const act = async (message: string, action: Parameters<typeof mutate>[0]) => {
    await mutate(action);
    record(message);
  };
  const suspend = (property: Property) =>
    act(`Suspended “${property.title}”. It is hidden from the public.`, (store) =>
      store.updateProperty(property.id, { review: "suspended" }),
    );

  const pending = data.properties.filter((item) => item.review === "pending");
  const suspended = data.properties.filter((item) => item.review === "suspended");
  const flaggedReviews = data.reviews.filter((item) => item.status === "flagged");
  const providerName = (id?: string) => data.providers.find((item) => item.id === id)?.name ?? "No provider";
  const openCases = cases.filter((item) => item.status !== "closed");

  const tabs: { id: Tab; label: string; count?: number; show: boolean }[] = [
    { id: "queue", label: "Review queue", count: pending.length, show: true },
    { id: "flags", label: "Flags", count: reports.length + flaggedReviews.length, show: true },
    { id: "assisted", label: "Assisted listings", count: openCases.length, show: true },
    { id: "suspended", label: "Suspended", count: suspended.length, show: true },
    { id: "providers", label: "Providers", show: true },
    { id: "activity", label: "Activity log", show: allowed("view-activity") },
  ];

  return (
    <>
      <section className="page-section" aria-labelledby="staff-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{ROLE_LABELS[staff.role]} panel</p>
            <h1 id="staff-title">Staff console</h1>
            <p className="section-lead">
              Signed in as {staff.name}.{" "}
              {staff.role === "admin"
                ? "Administrators can do everything, including restoring or deleting listings and reviewing provider profiles."
                : "Employees review listings, handle flags, and prepare assisted listings. Restoring, deleting, and provider review need an administrator."}
            </p>
          </div>
          <div className="heading-actions">
            <a className="primary-action" href="/list-property"><i className="ph ph-plus" aria-hidden="true" /> Create assisted listing</a>
            <button className="secondary-action" type="button" onClick={() => { clearSession(); refreshSession(); }}>Sign out</button>
          </div>
        </div>
        <div className="tab-row" role="group" aria-label="Staff sections">
          {tabs.filter((item) => item.show).map((item) => (
            <button key={item.id} type="button" aria-pressed={tab === item.id} className={tab === item.id ? "is-active" : undefined} onClick={() => setTab(item.id)}>
              {item.label}{item.count !== undefined ? <span className="tab-count"> {item.count}</span> : null}
            </button>
          ))}
        </div>
        <p className="form-note" role="status" aria-live="polite">{note}</p>
        {!ready ? <p className="form-note">Loading listing data…</p> : null}
      </section>

      {tab === "queue" ? (
        <section className="page-section" aria-labelledby="queue-title">
          <h2 id="queue-title">Listings waiting for review</h2>
          <p className="section-lead">New listings are public immediately and labeled as not yet reviewed. “Mark reviewed” records that staff looked at the listing; it does not verify ownership, price, or the boundary.</p>
          {pending.length === 0 ? <p className="empty-state">Nothing is waiting for review.</p> : null}
          <ul className="work-list">
            {pending.map((item) => (
              <li key={item.id}>
                <div>
                  <Link href={`/property/${encodeURIComponent(item.id)}`}><strong>{item.title}</strong></Link>
                  <span>{formatPrice(item)} · {areaLabel(item)} · {providerName(item.providerId)}{item.assistedBy ? ` · assisted by ${item.assistedBy}` : ""}</span>
                  {!item.adminArea ? <span className="work-warning">No official area matched the map pins.</span> : null}
                </div>
                <div className="work-actions">
                  <button className="primary-action" type="button" onClick={() => void act(`Marked “${item.title}” as reviewed.`, (store) => store.updateProperty(item.id, { review: "reviewed" }))}>Mark reviewed</button>
                  <button className="secondary-action danger" type="button" onClick={() => void suspend(item)}>Suspend</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "flags" ? (
        <>
          <section className="page-section" aria-labelledby="reports-title">
            <h2 id="reports-title">Reported listings</h2>
            <p className="section-lead">Reports are stored in this browser only, so you see flags raised on this device.</p>
            {reports.length === 0 ? <p className="empty-state">No open listing reports.</p> : null}
            <ul className="work-list">
              {reports.map((report) => {
                const property = data.properties.find((item) => item.id === report.propertyId);
                return (
                  <li key={report.id}>
                    <div>
                      <strong>{report.title || property?.title || report.propertyId}</strong>
                      <span>{report.reason} · reported {when(report.createdAt)}</span>
                      <span>{property ? (property.review === "suspended" ? "Listing already suspended" : `Listing is public · ${providerName(property.providerId)}`) : "Listing no longer exists"}</span>
                    </div>
                    <div className="work-actions">
                      {property ? <Link className="secondary-action" href={`/property/${encodeURIComponent(property.id)}`}>Open listing</Link> : null}
                      <button className="secondary-action" type="button" onClick={() => { removeReport(report.id); record(`Dismissed a report on “${report.title ?? report.propertyId}”.`); }}>Dismiss report</button>
                      {property && property.review !== "suspended" ? (
                        <button className="secondary-action danger" type="button" onClick={async () => { await suspend(property); removeReportsFor(property.id); reloadLocal(); }}>Suspend listing</button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="page-section page-section-tint" aria-labelledby="flagged-reviews-title">
            <h2 id="flagged-reviews-title">Flagged provider reviews</h2>
            <p className="section-lead">Flagged reviews do not count toward a provider rating until staff keep them.</p>
            {flaggedReviews.length === 0 ? <p className="empty-state">No flagged reviews.</p> : null}
            <ul className="work-list">
              {flaggedReviews.map((review) => (
                <li key={review.id}>
                  <div>
                    <strong>{review.rating} ★ for {providerName(review.providerId)}</strong>
                    <span>“{review.comment || "No comment"}” — {review.author}, {when(review.createdAt)}</span>
                  </div>
                  <div className="work-actions">
                    <button className="secondary-action" type="button" onClick={() => void act(`Kept a review for ${providerName(review.providerId)}.`, (store) => store.setReviewStatus(review.id, "published"))}>Keep review</button>
                    <button className="secondary-action danger" type="button" onClick={() => void act(`Removed a review for ${providerName(review.providerId)}.`, (store) => store.setReviewStatus(review.id, "removed"))}>Remove review</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {tab === "assisted" ? (
        <section className="page-section" aria-labelledby="assisted-title">
          <h2 id="assisted-title">Assisted listings</h2>
          <p className="section-lead">Track clients who asked staff to prepare their listing. Cases stay in this browser.</p>
          <div className="panel-columns">
            <form
              className="panel-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const values = new FormData(form);
                const created = addAssistedCase({
                  clientLabel: String(values.get("clientLabel")),
                  providerId: String(values.get("providerId") ?? ""),
                  notes: String(values.get("notes") ?? ""),
                  assignedTo: staff.name,
                });
                form.reset();
                record(`Opened assisted case “${created.clientLabel}”.`);
              }}
            >
              <h3>New assisted case</h3>
              <label>Client reference<input name="clientLabel" required maxLength={80} placeholder="e.g., Walk-in owner, Mati lot" /></label>
              <label>Provider profile
                <select name="providerId" defaultValue="">
                  <option value="">Not created yet</option>
                  {data.providers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>Listing notes<textarea name="notes" rows={3} maxLength={600} placeholder="Property type, location, what the client still needs to send" /></label>
              <p className="demo-warning" role="note">Do not enter IDs or private contact details in case notes.</p>
              <button className="primary-action" type="submit">Open case</button>
            </form>
            <ul className="work-list">
              {cases.length === 0 ? <li className="empty-state">No assisted cases yet.</li> : null}
              {cases.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.clientLabel}</strong>
                    <span>{providerName(item.providerId)} · assigned to {item.assignedTo} · updated {when(item.updatedAt)}</span>
                    {item.notes ? <span>{item.notes}</span> : null}
                  </div>
                  <div className="work-actions">
                    <label className="inline-field">Status
                      <select
                        value={item.status}
                        onChange={(event) => {
                          updateAssistedCase(item.id, { status: event.target.value as AssistedStatus });
                          record(`Case “${item.clientLabel}” set to ${ASSISTED_STATUS_LABELS[event.target.value as AssistedStatus]}.`);
                        }}
                      >
                        {Object.entries(ASSISTED_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label className="inline-field">Linked listing
                      <select
                        value={item.propertyId ?? ""}
                        onChange={(event) => {
                          updateAssistedCase(item.id, { propertyId: event.target.value || undefined });
                          record(`Case “${item.clientLabel}” linked to a listing.`);
                        }}
                      >
                        <option value="">None</option>
                        {data.properties.filter((property) => property.assistedBy).map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}
                      </select>
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {tab === "suspended" ? (
        <section className="page-section" aria-labelledby="suspended-title">
          <h2 id="suspended-title">Suspended listings</h2>
          <p className="section-lead">Suspended listings are hidden from search, the map, provider pages, and direct links.</p>
          {suspended.length === 0 ? <p className="empty-state">No suspended listings.</p> : null}
          <ul className="work-list">
            {suspended.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{formatPrice(item)} · {areaLabel(item)} · {providerName(item.providerId)}</span>
                </div>
                <div className="work-actions">
                  {allowed("restore-listing") ? (
                    <>
                      <button className="secondary-action" type="button" onClick={() => void act(`Restored “${item.title}” to the review queue.`, (store) => store.updateProperty(item.id, { review: "pending" }))}>Restore to queue</button>
                      <button
                        className="secondary-action danger"
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete “${item.title}” permanently? This cannot be undone.`))
                            void act(`Deleted “${item.title}”.`, (store) => store.removeProperty(item.id));
                        }}
                      >
                        Delete permanently
                      </button>
                    </>
                  ) : (
                    <span className="work-warning">An administrator can restore or delete this listing.</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "providers" ? (
        <section className="page-section" aria-labelledby="staff-providers-title">
          <h2 id="staff-providers-title">Providers</h2>
          <div className="panel-columns">
            <ul className="work-list">
              {data.providers.map((item) => (
                <li key={item.id}>
                  <div>
                    <Link href={`/providers/${encodeURIComponent(item.id)}`}><strong>{item.name}</strong></Link>
                    <span>{KIND_LABELS[item.kind]} · {data.properties.filter((property) => property.providerId === item.id).length} listings · {item.staffReviewed ? "Profile reviewed" : "Profile not reviewed"}</span>
                  </div>
                  <div className="work-actions">
                    {allowed("review-provider") ? (
                      <button className="toggle-button" type="button" aria-pressed={item.staffReviewed} onClick={() => void act(`${item.name} ${item.staffReviewed ? "is no longer marked" : "marked"} as staff reviewed.`, (store) => store.updateProvider(item.id, { staffReviewed: !item.staffReviewed }))}>
                        {item.staffReviewed ? <><SealCheck aria-hidden="true" /> Staff reviewed</> : "Mark staff reviewed"}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <form
              className="panel-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const values = new FormData(form);
                const name = String(values.get("name")).trim();
                void act(`Created provider profile “${name}” for an assisted client.`, (store) =>
                  store.addProvider({ id: crypto.randomUUID(), name, kind: String(values.get("kind")) as ProviderKind, staffReviewed: false, joinedAt: new Date().toISOString() }),
                );
                form.reset();
              }}
            >
              <h3>Add a provider for an assisted client</h3>
              <label>Business or owner name<input name="name" required maxLength={120} /></label>
              <label>Type
                <select name="kind" defaultValue="owner">
                  <option value="owner">Property owner</option>
                  <option value="broker">Broker</option>
                  <option value="developer">Developer</option>
                </select>
              </label>
              <button className="primary-action" type="submit" disabled={!ready}>Add provider</button>
            </form>
          </div>
        </section>
      ) : null}

      {tab === "activity" && allowed("view-activity") ? (
        <section className="page-section" aria-labelledby="activity-title">
          <h2 id="activity-title">Activity log</h2>
          <p className="section-lead">The last 100 client and staff actions recorded in this browser. Not a tamper-proof audit trail.</p>
          {activity.length === 0 ? <p className="empty-state">No activity recorded yet.</p> : null}
          <ul className="activity-list">
            {activity.map((entry) => (
              <li key={entry.id}><time dateTime={entry.createdAt}>{when(entry.createdAt)}</time><span>{entry.actor} ({ROLE_LABELS[entry.role]})</span><span>{entry.action}</span></li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
