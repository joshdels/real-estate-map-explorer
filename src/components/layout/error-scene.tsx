"use client";

import Link from "next/link";
import { House, MagnifyingGlass } from "@phosphor-icons/react";

/**
 * Shared branded error surface for 404, 500, and other error pages.
 * Uses the hero image styling and always offers a clear way back to the
 * homepage. A Client Component (the Phosphor icons need React context), so the
 * Server Component `not-found.tsx` renders it as a client child. Pass a
 * ready-made action node (such as a Try again button) through `action`; when
 * present it becomes the primary action and the homepage link steps back.
 */
export function ErrorScene({
  code,
  title,
  message,
  action,
}: {
  code: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <main className="error-scene" role="alert" aria-labelledby="error-title">
      <div className="error-scene-inner">
        <p className="error-code" aria-hidden="true">
          {code}
        </p>
        <h1 id="error-title">{title}</h1>
        <p className="error-lead">{message}</p>
        <div className="error-actions">
          {action}
          <Link
            className={`error-button ${action ? "error-button-ghost" : "error-button-primary"}`}
            href="/"
          >
            <House aria-hidden="true" />
            Back to homepage
          </Link>
          <a className="error-button error-button-ghost" href="/explore">
            <MagnifyingGlass aria-hidden="true" />
            Explore lots
          </a>
        </div>
        <p className="error-support">Reference {code}. If this keeps happening, try again shortly.</p>
      </div>
    </main>
  );
}
