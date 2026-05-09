import { getSupabaseAdmin } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
   const { qasba } = params;
   const supabase = getSupabaseAdmin();

   const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('qasba', qasba)
      .single();

   if (familyError || !family) {
      return Response.json(
         { error: 'Family not found' },
         {
            status: 404,
            headers: {
               'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
               'Pragma': 'no-cache',
               'Expires': '0'
            }
         }
      );
   }

   // Fetch family_persons filtered server-side
   const { data: familyPersons, error: fpError } = await supabase
      .from('family_persons')
      .select('person_id')
      .eq('family_id', family.id);

   if (fpError) {
      return Response.json(
         { error: fpError.message },
         {
            status: 500,
            headers: {
               'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
               'Pragma': 'no-cache',
               'Expires': '0'
            }
         }
      );
   }

   const personIds = (familyPersons || []).map(fp => fp.person_id);

   let persons = [];
   let marriages = [];
   let parentNamesById = {};
   if (personIds.length > 0) {
      const { data: personsData } = await supabase
         .from('persons')
         .select('*')
         .in('id', personIds);
      persons = personsData || [];

      const parentIds = [...new Set(
         (persons || [])
            .flatMap(p => [p.father_id, p.mother_id])
            .filter(Boolean)
      )];

      if (parentIds.length > 0) {
         const { data: parentRows = [] } = await supabase
            .from('persons')
            .select('id, name')
            .in('id', parentIds);
         parentRows.forEach(parent => {
            parentNamesById[parent.id] = parent.name;
         });
      }

      const [{ data: bySpouse1 = [] }, { data: bySpouse2 = [] }] = await Promise.all([
         supabase.from('marriages').select('*').in('spouse1_id', personIds),
         supabase.from('marriages').select('*').in('spouse2_id', personIds)
      ]);

      const marriageMap = new Map();
      [...bySpouse1, ...bySpouse2].forEach(m => marriageMap.set(m.id, m));
      marriages = [...marriageMap.values()];
   }

   return Response.json(
      {
         family,
         persons: persons.map(p => ({
            id: p.id,
            uniqueId: p.unique_id,
            name: p.name,
            gender: p.gender,
            alive: p.alive,
            dateOfBirth: p.date_of_birth,
            dateOfDeath: p.date_of_death,
            placeOfBirth: p.place_of_birth,
            placeOfDeath: p.place_of_death,
            about: p.about,
            fatherId: p.father_id,
            fatherName: p.father_name || parentNamesById[p.father_id] || null,
            motherId: p.mother_id,
            motherName: p.mother_name || parentNamesById[p.mother_id] || null,
            isLawald: p.is_lawald === true,
            displayBadge: p.display_badge || null
         })),
         marriages: marriages.map(m => ({
            id: m.id,
            spouse1Id: m.spouse1_id,
            spouse2Id: m.spouse2_id,
            marriageDate: m.marriage_date,
            isActive: m.is_active
         }))
      },
      {
         headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
         }
      }
   );
}
