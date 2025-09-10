
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in the application
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            // IMPORTANT: For production, replace '*' with your specific Odoo domain for security.
            // e.g., 'https://your-odoo-site.com'
            value: '*', 
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS, PATCH, DELETE, POST, PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
           // This header is necessary to allow embedding in an iframe.
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *;", // For production, replace * with your Odoo domain.
          }
        ],
      },
    ];
  },
};

export default nextConfig;
