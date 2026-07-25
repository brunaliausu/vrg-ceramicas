import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const supabasePatterns = [
  {
    protocol: 'https' as const,
    hostname: '**.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
  ...(supabaseHostname
    ? [{
        protocol: 'https' as const,
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      }]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabasePatterns,
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
