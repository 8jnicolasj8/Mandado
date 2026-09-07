import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Docker / NAS deployment; let Vercel handle its native output
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
};

export default nextConfig;
