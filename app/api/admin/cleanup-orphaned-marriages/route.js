import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { requireEditorAuth } from '@/lib/editorAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cleanup-orphaned-marriages
 * Deletes marriage rows where either spouse no longer exists in the persons table.
 */
export async function POST(request) {
   try {
      const authResult = await requireEditorAuth();
      if (authResult instanceof Response) return authResult;

      const supabase = getSupabaseAdmin();

      // Get all marriages
      const { data: allMarriages, error: mErr } = await supabase
         .from('marriages')
         .select('id, spouse1_id, spouse2_id');

      if (mErr) {
         return Response.json({ error: mErr.message }, { status: 500 });
      }

      if (!allMarriages || allMarriages.length === 0) {
         return Response.json({ deleted: 0, message: 'No marriages found' });
      }

      const allSpouseIds = [...new Set([
         ...allMarriages.map(m => m.spouse1_id),
         ...allMarriages.map(m => m.spouse2_id)
      ])];

      const { data: existingPersons = [] } = await supabase
         .from('persons')
         .select('id')
         .in('id', allSpouseIds);

      const existingIds = new Set(existingPersons.map(p => p.id));

      const orphanedIds = allMarriages
         .filter(m => !existingIds.has(m.spouse1_id) || !existingIds.has(m.spouse2_id))
         .map(m => m.id);

      if (orphanedIds.length === 0) {
         return Response.json({ deleted: 0, message: 'No orphaned marriages found' });
      }

      const { error: delErr } = await supabase
         .from('marriages')
         .delete()
         .in('id', orphanedIds);

      if (delErr) {
         return Response.json({ error: delErr.message }, { status: 500 });
      }

      return Response.json({
         success: true,
         deleted: orphanedIds.length,
         message: `Deleted ${orphanedIds.length} orphaned marriage record(s)`
      });

   } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
   }
}
