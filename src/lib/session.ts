import type { SessionRole, StaffRole } from "@/lib/types";

/**
 * Local demo session. This is a visible convenience for trying each role in
 * one browser. It is NOT authentication and must never guard real private
 * data: production roles need Django authentication and server-side authorization.
 */
export interface Session {
  role: SessionRole;
  name: string;
  /** Set for client sessions: the provider profile being managed. */
  providerId?: string;
}

const KEY = "spl-demo-session";

/** Documented local passcodes. Deliberately not secret. */
const STAFF_PASSCODES: Record<string, StaffRole> = {
  admin: "admin",
  staff: "employee",
};

export const ROLE_LABELS: Record<SessionRole, string> = {
  admin: "Administrator",
  employee: "Employee",
  client: "Client",
};

export type StaffAction =
  | "review-listing"
  | "resolve-report"
  | "moderate-review"
  | "assist-listing"
  | "suspend-listing"
  | "restore-listing"
  | "delete-listing"
  | "review-provider"
  | "view-activity";

const EMPLOYEE_ACTIONS: readonly StaffAction[] = [
  "review-listing",
  "resolve-report",
  "moderate-review",
  "assist-listing",
  "suspend-listing",
];

export function roleForPasscode(passcode: string): StaffRole | undefined {
  return STAFF_PASSCODES[passcode.trim()];
}

export function can(session: Session | null, action: StaffAction): boolean {
  if (!session) return false;
  if (session.role === "admin") return true;
  return session.role === "employee" && EMPLOYEE_ACTIONS.includes(action);
}

export function isStaff(session: Session | null): boolean {
  return session?.role === "admin" || session?.role === "employee";
}

export function getSession(): Session | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as Session | null;
    if (!parsed || !(parsed.role in ROLE_LABELS) || typeof parsed.name !== "string")
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* Session storage unavailable: the role lasts for this page only. */
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* Nothing to clear. */
  }
}
