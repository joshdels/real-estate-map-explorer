import type { User } from "@supabase/supabase-js";
import { qs } from "./dom";
import { createSupabaseBrowserClient } from "./lib/supabase/client";

export class AuthController {
  private readonly client = createSupabaseBrowserClient();
  private user: User | null = null;

  async initialize(): Promise<void> {
    const signIn = qs<HTMLButtonElement>("#google-sign-in");
    const signOut = qs<HTMLButtonElement>("#google-sign-out");
    signIn.addEventListener("click", () => void this.signIn());
    signOut.addEventListener("click", () => void this.signOut());

    const error = new URLSearchParams(window.location.search).get("auth_error");
    if (error) {
      qs("#auth-status").textContent = error;
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (!this.client) {
      this.render();
      return;
    }
    const { data } = await this.client.auth.getUser();
    this.user = data.user;
    this.client.auth.onAuthStateChange((_event, session) => {
      this.user = session?.user ?? null;
      this.render();
    });
    this.render();
  }

  isAuthenticated(): boolean {
    return Boolean(this.user);
  }

  private async signIn(): Promise<void> {
    if (!this.client) {
      qs("#auth-status").textContent =
        "Supabase must be configured before Google sign-in can be used.";
      return;
    }
    qs("#auth-status").textContent = "Opening Google sign-in…";
    const { error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    if (error) qs("#auth-status").textContent = error.message;
  }

  private async signOut(): Promise<void> {
    const { error } = (await this.client?.auth.signOut()) ?? {};
    qs("#auth-status").textContent = error
      ? error.message
      : "You have been signed out.";
  }

  private render(): void {
    const signIn = qs<HTMLButtonElement>("#google-sign-in");
    const signOut = qs<HTMLButtonElement>("#google-sign-out");
    signIn.hidden = Boolean(this.user);
    signOut.hidden = !this.user;
    qs("#auth-status").textContent = this.user
      ? `Signed in as ${this.user.email ?? "Google user"}.`
      : "Sign in with an authorized Google account for Supabase-backed admin writes, or use the local passcode for this browser only.";
  }
}
