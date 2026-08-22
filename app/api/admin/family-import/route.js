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

/**
 * Builds a family tree for the given sourceFamilyId using the EXACT same
 * algorithm as /api/family-tree/tree/[qasba]/route.js so the import
 * preview is structurally identical to the live Shajra-e-Saadaat view.
 */
async function buildSourceFamilyTree(supabase, sourceFamilyId) {
   const { data: familyPersons, error: fpError } = await supabase
      .from('family_persons')
      .select('person_id')
      .eq('family_id', sourceFamilyId);

   if (fpError) throw fpError;

   const personIds = (familyPersons || []).map(fp => fp.person_id);
   if (personIds.length === 0) return null;

   let { data: persons = [] } = await supabase
      .from('persons')
      .select('id, unique_id, name, gender, alive, father_id, mother_id')
      .in('id', personIds);

   const visibleCoreIds = [...new Set((persons || []).map(p => p.id))];

   //    Children linked to another family still appear so parentâ†’child edges
   //    remain complete across qasbas.
   if (visibleCoreIds.length > 0) {
      const [byFather, byMother] = await Promise.all([
         supabase
            .from('persons')
            .select('id, unique_id, name, gender, alive, father_id, mother_id')
            .in('father_id', visibleCoreIds),
         supabase
            .from('persons')
            .select('id, unique_id, name, gender, alive, father_id, mother_id')
            .in('mother_id', visibleCoreIds),
      ]);

      const extraMap = new Map();
      [...(byFather.data || []), ...(byMother.data || [])].forEach(child => {
         if (child?.id) extraMap.set(child.id, child);
      });

      const merged = new Map((persons || []).map(p => [p.id, p]));
      extraMap.forEach((p, id) => { if (!merged.has(id)) merged.set(id, p); });
      persons = [...merged.values()];
   }

   // allFetchedIdSet = direct members + extra children, computed BEFORE
   // external spouses are added.  The real tree uses this exact set for
   // root-detection and child-placement â€” external spouses must NOT be included.
   const allFetchedIds = [...new Set(persons.map(p => p.id))];
   const allFetchedIdSet = new Set(allFetchedIds);

   const [{ data: bySpouse1 = [] }, { data: bySpouse2 = [] }] = await Promise.all([
      supabase.from('marriages').select('spouse1_id, spouse2_id').in('spouse1_id', allFetchedIds),
      supabase.from('marriages').select('spouse1_id, spouse2_id').in('spouse2_id', allFetchedIds),
   ]);

   const marriagesMap = new Map();
   [...bySpouse1, ...bySpouse2].forEach(m => {
      marriagesMap.set(`${m.spouse1_id}:${m.spouse2_id}`, m);
   });
   const marriages = [...marriagesMap.values()];

   const personMap = {};
   persons.forEach(p => { personMap[p.id] = p; });

   const externalIds = [];
   marriages.forEach(m => {
      if (!personMap[m.spouse1_id]) externalIds.push(m.spouse1_id);
      if (!personMap[m.spouse2_id]) externalIds.push(m.spouse2_id);
   });

   const uniqExternal = [...new Set(externalIds)];
   if (uniqExternal.length > 0) {
      const { data: extPersons = [] } = await supabase
         .from('persons')
         .select('id, unique_id, name, gender, alive, father_id, mother_id')
         .in('id', uniqExternal);
      extPersons.forEach(p => { personMap[p.id] = p; });
   }

   const spouseMap = {};
   marriages.forEach(m => {
      if (!spouseMap[m.spouse1_id]) spouseMap[m.spouse1_id] = [];
      if (!spouseMap[m.spouse2_id]) spouseMap[m.spouse2_id] = [];
      spouseMap[m.spouse1_id].push(m.spouse2_id);
      spouseMap[m.spouse2_id].push(m.spouse1_id);
   });

   //    Uses allFetchedIdSet so external spouses don't become ghost parents.
   const childIdSet = new Set();
   persons.forEach(p => {
      if ((p.father_id && allFetchedIdSet.has(p.father_id)) ||
         (p.mother_id && allFetchedIdSet.has(p.mother_id))) {
         childIdSet.add(p.id);
      }
   });

   const rootPersons = persons.filter(p => !childIdSet.has(p.id));
   if (rootPersons.length === 0) return null;

   // â”€â”€ 8. Recursive node builder â€” identical child-placement to real tree â”€â”€â”€â”€
   const visitedIds = new Set();

   function buildNode(person) {
      if (!person || visitedIds.has(person.id)) return null;
      visitedIds.add(person.id);

      const spouseIds = spouseMap[person.id] || [];
      const spouseNodes = spouseIds
         .map(sid => {
            const sp = personMap[sid];
            if (!sp) return null;
            return {
               dbId: sp.id,
               id: sp.unique_id || sp.id,
               name: sp.name,
               gender: sp.gender,
               alive: sp.alive,
            };
         })
         .filter(Boolean);

      // Attach under father always.
      // Attach under mother only when father is external (not in allFetchedIdSet).
      const children = persons
         .filter(p => {
            if (p.id === person.id) return false;
            if (p.father_id === person.id) return true;
            if (p.mother_id === person.id && !allFetchedIdSet.has(p.father_id)) return true;
            return false;
         })
         .map(p => buildNode(p))
         .filter(Boolean);

      const node = {
         dbId: person.id,
         id: person.unique_id || person.id,
         name: person.name,
         gender: person.gender,
         alive: person.alive,
      };
      if (children.length > 0) node.children = children;
      if (spouseNodes.length === 1) node.spouse = spouseNodes[0];
      else if (spouseNodes.length > 1) node.spouse = spouseNodes;
      return node;
   }

   const primaryTree = buildNode(rootPersons[0]);

   const buildDetached = (list) =>
      list
         .filter(p => !visitedIds.has(p.id))
         .map(p => buildNode(p))
         .filter(Boolean);

   const allDetached = [
      ...buildDetached(rootPersons),
      ...buildDetached(persons),
   ];
   const detachedLineageRoots = allDetached.filter(
      n => Array.isArray(n.children) && n.children.length > 0
   );

   if (!primaryTree) return null;

   if (detachedLineageRoots.length === 0) return primaryTree;

   return {
      id: `virtual-root-${sourceFamilyId}`,
      name: 'Source Family',
      isVirtualRoot: true,
      children: [primaryTree, ...detachedLineageRoots],
   };
}

