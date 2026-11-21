import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, loginWithEmail, logoutFromDjango } from "@/lib/django-auth";

const user = {
  pk: 1,
  email: "staff@example.test",
  first_name: "",
  last_name: "",
  role: "employee" as const,
  provider_id: null,
};

describe("Django authentication", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("logs in with email and password, then reads the cookie-backed user", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(user), { status: 200 }));
    await expect(loginWithEmail("staff@example.test", "password")).resolves.toEqual(user);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v1/auth/login/",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("treats an unauthorized user response as signed out", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("logs out through the Django API", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    await logoutFromDjango();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/auth/logout/",
      { method: "POST", credentials: "include" },
    );
  });
});
