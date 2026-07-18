'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import AddPersonForm from './components/AddPersonForm';
import AddFamilyForm from './components/AddFamilyForm';
import EditPersonModal from './components/EditPersonModal';
import ImportChainTab from './components/ImportChainTab';
import { fetchAllFamilies, fetchFamilyData, removePersonFromFamily, deleteFamily, updateFamily, fetchPersonDetails, deleteMarriage, deletePerson } from './utils/api';

export default function FamilyManagementPage() {
   const [families, setFamilies] = useState([]);
   const [selectedFamily, setSelectedFamily] = useState(null);
   const [familyData, setFamilyData] = useState(null);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState('overview'); // overview, add-person, manage-persons, manage-spouse, import-chain
   const [personSearchQuery, setPersonSearchQuery] = useState('');
   const [spouseSearchQuery, setSpouseSearchQuery] = useState('');
   const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
   const [editingPerson, setEditingPerson] = useState(null);
   const [showDeleteFamilyModal, setShowDeleteFamilyModal] = useState(false);
   const [showEditFamilyModal, setShowEditFamilyModal] = useState(false);
   const [editFamilyForm, setEditFamilyForm] = useState({ name: '', qasba: '', region: '', description: '' });
   const [unknownSpouseDetails, setUnknownSpouseDetails] = useState({});


   // Use ref to track latest selectedFamily for callbacks
   const selectedFamilyRef = useRef(null);

   // Load all families on mount
   useEffect(() => {
      loadFamilies();
   }, []);

   // Update ref whenever selectedFamily changes
   useEffect(() => {
      selectedFamilyRef.current = selectedFamily;
   }, [selectedFamily]);

   const loadFamilies = async () => {
      try {
         setLoading(true);
         const data = await fetchAllFamilies();
         setFamilies(data);
      } catch (error) {
         console.error('Failed to load families:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleSelectFamily = async (family) => {
      setSelectedFamily(family);
      try {
         setLoading(true);
         const data = await fetchFamilyData(family.qasba);
         setFamilyData(data);
         setActiveTab('overview');
      } catch (error) {
         console.error('Failed to load family data:', error);
      } finally {
         setLoading(false);
      }
   };

   // Refresh family data without changing selected family
   const refreshFamilyData = async () => {
      if (!selectedFamilyRef.current) return;
      try {
         setLoading(true);
         const data = await fetchFamilyData(selectedFamilyRef.current.qasba);
         setFamilyData(data);
         return data;
      } catch (error) {
         console.error('Failed to refresh family data:', error);
         return null;
      } finally {
         setLoading(false);
      }
   };

   const handleDeletePerson = async (personId, personName) => {
      if (!window.confirm(`Remove "${personName}" from this family only? The person record will remain in other families and global data.`)) {
         return;
      }

      try {
         setLoading(true);
         // Remove from this family only (do not delete global person record)
         await removePersonFromFamily(selectedFamily.id, personId);

         // Re-sync from server immediately to avoid optimistic/UI drift.
         await refreshFamilyData();
      } catch (error) {
         console.error('Failed to delete person:', error);
         // Refetch on error to restore correct state.
         const latest = await refreshFamilyData();

         // If API says not linked, but refreshed data no longer has the person, treat as already removed.
         if (
            /not linked to this family/i.test(String(error?.message || '')) &&
            latest &&
            Array.isArray(latest.persons) &&
            !latest.persons.some(p => p.id === personId)
         ) {
            return;
         }

         alert('Failed to remove person from this family: ' + error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleOpenEditFamily = () => {
      setEditFamilyForm({
         name: selectedFamily.name || '',
         qasba: selectedFamily.qasba || '',
         region: selectedFamily.region || '',
         description: selectedFamily.description || '',
      });
      setShowEditFamilyModal(true);
   };

   const handleUpdateFamily = async () => {
      if (!selectedFamily?.id) return;
      const { name, qasba, region, description } = editFamilyForm;
      if (!name.trim()) { alert('Family name is required.'); return; }
      if (!qasba.trim()) { alert('Identifier (qasba) is required.'); return; }
      try {
         setLoading(true);
         await updateFamily(selectedFamily.id, { name: name.trim(), qasba: qasba.trim(), region: region.trim(), description: description.trim() });
         setShowEditFamilyModal(false);
         // Reload families list and refresh selected family with new qasba
         const updated = await fetchAllFamilies();
         setFamilies(updated);
         const refreshed = updated.find(f => f.id === selectedFamily.id);
         if (refreshed) {
            setSelectedFamily(refreshed);
            const data = await fetchFamilyData(refreshed.qasba);
            setFamilyData(data);
         }
      } catch (error) {
         alert('Failed to update family: ' + error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleDeleteFamily = async () => {
      if (!selectedFamily?.id) return;

      try {
         setLoading(true);
         await deleteFamily(selectedFamily.id);

         // Reset selection and refresh family list
         setShowDeleteFamilyModal(false);
         setSelectedFamily(null);
         setFamilyData(null);
         setActiveTab('overview');
         await loadFamilies();
      } catch (error) {
         console.error('Failed to delete family:', error);
         alert('Failed to delete family: ' + error.message);
      } finally {
         setLoading(false);
      }
   };

   const filteredPersons = familyData && personSearchQuery
      ? familyData.persons.filter(p =>
         p.name.toLowerCase().includes(personSearchQuery.toLowerCase())
      )
      : familyData?.persons || [];

   // Resolve spouse profiles not listed directly in family persons (used for unknown spouse management).
   useEffect(() => {
      let cancelled = false;

      const loadUnknownSpouseDetails = async () => {
         if (!familyData?.marriages?.length || !familyData?.persons?.length) {
            setUnknownSpouseDetails({});
            return;
         }

         const familyPersonIds = new Set((familyData.persons || []).map(p => p.id));
         const candidateIds = new Set();

         (familyData.marriages || []).forEach((m) => {
            const spouse1InFamily = familyPersonIds.has(m.spouse1Id);
            const spouse2InFamily = familyPersonIds.has(m.spouse2Id);
            if (spouse1InFamily && !spouse2InFamily) candidateIds.add(m.spouse2Id);
            if (spouse2InFamily && !spouse1InFamily) candidateIds.add(m.spouse1Id);
         });

         if (candidateIds.size === 0) {
            setUnknownSpouseDetails({});
            return;
         }

         const detailPairs = await Promise.all(
            [...candidateIds].map(async (id) => {
               try {
                  const detail = await fetchPersonDetails(id);
                  return [id, detail?.person || null];
               } catch {
                  return [id, null];
               }
            })
         );

         if (cancelled) return;
         setUnknownSpouseDetails(Object.fromEntries(detailPairs));
      };

      loadUnknownSpouseDetails();
      return () => { cancelled = true; };
   }, [familyData]);

   const unknownSpouseSections = useMemo(() => {
      if (!familyData?.marriages?.length || !familyData?.persons?.length) {
         return { primary: [], additional: [] };
      }

      const familyPersonIds = new Set((familyData.persons || []).map(p => p.id));
      const familyPersonById = new Map((familyData.persons || []).map(p => [p.id, p]));

      const byFamilyPerson = new Map();

      (familyData.marriages || []).forEach((m) => {
         const spouse1InFamily = familyPersonIds.has(m.spouse1Id);
         const spouse2InFamily = familyPersonIds.has(m.spouse2Id);
         if (spouse1InFamily === spouse2InFamily) return;

         const familyPersonId = spouse1InFamily ? m.spouse1Id : m.spouse2Id;
         const spouseId = spouse1InFamily ? m.spouse2Id : m.spouse1Id;
         const spouseProfile = unknownSpouseDetails[spouseId] || null;
         const spouseFamilies = Array.isArray(spouseProfile?.families) ? spouseProfile.families : [];

         // Unknown spouse means no family assignment anywhere.
         if (spouseFamilies.length > 0) return;

         const entry = {
            marriageId: m.id,
            spouseId,
            spouseName: spouseProfile?.name || `Person #${spouseId}`,
            spouseUniqueId: spouseProfile?.uniqueId || null,
            spouseGender: spouseProfile?.gender || null,
            spouseAlive: typeof spouseProfile?.alive === 'boolean' ? spouseProfile.alive : null,
            linkedPersonId: familyPersonId,
            linkedPersonName: familyPersonById.get(familyPersonId)?.name || `Person #${familyPersonId}`
         };

         if (!byFamilyPerson.has(familyPersonId)) byFamilyPerson.set(familyPersonId, []);
         byFamilyPerson.get(familyPersonId).push(entry);
      });

      const primary = [];
      const additional = [];

      byFamilyPerson.forEach((entries) => {
         const ordered = [...entries].sort((a, b) => {
            const aNum = Number(a.marriageId);
            const bNum = Number(b.marriageId);
            if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
            return String(a.marriageId).localeCompare(String(b.marriageId));
         });

         if (ordered.length > 0) primary.push(ordered[0]);
         if (ordered.length > 1) additional.push(...ordered.slice(1));
      });

      primary.sort((a, b) => a.spouseName.localeCompare(b.spouseName));
      additional.sort((a, b) => a.spouseName.localeCompare(b.spouseName));

      return { primary, additional };
   }, [familyData, unknownSpouseDetails]);

   const filteredUnknownSpouseSections = useMemo(() => {
      const query = spouseSearchQuery.trim().toLowerCase();
      if (!query) return unknownSpouseSections;

      const matchesQuery = (row) => {
         return [row.spouseName, row.linkedPersonName, row.spouseUniqueId]
            .filter(Boolean)
            .some(value => String(value).toLowerCase().includes(query));
      };

      return {
         primary: unknownSpouseSections.primary.filter(matchesQuery),
         additional: unknownSpouseSections.additional.filter(matchesQuery)
      };
   }, [unknownSpouseSections, spouseSearchQuery]);

   const handleDeleteMarriageLink = async (marriageId, spouseName, linkedPersonName) => {
      if (!window.confirm(`Remove marriage link between "${linkedPersonName}" and "${spouseName}"?`)) return;

      try {
         setLoading(true);
         await deleteMarriage(marriageId);
         await refreshFamilyData();
      } catch (error) {
         console.error('Failed to delete marriage:', error);
         alert('Failed to remove marriage link: ' + error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleDeleteUnknownSpouseRecord = async (spouseId, spouseName) => {
      if (!window.confirm(`Delete spouse record "${spouseName}" completely? This removes linked marriages and cannot be undone.`)) return;

      try {
         setLoading(true);
         await deletePerson(spouseId);
         await refreshFamilyData();
      } catch (error) {
         console.error('Failed to delete unknown spouse record:', error);
         alert('Failed to delete spouse record: ' + error.message);
      } finally {
         setLoading(false);
      }
   };

   const totalFilteredUnknownSpouses = filteredUnknownSpouseSections.primary.length + filteredUnknownSpouseSections.additional.length;

   return (
      <div style={styles.container}>
         <h1><i className="fa-solid fa-book" style={{ marginRight: '10px' }}></i>Family Tree Management System</h1>
         <p style={styles.subtitle}>Add, edit, and manage family genealogy data</p>

         <div style={styles.layout}>
            {/* LEFT SIDEBAR: Family List */}
            <div style={styles.sidebar}>
               <h2>Families</h2>
               <button
                  style={styles.addFamilyBtn}
                  onClick={() => setShowAddFamilyModal(true)}
               >
                  <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i>Add New Family
               </button>
               {loading && families.length === 0 ? (
                  <div style={styles.loading}>Loading families...</div>
               ) : families.length === 0 ? (
                  <div style={styles.empty}>No families yet. Add one!</div>
               ) : (
                  <div style={styles.familyList}>
                     {families.map(family => (
                        <div
                           key={family.id}
                           onClick={() => handleSelectFamily(family)}
                           style={{
                              ...styles.familyItem,
                              ...(selectedFamily?.id === family.id ? styles.familyItemActive : {})
                           }}
                        >
                           <div style={styles.familyName}>{family.name}</div>
                           {family.region && <div style={styles.familyRegion}>{family.region}</div>}
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {/* RIGHT MAIN AREA: Family Details */}
            <div style={styles.mainArea}>
               {!selectedFamily ? (
                  <div style={styles.noSelection}>
                     <h2><i className="fa-solid fa-arrow-left" style={{ marginRight: '10px' }}></i>Select a family from the list to begin</h2>
                     <p>You can then add, edit, or delete people within that family.</p>
                  </div>
               ) : (
                  <>
                     {/* HEADER WITH TABS */}
                     <div style={styles.header}>
                        <h2>{selectedFamily.name}</h2>
                        <div style={styles.tabs}>
                           <button
                              onClick={() => setActiveTab('overview')}
                              style={{
                                 ...styles.tab,
                                 ...(activeTab === 'overview' ? styles.tabActive : {})
                              }}
                           >
                              <i className="fa-solid fa-chart-pie" style={{ marginRight: '6px' }}></i>Overview
                           </button>
                           <button
                              onClick={() => setActiveTab('add-person')}
                              style={{
                                 ...styles.tab,
                                 ...(activeTab === 'add-person' ? styles.tabActive : {})
                              }}
                           >
                              <i className="fa-solid fa-user-plus" style={{ marginRight: '6px' }}></i>Add Person
                           </button>
                           <button
                              onClick={() => setActiveTab('manage-persons')}
                              style={{
                                 ...styles.tab,
                                 ...(activeTab === 'manage-persons' ? styles.tabActive : {})
                              }}
                           >
                              <i className="fa-solid fa-users" style={{ marginRight: '6px' }}></i>Manage Persons
                           </button>
                           <button
                              onClick={() => setActiveTab('manage-spouse')}
                              style={{
                                 ...styles.tab,
                                 ...(activeTab === 'manage-spouse' ? styles.tabActive : {})
                              }}
                           >
                              <i className="fa-solid fa-user-group" style={{ marginRight: '6px' }}></i>Manage Spouse
                           </button>
                           <button
                              onClick={() => setActiveTab('import-chain')}
                              style={{
                                 ...styles.tab,
                                 ...(activeTab === 'import-chain' ? styles.tabActive : {})
                              }}
                           >
                              <i className="fa-solid fa-code-branch" style={{ marginRight: '6px' }}></i>Import Chain
                           </button>
                        </div>
                     </div>

                     {/* TAB: OVERVIEW */}
                     {activeTab === 'overview' && familyData && (
                        <div style={styles.tabContent}>
                           <h3>Family Overview</h3>

                           <div style={styles.infoBox}>
                              <h4><i className="fa-solid fa-location-dot" style={{ marginRight: '8px' }}></i>Family Information</h4>
                              <p><strong>Name:</strong> {selectedFamily.name}</p>
                              <p><strong>Identifier:</strong> {selectedFamily.qasba}</p>
                              {selectedFamily.region && (
                                 <p><strong>Region:</strong> {selectedFamily.region}</p>
                              )}
                              {selectedFamily.description && (
                                 <p><strong>Description:</strong> {selectedFamily.description}</p>
                              )}
                           </div>

                           <div style={styles.infoBox}>
                              <h4><i className="fa-solid fa-user" style={{ marginRight: '8px' }}></i>Focus Person</h4>
                              {selectedFamily.focusPerson && (
                                 <>
                                    <p><strong>Name:</strong> {selectedFamily.focusPerson.name}</p>
                                    <p><strong>Gender:</strong> {selectedFamily.focusPerson.gender}</p>
                                    <p><strong>Status:</strong> {selectedFamily.focusPerson.alive
                                       ? <span style={{ color: '#28a745' }}><i className="fa-solid fa-circle" style={{ fontSize: '10px', marginRight: '5px' }}></i>Living</span>
                                       : <span style={{ color: '#dc3545' }}><i className="fa-solid fa-circle" style={{ fontSize: '10px', marginRight: '5px' }}></i>Deceased</span>
                                    }</p>
                                 </>
                              )}
                           </div>

                           <div style={styles.infoBox}>
                              <h4><i className="fa-solid fa-chart-line" style={{ marginRight: '8px' }}></i>Statistics</h4>
                              <p><strong>Total Persons:</strong> {familyData.persons.length}</p>
                              <p><strong>Marriages:</strong> {familyData.marriages.length}</p>
                              <p><strong>Last Modified:</strong> {new Date(selectedFamily.lastModified).toLocaleDateString()}</p>
                              <div style={styles.dangerZone}>
                                 <button
                                    style={styles.editFamilyBtn}
                                    onClick={handleOpenEditFamily}
                                    disabled={loading}
                                 >
                                    <i className="fa-solid fa-pen" style={{ marginRight: '6px' }}></i>
                                    Edit Family Details
                                 </button>
                                 <button
                                    style={styles.deleteFamilyBtn}
                                    onClick={() => setShowDeleteFamilyModal(true)}
                                    disabled={loading}
                                 >
                                    <i className="fa-solid fa-trash" style={{ marginRight: '6px' }}></i>
                                    Delete Family
                                 </button>
                                 <small style={styles.dangerHint}>
                                    This removes the selected family and its family-membership mappings.
                                 </small>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* TAB: ADD PERSON */}
                     {activeTab === 'add-person' && (
                        <div style={styles.tabContent}>
                           <AddPersonForm
                              familyId={selectedFamily.id}
                              allFamilies={families}
                              existingPersonIds={familyData?.persons.map(p => p.uniqueId) || []}
                              onPersonAdded={async () => {
                                 await refreshFamilyData();
                              }}
                              onFamilyCreated={() => loadFamilies()}
                              onCancel={() => setActiveTab('overview')}
                           />
                        </div>
                     )}

                     {/* TAB: MANAGE PERSONS */}
                     {activeTab === 'manage-persons' && familyData && (
                        <div style={styles.tabContent}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                              <h3>Manage Persons in {selectedFamily.name}</h3>
                              <button
                                 onClick={refreshFamilyData}
                                 disabled={loading}
                                 style={{
                                    padding: '8px 12px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1
                                 }}
                              >
                                 <i className={`fa-solid fa-arrows-rotate${loading ? ' fa-spin' : ''}`} style={{ marginRight: '6px' }}></i>
                                 {loading ? 'Refreshing...' : 'Refresh Data'}
                              </button>
                           </div>

                           <div style={styles.searchBox}>
                              <input
                                 type="text"
                                 placeholder="Search persons by name..."
                                 value={personSearchQuery}
                                 onChange={(e) => setPersonSearchQuery(e.target.value)}
                                 style={styles.searchInput}
                              />
                              <span>{filteredPersons.length} results</span>
                           </div>

                           {filteredPersons.length === 0 ? (
                              <div style={styles.empty}>
                                 {personSearchQuery ? 'No matching persons' : 'No persons added yet'}
                              </div>
                           ) : (
                              <div style={styles.scrollSection}>
                                 <table style={styles.table}>
                                    <thead>
                                       <tr>
                                          <th style={styles.th}>#</th>
                                          <th style={styles.th}>Name</th>
                                          <th style={styles.th}>ID</th>
                                          <th style={styles.th}>Gender</th>
                                          <th style={styles.th}>Status</th>
                                          <th style={styles.th}>Date of Birth</th>
                                          <th style={styles.th}>Date of Death</th>
                                          <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
                                       </tr>
                                    </thead>
                                    <tbody>
                                       {filteredPersons.map((person, index) => (
                                          <tr key={person.id} style={styles.tr}>
                                             <td style={styles.td}>{index + 1}</td>
                                             <td style={{ ...styles.td, fontWeight: '600' }}>{person.name}</td>
                                             <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px' }}>{person.uniqueId}</td>
                                             <td style={styles.td}>{person.gender === 'male' ? 'Male' : 'Female'}</td>
                                             <td style={styles.td}>
                                                {person.alive
                                                   ? <span style={{ color: '#28a745' }}><i className="fa-solid fa-circle" style={{ fontSize: '9px', marginRight: '6px' }}></i>Living</span>
                                                   : <span style={{ color: '#dc3545' }}><i className="fa-solid fa-circle" style={{ fontSize: '9px', marginRight: '6px' }}></i>Deceased</span>
                                                }
                                             </td>
                                             <td style={styles.td}>{person.dateOfBirth || '—'}</td>
                                             <td style={styles.td}>{person.dateOfDeath || '—'}</td>
                                             <td style={{ ...styles.td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                <button style={styles.editBtn} onClick={() => setEditingPerson(person)}>
                                                   <i className="fa-solid fa-pen-to-square" style={{ marginRight: '4px' }}></i>Edit
                                                </button>
                                                <button style={{ ...styles.deleteBtn, marginLeft: '6px' }} onClick={() => handleDeletePerson(person.id, person.name)}>
                                                   <i className="fa-solid fa-trash" style={{ marginRight: '4px' }}></i>Delete
                                                </button>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           )}
                        </div>
                     )}

                     {/* TAB: MANAGE SPOUSE */}
                     {activeTab === 'manage-spouse' && familyData && (
                        <div style={styles.tabContent}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                              <h3>Manage Unknown Spouses in {selectedFamily.name}</h3>
                              <button
                                 onClick={refreshFamilyData}
                                 disabled={loading}
                                 style={{
                                    padding: '8px 12px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1
                                 }}
                              >
                                 <i className={`fa-solid fa-arrows-rotate${loading ? ' fa-spin' : ''}`} style={{ marginRight: '6px' }}></i>
                                 {loading ? 'Refreshing...' : 'Refresh Data'}
                              </button>
                           </div>

                           <div style={styles.searchBox}>
                              <input
                                 type="text"
                                 placeholder="Search spouse name, linked person, or ID..."
                                 value={spouseSearchQuery}
                                 onChange={(e) => setSpouseSearchQuery(e.target.value)}
                                 style={styles.searchInput}
                              />
                              <span>{totalFilteredUnknownSpouses} results</span>
                           </div>

                           {(filteredUnknownSpouseSections.primary.length === 0 && filteredUnknownSpouseSections.additional.length === 0) ? (
                              <div style={styles.empty}>
                                 {spouseSearchQuery ? 'No matching unknown spouses' : 'No unknown spouses found'}
                              </div>
                           ) : (
                              <div style={{ ...styles.unknownSpousePanel, ...styles.scrollSection }}>
                                 {filteredUnknownSpouseSections.primary.length > 0 && (
                                    <div style={styles.unknownSpouseGroup}>
                                       <div style={styles.unknownSpouseGroupTitle}>
                                          Unknown Primary Spouses ({filteredUnknownSpouseSections.primary.length})
                                       </div>
                                       {filteredUnknownSpouseSections.primary.map((row) => (
                                          <div key={`primary-${row.marriageId}-${row.spouseId}`} style={styles.unknownSpouseRow}>
                                             <div style={styles.unknownSpouseMeta}>
                                                <div style={styles.unknownSpouseName}>{row.spouseName}</div>
                                                <div style={styles.unknownSpouseSubline}>
                                                   Linked with: {row.linkedPersonName}
                                                   {row.spouseUniqueId ? ` | ID: ${row.spouseUniqueId}` : ''}
                                                </div>
                                             </div>
                                             <div style={styles.unknownSpouseActions}>
                                                <button
                                                   style={styles.unlinkBtn}
                                                   onClick={() => handleDeleteMarriageLink(row.marriageId, row.spouseName, row.linkedPersonName)}
                                                   disabled={loading}
                                                >
                                                   Unlink
                                                </button>
                                                <button
                                                   style={styles.deleteBtn}
                                                   onClick={() => handleDeleteUnknownSpouseRecord(row.spouseId, row.spouseName)}
                                                   disabled={loading}
                                                >
                                                   Delete Record
                                                </button>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 )}

                                 {filteredUnknownSpouseSections.additional.length > 0 && (
                                    <div style={styles.unknownSpouseGroup}>
                                       <div style={styles.unknownSpouseGroupTitle}>
                                          Unknown Spouses ({filteredUnknownSpouseSections.additional.length})
                                       </div>
                                       {filteredUnknownSpouseSections.additional.map((row) => (
                                          <div key={`additional-${row.marriageId}-${row.spouseId}`} style={styles.unknownSpouseRow}>
                                             <div style={styles.unknownSpouseMeta}>
                                                <div style={styles.unknownSpouseName}>{row.spouseName}</div>
                                                <div style={styles.unknownSpouseSubline}>
                                                   Linked with: {row.linkedPersonName}
                                                   {row.spouseUniqueId ? ` | ID: ${row.spouseUniqueId}` : ''}
                                                </div>
                                             </div>
                                             <div style={styles.unknownSpouseActions}>
                                                <button
                                                   style={styles.unlinkBtn}
                                                   onClick={() => handleDeleteMarriageLink(row.marriageId, row.spouseName, row.linkedPersonName)}
                                                   disabled={loading}
                                                >
                                                   Unlink
                                                </button>
                                                <button
                                                   style={styles.deleteBtn}
                                                   onClick={() => handleDeleteUnknownSpouseRecord(row.spouseId, row.spouseName)}
                                                   disabled={loading}
                                                >
                                                   Delete Record
                                                </button>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                     )}

                     {/* TAB: IMPORT CHAIN */}
                     {activeTab === 'import-chain' && (
                        <div style={styles.tabContent}>
                           <ImportChainTab
                              selectedFamily={selectedFamily}
                              families={families}
                              onImported={async () => {
                                 await refreshFamilyData();
                                 setActiveTab('manage-persons');
                              }}
                           />
                        </div>
                     )}

                  </>
               )}
            </div>
         </div>

         {/* ADD FAMILY MODAL */}
         {showAddFamilyModal && (
            <div style={styles.modal}>
               <div style={styles.modalContent}>
                  <button
                     style={styles.closeBtn}
                     onClick={() => setShowAddFamilyModal(false)}
                  >
                     ✕
                  </button>
                  <AddFamilyForm
                     onFamilyAdded={() => {
                        setShowAddFamilyModal(false);
                        loadFamilies();
                     }}
                     onCancel={() => setShowAddFamilyModal(false)}
                  />
               </div>
            </div>
         )}

         {/* EDIT PERSON MODAL */}
         {editingPerson && (
            <EditPersonModal
               person={editingPerson}
               marriages={familyData?.marriages || []}
               persons={familyData?.persons || []}
               allFamilies={families}
               onSave={async () => {
                  setEditingPerson(null);
                  await refreshFamilyData();
               }}
               onFamilyCreated={() => loadFamilies()}
               onClose={() => setEditingPerson(null)}
            />
         )}

         {/* EDIT FAMILY MODAL */}
         {showEditFamilyModal && selectedFamily && (
            <div style={styles.modal}>
               <div style={styles.modalContent}>
                  <button style={styles.closeBtn} onClick={() => setShowEditFamilyModal(false)}>✕</button>
                  <h3 style={{ marginTop: 0 }}>
                     <i className="fa-solid fa-pen" style={{ marginRight: '8px' }}></i>
                     Edit Family Details
                  </h3>
                  <div style={styles.editFormGroup}>
                     <label style={styles.editLabel}>Display Name *</label>
                     <input
                        type="text"
                        value={editFamilyForm.name}
                        onChange={(e) => setEditFamilyForm(p => ({ ...p, name: e.target.value }))}
                        style={styles.editInput}
                        placeholder="e.g. Aal-e-Wajid Ali"
                     />
                  </div>
                  <div style={styles.editFormGroup}>
                     <label style={styles.editLabel}>Identifier (qasba) *</label>
                     <input
                        type="text"
                        value={editFamilyForm.qasba}
                        onChange={(e) => setEditFamilyForm(p => ({ ...p, qasba: e.target.value }))}
                        style={styles.editInput}
                        placeholder="e.g. miran-bigha"
                     />
                     <small style={{ color: '#b45309', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                        ⚠️ Changing this breaks the family tree URL and data lookups. Update with care.
                     </small>
                  </div>
                  <div style={styles.editFormGroup}>
                     <label style={styles.editLabel}>Region</label>
                     <input
                        type="text"
                        value={editFamilyForm.region}
                        onChange={(e) => setEditFamilyForm(p => ({ ...p, region: e.target.value }))}
                        style={styles.editInput}
                        placeholder="e.g. Bihar, India"
                     />
                  </div>
                  <div style={styles.editFormGroup}>
                     <label style={styles.editLabel}>Description</label>
                     <textarea
                        value={editFamilyForm.description}
                        onChange={(e) => setEditFamilyForm(p => ({ ...p, description: e.target.value }))}
                        style={{ ...styles.editInput, minHeight: '80px', resize: 'vertical' }}
                        placeholder="Short description of this family branch..."
                     />
                  </div>
                  <div style={styles.deleteModalActions}>
                     <button style={styles.cancelDangerBtn} onClick={() => setShowEditFamilyModal(false)} disabled={loading}>
                        Cancel
                     </button>
                     <button
                        onClick={handleUpdateFamily}
                        disabled={loading}
                        style={{ ...styles.confirmDangerBtn, background: '#2563eb' }}
                     >
                        {loading ? 'Saving...' : 'Save Changes'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* DELETE FAMILY MODAL */}
         {showDeleteFamilyModal && selectedFamily && (
            <div style={styles.modal}>
               <div style={styles.deleteModalContent}>
                  <h3 style={{ marginTop: 0, color: '#721c24' }}>
                     <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
                     Confirm Family Deletion
                  </h3>
                  <p>
                     Are you sure you want to delete <strong>{selectedFamily.name}</strong>?
                  </p>
                  <p style={{ color: '#721c24', fontWeight: '600' }}>
                     This action cannot be undone. Family mappings and related scoped data will be removed.
                  </p>
                  <div style={styles.deleteModalActions}>
                     <button
                        style={styles.cancelDangerBtn}
                        onClick={() => setShowDeleteFamilyModal(false)}
                        disabled={loading}
                     >
                        Cancel
                     </button>
                     <button
                        style={styles.confirmDangerBtn}
                        onClick={handleDeleteFamily}
                        disabled={loading}
                     >
                        {loading ? 'Deleting...' : 'Yes, Delete Family'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

// STYLES
const styles = {
   container: {
      padding: '20px',
      maxWidth: '100%',
      margin: '0 auto'
   },
   subtitle: {
      color: '#666',
      marginBottom: '20px'
   },
   layout: {
      display: 'grid',
      gridTemplateColumns: '250px 1fr',
      gap: '20px',
      marginTop: '20px'
   },
   sidebar: {
      background: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      height: 'fit-content',
      maxHeight: '80vh',
      overflowY: 'auto'
   },
   familyList: {
      marginBottom: '15px'
   },
   familyItem: {
      padding: '10px',
      margin: '5px 0',
      borderRadius: '4px',
      cursor: 'pointer',
      border: '1px solid #ddd',
      transition: 'all 0.2s'
   },
   familyItemActive: {
      background: '#2a5298',
      color: 'white',
      border: '1px solid #1e3c72'
   },
   familyName: {
      margin: 0,
      fontSize: '14px',
      fontWeight: '600'
   },
   familyRegion: {
      fontSize: '12px',
      opacity: '0.75',
      marginTop: '2px'
   },
   addFamilyBtn: {
      width: '100%',
      padding: '10px',
      background: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
      marginBottom: '15px'
   },
   mainArea: {
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      minHeight: '600px'
   },
   noSelection: {
      textAlign: 'center',
      padding: '40px',
      color: '#999'
   },
   header: {
      marginBottom: '20px',
      borderBottom: '2px solid #eee',
      paddingBottom: '15px'
   },
   tabs: {
      display: 'flex',
      gap: '10px',
      marginTop: '15px'
   },
   tab: {
      padding: '10px 15px',
      border: '1px solid #ddd',
      background: '#f9f9f9',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s'
   },
   tabActive: {
      background: '#2a5298',
      color: 'white',
      border: '1px solid #1e3c72'
   },
   tabContent: {
      marginTop: '20px'
   },
   infoBox: {
      background: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '15px',
      marginBottom: '15px'
   },
   dangerZone: {
      marginTop: '12px',
      paddingTop: '12px',
      borderTop: '1px solid #f3c2c7',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
   },
   deleteFamilyBtn: {
      width: 'fit-content',
      padding: '8px 12px',
      border: 'none',
      borderRadius: '4px',
      background: '#dc3545',
      color: 'white',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600'
   },
   dangerHint: {
      color: '#6c757d',
      fontSize: '12px'
   },
   editFamilyBtn: {
      width: 'fit-content',
      padding: '8px 12px',
      border: 'none',
      borderRadius: '4px',
      background: '#2563eb',
      color: 'white',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600'
   },
   editFormGroup: {
      marginBottom: '14px'
   },
   editLabel: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '5px'
   },
   editInput: {
      width: '100%',
      padding: '9px 11px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box'
   },
   searchBox: {
      display: 'flex',
      gap: '10px',
      marginBottom: '15px',
      alignItems: 'center'
   },
   searchInput: {
      flex: 1,
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px'
   },
   scrollSection: {
      maxHeight: '60vh',
      overflowY: 'auto',
      overflowX: 'auto',
      border: '1px solid #e5e7eb',
      borderRadius: '8px'
   },
   unknownSpousePanel: {
      border: '1px solid #f2d7a1',
      background: '#fffaf0',
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '16px'
   },
   unknownSpouseHeading: {
      margin: '0 0 10px 0',
      color: '#9a3412',
      fontSize: '15px'
   },
   unknownSpouseGroup: {
      marginTop: '10px'
   },
   unknownSpouseGroupTitle: {
      fontWeight: '700',
      color: '#7c2d12',
      marginBottom: '8px',
      fontSize: '13px'
   },
   unknownSpouseRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '10px',
      border: '1px solid #f3dfb7',
      borderRadius: '6px',
      background: '#fff',
      padding: '10px',
      marginBottom: '8px'
   },
   unknownSpouseMeta: {
      minWidth: 0
   },
   unknownSpouseName: {
      fontWeight: '700',
      color: '#1f2937'
   },
   unknownSpouseSubline: {
      marginTop: '3px',
      fontSize: '12px',
      color: '#6b7280'
   },
   unknownSpouseActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
   },
   globalCard: {
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '10px',
      background: '#ffffff'
   },
   globalCardHead: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '10px'
   },
   globalSubline: {
      marginTop: '4px',
      fontSize: '12px',
      color: '#4b5563'
   },
   globalFamilyList: {
      marginTop: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
   },
   globalFamilyItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '6px 8px',
      background: '#f9fafb'
   },
   globalAddFamilyRow: {
      marginTop: '10px'
   },
   unlinkBtn: {
      padding: '5px 10px',
      background: '#f59e0b',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px'
   },
   table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
   },
   th: {
      textAlign: 'left',
      padding: '10px 12px',
      background: '#2a5298',
      color: 'white',
      fontWeight: '600',
      fontSize: '13px',
      whiteSpace: 'nowrap'
   },
   td: {
      padding: '10px 12px',
      borderBottom: '1px solid #eee',
      verticalAlign: 'middle'
   },
   tr: {
      transition: 'background 0.15s'
   },
   editBtn: {
      padding: '5px 10px',
      background: '#17a2b8',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px'
   },
   deleteBtn: {
      padding: '5px 10px',
      background: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px'
   },
   loading: {
      textAlign: 'center',
      color: '#999',
      padding: '20px'
   },
   empty: {
      textAlign: 'center',
      color: '#999',
      padding: '20px'
   },
   modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
   },
   modalContent: {
      background: 'white',
      borderRadius: '8px',
      padding: '30px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '90vh',
      overflowY: 'auto',
      position: 'relative',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
   },
   deleteModalContent: {
      background: 'white',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '520px',
      width: '90%',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
      border: '1px solid #f5c6cb'
   },
   deleteModalActions: {
      marginTop: '18px',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px'
   },
   cancelDangerBtn: {
      padding: '9px 14px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      background: '#f8f9fa',
      cursor: 'pointer'
   },
   confirmDangerBtn: {
      padding: '9px 14px',
      border: 'none',
      borderRadius: '4px',
      background: '#dc3545',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer'
   },
   closeBtn: {
      position: 'absolute',
      top: '15px',
      right: '15px',
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#666',
      padding: '0',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
   }
};
