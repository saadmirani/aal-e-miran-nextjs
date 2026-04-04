/** @type {import('next').NextConfig} */
const nextConfig = {
   reactStrictMode: true,
   swcMinify: true,
   images: {
      unoptimized: true,
   },
   webpack: (config, { isServer }) => {
      // Add support for importing markdown files as raw text
      config.module.rules.push({
         test: /\.md$/,
         use: 'raw-loader',
      });

      // Handle firebase-admin in edge runtime (middleware)
      if (!isServer) {
         config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            crypto: false,
         };
      }

      return config;
   },
   // For deploying on Vercel with rewrites
   async rewrites() {
      return {
         beforeFiles: [
            // These rewrites handle routing for the biography and books pages
            {
               source: '/biography/:slug',
               destination: '/biography/:slug',
            },
            {
               source: '/books/:slug',
               destination: '/books/:slug',
            },
         ],
      };
   },
};

module.exports = nextConfig;
