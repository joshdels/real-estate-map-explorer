import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Make the deployment mode a build-time constant in client and server
  // bundles. Turbopack otherwise leaves this shared-module lookup unresolved in
  // browser code, which can accidentally re-enable the bundled development seed.
  env: {
    NEXT_PUBLIC_APP_MODE: process.env.NEXT_PUBLIC_APP_MODE ?? "development",
  },
  // Disabled: StrictMode double-mounts MapLibre map instances in dev, which
  // creates then immediately disposes a map and aborts its web worker load
  // ("worker failed to load"). Imperative map widgets don't tolerate the
  // double-invoke; this has no effect on production rendering.
  reactStrictMode: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
