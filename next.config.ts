import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // меньше размер деплоя на Railway/Vercel
  reactCompiler: true,
  allowedDevOrigins: ["http://192.168.1.205:3000", "http://192.168.1.205:3001"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 560, 640, 750, 828, 1080, 1200, 1920],
  },
};

export default nextConfig;
