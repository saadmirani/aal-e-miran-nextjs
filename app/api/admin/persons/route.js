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

      const buildPayload = (uniqueId) => ({
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
      });

      const getNextUniqueIdFromSequence = async () => {
         const { data, error } = await supabase.rpc('get_next_person_unique_id');
         if (error) {
            const message = error.message || '';
            if (/function .*get_next_person_unique_id|rpc function.*get_next_person_unique_id|could not find function get_next_person_unique_id/i.test(message)) {
               return null;
            }
            throw error;
         }
         return typeof data === 'string' ? data : data?.[0] || null;
      };

      const getNextUniqueIdFallback = async () => {
         const { data: existing, error } = await supabase
            .from('persons')
            .select('unique_id')
            .order('unique_id', { ascending: false })
            .limit(1);

         if (error) throw error;

         const lastId = existing?.[0]?.unique_id || '';
         const lastNumber = parseInt(lastId.replace(/^p/, ''), 10);
         const nextNumber = Number.isInteger(lastNumber) ? lastNumber + 1 : 1;
         return `p${String(nextNumber).padStart(4, '0')}`;
      };

      const getNextUniqueId = async () => {
         const uniqueId = await getNextUniqueIdFromSequence();
         if (uniqueId) return uniqueId;
         return getNextUniqueIdFallback();
      };

      const isUniqueIdConflict = (error) => {
         const message = error?.message || '';
         return /unique constraint.*unique_id|persons_unique_id_key|duplicate key value violates unique constraint "persons_unique_id_key"/i.test(message);
      };

      const insertPerson = async (payload) => {
         const response = await supabase
            .from('persons')
            .insert([payload])
            .select()
            .single();
         return response;
      };

      let person = null;
      let error = null;
      const maxAttempts = 5;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
         const uniqueId = await getNextUniqueId();
         const payload = buildPayload(uniqueId);

         const primaryInsert = await insertPerson(payload);

         if (primaryInsert.error) {
            if (isUniqueIdConflict(primaryInsert.error)) {
               if (attempt === maxAttempts) {
                  throw new Error('Unable to allocate a unique person ID, please try again.');
               }
               continue;
            }

            if (/father_name|display_badge|is_lawald/i.test(primaryInsert.error.message || '')) {
               const { father_name, display_badge, is_lawald, ...fallbackPayload } = payload;
               const fallbackInsert = await insertPerson(fallbackPayload);

               if (fallbackInsert.error) {
                  if (isUniqueIdConflict(fallbackInsert.error)) {
                     if (attempt === maxAttempts) {
                        throw new Error('Unable to allocate a unique person ID, please try again.');
                     }
                     continue;
                  }
                  throw fallbackInsert.error;
               }

               person = fallbackInsert.data;
               error = null;
               break;
            }

            throw primaryInsert.error;
         }

         person = primaryInsert.data;
         error = null;
         break;
      }

      if (error) throw error;

      bustFamilyTreeCache();

      return Response.json({ success: true, data: person }, { status: 201 });
   } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
   }
}
