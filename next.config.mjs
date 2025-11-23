/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || (() => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      return apiUrl.replace('/api/v1', '');
    })(),
  },
  
  // Production optimizations
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Security headers are handled by vercel.json
  // Headers in next.config.mjs are only applied during local development
  
  // Output configuration for static export (if needed)
  // output: 'standalone', // Uncomment if using standalone mode
  
  // Power by header
  poweredByHeader: false,
};

export default nextConfig;


