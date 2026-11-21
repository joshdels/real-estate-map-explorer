"use client";

import { useEffect } from "react";
import Link from "next/link";

// Catches errors in the root layout itself. It replaces the root layout, so it
// must render its own <html> and <body> and cannot rely on the app's global
// styles reaching it. Styles are inlined here, echoing the hero: dark indigo
// surface with a neon code. `retry` re-renders the tree; older Next.js used
// `reset`.
export default function GlobalError({
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
    <html lang="en-PH">
      <head>
        <title>Something went wrong — Open Lot Plans</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={bodyStyle}>
        <main style={innerStyle} role="alert">
          <p style={codeStyle} aria-hidden="true">
            500
          </p>
          <h1 style={titleStyle}>The app could not load</h1>
          <p style={leadStyle}>
            Something went wrong while starting the page. Try again, or go back to the homepage.
          </p>
          <div style={actionsStyle}>
            {tryAgain ? (
              <button type="button" onClick={() => tryAgain()} style={primaryBtn}>
                Try again
              </button>
            ) : null}
            <Link href="/" style={tryAgain ? ghostBtn : primaryBtn}>
              Back to homepage
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "48px 20px",
  color: "#fff",
  fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  background:
    "radial-gradient(900px 420px at 85% -10%, rgba(90,78,145,0.18), transparent 70%), linear-gradient(100deg, #081126 0%, #0d142d 55%, #171830 100%)",
};
const innerStyle: React.CSSProperties = { maxWidth: 560, textAlign: "center" };
const codeStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "clamp(4rem, 16vw, 8rem)",
  lineHeight: 1,
  color: "#fff04a",
  textShadow: "0 0 28px rgba(255,240,74,0.22)",
};
const titleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "clamp(1.5rem, 4vw, 2.3rem)",
  lineHeight: 1.1,
};
const leadStyle: React.CSSProperties = {
  margin: "14px auto 0",
  maxWidth: "46ch",
  color: "#d9dcf7",
  fontSize: "1.05rem",
  lineHeight: 1.55,
};
const actionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 12,
  marginTop: 28,
};
const baseBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 46,
  padding: "0 20px",
  borderRadius: 10,
  fontWeight: 650,
  fontSize: "1rem",
  textDecoration: "none",
  cursor: "pointer",
  border: "1px solid transparent",
};
const primaryBtn: React.CSSProperties = {
  ...baseBtn,
  background: "#4f57e3",
  color: "#fff",
};
const ghostBtn: React.CSSProperties = {
  ...baseBtn,
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  borderColor: "rgba(255,255,255,0.28)",
};
