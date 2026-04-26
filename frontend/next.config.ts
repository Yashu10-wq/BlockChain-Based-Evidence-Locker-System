import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: 'build',
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
