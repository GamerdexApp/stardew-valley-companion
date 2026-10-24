import { readFileSync } from "node:fs";
import type { NextConfig } from "next";
import { legacyRedirects } from "./src/data/legacyRoutes";

const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as {
  version: string;
};

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: version },
  async redirects() {
    return legacyRedirects();
  },
};

export default nextConfig;
