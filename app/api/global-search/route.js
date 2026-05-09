import { getSupabaseAdmin } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

/**
 * Generates spelling variations for Arabic/Urdu transliterated names.
 *
 * Handles common interchangeable patterns:
 *   o ↔ u        (Fozail / Fuzail, Mohammad / Muhammad)
 *   ia ↔ iya     (Sadia / Sadiya, Aulia / Auliya)
 *   a  ↔ ah      (Hafsa / Hafsah, Zainab already ends in b so no false match)
 *   ie ↔ i       (Hanie / Hani)
 *   ae ↔ ai      (Inayet / Inayet – kept for completeness)
 */
function getNameVariants(raw) {
   const q = raw.trim().toLowerCase();
   const set = new Set([q]);

   // o ↔ u
   if (/o/.test(q)) set.add(q.replace(/o/g, 'u'));
   if (/u/.test(q)) set.add(q.replace(/u/g, 'o'));

   // Expand to cover mixed replacements (e.g. "fozail" → "fuzail" but also vice versa)
   // Already covered by the two lines above independently.

   // ia ↔ iya  (trailing)
   if (q.endsWith('iya')) set.add(q.slice(0, -3) + 'ia');
   else if (q.endsWith('ia')) set.add(q + 'ya');

   // a ↔ ah  (trailing – only add 'h' if not already ending in h/a consonant cluster)
   if (q.endsWith('ah')) set.add(q.slice(0, -1));  // hafsah → hafsa
   else if (q.endsWith('a') && !q.endsWith('ia') && !q.endsWith('ya')) set.add(q + 'h'); // hafsa → hafsah

   // ie ↔ i  (trailing)
   if (q.endsWith('ie')) set.add(q.slice(0, -2) + 'i');
   else if (q.endsWith('i') && !q.endsWith('ii')) set.add(q + 'e');

   // Also apply o↔u on derived variants
   const baseVariants = [...set];
   for (const v of baseVariants) {
      if (/o/.test(v)) set.add(v.replace(/o/g, 'u'));
      if (/u/.test(v)) set.add(v.replace(/u/g, 'o'));
   }

   return [...set];
}

/**
 * GET /api/global-search?q=<query>&limit=<n>
 *
 * Bandwidth-efficient global person search:
 *   - Minimum 2 characters required (enforced here and on client)
 *   - Default limit 15, max 30
 *   - Single DB round-trip via OR across name variants
 *   - Second round-trip only to fetch father names & families for matched IDs
 */
export async function GET(request) {
   try {
      const { searchParams } = new URL(request.url);
      const rawQuery = searchParams.get('q') || '';
      const limit = Math.min(parseInt(searchParams.get('limit')) || 15, 30);

      if (rawQuery.trim().length < 2) {
         return Response.json({ success: true, data: [] });
      }

      const supabase = getSupabaseAdmin();
      const variants = getNameVariants(rawQuery);

      // Build OR filter: name.ilike.%variant1%,name.ilike.%variant2%,...
      const orFilter = variants.map(v => `name.ilike.%${v}%`).join(',');

      const { data: persons, error: personsError } = await supabase
         .from('persons')
         .select('id, name, gender, alive, father_id, father_name, mother_id, display_badge')
         .or(orFilter)
         .limit(limit);

      if (personsError) throw personsError;
      if (!persons || persons.length === 0) {
         return Response.json({ success: true, data: [] });
      }

      const personIds = persons.map(p => p.id);
      const fatherIds = [...new Set(persons.map(p => p.father_id).filter(Boolean))];
      const motherIds = [...new Set(persons.map(p => p.mother_id).filter(Boolean))];
      const parentIds = [...new Set([...fatherIds, ...motherIds])];

      // Parallel: memberships for found persons + parent names + parent family memberships
      const [membershipsResult, parentNamesResult, parentMembershipsResult] = await Promise.all([
         supabase
            .from('family_persons')
            .select('person_id, families(id, name, qasba)')
            .in('person_id', personIds),
         parentIds.length > 0
            ? supabase.from('persons').select('id, name').in('id', parentIds)
            : Promise.resolve({ data: [] }),
         parentIds.length > 0
            ? supabase.from('family_persons').select('person_id, family_id').in('person_id', parentIds)
            : Promise.resolve({ data: [] })
      ]);

      if (membershipsResult.error) throw membershipsResult.error;

      // parentNameMap: id → name
      const parentNameMap = {};
      for (const p of parentNamesResult.data || []) parentNameMap[p.id] = p.name;

      // parentFamilySet: parentId → Set<familyId>
      const parentFamilySet = {};
      for (const m of parentMembershipsResult.data || []) {
         if (!parentFamilySet[m.person_id]) parentFamilySet[m.person_id] = new Set();
         parentFamilySet[m.person_id].add(m.family_id);
      }

      // familyMap: personId → [{ id, name, qasba }]
      const familyMap = {};
      for (const m of membershipsResult.data || []) {
         if (!m.families) continue;
         if (!familyMap[m.person_id]) familyMap[m.person_id] = [];
         const already = familyMap[m.person_id].some(f => f.id === m.families.id);
         if (!already) familyMap[m.person_id].push(m.families);
      }

      const formatted = persons.map(p => {
         const fatherName = p.father_name || (p.father_id ? parentNameMap[p.father_id] : null) || null;
         const motherName = p.mother_id ? parentNameMap[p.mother_id] || null : null;

         const families = (familyMap[p.id] || []).map(f => {
            // Determine which parent connects this person to this family
            const fatherInFamily = p.father_id && parentFamilySet[p.father_id]?.has(f.id);
            const motherInFamily = p.mother_id && parentFamilySet[p.mother_id]?.has(f.id);
            let parentType = 'father'; // default
            if (motherInFamily && !fatherInFamily) parentType = 'mother';
            return { ...f, parentType };
         });

         return {
            id: p.id,
            name: p.name,
            gender: p.gender,
            alive: p.alive,
            fatherName,
            motherName,
            displayBadge: p.display_badge || null,
            families
         };
      });

      return Response.json({ success: true, data: formatted });
   } catch (err) {
      console.error('[global-search] error:', err);
      return Response.json({ error: 'Search failed' }, { status: 500 });
   }
}
