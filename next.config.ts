import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Allow external dev tunnels (ngrok, localtunnel, LAN access)
  // Next.js 15 blocks requests from non-localhost origins by default.
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
    "192.168.*",
    "10.*",
  ],

  turbopack: {},
};

export default nextConfig;
