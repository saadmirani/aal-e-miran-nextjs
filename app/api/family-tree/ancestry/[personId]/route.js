import { getSupabaseAdmin } from '@/lib/supabaseClient';

/**
 * GET /api/family-tree/ancestry/:personId
 *
 * Lightweight endpoint that walks up the father_id chain entirely on the server
 * and returns the ancestor name array in a single HTTP round-trip from the browser.
 *
 * Server ↔ Supabase latency is ~5-15 ms per hop (same region / VPC),
 * vs ~100-200 ms per hop when the browser calls /api/family-tree/person/{id} in a loop.
 *
 * Response: { chain: [{ id, name }, ...] }  — ordered ancestor → root
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
   try {
      const supabase = getSupabaseAdmin();
      const startId = params.personId;

      const chain = [];
      let currentId = startId;
      const visited = new Set();

      while (currentId && !visited.has(currentId) && chain.length < 60) {
         visited.add(currentId);

         const { data, error } = await supabase
            .from('persons')
            .select('id, name, father_id')
            .eq('id', currentId)
            .single();

         if (error || !data) break;

         chain.push({ id: data.id, name: data.name || '' });
         currentId = data.father_id || null;
      }

      return Response.json({ chain }, {
         headers: { 'Cache-Control': 'no-store' },
      });
   } catch (err) {
      console.error('Ancestry API error:', err);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
   }
}
