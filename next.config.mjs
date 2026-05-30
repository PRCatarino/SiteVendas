/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["playwright", "playwright-core", "pg"],
};

export default nextConfig;
