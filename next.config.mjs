/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Add custom security headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // 🔒 You can add other useful security headers too:
          // { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
