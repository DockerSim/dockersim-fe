import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // <-- 이 줄을 추가합니다.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
