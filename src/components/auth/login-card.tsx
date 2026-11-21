"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleNotch, Envelope, Lock } from "@phosphor-icons/react";
import { brand } from "@/lib/brand";
import { loginWithEmail } from "@/lib/django-auth";

export function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedEmail = email.trim();
    const submittedPassword = password;
    if (!submittedEmail || !submittedPassword) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(submittedEmail, submittedPassword);
      router.push("/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Sign in failed.");
      setSubmitting(false);
    }
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

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="ui-button login-submit" disabled={submitting}>
            {submitting && <CircleNotch className="login-submit-spinner" aria-hidden="true" />}
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="login-alt">
          No account yet? <Link href="/become-a-provider">Become a provider</Link>
        </p>
        <p className="login-demo-note" role="note">Your session is stored in secure Django cookies.</p>
      </div>
      </div>
    </div>
  );
}
