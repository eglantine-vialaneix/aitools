import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "/*": ["./app/backend/.venv/**/*"],
  },
};

export default nextConfig;
