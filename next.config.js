/** @type {import('next').NextConfig} */
const nextConfig = {
   reactStrictMode: true,
   swcMinify: true,
   images: {
      unoptimized: true,
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
