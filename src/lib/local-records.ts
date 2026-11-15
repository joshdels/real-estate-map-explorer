import type {
  ActivityEntry,
  AssistedCase,
  AssistedStatus,
  ListingReport,
  SessionRole,
} from "@/lib/types";

/**
 * Browser-only operational records: visitor reports, staff-assisted listing
 * cases, and the staff activity log. They are deliberately kept out of the
 * shared dataset, which anonymous visitors can read. Nothing here is a
 * production audit trail.
 */
const REPORTS_KEY = "spl-listing-reports";
const ASSISTED_KEY = "spl-assisted-listings";
const ACTIVITY_KEY = "spl-activity-log";

export const REPORT_REASONS = [
  "Scam or fraudulent listing",
  "Wrong location or boundary",
  "Wrong price or already sold",
  "Sexual or explicit content",
  "Inappropriate or offensive",
  "Other",
] as const;

function read<T>(key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, records: T[], limit = 200): void {
  try {
    localStorage.setItem(key, JSON.stringify(records.slice(0, limit)));
  } catch {
    /* Storage unavailable: these records are best-effort. */
  }
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function listReports(): ListingReport[] {
  return read<ListingReport>(REPORTS_KEY);
}

export function addReport(propertyId: string, reason: string, title?: string): void {
  write(REPORTS_KEY, [
    {
      id: newId("report"),
      propertyId,
      title,
      reason: reason.trim().slice(0, 200) || "Other",
      createdAt: new Date().toISOString(),
    },
    ...listReports(),
  ]);
}

export function removeReport(id: string): void {
  write(REPORTS_KEY, listReports().filter((report) => report.id !== id));
}

export function removeReportsFor(propertyId: string): void {
  write(REPORTS_KEY, listReports().filter((report) => report.propertyId !== propertyId));
}

export function listAssistedCases(): AssistedCase[] {
  return read<AssistedCase>(ASSISTED_KEY);
}

export function addAssistedCase(
  input: Pick<AssistedCase, "clientLabel" | "notes" | "assignedTo" | "providerId">,
): AssistedCase {
  const now = new Date().toISOString();
  const record: AssistedCase = {
    id: newId("assist"),
    clientLabel: input.clientLabel.trim().slice(0, 80),
    notes: input.notes.trim().slice(0, 600),
    assignedTo: input.assignedTo,
    providerId: input.providerId || undefined,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
  write(ASSISTED_KEY, [record, ...listAssistedCases()]);
  return record;
}

export function updateAssistedCase(
  id: string,
  patch: Partial<Pick<AssistedCase, "status" | "propertyId" | "assignedTo">>,
): void {
  write(
    ASSISTED_KEY,
    listAssistedCases().map((item) =>
      item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
    ),
  );
}

export const ASSISTED_STATUS_LABELS: Record<AssistedStatus, string> = {
  new: "New request",
  "in-progress": "In progress",
  published: "Listing published",
  closed: "Closed",
};

export function listActivity(): ActivityEntry[] {
  return read<ActivityEntry>(ACTIVITY_KEY);
}

export function logActivity(actor: string, role: SessionRole, action: string): void {
  write(
    ACTIVITY_KEY,
    [
      { id: newId("activity"), actor, role, action, createdAt: new Date().toISOString() },
      ...listActivity(),
    ],
    100,
  );
}
