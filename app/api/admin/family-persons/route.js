import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { requireEditorAuth } from '@/lib/editorAuth';
import { bustFamilyTreeCache } from '@/lib/familyTreeCache';

export const dynamic = 'force-dynamic';

// Add person to family
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

      const { data, error } = await supabase
         .from('family_persons')
         .insert([{
            family_id: familyId,
            person_id: personId,
            role: 'member'
         }])
         .select()
         .single();

      if (error) throw error;

      bustFamilyTreeCache();

      return Response.json({
         success: true,
         message: 'Person added to family',
         data
      }, { status: 201 });

   } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
   }
}
