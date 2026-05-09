'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTreeRendering } from '@/hooks/useTreeRendering';
import { DetailPopup } from '@/components/DetailPopup';
import { useAuth } from '@/context/AuthContext';
import { fetchAllFamilies, fetchFamilyData, deletePerson, removePersonFromFamily } from '@/app/admin/family-management/utils/api';
import './shajra.css';

const LazyAddPersonForm = dynamic(() => import('@/app/admin/family-management/components/AddPersonForm'), { ssr: false });
const LazyEditPersonModal = dynamic(() => import('@/app/admin/family-management/components/EditPersonModal'), { ssr: false });

export default function ShajraPage() {
   const { qasba } = useParams();
   const router = useRouter();
   const searchParams = useSearchParams();
   const { isAdmin, loading: authLoading } = useAuth();
   const [treeData, setTreeData] = useState(null);
   const [familyInfo, setFamilyInfo] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [popupData, setPopupData] = useState(null);
   const [linkedFamilyPicker, setLinkedFamilyPicker] = useState(null);
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState([]);
   const [editMode, setEditMode] = useState(false);
   const [stats, setStats] = useState(null);
   const [detachedCount, setDetachedCount] = useState(0);
   const [treeCrudState, setTreeCrudState] = useState(null);
   const [treeCrudData, setTreeCrudData] = useState({ loading: false, allFamilies: [], familyData: null, person: null, error: '' });
   const containerRef = useRef(null);
   const allFamiliesCacheRef = useRef(null);
   const familyDataCacheRef = useRef({ qasba: null, data: null });

   const treeContainsPerson = useCallback((node, personId) => {
      if (!node || !personId) return false;
      if (node.dbId === personId || node.id === personId) return true;

      const spouses = Array.isArray(node.spouse) ? node.spouse : (node.spouse ? [node.spouse] : []);
      if (spouses.some(sp => sp?.dbId === personId || sp?.id === personId)) return true;

      const kids = [
         ...(Array.isArray(node.children) ? node.children : []),
         ...(Array.isArray(node._children) ? node._children : [])
      ];
      return kids.some(child => treeContainsPerson(child, personId));
   }, []);

   const treeHasExpectedSpouseLinks = useCallback((node, personId, expectedSpouseIds = []) => {
      if (!personId || !Array.isArray(expectedSpouseIds) || expectedSpouseIds.length === 0) return true;
      if (!node) return false;

      const spouseList = Array.isArray(node.spouse) ? node.spouse : (node.spouse ? [node.spouse] : []);
      const spouseIdsOnNode = new Set(spouseList.map(sp => sp?.dbId || sp?.id).filter(Boolean));
      const nodeId = node.dbId || node.id;

      // Case A: person is a node; expected spouses should be attached to that node.
      if (nodeId === personId) {
         return expectedSpouseIds.every(id => spouseIdsOnNode.has(id));
      }

      // Case B: person is rendered as spouse under another node; that node should be one expected spouse.
      if (spouseIdsOnNode.has(personId) && expectedSpouseIds.includes(nodeId)) {
         return true;
      }

      const kids = [
         ...(Array.isArray(node.children) ? node.children : []),
         ...(Array.isArray(node._children) ? node._children : [])
      ];
      return kids.some(child => treeHasExpectedSpouseLinks(child, personId, expectedSpouseIds));
   }, []);

   // Fetch tree data
   const refreshTree = useCallback(async ({ background = false, forceFresh = false, expectedPersonId = null, expectedSpouseIds = [] } = {}) => {
      if (!background) setLoading(true);
      setError(null);
      try {
         const attempts = expectedPersonId ? 8 : 1;
         let json = null;
         let lastFetched = null;

         for (let attempt = 0; attempt < attempts; attempt += 1) {
            const treeUrl = `/api/family-tree/tree/${qasba}?_ts=${Date.now()}-${attempt}`;
            const res = await fetch(treeUrl, { cache: 'no-store' });
            if (!res.ok) throw new Error('Family not found');
            const current = await res.json();
            lastFetched = current;

            const personOk = !expectedPersonId || treeContainsPerson(current.tree, expectedPersonId);
            const spouseLinksOk = !expectedPersonId || treeHasExpectedSpouseLinks(current.tree, expectedPersonId, expectedSpouseIds);

            if (personOk && spouseLinksOk) {
               json = current;
               break;
            }

            if (attempt < attempts - 1) {
               await new Promise(resolve => setTimeout(resolve, 500));
            }
         }

         // After exhausting retries, always commit the latest server response so
         // the tree never stays frozen on stale/optimistic state.
         if (!json) json = lastFetched;
         if (!json) return;

         setFamilyInfo(json.family);
         setTreeData(json.tree);
         setDetachedCount(json.detachedCount || 0);
      } catch (err) {
         setError(err.message);
      } finally {
         if (!background) setLoading(false);
      }
   }, [qasba, treeContainsPerson, treeHasExpectedSpouseLinks]);

   const [biographyMap, setBiographyMap] = useState({}); // { dbId: slug } for "Read full biography" links

   useEffect(() => {
      if (!qasba) return;

      // Always fetch fresh tree data to guarantee admin mutations are reflected immediately.
      refreshTree({ forceFresh: true });

      // Load biography index for linking from tree popup
      fetch('/api/biographies/list')
         .then(r => r.ok ? r.json() : { biographies: [] })
         .then(data => {
            const map = {};
            (data.biographies || []).forEach(bio => {
               if (bio.supabasePersonId && bio.slug) map[bio.supabasePersonId] = bio.slug;
            });
            setBiographyMap(map);
         })
         .catch(() => { /* non-critical */ });
   }, [qasba, refreshTree]);

   const handleNodeClick = useCallback((d, x, y) => {
      setPopupData(d.data);
   }, []);

   const handleSetSection = useCallback((newQasba, focusId) => {
      const focusQuery = focusId ? `?focus=${encodeURIComponent(focusId)}` : '';
      router.push(`/shajra/${newQasba}${focusQuery}`);
   }, [router]);

   const handleLinkedFamilyClick = useCallback((person, families) => {
      if (!families || families.length === 0) return;
      setLinkedFamilyPicker({
         personId: person?.id,
         personName: person?.name,
         families
      });
   }, []);

   const closeTreeCrud = useCallback(() => {
      setTreeCrudState(null);
      setTreeCrudData({ loading: false, allFamilies: [], familyData: null, person: null, error: '' });
   }, []);

   const getSingleSpouse = useCallback((node) => {
      const spouses = Array.isArray(node?.spouse) ? node.spouse : (node?.spouse ? [node.spouse] : []);
      return spouses.length === 1 ? spouses[0] : null;
   }, []);

   const getExistingChildNames = useCallback((node) => {
      const visibleChildren = Array.isArray(node?.children) ? node.children : [];
      const collapsedChildren = Array.isArray(node?._children) ? node._children : [];
      return [...visibleChildren, ...collapsedChildren]
         .map(child => child?.name)
         .filter(Boolean);
   }, []);

   const openTreeCrud = useCallback((mode, node = null) => {
      setPopupData(null);
      setTreeCrudState({ mode, node });
   }, []);

   const patchChildIntoTree = useCallback((parentDbId, createdPerson, parentContext = {}) => {
      if (!parentDbId || !createdPerson?.id) return;

      const childNode = {
         dbId: createdPerson.id,
         id: createdPerson.unique_id || createdPerson.id,
         name: createdPerson.name,
         fname: parentContext.fatherName || '',
         gender: createdPerson.gender || 'male',
         alive: typeof createdPerson.alive === 'boolean' ? createdPerson.alive : true,
         dob: createdPerson.date_of_birth || '',
         dod: createdPerson.date_of_death || '',
         place: createdPerson.place_of_birth || '',
         about: createdPerson.about || '',
         motherName: parentContext.motherName || '',
         fatherSpouseCount: parentContext.fatherSpouseCount || 0,
         personId: createdPerson.unique_id || createdPerson.id
      };

      const clone = (node) => {
         if (!node) return node;
         const next = { ...node };
         if (Array.isArray(node.children)) next.children = node.children.map(clone);
         if (Array.isArray(node._children)) next._children = node._children.map(clone);
         if (Array.isArray(node.spouse)) next.spouse = node.spouse.map(sp => ({ ...sp }));
         else if (node.spouse && typeof node.spouse === 'object') next.spouse = { ...node.spouse };
         return next;
      };

      const appendToParent = (node) => {
         if (!node) return false;

         if (node.dbId === parentDbId) {
            if (Array.isArray(node.children)) {
               node.children = [...node.children, childNode];
            } else if (Array.isArray(node._children)) {
               node._children = [...node._children, childNode];
            } else {
               node.children = [childNode];
            }
            return true;
         }

         if (Array.isArray(node.children)) {
            for (const child of node.children) {
               if (appendToParent(child)) return true;
            }
         }

         if (Array.isArray(node._children)) {
            for (const child of node._children) {
               if (appendToParent(child)) return true;
            }
         }

         return false;
      };

      setTreeData(prev => {
         if (!prev) return prev;
         const nextTree = clone(prev);
         const inserted = appendToParent(nextTree);
         return inserted ? nextTree : prev;
      });
   }, []);

   const handleDeleteFromTree = useCallback(async (node) => {
      if (!node?.dbId) return;

      const choice = window.prompt(
         `Delete options for "${node.name}":\n1 = Delete from this family only\n2 = Delete completely\n\nType 1 or 2`
      );

      if (!choice) return;

      try {
         if (choice.trim() === '1') {
            if (!familyInfo?.id) {
               alert('Current family not found.');
               return;
            }
            await removePersonFromFamily(familyInfo.id, node.dbId);
         } else if (choice.trim() === '2') {
            const confirmed = window.confirm(`Delete "${node.name}" permanently from the database? This also removes linked marriages and burial info.`);
            if (!confirmed) return;
            await deletePerson(node.dbId);
         } else {
            alert('Invalid choice. Type 1 or 2.');
            return;
         }

         setPopupData(null);
         await refreshTree({ forceFresh: true });
      } catch (err) {
         alert(err.message || 'Failed to delete person');
      }
   }, [familyInfo?.id, refreshTree]);

   useEffect(() => {
      let cancelled = false;

      async function loadTreeCrudData() {
         if (!treeCrudState || !familyInfo?.qasba) return;

         setTreeCrudData({ loading: true, allFamilies: [], familyData: null, person: null, error: '' });

         try {
            const allFamiliesPromise = allFamiliesCacheRef.current
               ? Promise.resolve(allFamiliesCacheRef.current)
               : fetchAllFamilies();

            const familyDataPromise = treeCrudState.mode === 'edit'
               ? fetchFamilyData(familyInfo.qasba)
               : Promise.resolve(null);

            const [allFamilies, familyDataResult] = await Promise.all([
               allFamiliesPromise,
               familyDataPromise
            ]);

            if (cancelled) return;

            if (!allFamiliesCacheRef.current) {
               allFamiliesCacheRef.current = allFamilies || [];
            }
            if (treeCrudState.mode === 'edit' && familyDataResult) {
               familyDataCacheRef.current = { qasba: familyInfo.qasba, data: familyDataResult };
            }

            const selectedPerson = treeCrudState.mode === 'edit'
               ? (familyDataResult?.persons || []).find(p => String(p.id) === String(treeCrudState.node?.dbId)) || null
               : null;

            // Fallback: person may not be in family_persons (e.g. auto-populated child).
            // Fetch them directly by ID so the edit modal always works.
            let resolvedPerson = selectedPerson;
            if (treeCrudState.mode === 'edit' && !selectedPerson && treeCrudState.node?.dbId) {
               try {
                  const directRes = await fetch(`/api/family-tree/person/${treeCrudState.node.dbId}`);
                  if (!cancelled && directRes.ok) {
                     const directData = await directRes.json();
                     if (directData?.person) {
                        resolvedPerson = directData.person;
                     }
                  }
               } catch { /* ignore */ }
            }

            setTreeCrudData({
               loading: false,
               allFamilies: allFamiliesCacheRef.current || [],
               familyData: familyDataResult,
               person: resolvedPerson,
               error: ''
            });
         } catch (err) {
            if (cancelled) return;
            setTreeCrudData({ loading: false, allFamilies: [], familyData: null, person: null, error: err.message || 'Failed to load editor data' });
         }
      }

      loadTreeCrudData();
      return () => { cancelled = true; };
   }, [treeCrudState, familyInfo?.qasba]);

   const treeCrudConfig = useMemo(() => {
      if (!treeCrudState) return null;

      const node = treeCrudState.node;
      const spouse = getSingleSpouse(node);

      if (treeCrudState.mode === 'add-root') {
         return {
            title: `Add First Person to ${familyInfo?.name || 'Family'}`,
            initialValues: {},
            lockedSelections: {},
            duplicateNameCandidates: [],
         };
      }

      if (treeCrudState.mode === 'add-spouse' && node?.dbId) {
         return {
            title: `Add Spouse for ${node.name}`,
            initialValues: {
               gender: node.gender === 'male' ? 'female' : 'male',
               spouseId: node.dbId,
               spouseName: node.name,
               spouseFamilyId: familyInfo?.id || null,
               spouseFamilyName: familyInfo?.name || null
            },
            lockedSelections: { spouseId: true },
            duplicateNameCandidates: [],
         };
      }

      if (treeCrudState.mode === 'add-child' && node?.dbId) {
         const initialValues = {};
         const lockedSelections = {};

         if (node.gender === 'female') {
            initialValues.motherId = node.dbId;
            initialValues.motherName = node.name;
            initialValues.motherFamilyId = familyInfo?.id || null;
            initialValues.motherFamilyName = familyInfo?.name || null;
            lockedSelections.motherId = true;

            if (spouse?.dbId) {
               initialValues.fatherId = spouse.dbId;
               initialValues.fatherName = spouse.name;
               lockedSelections.fatherId = true;
            }
         } else {
            initialValues.fatherId = node.dbId;
            initialValues.fatherName = node.name;
            lockedSelections.fatherId = true;

            if (spouse?.dbId) {
               initialValues.motherId = spouse.dbId;
               initialValues.motherName = spouse.name;
               initialValues.motherFamilyId = spouse.familyId || null;
               initialValues.motherFamilyName = spouse.familyName || null;
               lockedSelections.motherId = true;
            }
         }

         return {
            title: `Add Child for ${node.name}`,
            initialValues,
            lockedSelections,
            duplicateNameCandidates: getExistingChildNames(node)
         };
      }

      return null;
   }, [treeCrudState, familyInfo, getExistingChildNames, getSingleSpouse]);

   const editingTools = useMemo(() => ({
      enabled: isAdmin && editMode,
      onAddChild: (node) => openTreeCrud('add-child', node),
      onEdit: (node) => openTreeCrud('edit', node),
      onDelete: handleDeleteFromTree
   }), [isAdmin, editMode, openTreeCrud, handleDeleteFromTree]);

   const focusParam = searchParams.get('focus');

   const config = useMemo(() => ({
      qasbaName: familyInfo?.name || '',
      defaultFocusId: focusParam || treeData?.id || null,
      urlFocusId: focusParam || null,
      jsonData: treeData,
   }), [familyInfo?.name, focusParam, treeData]);

   const { svgRef, drawTree, focusNodeById, rootRef, peopleRef, getStats } = useTreeRendering(
      config,
      handleNodeClick,
      handleSetSection,
      handleLinkedFamilyClick,
      editingTools
   );

   // Draw tree when data is ready
   useEffect(() => {
      if (treeData) {
         // Small delay to ensure SVG is in DOM
         const timer = setTimeout(() => {
            drawTree();
            setStats(getStats());
         }, 100);
         return () => clearTimeout(timer);
      } else {
         setStats(null);
      }
   }, [treeData, drawTree, getStats]);

   // Redraw on resize
   useEffect(() => {
      const handleResize = () => {
         if (treeData) {
            drawTree();
            setStats(getStats());
         }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
   }, [treeData, drawTree, getStats]);

   // Search filter
   useEffect(() => {
      if (!searchQuery.trim() || !peopleRef.current) {
         setSearchResults([]);
         return;
      }
      const q = searchQuery.toLowerCase();
      const results = peopleRef.current.filter(p =>
         p.name.toLowerCase().includes(q) || (p.fname && p.fname.toLowerCase().includes(q))
      ).slice(0, 10);
      setSearchResults(results);
   }, [searchQuery, peopleRef]);

   const handleSearchSelect = (person) => {
      focusNodeById(person.focusId);
      setSearchQuery('');
      setSearchResults([]);
   };

   if (loading) {
      return (
         <div className="tree-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Loading family tree...</span>
         </div>
      );
   }

   if (error) {
      return (
         <div className="tree-error">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
         </div>
      );
   }

   return (
      <div
         className="nasab-wrapper"
         ref={containerRef}
         onClick={() => {
            if (popupData) setPopupData(null);
            if (linkedFamilyPicker) setLinkedFamilyPicker(null);
         }}
      >
         {/* Search bar header */}
         <div className="search-bar-header">
            <div className="search-container" style={{ position: 'relative' }}>
               <input
                  type="text"
                  className="tree-search"
                  placeholder={`Search in ${familyInfo?.name || 'family'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
               {searchResults.length > 0 && (
                  <ul className="search-suggestions">
                     {searchResults.map((p, idx) => (
                        <li key={idx} onClick={() => handleSearchSelect(p)}>
                           <strong>{p.name}</strong>
                           {(p.fname || p.parentName) && (
                              <span className="suggest-fname">
                                 {' — '}
                                 {p.type === 'spouse'
                                    ? 'Spouse of'
                                    : (p.gender === 'female' ? 'D/O' : 'S/O')}{' '}
                                 {p.type === 'spouse' ? (p.parentName || p.fname) : (p.fname || p.parentName)}
                              </span>
                           )}
                        </li>
                     ))}
                  </ul>
               )}
            </div>

            {stats && (
               <div className="tree-stats-bar">
                  <span title="Total people"><i className="fas fa-users"></i> {stats.totalPeople}</span>
                  <span title="Generations"><i className="fas fa-layer-group"></i> {stats.generations}</span>
                  <span title="Living" style={{ color: '#22c55e' }}><i className="fas fa-heart"></i> {stats.livingPeople}</span>
               </div>
            )}

            {!authLoading && isAdmin && (
               <button
                  type="button"
                  className={`tree-edit-toggle ${editMode ? 'active' : ''}`}
                  onClick={() => setEditMode(prev => !prev)}
               >
                  <i className={`fa-solid ${editMode ? 'fa-wand-magic-sparkles' : 'fa-pen-to-square'}`}></i>
                  {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
               </button>
            )}

            {!authLoading && isAdmin && detachedCount > 0 && (
               <div
                  className="tree-detached-warning"
                  title={`${detachedCount} people in this family have no parent link and do not appear in the tree. Edit each person to set their father.`}
               >
                  <i className="fas fa-exclamation-triangle"></i>
                  {' '}{detachedCount} unlinked
               </div>
            )}
         </div>

         {/* Tree SVG or empty state */}
         {!treeData ? (
            <div className="tree-empty">
               <i className="fas fa-tree"></i>
               <span>No tree data available for this family yet.</span>
               {!authLoading && isAdmin && (
                  <button className="tree-empty-add-btn" onClick={() => openTreeCrud('add-root')}>
                     <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>Start This Family
                  </button>
               )}
            </div>
         ) : (
            <div className="tree-container">
               <svg ref={svgRef} className="family-tree-svg" />
            </div>
         )}

         {/* Detail Popup */}
         {popupData && (
            <DetailPopup
               data={popupData}
               onClose={() => setPopupData(null)}
               rootRef={rootRef}
               setSection={handleSetSection}
               biographyMap={biographyMap}
            />
         )}

         {linkedFamilyPicker && (
            <div className="linked-family-overlay" onClick={() => setLinkedFamilyPicker(null)}>
               <div className="linked-family-card" onClick={(e) => e.stopPropagation()}>
                  <div className="linked-family-header">
                     <h4>Select Linked Family</h4>
                     <button className="linked-family-close" onClick={() => setLinkedFamilyPicker(null)}>
                        &times;
                     </button>
                  </div>
                  <p className="linked-family-subtitle">
                     {linkedFamilyPicker.personName} is linked to multiple families.
                  </p>
                  <div className="linked-family-list">
                     {linkedFamilyPicker.families.map((f) => (
                        <button
                           key={`${linkedFamilyPicker.personId}-${f.familyId}`}
                           className="linked-family-item"
                           onClick={() => {
                              setLinkedFamilyPicker(null);
                              handleSetSection(f.familyQasba, linkedFamilyPicker.personId);
                           }}
                        >
                           <span className="linked-family-name">{f.familyName || f.familyQasba}</span>
                           <span className="linked-family-qasba">{f.familyQasba}</span>
                        </button>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {treeCrudState && treeCrudState.mode !== 'edit' && (
            <div className="tree-editor-overlay" onClick={closeTreeCrud}>
               <div className="tree-editor-panel" onClick={(e) => e.stopPropagation()}>
                  <button className="tree-editor-close" onClick={closeTreeCrud}>&times;</button>
                  {treeCrudData.loading ? (
                     <div className="tree-editor-loading">Loading editor...</div>
                  ) : treeCrudData.error ? (
                     <div className="tree-editor-error">{treeCrudData.error}</div>
                  ) : treeCrudConfig ? (
                     <>

                        <LazyAddPersonForm
                           key={`${treeCrudState.mode}-${treeCrudState.node?.dbId || 'root'}`}
                           familyId={familyInfo?.id}
                           allFamilies={treeCrudData.allFamilies}
                           onPersonAdded={async (newPerson, meta = {}) => {
                              const mode = treeCrudState?.mode;
                              const node = treeCrudState?.node;
                              closeTreeCrud();

                              // Optimistically patch newly added child for immediate visual feedback.
                              if (mode === 'add-child' && node?.dbId && newPerson?.id) {
                                 const spouse = getSingleSpouse(node);
                                 const nodeSpouses = Array.isArray(node?.spouse) ? node.spouse : (node?.spouse ? [node.spouse] : []);
                                 patchChildIntoTree(node.dbId, newPerson, {
                                    fatherName: newPerson.father_name || node.fname || node.name || '',
                                    motherName: newPerson.mother_name || (node.gender === 'female' ? node.name : spouse?.name || ''),
                                    fatherSpouseCount: node.gender === 'male' ? nodeSpouses.length : (spouse ? 1 : 0)
                                 });
                              }

                              await refreshTree({
                                 background: true,
                                 forceFresh: true,
                                 expectedPersonId: newPerson?.id || null,
                                 expectedSpouseIds: Array.isArray(meta?.spouseIds) ? meta.spouseIds : []
                              });
                           }}
                           onFamilyCreated={() => { }}
                           onCancel={closeTreeCrud}
                           initialValues={treeCrudConfig.initialValues}
                           lockedSelections={treeCrudConfig.lockedSelections}
                           duplicateNameCandidates={treeCrudConfig.duplicateNameCandidates}
                           title={treeCrudConfig.title}
                        />
                     </>
                  ) : null}
               </div>
            </div>
         )}

         {treeCrudState?.mode === 'edit' && treeCrudData.person && (
            <LazyEditPersonModal
               person={treeCrudData.person}
               marriages={treeCrudData.familyData?.marriages || []}
               persons={treeCrudData.familyData?.persons || []}
               allFamilies={treeCrudData.allFamilies}
               onSave={async () => {
                  closeTreeCrud();
                  await refreshTree({ forceFresh: true });
               }}
               onFamilyCreated={() => { }}
               onClose={closeTreeCrud}
            />
         )}

         {treeCrudState?.mode === 'edit' && treeCrudData.loading && (
            <div className="tree-editor-overlay" onClick={closeTreeCrud}>
               <div className="tree-editor-panel tree-editor-panel--compact" onClick={(e) => e.stopPropagation()}>
                  <button className="tree-editor-close" onClick={closeTreeCrud}>&times;</button>
                  <div className="tree-editor-loading">Loading editor...</div>
               </div>
            </div>
         )}

         {treeCrudState?.mode === 'edit' && treeCrudData.error && !treeCrudData.loading && (
            <div className="tree-editor-overlay" onClick={closeTreeCrud}>
               <div className="tree-editor-panel tree-editor-panel--compact" onClick={(e) => e.stopPropagation()}>
                  <button className="tree-editor-close" onClick={closeTreeCrud}>&times;</button>
                  <div className="tree-editor-error">{treeCrudData.error}</div>
               </div>
            </div>
         )}
      </div>
   );
}
