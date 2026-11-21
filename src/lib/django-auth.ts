export interface DjangoUser {
  pk: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "administrator" | "employee" | "client";
  provider_id: string | null;
}

function apiUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!value) throw new Error("The Django API is not configured.");
  return value;
}

async function errorMessage(response: Response): Promise<string> {
  const fallback = `Authentication failed (${response.status}).`;
  try {
    const body = (await response.json()) as Record<string, unknown>;
    const value = body.non_field_errors ?? body.detail ?? body.email ?? body.password;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    return typeof value === "string" ? value : fallback;
  } catch {
    return fallback;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<DjangoUser> {
  const response = await fetch(`${apiUrl()}/api/v1/auth/login/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  const user = await getCurrentUser(true);
  if (!user) throw new Error("The login cookie was not accepted.");
  return user;
}

export async function getCurrentUser(required = false): Promise<DjangoUser | null> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl()}/api/v1/auth/user/`, { credentials: "include" });
  } catch (error) {
    if (required) throw error;
    return null;
  }
  if (response.status === 401 || response.status === 403) {
    if (required) throw new Error("The login cookie was not accepted.");
    return null;
  }
  if (!response.ok) throw new Error(await errorMessage(response));
  return (await response.json()) as DjangoUser;
}

export async function logoutFromDjango(): Promise<void> {
  const response = await fetch(`${apiUrl()}/api/v1/auth/logout/`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error(await errorMessage(response));
}
