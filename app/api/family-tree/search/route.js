import { getSupabaseAdmin } from '@/lib/supabaseClient';

/**
 * GET /api/family-tree/search?q=name
 * Searches for persons by name (used in admin dashboard for linking parents/spouses)
 * Returns person info along with their family membership
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseFatherFromAbout(aboutText) {
   if (!aboutText) return null;
   const match = aboutText.match(/(?:^|\n)\s*Father\s*:\s*(.+)\s*(?:\n|$)/i);
   return match?.[1]?.trim() || null;
}

/**
 * Normalize common Arabic name transliteration variants so that
 * e.g. "Habiba" and "Habeeba", "Siddiqui" and "Siddique" both match.
 */
function normalizeNameForSearch(str) {
   return str
      .toLowerCase()
      .replace(/aa/g, 'a')          // aa → a
      .replace(/ee/g, 'i')          // ee → i
      .replace(/oo/g, 'u')          // oo → u
      .replace(/ae/g, 'a')          // ae → a
      .replace(/ai/g, 'a')          // ai → a
      .replace(/ei/g, 'i')          // ei → i
      .replace(/ou/g, 'u')          // ou → u
      .replace(/kh/g, 'k')          // kh → k
      .replace(/gh/g, 'g')          // gh → g
      .replace(/qu/g, 'k')          // qu → k
      .replace(/[^a-z ]/g, '');     // strip non-alpha
}

/** Build a set of DB-side ilike patterns from a query covering transliteration variants. */
function buildSearchPatterns(query) {
   const patterns = new Set();
   patterns.add(`%${query}%`);
   const n = normalizeNameForSearch(query);
   if (n !== query.toLowerCase()) patterns.add(`%${n}%`);
   // Also try expanding single vowels to double for the reverse direction
   const expanded = query.toLowerCase()
      .replace(/(?<![aeiou])a(?![aeiou])/g, 'aa')
      .replace(/(?<![aeiou])i(?![aeiou])/g, 'ee')
      .replace(/(?<![aeiou])u(?![aeiou])/g, 'oo');
   if (expanded !== query.toLowerCase()) patterns.add(`%${expanded}%`);
   return [...patterns];
}

export async function GET(request) {
   try {
      const supabase = getSupabaseAdmin();
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q');
      const limit = parseInt(searchParams.get('limit')) || 20;
      const familyId = searchParams.get('familyId');

      if (!query || query.trim().length < 1) {
         return Response.json(
            { success: true, data: [] },
            {
               headers: {
                  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                  'Pragma': 'no-cache',
                  'Expires': '0'
               }
            }
         );
      }

      let persons = [];
      let error = null;

      let restrictedIds = null;
      if (familyId) {
         const { data: membershipRows, error: membershipErr } = await supabase
            .from('family_persons')
            .select('person_id')
            .eq('family_id', familyId)
            .limit(10000);

         if (membershipErr) throw membershipErr;
         restrictedIds = (membershipRows || []).map(r => r.person_id);

         if (restrictedIds.length === 0) {
            return Response.json(
               { success: true, data: [] },
               {
                  headers: {
                     'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                     'Pragma': 'no-cache',
                     'Expires': '0'
                  }
               }
            );
         }
      }

      // Build fuzzy patterns to catch transliteration variants (e.g. Habiba / Habeeba).
      const searchPatterns = buildSearchPatterns(query);

      // Run one query per pattern and merge unique results by id.
      const seenIds = new Set();
      let mergedPersons = [];
      let lastError = null;
      let hasFatherNameCol = true;

      for (const pattern of searchPatterns) {
         let builder = supabase
            .from('persons')
            .select('id, unique_id, name, gender, alive, date_of_birth, date_of_death, father_id, father_name, about')
            .ilike('name', pattern)
            .limit(limit);

         if (restrictedIds) builder = builder.in('id', restrictedIds);

         const result = await builder;

         if (result.error && /father_name/i.test(result.error.message || '')) {
            hasFatherNameCol = false;
            break; // fall through to backward-compat path
         }

         lastError = result.error;
         for (const row of (result.data || [])) {
            if (!seenIds.has(row.id)) {
               seenIds.add(row.id);
               mergedPersons.push(row);
            }
         }
      }

      if (!hasFatherNameCol) {
         // Backward-compatible fallback for databases without father_name column.
         seenIds.clear();
         mergedPersons = [];
         for (const pattern of searchPatterns) {
            let fb = supabase
               .from('persons')
               .select('id, unique_id, name, gender, alive, date_of_birth, date_of_death, father_id, about')
               .ilike('name', pattern)
               .limit(limit);
            if (restrictedIds) fb = fb.in('id', restrictedIds);
            const fbResult = await fb;
            lastError = fbResult.error;
            for (const row of (fbResult.data || [])) {
               if (!seenIds.has(row.id)) {
                  seenIds.add(row.id);
                  mergedPersons.push(row);
               }
            }
         }
      }

      persons = mergedPersons.slice(0, limit);
      error = lastError;

      if (error) throw error;

      // Fetch family memberships for all found persons
      const personIds = (persons || []).map(p => p.id);
      let familyMap = {};
      if (personIds.length > 0) {
         const { data: memberships } = await supabase
            .from('family_persons')
            .select('person_id, family_id, families(id, name, qasba)')
            .in('person_id', personIds);

         if (memberships) {
            for (const m of memberships) {
               familyMap[m.person_id] = {
                  familyId: m.families?.id || m.family_id,
                  familyName: m.families?.name || null,
                  familyQasba: m.families?.qasba || null
               };
            }
         }
      }

      // Fetch father names for suggestions
      const fatherIds = [...new Set((persons || []).map(p => p.father_id).filter(Boolean))];
      let fatherNameMap = {};
      if (fatherIds.length > 0) {
         const { data: fathers } = await supabase
            .from('persons')
            .select('id, name')
            .in('id', fatherIds);

         (fathers || []).forEach(f => {
            fatherNameMap[f.id] = f.name;
         });
      }

      const formatted = (persons || []).map(p => ({
         id: p.id,
         uniqueId: p.unique_id,
         name: p.name,
         fatherName: p.father_name || (p.father_id ? (fatherNameMap[p.father_id] || null) : null) || parseFatherFromAbout(p.about),
         gender: p.gender,
         alive: p.alive,
         dateOfBirth: p.date_of_birth,
         dateOfDeath: p.date_of_death,
         familyId: familyMap[p.id]?.familyId || null,
         familyName: familyMap[p.id]?.familyName || null
      }));

      return Response.json(
         {
            success: true,
            data: formatted,
            count: formatted.length
         },
         {
            headers: {
               'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
               'Pragma': 'no-cache',
               'Expires': '0'
            }
         }
      );

   } catch (error) {
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
