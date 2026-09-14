import type { NextConfig } from "next";

// Suppress Node.js DEP0169 deprecation warning emitted by upstream libraries in Node 22+
if (typeof process !== "undefined" && typeof process.emit === "function") {
  const originalEmit = process.emit;
  // @ts-expect-error override process.emit for warning filtering
  process.emit = function (name: string, data: any, ...args: any[]) {
    if (
      name === "warning" &&
      typeof data === "object" &&
      data &&
      (data.name === "DeprecationWarning" || data.code === "DEP0169") &&
      data.code === "DEP0169"
    ) {
      return false;
    }
    return originalEmit.apply(process, [name, data, ...args] as any);
  };
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {},
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
