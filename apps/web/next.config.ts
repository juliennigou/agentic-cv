import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@agentic-cv/db", "@agentic-cv/shared"]
};

export default nextConfig;
