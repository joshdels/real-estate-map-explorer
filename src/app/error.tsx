"use client";

import { useEffect } from "react";
import { ArrowClockwise } from "@phosphor-icons/react";
import { ErrorScene } from "@/components/layout/error-scene";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";

// Error boundaries must be Client Components. `retry` re-renders this segment;
// older Next.js passed `reset`, so fall back to it if `retry` is absent.
export default function ErrorPage({
  error,
  retry,
  reset,
}: {
  error: unknown;
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const tryAgain = retry ?? reset;

  return (
    <div className="page-shell">
      <SiteHeader />
      <ErrorScene
        code="500"
        title="Something went wrong on our side"
        message="This page did not load. The problem is usually short lived. Try again, or head back to the homepage."
        action={
          tryAgain ? (
            <button
              className="error-button error-button-primary"
              type="button"
              onClick={() => tryAgain()}
            >
              <ArrowClockwise aria-hidden="true" />
              Try again
            </button>
          ) : undefined
        }
      />
      <SiteFooter />
    </div>
  );
}
