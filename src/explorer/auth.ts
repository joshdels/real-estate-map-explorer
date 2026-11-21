import { qs } from "@/explorer/dom";
import { getCurrentUser, logoutFromDjango, type DjangoUser } from "@/lib/django-auth";
import { isProductionMode } from "@/lib/runtime-mode";

export class AuthController {
  private user: DjangoUser | null = null;

  async initialize(): Promise<void> {
    const signOut = qs<HTMLButtonElement>("#django-sign-out");
    signOut.addEventListener("click", () => void this.signOut());
    this.user = await getCurrentUser();
    this.render();
  }

  isAuthenticated(): boolean {
    return Boolean(this.user);
  }

  private async signOut(): Promise<void> {
    try {
      await logoutFromDjango();
      this.user = null;
      this.render();
      qs("#auth-status").textContent = "You have been signed out.";
    } catch (error) {
      qs("#auth-status").textContent =
        error instanceof Error ? error.message : "Sign out failed.";
    }
  }

  private render(): void {
    const signIn = qs<HTMLElement>("#django-sign-in");
    const signOut = qs<HTMLButtonElement>("#django-sign-out");
    signIn.hidden = Boolean(this.user);
    signOut.hidden = !this.user;
    qs("#auth-status").textContent = this.user
      ? `Signed in as ${this.user.email}.`
      : isProductionMode
        ? "Sign in with your email and password."
        : "Sign in with your email and password, or use a local demo passcode.";
  }
}