function collectDbIds(node, set = new Set()) {
   if (!node) return set;
   if (!node.isVirtualRoot && node.dbId != null) set.add(node.dbId);
   (node.children || []).forEach(c => collectDbIds(c, set));
   return set;
}

export async function POST(request) {
   try {
      const supabase = getSupabaseAdmin();
      const body = await request.json();

      const action = body.action || 'preview';
      const targetFamilyId = body.targetFamilyId;
      const sourceFamilyId = body.sourceFamilyId;

      if (!targetFamilyId || !sourceFamilyId) {
         return Response.json(
            { error: 'targetFamilyId and sourceFamilyId are required' },
            { status: 400 }
         );
      }

      if (action === 'preview') {
         const previewTree = await buildSourceFamilyTree(supabase, sourceFamilyId);

         if (!previewTree) {
            return Response.json(
               { error: 'Selected source family has no members to import.' },
               { status: 400 }
            );
         }

         const allDbIds = collectDbIds(previewTree);

         const { data: targetRows } = await supabase
            .from('family_persons')
            .select('person_id')
            .eq('family_id', targetFamilyId);
         const targetSet = new Set((targetRows || []).map(r => r.person_id));
         const alreadyLinked = [...allDbIds].filter(id => targetSet.has(id)).length;

         return Response.json({
            success: true,
            data: {
               previewTree,
               counts: {
                  total: allDbIds.size,
                  alreadyLinked,
                  toBeLinked: allDbIds.size - alreadyLinked,
               },
            },
         });
      }

      const selectedPersonIds = Array.isArray(body.selectedPersonIds)
         ? body.selectedPersonIds
         : [];
      if (selectedPersonIds.length === 0) {
         return Response.json(
            { error: 'No persons selected for import.' },
            { status: 400 }
         );
      }

      const { data: targetRows } = await supabase
         .from('family_persons')
         .select('person_id')
         .eq('family_id', targetFamilyId);
      const targetSet = new Set((targetRows || []).map(r => String(r.person_id)));

      const newLinkIds = selectedPersonIds.map(String).filter(id => !targetSet.has(id));
      const alreadyLinkedCount = selectedPersonIds.length - newLinkIds.length;

      if (newLinkIds.length > 0) {
         const chunks = chunkArray(newLinkIds, 500);
         for (const chunk of chunks) {
            const { error: insertErr } = await supabase.from('family_persons').insert(
               chunk.map(personId => ({
                  family_id: targetFamilyId,
                  person_id: personId,
                  role: 'member',
               }))
            );
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
            totalSelected: selectedPersonIds.length,
         },
      });
   } catch (error) {
      return Response.json(
         { error: error.message || 'Failed to process import' },
         { status: 500 }
      );
   }
}
