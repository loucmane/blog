import path from "node:path";
import { fileURLToPath } from "node:url";

const researchRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: researchRoot,
  poweredByHeader: false,
  turbopack: {
    root: researchRoot,
  },
};

export default nextConfig;
