"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, CircleNotch, Envelope, Lock, ShieldCheck } from "@phosphor-icons/react";
import { brand } from "@/lib/brand";

type CaptchaState = "idle" | "checking" | "passed";

export function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaState>("idle");
  const [error, setError] = useState<string | null>(null);

  const runCaptcha = () => {
    if (captcha !== "idle") return;
    setCaptcha("checking");
    // Demo only: a real Cloudflare Turnstile token would be verified server-side.
    window.setTimeout(() => setCaptcha("passed"), 900);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (captcha !== "passed") {
      setError("Complete the human check first.");
      return;
    }
    setError(null);
    // Demo only: no credentials are sent or stored. Continue to the client area.
    router.push("/dashboard");
  };

  return (
    <div className="login-split">
      <aside className="login-aside" aria-hidden="true">
        <div className="login-aside-overlay" />
        <div className="login-aside-copy">
          <span className="brand-mark">{brand.shortName}</span>
          <h2>{brand.name}</h2>
          <p>{brand.positioning}</p>
          <ul className="login-aside-points">
            <li>Compare lots on the map</li>
            <li>List and group your land</li>
            <li>Reach buyers across the Philippines</li>
          </ul>
        </div>
      </aside>

      <div className="login-panel">
      <Link className="login-back" href="/">
        <ArrowLeft aria-hidden="true" /> Back to homepage
      </Link>
      <div className="login-card">
        <div className="login-card-head">
          <span className="brand-mark" aria-hidden="true">{brand.shortName}</span>
          <h1>Sign in to {brand.name}</h1>
          <p>Manage your land listings and development groups.</p>
        </div>

        <form className="login-form" onSubmit={submit} noValidate>
          <label className="login-field">
            <span>Email</span>
            <span className="login-input">
              <Envelope aria-hidden="true" />
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </span>
          </label>

          <label className="login-field">
            <span>Password</span>
            <span className="login-input">
              <Lock aria-hidden="true" />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </span>
          </label>

          <div className="login-captcha" data-state={captcha}>
            <button
              type="button"
              className="login-captcha-check"
              role="checkbox"
              aria-checked={captcha === "passed"}
              aria-label="Verify you are human"
              onClick={runCaptcha}
              disabled={captcha !== "idle"}
            >
              {captcha === "passed" ? (
                <CheckCircle weight="fill" aria-hidden="true" />
              ) : captcha === "checking" ? (
                <CircleNotch className="login-captcha-spin" aria-hidden="true" />
              ) : (
                <span className="login-captcha-box" aria-hidden="true" />
              )}
              <span>
                {captcha === "passed" ? "Verified" : captcha === "checking" ? "Checking..." : "Verify you are human"}
              </span>
            </button>
            <span className="login-captcha-brand">
              <ShieldCheck aria-hidden="true" />
              Cloudflare Turnstile (demo)
            </span>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="ui-button login-submit">Sign in</button>
        </form>

        <p className="login-alt">
          No account yet? <Link href="/become-a-provider">Become a provider</Link>
        </p>
        <p className="login-demo-note" role="note">
          Demo sign in. No real account, password, or human check is used, and nothing you type is stored or sent.
        </p>
      </div>
      </div>
    </div>
  );
}
