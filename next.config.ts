import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://rayopa.onrender.com";
    return [
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: "/api/workflows/:path*",
        destination: `${backendUrl}/api/workflows/:path*`,
      },
      {
        source: "/api/invoices/:path*",
        destination: `${backendUrl}/api/invoices/:path*`,
      },
      {
        source: "/api/customers/:path*",
        destination: `${backendUrl}/api/customers/:path*`,
      },
      {
        source: "/api/audit/:path*",
        destination: `${backendUrl}/api/audit/:path*`,
      },
    ];
  },
};

export default nextConfig;
