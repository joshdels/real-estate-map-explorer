import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addAssistedCase,
  addReport,
  listActivity,
  listAssistedCases,
  listReports,
  logActivity,
  removeReportsFor,
  updateAssistedCase,
} from "@/lib/local-records";
import { can, clearSession, getSession, isStaff, roleForPasscode, setSession } from "@/lib/session";
import { PropertyStore } from "@/lib/store";
import type { DataRepository, Dataset } from "@/lib/types";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("demo roles", () => {
  it("maps the documented passcodes to roles", () => {
    expect(roleForPasscode("admin")).toBe("admin");
    expect(roleForPasscode(" staff ")).toBe("employee");
    expect(roleForPasscode("letmein")).toBeUndefined();
  });

  it("lets employees moderate but keeps destructive actions for admins", () => {
    const employee = { role: "employee" as const, name: "E" };
    const admin = { role: "admin" as const, name: "A" };
    const client = { role: "client" as const, name: "C", providerId: "p" };
    expect(can(employee, "review-listing")).toBe(true);
    expect(can(employee, "suspend-listing")).toBe(true);
    expect(can(employee, "delete-listing")).toBe(false);
    expect(can(employee, "restore-listing")).toBe(false);
    expect(can(employee, "review-provider")).toBe(false);
    expect(can(admin, "delete-listing")).toBe(true);
    expect(can(client, "review-listing")).toBe(false);
    expect(can(null, "review-listing")).toBe(false);
    expect(isStaff(client)).toBe(false);
  });

  it("stores and clears the session, ignoring corrupt values", () => {
    setSession({ role: "client", name: "Sample", providerId: "p1" });
    expect(getSession()).toEqual({ role: "client", name: "Sample", providerId: "p1" });
    clearSession();
    expect(getSession()).toBeNull();
    sessionStorage.setItem("spl-demo-session", '{"role":"owner","name":"x"}');
    expect(getSession()).toBeNull();
  });
});

describe("local operational records", () => {
  it("records reports and clears them per listing", () => {
    addReport("p1", "Scam or fraudulent listing", "Lot 1");
    addReport("p2", "Other");
    addReport("p1", "Wrong price or already sold");
    expect(listReports()).toHaveLength(3);
    removeReportsFor("p1");
    expect(listReports().map((item) => item.propertyId)).toEqual(["p2"]);
  });

  it("tracks an assisted case through to a linked listing", () => {
    const created = addAssistedCase({ clientLabel: "Walk-in owner", notes: "Needs photos", assignedTo: "Staff A", providerId: "" });
    expect(created.status).toBe("new");
    updateAssistedCase(created.id, { status: "published", propertyId: "p9" });
    expect(listAssistedCases()[0]).toMatchObject({ status: "published", propertyId: "p9" });
    expect(listAssistedCases()[0].providerId).toBeUndefined();
  });

  it("keeps the newest activity first", () => {
    logActivity("A", "admin", "first");
    logActivity("B", "employee", "second");
    expect(listActivity().map((item) => item.action)).toEqual(["second", "first"]);
  });
});

describe("store moderation and listing management", () => {
  const seed: Dataset = {
    metadata: { name: "test", version: 1, isSample: true, notice: "sample" },
    utilities: {},
    destinations: [],
    routes: [],
    providers: [
      { id: "prov-a", name: "A", kind: "broker", staffReviewed: false },
      { id: "prov-b", name: "B", kind: "owner", staffReviewed: false },
    ],
    groups: [{ id: "group-b", providerId: "prov-b", name: "B group" }],
    reviews: [],
    properties: [
      { id: "p1", title: "Lot", address: "Sample", coordinates: [1, 2], polygon: [[1, 2], [1, 3], [2, 3]], area: "1 sqm", price: 1, status: "Available", utilities: {}, providerId: "prov-a" },
    ],
  };
  const createStore = async () => {
    const repository: DataRepository = { source: "local", load: vi.fn(async () => structuredClone(seed)), save: vi.fn(async () => undefined) };
    const store = new PropertyStore(repository);
    await store.initialize();
    return { store, repository };
  };

  it("defaults new fields and persists a suspension", async () => {
    const { store, repository } = await createStore();
    expect(store.snapshot().properties[0]).toMatchObject({ review: "pending", purpose: "sale", propertyType: "lot", featured: false });
    expect(await store.updateProperty("p1", { review: "suspended" })).toBe(true);
    expect(store.snapshot().properties[0].review).toBe("suspended");
    expect(repository.save).toHaveBeenCalledOnce();
    expect(await store.updateProperty("missing", { featured: true })).toBe(false);
  });

  it("refuses to place a listing in another provider's group", async () => {
    const { store } = await createStore();
    await store.updateProperty("p1", { groupId: "group-b" });
    expect(store.snapshot().properties[0].groupId).toBeUndefined();
    await store.addGroup({ id: "group-a", providerId: "prov-a", name: "A group" });
    await store.updateProperty("p1", { groupId: "group-a" });
    expect(store.snapshot().properties[0].groupId).toBe("group-a");
    await store.removeGroup("group-a");
    expect(store.snapshot().properties[0].groupId).toBeUndefined();
  });

  it("publishes reviews, then lets staff flag and remove them", async () => {
    const { store } = await createStore();
    await store.addReview({ providerId: "prov-a", rating: 4, comment: "Good", author: "Buyer" });
    await store.addReview({ providerId: "prov-a", rating: 9, comment: "Out of range", author: "Buyer" });
    const reviews = store.snapshot().reviews;
    expect(reviews).toHaveLength(1);
    await store.setReviewStatus(reviews[0].id, "flagged");
    expect(store.snapshot().reviews[0].status).toBe("flagged");
  });
});
