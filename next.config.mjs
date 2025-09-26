/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Remote image whitelist using env
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: new URL(process.env.NEXT_PUBLIC_API_DOMAIN).hostname,
      },
    ],
  },

  // ✅ Custom security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Example extras:
          // { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
