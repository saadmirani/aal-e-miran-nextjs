import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
   const { qasba } = await params;

   // Sanitize: only allow alphanumeric and hyphens to prevent path traversal
   if (!qasba || !/^[a-z0-9-]+$/i.test(qasba)) {
      return Response.json({ error: 'Invalid family identifier' }, { status: 400 });
   }

   const filePath = path.join(process.cwd(), 'content', 'family-info', `${qasba}.md`);

   if (!fs.existsSync(filePath)) {
      return Response.json({ error: 'No information available for this family' }, { status: 404 });
   }

   try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content } = matter(raw);

      return Response.json({
         success: true,
         frontmatter,
         content,
      });
   } catch (err) {
      console.error('Failed to read family info:', err);
      return Response.json({ error: 'Failed to read family information' }, { status: 500 });
   }
}
