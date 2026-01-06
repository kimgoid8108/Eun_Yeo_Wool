import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/players",
        destination: "/executives",
        permanent: true, // 308 Permanent Redirect
      },
    ];
  },
};

export default nextConfig;
