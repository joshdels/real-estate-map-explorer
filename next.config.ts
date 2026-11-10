import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
