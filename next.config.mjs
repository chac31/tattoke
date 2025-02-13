/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'replicate.delivery',
      'replicate.com',
      'avsqykisdwvxtifrewgs.supabase.co',
      'placehold.co'
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      }
    ],
    unoptimized: true
  },
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
