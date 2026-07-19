const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bazmesaadaat.org';

export default function robots() {
   return {
      rules: [
         {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/auth/'],
         },
      ],
      sitemap: `${SITE_URL}/sitemap.xml`,
      host: SITE_URL,
   };
}
