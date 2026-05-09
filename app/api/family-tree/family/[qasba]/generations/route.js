import { supabaseAdmin } from '@/lib/supabaseClient';

/**
 * GET /api/family-tree/family/:qasba/generations?start=11&end=15
 * 
 * Returns persons in specific generation range
 * Used when user clicks "Expand +5 generations" on female descendants
 * 
 * Query params:
 * - start: generation level to start from (default: 11)
 * - end: generation level to end at (default: 15)
 */
export const dynamic = 'force-dynamic';  // ✅ Disable caching for this route

export async function GET(request, { params }) {
   try {
      const { qasba } = params;
      const { searchParams } = new URL(request.url);
      const start = parseInt(searchParams.get('start')) || 11;
      const end = parseInt(searchParams.get('end')) || 15;

      // 1. Get family by qasba
      const { data: family, error: familyError } = await supabaseAdmin
         .from('families')
         .select('id')
         .eq('qasba', qasba)
         .single();

      if (familyError || !family) {
         return Response.json(
            { error: 'Family not found' },
            { status: 404 }
         );
      }

      // 2. Get persons in the generation range
      const { data: generations, error: genError } = await supabaseAdmin
         .from('person_generations')
         .select(`
        person_id,
        generation_level,
        is_collapsed_default,
        persons (
          id, unique_id, name, gender, date_of_birth, 
          date_of_death, alive, about, father_id, mother_id
        )
      `)
         .eq('family_id', family.id)
         .gte('generation_level', start)
         .lte('generation_level', end)
         .order('generation_level');

      if (genError) {
         console.error('Supabase error:', genError);
         return Response.json(
            { error: 'Failed to fetch generations' },
            { status: 500 }
         );
      }

      if (!generations || generations.length === 0) {
         return Response.json({
            success: true,
            data: [],
            message: `No persons found in generations ${start}-${end}`
         });
      }

      // 3. Get marriages for all these persons
      const personIds = generations
         .map(g => g.persons?.id)
         .filter(Boolean);

      const { data: marriages } = await supabaseAdmin
         .from('marriages')
         .select('*')
         .or(`spouse1_id.in.(${personIds.join(',')})` +
            `,spouse2_id.in.(${personIds.join(',')})`);

      // 4. Get burial info
      const { data: burialInfo } = await supabaseAdmin
         .from('burial_info')
         .select('*')
         .in('person_id', personIds);

      // 5. Format response
      const formattedPersons = generations
         .filter(g => g.persons)
         .map(g => ({
            id: g.persons.id,
            uniqueId: g.persons.unique_id,
            name: g.persons.name,
            gender: g.persons.gender,
            dateOfBirth: g.persons.date_of_birth,
            dateOfDeath: g.persons.date_of_death,
            alive: g.persons.alive,
            about: g.persons.about,
            fatherId: g.persons.father_id,
            motherId: g.persons.mother_id,
            generationLevel: g.generation_level,
            isCollapsedDefault: g.is_collapsed_default
         }));

      const formattedMarriages = (marriages || []).map(m => ({
         id: m.id,
         spouse1Id: m.spouse1_id,
         spouse2Id: m.spouse2_id,
         marriageDate: m.marriage_date,
         isActive: m.is_active
      }));

      const formattedBurial = (burialInfo || []).reduce((acc, b) => {
         acc[b.person_id] = {
            burialPlace: b.burial_place,
            burialMapUrl: b.burial_map_url
         };
         return acc;
      }, {});

      return Response.json({
         success: true,
         data: {
            persons: formattedPersons,
            marriages: formattedMarriages,
            burialInfo: formattedBurial,
            generationRange: { start, end },
            count: formattedPersons.length
         }
      });

   } catch (error) {
      console.error('API Error:', error);
      return Response.json(
         { error: 'Internal server error' },
         { status: 500 }
      );
   }
}
