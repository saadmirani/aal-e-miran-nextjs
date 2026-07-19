import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bazmesaadaat.org';

// ---------------------------------------------------------------------------
// Helper: read and parse a family-info markdown file
// ---------------------------------------------------------------------------
function readFamilyInfo(qasba) {
   if (!qasba || !/^[a-z0-9-]+$/i.test(qasba)) return null;
   const filePath = path.join(process.cwd(), 'content', 'family-info', `${qasba}.md`);
   if (!fs.existsSync(filePath)) return null;
   try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content } = matter(raw);
      return { frontmatter, content };
   } catch {
      return null;
   }
}

// ---------------------------------------------------------------------------
// Helper: derive a readable title from a qasba slug
// ---------------------------------------------------------------------------
function slugToTitle(slug) {
   return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
}

// ---------------------------------------------------------------------------
// Helper: extract first meaningful paragraph as a plain-text description
// ---------------------------------------------------------------------------
function extractDescription(content, maxLength = 160) {
   const cleaned = content
      .replace(/^---[\s\S]*?---/, '')   // strip frontmatter block if any
      .replace(/^#+.+$/gm, '')          // strip headings
      .replace(/\*\*(.+?)\*\*/g, '$1') // strip bold
      .replace(/\*(.+?)\*/g, '$1')     // strip italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip links
      .replace(/[>|-]+/g, '')           // strip blockquote / hr markers
      .replace(/\s{2,}/g, ' ')
      .trim();
   const firstParagraph = cleaned.split(/\n{2,}/)[0].trim();
   return firstParagraph.length > maxLength
      ? firstParagraph.slice(0, maxLength - 1) + '…'
      : firstParagraph;
}

// ---------------------------------------------------------------------------
// generateStaticParams — pre-renders known families at build time.
// New families added to the DB later still work via on-demand SSR
// because dynamicParams = true (Next.js default). No redeployment needed.
// ---------------------------------------------------------------------------
export async function generateStaticParams() {
   const dir = path.join(process.cwd(), 'content', 'family-info');
   if (!fs.existsSync(dir)) return [];
   const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
   return files.map((f) => ({ qasba: f.replace('.md', '') }));
}

// ---------------------------------------------------------------------------
// generateMetadata — per-family SEO tags
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }) {
   const { qasba } = await params;

   const info = readFamilyInfo(qasba);
   const fm = info?.frontmatter || {};

   const familyName = fm.family_name || slugToTitle(qasba);
   const location = fm.location || 'Bihar, India';
   const ancestor = fm.moris_e_aala || '';

   const description = info?.content
      ? extractDescription(info.content)
      : `Explore the complete genealogical family tree of ${familyName}, a distinguished Saadaat family from ${location}.`;

   const keywords = [
      'family tree',
      'genealogy',
      'shajra nasab',
      'Saadaat',
      'Bihar',
      familyName,
      location,
      ...(ancestor ? [ancestor] : []),
      'Bazm-e-Saadaat',
      'Islamic genealogy',
      'Syed family',
   ];

   const title = `${familyName} — Shajra Nasab | Bazm-e-Saadaat`;
   const url = `${SITE_URL}/shajra/${qasba}`;

   return {
      title,
      description,
      keywords,
      alternates: { canonical: url },
      openGraph: {
         title,
         description,
         url,
         siteName: 'Bazm-e-Saadaat',
         type: 'website',
         locale: 'en_IN',
      },
      twitter: {
         card: 'summary',
         title,
         description,
      },
   };
}

// ---------------------------------------------------------------------------
// Layout — injects JSON-LD structured data alongside children
// ---------------------------------------------------------------------------
export default async function ShajraQasbaLayout({ children, params }) {
   const { qasba } = await params;
   const info = readFamilyInfo(qasba);
   const fm = info?.frontmatter || {};

   const familyName = fm.family_name || slugToTitle(qasba);
   const location = fm.location || 'Bihar, India';
   const ancestor = fm.moris_e_aala || '';
   const url = `${SITE_URL}/shajra/${qasba}`;

   const description = info?.content
      ? extractDescription(info.content)
      : `Genealogical family tree of ${familyName} from ${location}.`;

   const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
         {
            '@type': 'WebPage',
            '@id': url,
            url,
            name: `${familyName} — Shajra Nasab | Bazm-e-Saadaat`,
            description,
            isPartOf: { '@id': SITE_URL },
            breadcrumb: {
               '@type': 'BreadcrumbList',
               itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                  { '@type': 'ListItem', position: 2, name: 'Family Trees', item: `${SITE_URL}/shajra` },
                  { '@type': 'ListItem', position: 3, name: familyName, item: url },
               ],
            },
         },
         {
            '@type': 'FamilyRelationship',
            name: familyName,
            description,
            ...(location && { location: { '@type': 'Place', name: location } }),
            ...(ancestor && {
               founder: { '@type': 'Person', name: ancestor },
            }),
         },
      ],
   };

   return (
      <>
         <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
         />
         {children}
      </>
   );
}
