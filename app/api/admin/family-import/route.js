import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { bustFamilyTreeCache } from '@/lib/familyTreeCache';

export const dynamic = 'force-dynamic';

function chunkArray(items, size) {
   const chunks = [];
   for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
   }
   return chunks;
}

export async function POST(request) {
   try {
      const supabase = getSupabaseAdmin();
      const body = await request.json();

      const action = body.action || 'preview'; // preview | import
      const targetFamilyId = body.targetFamilyId;
      const sourceFamilyId = body.sourceFamilyId;
      const rootPersonId = body.rootPersonId;
      const generationLimit = Math.max(1, Number(body.generationLimit) || 1);
      const includeSpouses = body.includeSpouses !== false;
      const includeFullSubtree = body.includeFullSubtree === true;

      if (!targetFamilyId || !sourceFamilyId || !rootPersonId) {
         return Response.json({ error: 'targetFamilyId, sourceFamilyId, and rootPersonId are required' }, { status: 400 });
      }

      // Load source family membership
      const { data: sourceRows, error: sourceRowsErr } = await supabase
         .from('family_persons')
         .select('person_id')
         .eq('family_id', sourceFamilyId);

      if (sourceRowsErr) throw sourceRowsErr;

      const sourcePersonIdSet = new Set((sourceRows || []).map(r => r.person_id));
      if (!sourcePersonIdSet.has(rootPersonId)) {
         return Response.json({ error: 'Root person does not belong to the source family.' }, { status: 400 });
      }

      // Fetch all persons to build family structure
      const { data: persons, error: personsErr } = await supabase
         .from('persons')
         .select('id, unique_id, name, gender, alive, father_id, mother_id');

      if (personsErr) throw personsErr;

      const personMap = {};
      const childrenByParent = {};
      (persons || []).forEach(p => {
         personMap[p.id] = p;
      });

      (persons || []).forEach(p => {
         if (p.father_id) {
            if (!childrenByParent[p.father_id]) childrenByParent[p.father_id] = new Set();
            childrenByParent[p.father_id].add(p.id);
         }
         if (p.mother_id) {
            if (!childrenByParent[p.mother_id]) childrenByParent[p.mother_id] = new Set();
            childrenByParent[p.mother_id].add(p.id);
         }
      });

      // Build strict generation-limited descendant tree from root person.
      const descendantsOfRoot = new Set([rootPersonId]);
      const levels = new Map([[rootPersonId, 1]]);
      const queue = [{ id: rootPersonId, depth: 1 }];

      while (queue.length > 0) {
         const { id, depth } = queue.shift();
         if (depth >= generationLimit) continue;

         const childIds = Array.from(childrenByParent[id] || []);

         for (const childId of childIds) {
            if (descendantsOfRoot.has(childId)) continue;

            // Only include if in source family OR if including full subtree
            if (!includeFullSubtree && !sourcePersonIdSet.has(childId)) continue;

            descendantsOfRoot.add(childId);
            levels.set(childId, depth + 1);
            queue.push({ id: childId, depth: depth + 1 });
         }
      }

      const finalSelection = descendantsOfRoot;

      let marriages = [];

      if (includeSpouses) {
         const selectedIds = Array.from(finalSelection);
         if (selectedIds.length > 0) {
            const idChunks = chunkArray(selectedIds, 400);
            const marriageMap = new Map();

            for (const ids of idChunks) {
               const [{ data: leftData, error: leftErr }, { data: rightData, error: rightErr }] = await Promise.all([
                  supabase.from('marriages').select('spouse1_id, spouse2_id').in('spouse1_id', ids),
                  supabase.from('marriages').select('spouse1_id, spouse2_id').in('spouse2_id', ids)
               ]);

               if (leftErr) throw leftErr;
               if (rightErr) throw rightErr;

               [...(leftData || []), ...(rightData || [])].forEach(m => {
                  marriageMap.set(`${m.spouse1_id}:${m.spouse2_id}`, m);
               });
            }

            marriages = Array.from(marriageMap.values());
         }
      }

      // Only import the final selection people - NOT spouses
      const allImportIds = finalSelection;

      // Get existing links in target family
      const { data: targetRows, error: targetRowsErr } = await supabase
         .from('family_persons')
         .select('person_id')
         .eq('family_id', targetFamilyId);

      if (targetRowsErr) throw targetRowsErr;

      const targetSet = new Set((targetRows || []).map(r => r.person_id));
      const newLinkIds = Array.from(allImportIds).filter(id => !targetSet.has(id));
      const alreadyLinkedCount = allImportIds.size - newLinkIds.length;

      // Build preview tree showing imported structure
      const childrenMapArray = {};
      Object.keys(childrenByParent).forEach(pid => {
         childrenMapArray[pid] = Array.from(childrenByParent[pid] || []).filter(cid => finalSelection.has(cid));
      });

      const spouseNamesByPerson = {};
      marriages.forEach(m => {
         if (finalSelection.has(m.spouse1_id)) {
            if (!spouseNamesByPerson[m.spouse1_id]) spouseNamesByPerson[m.spouse1_id] = [];
            if (personMap[m.spouse2_id]) spouseNamesByPerson[m.spouse1_id].push(personMap[m.spouse2_id].name);
         }
         if (finalSelection.has(m.spouse2_id)) {
            if (!spouseNamesByPerson[m.spouse2_id]) spouseNamesByPerson[m.spouse2_id] = [];
            if (personMap[m.spouse1_id]) spouseNamesByPerson[m.spouse2_id].push(personMap[m.spouse1_id].name);
         }
      });

      const buildPreviewNode = (personId) => {
         const p = personMap[personId];
         const childIds = childrenMapArray[personId] || [];
         return {
            id: personId,
            uniqueId: p?.unique_id || null,
            name: p?.name || 'Unknown',
            generation: levels.get(personId) || null,
            spouseNames: includeSpouses ? (spouseNamesByPerson[personId] || []) : [],
            children: childIds.map(buildPreviewNode)
         };
      };

      const previewTree = buildPreviewNode(rootPersonId);

      if (action === 'preview') {
         return Response.json({
            success: true,
            data: {
               rootPersonId,
               includeSpouses,
               includeFullSubtree,
               counts: {
                  descendants: finalSelection.size,
                  alreadyLinked: alreadyLinkedCount,
                  toBeLinked: newLinkIds.length
               },
               generationLimit,
               previewTree
            }
         });
      }

      // Import action
      if (newLinkIds.length > 0) {
         const chunks = chunkArray(newLinkIds, 500);
         for (const chunk of chunks) {
            const payload = chunk.map(personId => ({
               family_id: targetFamilyId,
               person_id: personId,
               role: 'member'
            }));

            const { error: insertErr } = await supabase
               .from('family_persons')
               .insert(payload);

            if (insertErr) throw insertErr;
         }
      }

      bustFamilyTreeCache();

      return Response.json({
         success: true,
         message: 'Import completed',
         data: {
            imported: newLinkIds.length,
            alreadyLinked: alreadyLinkedCount,
            totalSelected: allImportIds.size,
            generationLimit
         }
      });
   } catch (error) {
      return Response.json({ error: error.message || 'Failed to process import' }, { status: 500 });
   }
}
