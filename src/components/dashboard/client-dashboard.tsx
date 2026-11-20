"use client";

import Link from "next/link";
import { useState } from "react";
import {
  KIND_LABELS,
  areaLabel,
  formatPrice,
  formatRating,
  providerRatings,
} from "@/lib/listings";
import { logActivity } from "@/lib/local-records";
import { clearSession, setSession } from "@/lib/session";
import type { ListingStatus, Provider, ProviderKind } from "@/lib/types";
import { useDataset } from "@/hooks/use-dataset";
import { useSession } from "@/hooks/use-session";

const STATUSES: ListingStatus[] = ["Available", "Reserved", "Sold"];

export function ClientDashboard() {
  const { data, ready, mutate } = useDataset();
  const [session, refreshSession] = useSession();
  const [note, setNote] = useState("");
  const provider =
    session?.role === "client"
      ? data.providers.find((item) => item.id === session.providerId)
      : undefined;

  const enter = (target: Provider) => {
    setSession({ role: "client", name: target.name, providerId: target.id });
    refreshSession();
  };

  if (!provider)
    return (
      <section className="page-section" aria-labelledby="client-access-title">
        <p className="section-kicker">For owners, brokers, and developers</p>
        <h1 id="client-access-title">Client dashboard</h1>
        <p className="section-lead">Manage your lot listings, organise them by development, and highlight your best available land.</p>
        <p className="demo-warning" role="note">
          Demo access only. Choosing a profile below is not a login and protects nothing. Real accounts need Supabase sign-in with server-side permissions.
        </p>
        <div className="panel-columns">
          <form
            className="panel-form"
            onSubmit={(event) => {
              event.preventDefault();
              const id = String(new FormData(event.currentTarget).get("providerId"));
              const target = data.providers.find((item) => item.id === id);
              if (target) enter(target);
            }}
          >
            <h2>Open an existing profile</h2>
            <label>Provider profile
              <select name="providerId" required>
                {data.providers.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({KIND_LABELS[item.kind]})</option>
                ))}
              </select>
            </label>
            <button className="primary-action" type="submit" disabled={!ready || data.providers.length === 0}>Open dashboard</button>
          </form>
          <form
            className="panel-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              const created: Provider = {
                id: crypto.randomUUID(),
                name: String(values.get("name")).trim(),
                kind: String(values.get("kind")) as ProviderKind,
                serviceArea: String(values.get("serviceArea") ?? "").trim() || undefined,
                staffReviewed: false,
                joinedAt: new Date().toISOString(),
              };
              await mutate((store) => store.addProvider(created));
              enter(created);
            }}
          >
            <h2>Create a new profile</h2>
            <label>Business or owner name<input name="name" required maxLength={120} /></label>
            <label>I am a
              <select name="kind" defaultValue="owner">
                <option value="owner">Land owner</option>
                <option value="broker">Broker</option>
                <option value="developer">Developer</option>
              </select>
            </label>
            <label>Service area (optional)<input name="serviceArea" maxLength={120} placeholder="e.g., Cebu" /></label>
            <button className="primary-action" type="submit" disabled={!ready}>Create profile</button>
          </form>
        </div>
      </section>
    );

  const listings = data.properties.filter((item) => item.providerId === provider.id);
  const groups = data.groups.filter((item) => item.providerId === provider.id);
  const rating = providerRatings(data.reviews).get(provider.id);
  const count = (test: (status: ListingStatus) => boolean) => listings.filter((item) => test(item.status)).length;
  const act = async (message: string, action: Parameters<typeof mutate>[0]) => {
    await mutate(action);
    logActivity(provider.name, "client", message);
    setNote(message);
  };

  return (
    <>
      <section className="page-section" aria-labelledby="dashboard-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Client dashboard · {KIND_LABELS[provider.kind]}</p>
            <h1 id="dashboard-title">{provider.name}</h1>
            <p className="section-lead">{formatRating(rating)}. {provider.staffReviewed ? "Profile reviewed by staff." : "Profile not yet reviewed by staff."}</p>
          </div>
          <div className="heading-actions">
            <a className="primary-action" href="/list-property"><i className="ph ph-plus" aria-hidden="true" /> Add a listing</a>
            <Link className="secondary-action" href={`/providers/${encodeURIComponent(provider.id)}`}>View public page</Link>
            <button className="secondary-action" type="button" onClick={() => { clearSession(); refreshSession(); }}>Switch profile</button>
          </div>
        </div>
        <dl className="stat-row">
          <div><dt>Listings</dt><dd>{listings.length}</dd></div>
          <div><dt>Available</dt><dd>{count((status) => status === "Available")}</dd></div>
          <div><dt>Reserved or sold</dt><dd>{count((status) => status !== "Available")}</dd></div>
          <div><dt>Highlighted</dt><dd>{listings.filter((item) => item.featured).length}</dd></div>
          <div><dt>Waiting for staff review</dt><dd>{listings.filter((item) => item.review === "pending").length}</dd></div>
        </dl>
        <p className="form-note" role="status" aria-live="polite">{note}</p>
      </section>

      <section className="page-section" aria-labelledby="my-listings-title">
        <h2 id="my-listings-title">Your listings</h2>
        {listings.length === 0 ? (
          <p className="empty-state">No listings yet. Use “Add a listing” to pin your first lot plan on the map.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th scope="col">Listing</th><th scope="col">Price</th><th scope="col">Status</th><th scope="col">Group</th><th scope="col">Highlight</th><th scope="col">Staff review</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={item.id}>
                    <th scope="row">
                      <Link href={`/property/${encodeURIComponent(item.id)}`}>{item.title}</Link>
                      <small>{areaLabel(item)}</small>
                    </th>
                    <td>{formatPrice(item)}</td>
                    <td>
                      <select
                        aria-label={`Status of ${item.title}`}
                        value={item.status}
                        onChange={(event) => {
                          // Read the value now: the control is reset before the async save runs.
                          const status = event.target.value as ListingStatus;
                          void act(`${item.title} marked ${status}.`, (store) => store.updateProperty(item.id, { status }));
                        }}
                      >
                        {STATUSES.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label={`Group for ${item.title}`}
                        value={item.groupId ?? ""}
                        onChange={(event) => {
                          const groupId = event.target.value || undefined;
                          void act(`${item.title} moved to ${groups.find((group) => group.id === groupId)?.name ?? "no group"}.`, (store) => store.updateProperty(item.id, { groupId }));
                        }}
                      >
                        <option value="">No group</option>
                        {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <button
                        className="toggle-button"
                        type="button"
                        aria-pressed={Boolean(item.featured)}
                        aria-label={`Highlight ${item.title}`}
                        onClick={() => void act(`${item.title} ${item.featured ? "is no longer highlighted" : "is now highlighted"}.`, (store) => store.updateProperty(item.id, { featured: !item.featured }))}
                      >
                        {item.featured ? "★ Highlighted" : "☆ Highlight"}
                      </button>
                    </td>
                    <td>{item.review === "reviewed" ? "Reviewed" : item.review === "suspended" ? "Suspended — hidden from the public" : "Pending"}</td>
                    <td>
                      <button
                        className="text-button danger"
                        type="button"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => {
                          if (window.confirm(`Remove “${item.title}” permanently?`))
                            void act(`${item.title} removed.`, (store) => store.removeProperty(item.id));
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="page-section page-section-tint" aria-labelledby="groups-title">
        <h2 id="groups-title">Listing groups</h2>
        <p className="section-lead">Show related lots together on your public page, such as a subdivision, development site, or project phase.</p>
        <div className="panel-columns">
          <ul className="group-list">
            {groups.length === 0 ? <li className="empty-state">No groups yet.</li> : null}
            {groups.map((group) => {
              const members = listings.filter((item) => item.groupId === group.id);
              return (
                <li key={group.id}>
                  <strong>{group.name}</strong>
                  <span>{members.length} {members.length === 1 ? "listing" : "listings"}{group.description ? ` · ${group.description}` : ""}</span>
                  <button
                    className="text-button danger"
                    type="button"
                    aria-label={`Delete group ${group.name}`}
                    onClick={() => void act(`Group “${group.name}” deleted. Its listings stay published.`, (store) => store.removeGroup(group.id))}
                  >
                    Delete group
                  </button>
                </li>
              );
            })}
          </ul>
          <form
            className="panel-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const values = new FormData(form);
              const name = String(values.get("name")).trim();
              void act(`Group “${name}” created.`, (store) =>
                store.addGroup({ id: crypto.randomUUID(), providerId: provider.id, name, description: String(values.get("description") ?? "").trim() || undefined }),
              );
              form.reset();
            }}
          >
            <h3>Create a group</h3>
            <label>Group name<input name="name" required maxLength={120} placeholder="e.g., Bayside Phase 2" /></label>
            <label>Short description (optional)<input name="description" maxLength={300} /></label>
            <button className="primary-action" type="submit" disabled={!ready}>Create group</button>
          </form>
        </div>
      </section>

      <section className="page-section" aria-labelledby="profile-edit-title">
        <h2 id="profile-edit-title">Public profile</h2>
        <form
          className="panel-form"
          key={provider.id}
          onSubmit={(event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            void act("Profile updated.", (store) =>
              store.updateProvider(provider.id, {
                tagline: String(values.get("tagline") ?? "").trim() || undefined,
                serviceArea: String(values.get("serviceArea") ?? "").trim() || undefined,
              }),
            );
          }}
        >
          <label>Tagline<input name="tagline" maxLength={200} defaultValue={provider.tagline ?? ""} /></label>
          <label>Service area<input name="serviceArea" maxLength={120} defaultValue={provider.serviceArea ?? ""} /></label>
          <button className="primary-action" type="submit" disabled={!ready}>Save profile</button>
        </form>
      </section>
    </>
  );
}
