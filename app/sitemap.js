import fs from 'fs';
import path from 'path';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bazmesaadaat.org';

// ---------------------------------------------------------------------------
// Revalidate every 24 hours — sitemap auto-refreshes as new content is added
// ---------------------------------------------------------------------------
export const revalidate = 86400;

// ---------------------------------------------------------------------------
// Static pages
// ---------------------------------------------------------------------------
const STATIC_ROUTES = [
   { url: '/', changeFrequency: 'weekly', priority: 1.0 },
   { url: '/biographies/view-all', changeFrequency: 'weekly', priority: 0.9 },
   { url: '/khanqahs', changeFrequency: 'weekly', priority: 0.9 },
   { url: '/about', changeFrequency: 'monthly', priority: 0.6 },
   { url: '/contact', changeFrequency: 'monthly', priority: 0.5 },
];

// ---------------------------------------------------------------------------
// Fetch all families from Supabase
// ---------------------------------------------------------------------------
async function fetchFamilyRoutes() {
   try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL,
         process.env.SUPABASE_SERVICE_ROLE_KEY,
         { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data, error } = await supabase
         .from('families')
         .select('qasba, updated_at')
         .order('qasba');

      if (error || !data) return [];

      return data
         .filter((f) => f.qasba)
         .map((f) => ({
            url: `/shajra/${f.qasba}`,
            lastModified: f.updated_at ? new Date(f.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.85,
         }));
   } catch (err) {
      console.error('[sitemap] Failed to fetch families:', err.message);
      // Fallback: read from markdown files if Supabase is unreachable
      return readFamilyRoutesFromFiles();
   }
}

// Fallback: derive family routes from content/family-info/ markdown files
function readFamilyRoutesFromFiles() {
   const dir = path.join(process.cwd(), 'content', 'family-info');
   if (!fs.existsSync(dir)) return [];
   return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({
         url: `/shajra/${f.replace('.md', '')}`,
         lastModified: (() => { try { return fs.statSync(path.join(dir, f)).mtime; } catch { return new Date(); } })(),
         changeFrequency: 'monthly',
         priority: 0.85,
      }));
}

// ---------------------------------------------------------------------------
// Fetch all biographies from Firebase Firestore
// ---------------------------------------------------------------------------
async function fetchBiographyRoutes() {
   try {
      const admin = await import('firebase-admin');
      const adminApp = admin.default;

      if (!adminApp.apps.length) {
         adminApp.initializeApp({
            credential: adminApp.credential.cert({
               projectId: process.env.FIREBASE_PROJECT_ID,
               clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
               privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
         });
      }

      const db = adminApp.firestore();
      const snapshot = await db.collection('biographies').orderBy('createdAt', 'desc').get();

      const routes = [];
      snapshot.forEach((doc) => {
         const data = doc.data();
         const rawName = data.english?.name || data.urdu?.name || '';
         if (!rawName) return;
         const slug = rawName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
         routes.push({
            url: `/biographies/${slug}/view?id=${doc.id}`,
            lastModified: data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
         });
      });

      return routes;
   } catch (err) {
      console.error('[sitemap] Failed to fetch biographies:', err.message);
      return [];
   }
}

// ---------------------------------------------------------------------------
// Next.js sitemap export
// ---------------------------------------------------------------------------
export default async function sitemap() {
   const [familyRoutes, biographyRoutes] = await Promise.all([
      fetchFamilyRoutes(),
      fetchBiographyRoutes(),
   ]);

   const staticEntries = STATIC_ROUTES.map(({ url, ...rest }) => ({
      url: `${SITE_URL}${url}`,
      lastModified: new Date(),
      ...rest,
   }));

   const dynamicEntries = [...familyRoutes, ...biographyRoutes].map(
      ({ url, ...rest }) => ({ url: `${SITE_URL}${url}`, ...rest })
   );

   return [...staticEntries, ...dynamicEntries];
}
