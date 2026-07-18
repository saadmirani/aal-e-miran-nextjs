'use client';

import { useState, useEffect, useCallback } from 'react';
import EditPersonModal from '@/app/admin/family-management/components/EditPersonModal';
import {
   fetchAllFamilies,
   searchPersons,
   fetchPersonDetails,
   deletePerson,
   removePersonFromFamily,
   addPersonToFamily,
} from '@/app/admin/family-management/utils/api';

export default function GlobalDataTab() {
   const [families, setFamilies] = useState([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState([]);
   const [searching, setSearching] = useState(false);
   const [mutatingId, setMutatingId] = useState(null);
   const [editingPerson, setEditingPerson] = useState(null);

   useEffect(() => {
      fetchAllFamilies()
         .then(setFamilies)
         .catch((err) => console.error('Failed to load families:', err));
   }, []);

   const runSearch = useCallback(async (query) => {
      const q = (query ?? searchQuery).trim();
      if (!q) { setSearchResults([]); return; }
      setSearching(true);
      try {
         const baseResults = await searchPersons(q);
         const normalized = (baseResults || []).filter((row) => {
            const id = String(row?.id || '').trim();
            return id && id !== '=' && id !== 'undefined' && id !== 'null';
         });
         const detailed = await Promise.all(
            normalized.map(async (row) => {
               try {
                  const detail = await fetchPersonDetails(row.id);
                  const p = detail?.person || {};
                  return {
                     id: row.id,
                     uniqueId: p.uniqueId || row.uniqueId || null,
                     name: p.name || row.name || 'Unknown',
                     gender: p.gender || row.gender || 'unknown',
                     alive: typeof p.alive === 'boolean' ? p.alive : row.alive,
                     fatherId: p.fatherId || null,
                     motherId: p.motherId || null,
                     dateOfBirth: p.dateOfBirth || null,
                     dateOfDeath: p.dateOfDeath || null,
                     placeOfBirth: p.placeOfBirth || null,
                     placeOfDeath: p.placeOfDeath || null,
                     about: p.about || null,
                     isLawald: Boolean(p.isLawald),
                     displayBadge: p.displayBadge || '',
                     families: Array.isArray(p.families) ? p.families : [],
                     spouses: Array.isArray(detail?.spouses) ? detail.spouses : [],
                     children: Array.isArray(detail?.children) ? detail.children : [],
                  };
               } catch {
                  return {
                     id: row.id,
                     uniqueId: row.uniqueId || null,
                     name: row.name || 'Unknown',
                     gender: row.gender || 'unknown',
                     alive: row.alive,
                     fatherId: null, motherId: null,
                     dateOfBirth: row.dateOfBirth || null,
                     dateOfDeath: row.dateOfDeath || null,
                     placeOfBirth: null, placeOfDeath: null,
                     about: null, isLawald: false, displayBadge: '',
                     families: row.familyId
                        ? [{ id: row.familyId, name: row.familyName || null, qasba: null }]
                        : [],
                     spouses: [], children: [],
                  };
               }
            })
         );
         setSearchResults(detailed);
      } catch (err) {
         console.error('Global search failed:', err);
         alert('Search failed: ' + err.message);
      } finally {
         setSearching(false);
      }
   }, [searchQuery]);

   const handleSearch = () => runSearch(searchQuery);

   const handleDelete = async (personId, personName) => {
      if (!window.confirm(`Permanently delete "${personName}" from the database? This removes all family links and marriages and cannot be undone.`)) return;
      setMutatingId(personId);
      try {
         await deletePerson(personId);
         setSearchResults((prev) => prev.filter((p) => p.id !== personId));
      } catch (err) {
         alert('Failed to delete: ' + err.message);
      } finally {
         setMutatingId(null);
      }
   };

   const handleUnlink = async (personId, familyId) => {
      setMutatingId(personId);
      try {
         await removePersonFromFamily(familyId, personId);
         setSearchResults((prev) =>
            prev.map((p) =>
               p.id === personId
                  ? { ...p, families: (p.families || []).filter((f) => f.id !== familyId) }
                  : p
            )
         );
      } catch (err) {
         alert('Failed to unlink: ' + err.message);
      } finally {
         setMutatingId(null);
      }
   };

   const handleLink = async (personId, familyId) => {
      if (!familyId) return;
      setMutatingId(personId);
      try {
         await addPersonToFamily(familyId, personId);
         const meta = families.find((f) => String(f.id) === String(familyId));
         setSearchResults((prev) =>
            prev.map((p) => {
               if (p.id !== personId) return p;
               if ((p.families || []).some((f) => String(f.id) === String(familyId))) return p;
               return {
                  ...p,
                  families: [
                     ...(p.families || []),
                     { id: meta?.id || familyId, name: meta?.name || null, qasba: meta?.qasba || null },
                  ],
               };
            })
         );
      } catch (err) {
         alert('Failed to link: ' + err.message);
      } finally {
         setMutatingId(null);
      }
   };

   const handleEditSave = async () => {
      setEditingPerson(null);
      await runSearch(searchQuery);
   };

   return (
      <section className="tab-content">
         <h2>Manage Global Data</h2>
         <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
            Search any person across the entire database. Edit records, delete permanently, or manage family links. Changes sync everywhere instantly.
         </p>

         {/* Search bar */}
         <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <input
               type="text"
               placeholder="Search by person name..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
               style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
               }}
            />
            <button
               onClick={handleSearch}
               disabled={searching}
               style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: searching ? 'default' : 'pointer',
                  fontSize: '14px',
                  opacity: searching ? 0.7 : 1,
               }}
            >
               {searching ? 'Searching…' : 'Search'}
            </button>
         </div>

         {/* Empty state */}
         {!searching && searchResults.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '14px' }}>
               No results yet. Enter a name above and press Search.
            </div>
         )}

         {/* Results */}
         {searchResults.map((person) => {
            const linkedIds = new Set((person.families || []).map((f) => String(f.id)));
            const available = families.filter((f) => !linkedIds.has(String(f.id)));
            const isBusy = mutatingId === person.id;

            return (
               <div
                  key={person.id}
                  style={{
                     background: 'white',
                     border: '1px solid #e2e8f0',
                     borderRadius: '10px',
                     padding: '16px',
                     marginBottom: '12px',
                     boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
               >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                     <div>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>{person.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                           ID: {person.uniqueId || person.id}
                           &nbsp;·&nbsp;{person.gender}
                           &nbsp;·&nbsp;
                           <span style={{ color: person.alive ? '#16a34a' : '#dc2626' }}>
                              {person.alive ? 'Living' : 'Deceased'}
                           </span>
                           {person.dateOfBirth && ` · b. ${person.dateOfBirth}`}
                           {person.dateOfDeath && ` · d. ${person.dateOfDeath}`}
                        </div>
                        {person.about && (
                           <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                              {person.about.length > 120 ? person.about.slice(0, 120) + '…' : person.about}
                           </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                           Spouses: {person.spouses?.length ?? 0}&nbsp;·&nbsp;Children: {person.children?.length ?? 0}
                        </div>
                     </div>
                     <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                           onClick={() => setEditingPerson(person)}
                           disabled={isBusy}
                           style={{
                              padding: '7px 14px',
                              background: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: isBusy ? 'default' : 'pointer',
                              opacity: isBusy ? 0.6 : 1,
                           }}
                        >
                           <i className="fas fa-pen" style={{ marginRight: '5px' }}></i>Edit
                        </button>
                        <button
                           onClick={() => handleDelete(person.id, person.name)}
                           disabled={isBusy}
                           style={{
                              padding: '7px 14px',
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: isBusy ? 'default' : 'pointer',
                              opacity: isBusy ? 0.6 : 1,
                           }}
                        >
                           {isBusy ? 'Working…' : <><i className="fas fa-trash" style={{ marginRight: '5px' }}></i>Delete</>}
                        </button>
                     </div>
                  </div>

                  {/* Family Links */}
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                     <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        Family Links
                     </div>
                     {(person.families || []).length === 0 ? (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>No family linked</span>
                     ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                           {(person.families || []).map((f) => (
                              <span
                                 key={`${person.id}-${f.id}`}
                                 style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '20px',
                                    padding: '3px 10px',
                                    fontSize: '12px',
                                    color: '#1d4ed8',
                                 }}
                              >
                                 {f.name || f.qasba || f.id}
                                 <button
                                    onClick={() => handleUnlink(person.id, f.id)}
                                    disabled={isBusy}
                                    style={{
                                       background: 'none',
                                       border: 'none',
                                       color: '#dc2626',
                                       cursor: isBusy ? 'default' : 'pointer',
                                       fontWeight: 700,
                                       fontSize: '14px',
                                       lineHeight: 1,
                                       padding: 0,
                                    }}
                                    title="Remove link"
                                 >
                                    ×
                                 </button>
                              </span>
                           ))}
                        </div>
                     )}
                     {available.length > 0 && (
                        <select
                           defaultValue=""
                           disabled={isBusy}
                           onChange={(e) => {
                              const v = e.target.value;
                              if (v) { handleLink(person.id, v); e.target.value = ''; }
                           }}
                           style={{
                              marginTop: '8px',
                              padding: '5px 10px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: '#374151',
                              cursor: 'pointer',
                           }}
                        >
                           <option value="">+ Link to family…</option>
                           {available.map((f) => (
                              <option key={`opt-${person.id}-${f.id}`} value={f.id}>
                                 {f.name}{f.region ? ` (${f.region})` : ''}
                              </option>
                           ))}
                        </select>
                     )}
                  </div>
               </div>
            );
         })}

         {/* Edit Modal */}
         {editingPerson && (
            <EditPersonModal
               person={editingPerson}
               marriages={[]}
               persons={[]}
               allFamilies={families}
               onSave={handleEditSave}
               onFamilyCreated={() => fetchAllFamilies().then(setFamilies).catch(console.error)}
               onClose={() => setEditingPerson(null)}
            />
         )}
      </section>
   );
}
