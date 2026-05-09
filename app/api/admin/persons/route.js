import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { requireEditorAuth } from '@/lib/editorAuth';
import { bustFamilyTreeCache } from '@/lib/familyTreeCache';

export const dynamic = 'force-dynamic';

export async function POST(request) {
   try {
      const authResult = await requireEditorAuth();
      if (authResult instanceof Response) return authResult;

      const supabase = getSupabaseAdmin();
      const data = await request.json();

      // Generate sequential unique_id like p0001, p0002, ...
      const { data: existing } = await supabase
         .from('persons')
         .select('unique_id');

      const numbers = (existing || [])
         .map(p => parseInt(p.unique_id?.replace('p', '')))
         .filter(n => !isNaN(n))
         .sort((a, b) => b - a);

      const nextNumber = (numbers[0] || 0) + 1;
      const uniqueId = `p${String(nextNumber).padStart(4, '0')}`;

      const insertPayload = {
         name: data.name,
         unique_id: uniqueId,
         gender: data.gender,
         alive: data.alive !== undefined ? data.alive : true,
         is_lawald: data.is_lawald === true,
         date_of_birth: data.date_of_birth || null,
         date_of_death: data.date_of_death || null,
         place_of_birth: data.place_of_birth || null,
         place_of_death: data.place_of_death || null,
         about: data.about || null,
         father_id: data.father_id || null,
         mother_id: data.mother_id || null,
         father_name: data.father_name || null,
         display_badge: data.display_badge?.trim() || null
      };

      let person = null;
      let error = null;

      const primaryInsert = await supabase
         .from('persons')
         .insert([insertPayload])
         .select()
         .single();

      if (primaryInsert.error && /father_name|display_badge|is_lawald/i.test(primaryInsert.error.message || '')) {
         const { father_name, display_badge, is_lawald, ...fallbackPayload } = insertPayload;
         const fallbackInsert = await supabase
            .from('persons')
            .insert([fallbackPayload])
            .select()
            .single();
         person = fallbackInsert.data;
         error = fallbackInsert.error;
      } else {
         person = primaryInsert.data;
         error = primaryInsert.error;
      }

      if (error) throw error;

      bustFamilyTreeCache();

      return Response.json({ success: true, data: person }, { status: 201 });
   } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
   }
}
