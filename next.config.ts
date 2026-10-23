import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import { redirectsForRemovedPages } from "./src/data/legacyRoutes";

const legacyPageExists = (route: string) =>
  existsSync(path.join(process.cwd(), "src/app/(legacy)", route, "page.tsx"));

const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as {
  version: string;
};

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: version },
  async redirects() {
    return redirectsForRemovedPages(legacyPageExists);
  },
};

export default withFlowbiteReact(nextConfig);
