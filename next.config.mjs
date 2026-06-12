/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Remote image whitelist using env
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(process.env.NEXT_PUBLIC_API_DOMAIN).hostname,
      },
      {
        protocol: "https",
        hostname: "pub-8c442e392dc54f468c2cd6931d82e4ea.r2.dev",
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
