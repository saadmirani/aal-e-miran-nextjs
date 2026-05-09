import { getSupabaseAdmin } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

function parseFatherFromAbout(aboutText) {
   if (!aboutText) return null;
   const match = aboutText.match(/(?:^|\n)\s*Father\s*:\s*(.+)\s*(?:\n|$)/i);
   return match?.[1]?.trim() || null;
}

function parseMotherFromAbout(aboutText) {
   if (!aboutText) return null;
   const match = aboutText.match(/(?:^|\n)\s*Mother\s*:\s*(.+)\s*(?:\n|$)/i);
   return match?.[1]?.trim() || null;
}

function normalizeNameKey(name) {
   return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function buildTreePayload(qasba) {
   const supabase = getSupabaseAdmin();

   const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('qasba', qasba)
      .single();

   if (familyError || !family) {
      return { status: 404, body: { error: 'Family not found' } };
   }

   const { data: familyPersons, error: fpError } = await supabase
      .from('family_persons')
      .select('person_id')
      .eq('family_id', family.id);

   if (fpError) {
      return { status: 500, body: { error: fpError.message } };
   }

   const personIds = (familyPersons || []).map(fp => fp.person_id);

   if (personIds.length === 0) {
      return {
         status: 200,
         body: {
            family: { id: family.id, name: family.name, qasba: family.qasba },
            tree: null
         }
      };
   }

   let { data: persons = [] } = await supabase
      .from('persons')
      .select('*')
      .in('id', personIds);

   const visibleCoreIds = [...new Set((persons || []).map(p => p.id))];

   // Pull direct children of visible family persons even when child is only linked
   // to another family. This keeps parent-child relationships complete across qasbas.
   if (visibleCoreIds.length > 0) {
      const [childrenByFatherRes, childrenByMotherRes] = await Promise.all([
         supabase.from('persons').select('*').in('father_id', visibleCoreIds),
         supabase.from('persons').select('*').in('mother_id', visibleCoreIds)
      ]);

      const extraChildrenMap = new Map();
      [...(childrenByFatherRes.data || []), ...(childrenByMotherRes.data || [])].forEach(child => {
         if (child?.id) extraChildrenMap.set(child.id, child);
      });

      const mergedPersonMap = new Map((persons || []).map(p => [p.id, p]));
      extraChildrenMap.forEach((p, id) => {
         if (!mergedPersonMap.has(id)) mergedPersonMap.set(id, p);
      });
      persons = [...mergedPersonMap.values()];
   }

   const [{ data: marriagesBySpouse1 = [] }, { data: marriagesBySpouse2 = [] }] = await Promise.all([
      supabase.from('marriages').select('*').in('spouse1_id', visibleCoreIds),
      supabase.from('marriages').select('*').in('spouse2_id', visibleCoreIds)
   ]);

   const marriagesMap = new Map();
   [...marriagesBySpouse1, ...marriagesBySpouse2].forEach(m => {
      marriagesMap.set(m.id, m);
   });
   const marriages = [...marriagesMap.values()];

   const personMap = {};
   persons.forEach(p => {
      personMap[p.id] = p;
   });

   const externalSpouseIds = [];
   marriages.forEach(m => {
      if (!personMap[m.spouse1_id]) externalSpouseIds.push(m.spouse1_id);
      if (!personMap[m.spouse2_id]) externalSpouseIds.push(m.spouse2_id);
   });

   const uniqExternalSpouseIds = [...new Set(externalSpouseIds)];
   if (uniqExternalSpouseIds.length > 0) {
      const { data: extPersons = [] } = await supabase
         .from('persons')
         .select('*')
         .in('id', uniqExternalSpouseIds);
      extPersons.forEach(p => { personMap[p.id] = p; });
   }

   // Remove marriages that reference a person no longer in the DB (orphaned rows from deleted persons)
   const validMarriages = marriages.filter(
      m => personMap[m.spouse1_id] && personMap[m.spouse2_id]
   );
   marriages.length = 0;
   validMarriages.forEach(m => marriages.push(m));

   const missingFatherIds = [...new Set(
      Object.values(personMap)
         .map(p => p.father_id)
         .filter(fid => fid && !personMap[fid])
   )];

   if (missingFatherIds.length > 0) {
      const { data: fatherPersons = [] } = await supabase
         .from('persons')
         .select('*')
         .in('id', missingFatherIds);
      fatherPersons.forEach(p => { personMap[p.id] = p; });
   }

   const missingMotherIds = [...new Set(
      Object.values(personMap)
         .map(p => p.mother_id)
         .filter(mid => mid && !personMap[mid])
   )];

   if (missingMotherIds.length > 0) {
      const { data: motherPersons = [] } = await supabase
         .from('persons')
         .select('*')
         .in('id', missingMotherIds);
      motherPersons.forEach(p => { personMap[p.id] = p; });
   }

   const visibleIds = [...new Set([
      ...visibleCoreIds,
      ...uniqExternalSpouseIds
   ])];

   const burialMap = {};
   if (visibleIds.length > 0) {
      const { data: burials = [] } = await supabase
         .from('burial_info')
         .select('*')
         .in('person_id', visibleIds);

      burials.forEach(b => {
         burialMap[b.person_id] = b;
      });
   }

   const spouseMap = {};
   marriages.forEach(m => {
      if (!spouseMap[m.spouse1_id]) spouseMap[m.spouse1_id] = [];
      if (!spouseMap[m.spouse2_id]) spouseMap[m.spouse2_id] = [];
      spouseMap[m.spouse1_id].push(m.spouse2_id);
      spouseMap[m.spouse2_id].push(m.spouse1_id);
   });

   const membershipIds = [...new Set(Object.keys(personMap))];
   const membershipsByPerson = {};
   if (membershipIds.length > 0) {
      const { data: memberships = [] } = await supabase
         .from('family_persons')
         .select('person_id, family_id, families(id, name, qasba)')
         .in('person_id', membershipIds);

      memberships.forEach(m => {
         if (!membershipsByPerson[m.person_id]) membershipsByPerson[m.person_id] = [];
         membershipsByPerson[m.person_id].push({
            familyId: m.families?.id || m.family_id,
            familyName: m.families?.name || null,
            familyQasba: m.families?.qasba || null
         });
      });
   }

   const getFatherName = (person) => {
      if (!person) return null;
      if (person.father_name) return person.father_name;
      if (person.father_id && personMap[person.father_id]?.name) return personMap[person.father_id].name;
      return parseFatherFromAbout(person.about);
   };

   const getMotherName = (person) => {
      if (!person) return null;
      if (person.mother_name) return person.mother_name;
      if (person.mother_id && personMap[person.mother_id]?.name) return personMap[person.mother_id].name;

      // Fallback: when father has exactly one spouse, infer mother from that spouse.
      if (person.father_id) {
         const fatherSpouseIds = [...new Set(spouseMap[person.father_id] || [])];
         if (fatherSpouseIds.length === 1) {
            const inferredMother = personMap[fatherSpouseIds[0]];
            if (inferredMother?.name) return inferredMother.name;
         }
      }

      return parseMotherFromAbout(person.about);
   };

   const getSpouseCount = (personId) => {
      if (!personId) return 0;
      const ids = spouseMap[personId] || [];
      return new Set(ids).size;
   };

   const personIdSet = new Set(personIds);
   const childIds = new Set();
   persons.forEach(p => {
      // A person is a child if either their father OR mother belongs to this family.
      // Checking mother_id prevents cross-family children (e.g. child linked to mother's
      // family where the father is from a different family) from being treated as root nodes.
      if ((p.father_id && personIdSet.has(p.father_id)) || (p.mother_id && personIdSet.has(p.mother_id))) {
         childIds.add(p.id);
      }
   });

   const rootPersons = persons.filter(p => !childIds.has(p.id));
   const rootPerson = rootPersons[0];

   if (!rootPerson) {
      return {
         status: 200,
         body: {
            family: { id: family.id, name: family.name, qasba: family.qasba },
            tree: null
         }
      };
   }

   const visitedNodeIds = new Set();

   function buildNode(person, options = {}) {
      const { ignoreVisited = false } = options;
      if (!person) return null;
      if (visitedNodeIds.has(person.id) && !ignoreVisited) return null;
      visitedNodeIds.add(person.id);

      const burial = burialMap[person.id];
      const spouseIds = spouseMap[person.id] || [];
      const memberships = membershipsByPerson[person.id] || [];
      const isInCurrentFamily = memberships.some(m => m.familyId === family.id);

      const spouses = spouseIds.map(sid => {
         const spousePerson = personMap[sid];
         if (!spousePerson) return null; // deleted person – skip ghost node

         const spouseBurial = burialMap[sid];
         const spouseMemberships = membershipsByPerson[sid] || [];
         const spouseMembership = spouseMemberships[0] || null;
         const spouseInCurrentFamily = spouseMemberships.some(m => m.familyId === family.id);

         return {
            dbId: spousePerson.id,
            id: spousePerson.unique_id || spousePerson.id,
            name: spousePerson.name,
            fname: getFatherName(spousePerson) || '',
            motherName: getMotherName(spousePerson) || '',
            gender: spousePerson.gender,
            alive: spousePerson.alive,
            isLawald: spousePerson.is_lawald === true,
            dob: spousePerson.date_of_birth || '',
            dod: spousePerson.date_of_death || '',
            place: spousePerson.place_of_birth || '',
            about: spousePerson.about || '',
            isInCurrentFamily: spouseInCurrentFamily,
            familyId: spouseMembership?.familyId || null,
            familyName: spouseMembership?.familyName || null,
            familyQasba: spouseMembership?.familyQasba || null,
            burial: spouseBurial ? {
               place: spouseBurial.burial_place || '',
               map: spouseBurial.burial_map_url || spouseBurial.map_link || null
            } : null
         };
      }).filter(Boolean); // remove nulls from deleted/missing spouses

      // Dedupe spouse list by name when legacy duplicate profiles exist.
      // Prefer records with family linkage and fresher profile metadata.
      const spousesByName = new Map();
      spouses.forEach(sp => {
         const key = normalizeNameKey(sp.name) || String(sp.dbId || sp.id || '');
         const previous = spousesByName.get(key);
         if (!previous) {
            spousesByName.set(key, sp);
            return;
         }

         const score = (candidate) => {
            let s = 0;
            if (candidate.isInCurrentFamily) s += 100;
            if (candidate.familyId) s += 10;
            if (candidate.fname) s += 2;
            if (candidate.about) s += 1;
            return s;
         };

         if (score(sp) > score(previous)) {
            spousesByName.set(key, sp);
         }
      });
      const dedupedSpouses = [...spousesByName.values()];

      const children = persons
         .filter(p => {
            if (p.id === person.id) return false;
            // Always attach under father when father is a direct family member.
            if (p.father_id === person.id) return true;
            // Attach under mother only when the father is NOT a direct family member
            // (i.e. father is an external person - not in family_persons for this family).
            // Using personIdSet (direct members only) rather than personMap (all fetched persons,
            // including external spouses) is key: an external spouse IS in personMap but should
            // not block children from appearing under the mother.
            if (p.mother_id === person.id && !personIdSet.has(p.father_id)) return true;
            return false;
         })
         .map(child => buildNode(child))
         .filter(Boolean);

      const linkedFamilies = memberships.filter(m => m.familyId !== family.id && m.familyQasba);

      const node = {
         dbId: person.id,
         id: person.unique_id || person.id,
         name: person.name,
         fname: getFatherName(person) || '',
         motherName: getMotherName(person) || '',
         fatherSpouseCount: getSpouseCount(person.father_id),
         gender: person.gender,
         alive: person.alive,
         isLawald: person.is_lawald === true,
         dob: person.date_of_birth || '',
         dod: person.date_of_death || '',
         place: person.place_of_birth || '',
         about: person.about || '',
         isInCurrentFamily,
         burial: burial ? {
            place: burial.burial_place || '',
            map: burial.burial_map_url || burial.map_link || null
         } : null,
         personId: person.unique_id,
         children: children.length > 0 ? children : undefined
      };

      if (dedupedSpouses.length === 1) {
         node.spouse = dedupedSpouses[0];
      } else if (dedupedSpouses.length > 1) {
         node.spouse = dedupedSpouses;
      }

      if (linkedFamilies.length > 0) {
         node.link = true;
         node.qasba = linkedFamilies[0].familyQasba;
         node.linkedFamilies = linkedFamilies.map(f => ({
            familyId: f.familyId,
            familyName: f.familyName,
            familyQasba: f.familyQasba
         }));
      }

      return node;
   }

   const primaryTree = buildNode(rootPerson);

   // Build detached subtrees: other root-level persons and any still-unvisited persons.
   // Split them into two groups:
   //   - lineageRoots: have their own children → they are secondary founding ancestors
   //   - orphanedNodes: leaf persons with no parent and no children → not part of any lineage
   const buildDetached = (personList) =>
      personList
         .filter(p => !visitedNodeIds.has(p.id))
         .map(p => buildNode(p))
         .filter(Boolean);

   const allDetachedBuilt = [
      ...buildDetached(rootPersons),
      ...buildDetached(persons),
   ];

   const detachedLineageRoots = allDetachedBuilt.filter(
      n => Array.isArray(n.children) && n.children.length > 0
   );
   const detachedOrphans = allDetachedBuilt.filter(
      n => !Array.isArray(n.children) || n.children.length === 0
   );

   // Build the connected tree. If there are multiple lineage roots, wrap them under a
   // virtual root so D3 sees a proper single-root hierarchy. Orphaned persons (no parent
   // and no children) are excluded from the D3 tree — they corrupt the layout by forcing
   // D3 to spread all nodes as siblings, making the real tree appear tiny and off-centre.
   let tree;
   if (!primaryTree) {
      tree = null;
   } else if (detachedLineageRoots.length === 0) {
      tree = primaryTree;
   } else {
      // Multiple disconnected lineages → virtual root acts as invisible anchor.
      tree = {
         id: `virtual-root-${family.id}`,
         name: family.name,
         isVirtualRoot: true,
         children: [primaryTree, ...detachedLineageRoots],
      };
   }

   // Count of orphaned persons so the admin UI can show a warning.
   let detachedCount = detachedOrphans.length;

   // Final safety net: guarantee every family-linked person appears in the
   // payload, even if graph traversal ordering skipped a linked node.
   const collectTreeDbIds = (node, set) => {
      if (!node) return set;
      if (node.dbId) set.add(node.dbId);
      const kids = [
         ...(Array.isArray(node.children) ? node.children : []),
         ...(Array.isArray(node._children) ? node._children : [])
      ];
      kids.forEach(child => collectTreeDbIds(child, set));
      return set;
   };

   const buildStandaloneNode = (person) => {
      if (!person) return null;
      const burial = burialMap[person.id];
      const memberships = membershipsByPerson[person.id] || [];
      const isInCurrentFamily = memberships.some(m => m.familyId === family.id);

      return {
         dbId: person.id,
         id: person.unique_id || person.id,
         name: person.name,
         fname: getFatherName(person) || '',
         motherName: getMotherName(person) || '',
         fatherSpouseCount: getSpouseCount(person.father_id),
         gender: person.gender,
         alive: person.alive,
         isLawald: person.is_lawald === true,
         dob: person.date_of_birth || '',
         dod: person.date_of_death || '',
         place: person.place_of_birth || '',
         about: person.about || '',
         isInCurrentFamily,
         burial: burial ? {
            place: burial.burial_place || '',
            map: burial.burial_map_url || burial.map_link || null
         } : null,
         personId: person.unique_id
      };
   };

   const includedDbIds = collectTreeDbIds(tree, new Set());
   const missingLinkedIds = personIds.filter(id => !includedDbIds.has(id));

   // Backfill any linked IDs missing from personMap (defensive, for edge cases
   // where primary person fetch misses a linked row).
   const missingIdsWithoutPersonRow = missingLinkedIds.filter(id => !personMap[id]);
   if (missingIdsWithoutPersonRow.length > 0) {
      const { data: backfillPersons = [] } = await supabase
         .from('persons')
         .select('*')
         .in('id', missingIdsWithoutPersonRow);
      backfillPersons.forEach(p => {
         personMap[p.id] = p;
      });
   }

   // Same split for forced-missing: lineage heads go into the tree, leaf-only orphans
   // go to the detachedCount so the admin sees a warning to set their parent links.
   const forcedNodes = missingLinkedIds
      .map(id => {
         const person = personMap[id];
         if (!person) return null;
         const rebuilt = buildNode(person, { ignoreVisited: true });
         return rebuilt || buildStandaloneNode(person);
      })
      .filter(Boolean);

   const forcedLineageRoots = forcedNodes.filter(
      n => Array.isArray(n.children) && n.children.length > 0
   );
   // A "true orphan" is a person with no children AND no parent link in the direct
   // family membership set. Nodes that have parent links but were missed by normal
   // traversal (e.g. leaf children of external-father) should still appear in the tree.
   const forcedOrphans = forcedNodes.filter(n => {
      if (Array.isArray(n.children) && n.children.length > 0) return false;
      const person = personMap[n.dbId];
      if (!person) return true;
      // If the person has a parent that IS a family member, they're not truly detached.
      return !personIdSet.has(person.father_id) && !personIdSet.has(person.mother_id);
   });
   const forcedWithParentLinks = forcedNodes.filter(n => {
      if (Array.isArray(n.children) && n.children.length > 0) return false;
      const person = personMap[n.dbId];
      if (!person) return false;
      return personIdSet.has(person.father_id) || personIdSet.has(person.mother_id);
   });
   detachedCount += forcedOrphans.length;

   let finalizedTree = tree;
   // Forced lineage roots (multiple family founders) and forced leaf nodes with known
   // parent links go under the virtual root (or extend it). Truly parentless orphans
   // are excluded from the tree and counted in detachedCount.
   const forcedForTree = [...forcedLineageRoots, ...forcedWithParentLinks];
   if (forcedForTree.length > 0 && finalizedTree) {
      // Attach under the virtual root (or create one).
      if (finalizedTree.isVirtualRoot) {
         finalizedTree = {
            ...finalizedTree,
            children: [...(finalizedTree.children || []), ...forcedForTree],
         };
      } else {
         finalizedTree = {
            id: `virtual-root-${family.id}`,
            name: family.name,
            isVirtualRoot: true,
            children: [finalizedTree, ...forcedForTree],
         };
      }
   }

   return {
      status: 200,
      body: {
         family: { id: family.id, name: family.name, qasba: family.qasba },
         tree: finalizedTree,
         detachedCount,
      }
   };
}

export async function GET(request, { params }) {
   try {
      const { qasba } = params;
      const payload = await buildTreePayload(qasba);
      return Response.json(payload.body, {
         status: payload.status,
         headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
         }
      });
   } catch (error) {
      return Response.json(
         { error: error.message || 'Internal server error' },
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
