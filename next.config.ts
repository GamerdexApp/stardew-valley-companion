import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import { redirectsForRemovedPages } from "./src/data/legacyRoutes";

const legacyPageExists = (route: string) =>
  existsSync(path.join(process.cwd(), "src/app/(legacy)", route, "page.tsx"));

const nextConfig: NextConfig = {
  async redirects() {
    return redirectsForRemovedPages(legacyPageExists);
  },
};

export default withFlowbiteReact(nextConfig);
