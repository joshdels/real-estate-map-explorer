"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="fatal-message" role="alert">
      <p>The map explorer could not load.</p>
      <button className="primary-button" type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
