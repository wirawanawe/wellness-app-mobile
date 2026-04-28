import path from 'path';
import type { NextConfig } from 'next';
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

const isDev = process.env.NODE_ENV === "development";

const withSerwist = isDev 
  ? (config: NextConfig) => config 
  : withSerwistInit({
      swSrc: "src/sw.ts",
      swDest: "public/sw.js",
    });

export default withSerwist(nextConfig);
