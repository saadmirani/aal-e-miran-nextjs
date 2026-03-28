import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Function to read markdown files
export function loadMarkdownContent(contentType, slug, language = 'en') {
   try {
      const filePath = path.join(
         process.cwd(),
         'content',
         contentType,
         slug,
         `${language}.md`
      );

      if (!fs.existsSync(filePath)) {
         return null;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      return {
         frontmatter: data,
         content,
         slug,
      };
   } catch (error) {
      console.error(`Error loading markdown: ${error}`);
      return null;
   }
}

// Function to get all slugs for static generation
export function getAllSlugs(contentType) {
   try {
      const contentDir = path.join(process.cwd(), 'content', contentType);

      if (!fs.existsSync(contentDir)) {
         return [];
      }

      const dirs = fs.readdirSync(contentDir);
      return dirs.filter(dir => {
         const fullPath = path.join(contentDir, dir);
         return fs.statSync(fullPath).isDirectory();
      });
   } catch (error) {
      console.error(`Error getting slugs for ${contentType}: ${error}`);
      return [];
   }
}

// Function to generate metadata for SEO
export function generateSEOMetadata(title, description, slug, type = 'biography') {
   const domain = process.env.NEXT_PUBLIC_DOMAIN || 'bazmesaadaat.com';
   const url = `https://${domain}/${type}/${slug}`;

   return {
      title: `${title} - Aal-e-Miran`,
      description: description || `Full biography and details about ${title}`,
      openGraph: {
         title,
         description,
         url,
         type: 'article',
      },
      twitter: {
         card: 'summary_large_image',
         title,
         description,
      },
   };
}
