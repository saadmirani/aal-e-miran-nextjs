import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { requireEditorAuth } from '@/lib/editorAuth';
import { bustFamilyTreeCache } from '@/lib/familyTreeCache';

export const dynamic = 'force-dynamic';

// Remove person from family
export async function POST(request) {
   try {
      const authResult = await requireEditorAuth();
      if (authResult instanceof Response) return authResult;

      const supabase = getSupabaseAdmin();
      const { familyId, personId } = await request.json();

      if (!familyId || !personId) {
         return Response.json(
            { error: 'familyId and personId required' },
            { status: 400 }
         );
      }

      const { data: existingLink, error: linkCheckError } = await supabase
         .from('family_persons')
         .select('person_id')
         .eq('family_id', familyId)
         .eq('person_id', personId)
         .maybeSingle();

      if (linkCheckError) throw linkCheckError;

      if (!existingLink) {
         return Response.json(
            { error: 'Person was not linked to this family (no mapping removed)' },
            { status: 404 }
         );
      }

      const { error } = await supabase
         .from('family_persons')
         .delete()
         .eq('family_id', familyId)
         .eq('person_id', personId);

      if (error) throw error;

      bustFamilyTreeCache();

      return Response.json({ success: true, message: 'Person removed from family' });

   } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
   }
}
