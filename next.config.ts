import type { NextConfig } from "next";
import { validateEnv } from "@/lib/env-validation";

validateEnv();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
