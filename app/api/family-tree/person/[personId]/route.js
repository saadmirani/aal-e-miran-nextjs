import { getSupabaseAdmin } from '@/lib/supabaseClient';

/**
 * GET /api/family-tree/person/:personId
 * Returns full person details including spouses, children, siblings, burial, parents
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
   try {
      const supabase = getSupabaseAdmin();
      const { personId } = params;

      // 1) Person
      const { data: person, error: personError } = await supabase
         .from('persons')
         .select('*')
         .eq('id', personId)
         .single();

      if (personError || !person) {
         return Response.json(
            { error: 'Person not found' },
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

      // 2) Spouses through marriages
      const { data: marriages = [] } = await supabase
         .from('marriages')
         .select('id, spouse1_id, spouse2_id')
         .or(`spouse1_id.eq.${personId},spouse2_id.eq.${personId}`);

      const spouseIds = marriages
         .map(m => (m.spouse1_id === personId ? m.spouse2_id : m.spouse1_id))
         .filter(Boolean);

      let spousePersons = [];
      let spouseBurials = [];
      let spouseMemberships = [];

      if (spouseIds.length > 0) {
         const [personsRes, burialsRes, membershipsRes] = await Promise.all([
            supabase.from('persons').select('*').in('id', spouseIds),
            supabase.from('burial_info').select('*').in('person_id', spouseIds),
            supabase.from('family_persons').select('person_id, family_id, families(id, name, qasba)').in('person_id', spouseIds)
         ]);

         spousePersons = personsRes.data || [];
         spouseBurials = burialsRes.data || [];
         spouseMemberships = membershipsRes.data || [];
      }

      const spousePersonsMap = {};
      spousePersons.forEach(p => { spousePersonsMap[p.id] = p; });

      const spouseBurialMap = {};
      spouseBurials.forEach(b => { spouseBurialMap[b.person_id] = b; });

      const spouseFamilyMap = {};
      spouseMemberships.forEach(m => {
         if (!spouseFamilyMap[m.person_id]) {
            spouseFamilyMap[m.person_id] = {
               familyId: m.families?.id || m.family_id,
               familyName: m.families?.name || null,
               familyQasba: m.families?.qasba || null
            };
         }
      });

      const spouseFatherIds = [...new Set(spousePersons.map(p => p.father_id).filter(Boolean))];
      const fatherNamesMap = {};

      if (spouseFatherIds.length > 0) {
         const { data: fathers = [] } = await supabase
            .from('persons')
            .select('id, name')
            .in('id', spouseFatherIds);

         fathers.forEach(f => { fatherNamesMap[f.id] = f.name; });
      }

      const spouses = spouseIds
         .map(sid => {
            const sp = spousePersonsMap[sid];
            if (!sp) return null;

            const burial = spouseBurialMap[sid];
            const family = spouseFamilyMap[sid] || {};

            return {
               id: sp.id,
               uniqueId: sp.unique_id,
               name: sp.name,
               gender: sp.gender,
               alive: sp.alive,
               dateOfBirth: sp.date_of_birth,
               dateOfDeath: sp.date_of_death,
               placeOfBirth: sp.place_of_birth,
               placeOfDeath: sp.place_of_death,
               about: sp.about,
               fatherName: sp.father_id ? (fatherNamesMap[sp.father_id] || '') : '',
               familyId: family.familyId || null,
               familyName: family.familyName || null,
               familyQasba: family.familyQasba || null,
               burial: burial
                  ? {
                     place: burial.burial_place || '',
                     mapUrl: burial.burial_map_url || ''
                  }
                  : null
            };
         })
         .filter(Boolean);

      // 3) Children
      const { data: children = [] } = await supabase
         .from('persons')
         .select('id, unique_id, name, gender, date_of_birth, date_of_death, alive')
         .or(`father_id.eq.${personId},mother_id.eq.${personId}`);

      // 4) Siblings
      let siblings = [];
      if (person.father_id || person.mother_id) {
         const siblingFilters = [];
         if (person.father_id) siblingFilters.push(`father_id.eq.${person.father_id}`);
         if (person.mother_id) siblingFilters.push(`mother_id.eq.${person.mother_id}`);

         const { data: siblingRows = [] } = await supabase
            .from('persons')
            .select('id, unique_id, name, gender, date_of_birth, date_of_death, alive')
            .or(siblingFilters.join(','))
            .neq('id', personId);

         siblings = siblingRows;
      }

      // 5) Parents
      const parentIds = [];
      if (person.father_id) parentIds.push(person.father_id);
      if (person.mother_id) parentIds.push(person.mother_id);

      let parents = [];
      if (parentIds.length > 0) {
         const { data: parentRows = [] } = await supabase
            .from('persons')
            .select('id, unique_id, name, gender, date_of_birth, date_of_death, alive')
            .in('id', parentIds);

         parents = parentRows;
      }

      // 5b) Infer mother from father's single spouse when mother_id/mother_name is absent
      // (mirrors the same logic in the tree API's getMotherName)
      let inferredMotherName = null;
      if (!person.mother_id && !person.mother_name && person.father_id) {
         const { data: fatherMarriages = [] } = await supabase
            .from('marriages')
            .select('spouse1_id, spouse2_id')
            .or(`spouse1_id.eq.${person.father_id},spouse2_id.eq.${person.father_id}`);

         const fatherSpouseIds = [...new Set(
            fatherMarriages.map(m =>
               m.spouse1_id === person.father_id ? m.spouse2_id : m.spouse1_id
            ).filter(Boolean)
         )];

         if (fatherSpouseIds.length === 1) {
            const { data: inferredMother } = await supabase
               .from('persons')
               .select('id, name')
               .eq('id', fatherSpouseIds[0])
               .single();
            if (inferredMother?.name) inferredMotherName = inferredMother.name;
         }
      }

      // 6) Burial
      const { data: burialData } = await supabase
         .from('burial_info')
         .select('*')
         .eq('person_id', personId)
         .single();

      // 7) Family memberships for person
      const { data: membershipData = [] } = await supabase
         .from('family_persons')
         .select('family_id, families(id, name, qasba)')
         .eq('person_id', personId);

      const families = membershipData.map(row => ({
         id: row.families?.id || row.family_id,
         name: row.families?.name || null,
         qasba: row.families?.qasba || null
      }));

      // Keep legacy `spouse` for compatibility where old UI expects single spouse
      const spouse = spouses.length > 0 ? spouses[0] : null;

      return Response.json({
         success: true,
         person: {
            id: person.id,
            uniqueId: person.unique_id,
            name: person.name,
            gender: person.gender,
            dateOfBirth: person.date_of_birth,
            dateOfDeath: person.date_of_death,
            placeOfBirth: person.place_of_birth,
            placeOfDeath: person.place_of_death,
            alive: person.alive,
            about: person.about,
            fatherId: person.father_id,
            motherId: person.mother_id,
            // mother_name text col → inferred from father's single spouse → null
            motherName: person.mother_name || inferredMotherName || null,
            isLawald: person.is_lawald === true,
            displayBadge: person.display_badge || null,
            families,
            createdAt: person.created_at,
            updatedAt: person.updated_at
         },
         spouse,
         spouses,
         children: children.map(c => ({
            id: c.id,
            uniqueId: c.unique_id,
            name: c.name,
            gender: c.gender,
            dateOfBirth: c.date_of_birth,
            dateOfDeath: c.date_of_death,
            alive: c.alive
         })),
         siblings: siblings.map(s => ({
            id: s.id,
            uniqueId: s.unique_id,
            name: s.name,
            gender: s.gender,
            dateOfBirth: s.date_of_birth,
            dateOfDeath: s.date_of_death,
            alive: s.alive
         })),
         parents: parents.map(p => ({
            id: p.id,
            uniqueId: p.unique_id,
            name: p.name,
            gender: p.gender,
            dateOfBirth: p.date_of_birth,
            dateOfDeath: p.date_of_death,
            alive: p.alive
         })),
         burial: burialData
            ? {
               place: burialData.burial_place,
               mapUrl: burialData.burial_map_url
            }
            : null
      }, {
         headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
         }
      });
   } catch (error) {
      console.error('API Error:', error);
      return Response.json(
         { error: 'Internal server error' },
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
}
