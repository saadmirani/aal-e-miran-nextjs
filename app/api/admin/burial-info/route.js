import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { requireEditorAuth } from '@/lib/editorAuth';
import { bustFamilyTreeCache } from '@/lib/familyTreeCache';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/burial-info?q=<search>
 * Returns distinct burial places matching the query (for autocomplete).
 * Each entry includes the most recent map URL stored for that place.
 */
export async function GET(request) {
   try {
      const supabase = getSupabaseAdmin();
      const { searchParams } = new URL(request.url);
      const q = (searchParams.get('q') || '').trim();

      if (q.length < 1) {
         return Response.json({ success: true, data: [] });
      }

      const { data, error } = await supabase
         .from('burial_info')
         .select('burial_place, burial_map_url')
         .ilike('burial_place', `%${q}%`)
         .not('burial_place', 'is', null)
         .limit(20);

      if (error) throw error;

      // Deduplicate: keep one entry per unique place name (prefer the one with a map URL)
      const seen = new Map();
      for (const row of data || []) {
         const key = row.burial_place.trim().toLowerCase();
         if (!seen.has(key) || (!seen.get(key).burial_map_url && row.burial_map_url)) {
            seen.set(key, row);
         }
      }

      const results = [...seen.values()].map(r => ({
         place: r.burial_place,
         mapUrl: r.burial_map_url || null
      }));

      return Response.json({ success: true, data: results });
   } catch (err) {
      console.error('[burial-info GET]', err);
      return Response.json({ error: 'Failed to fetch burial places' }, { status: 500 });
   }
}

/**
 * POST /api/admin/burial-info
 * Create or update (upsert) burial information
 */
export async function POST(request) {
   try {
      const authResult = await requireEditorAuth();
      if (authResult instanceof Response) return authResult;

      const supabase = getSupabaseAdmin();
      const data = await request.json();

      if (!data.personId) {
         return Response.json(
            { error: 'Person ID is required' },
            { status: 400 }
         );
      }

      // Check if burial info already exists for this person
      const { data: existing } = await supabase
         .from('burial_info')
         .select('id')
         .eq('person_id', data.personId)
         .single();

      let burialInfo, error;
      if (existing) {
         // Update existing
         ({ data: burialInfo, error } = await supabase
            .from('burial_info')
            .update({
               burial_place: data.burial_place || null,
               burial_map_url: data.burial_map_url || null
            })
            .eq('id', existing.id)
            .select()
            .single());
      } else {
         // Insert new
         ({ data: burialInfo, error } = await supabase
            .from('burial_info')
            .insert([{
               person_id: data.personId,
               burial_place: data.burial_place || null,
               burial_map_url: data.burial_map_url || null
            }])
            .select()
            .single());
      }

      if (error) {
         return Response.json(
            { error: 'Failed to save burial info' },
            { status: 500 }
         );
      }

      bustFamilyTreeCache();

      return Response.json({
         success: true,
         message: 'Burial info saved successfully',
         data: burialInfo
      });

   } catch (error) {
      return Response.json(
         { error: error.message },
         { status: 500 }
      );
   }
}
