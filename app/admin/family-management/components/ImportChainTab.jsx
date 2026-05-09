'use client';

import { useMemo, useState } from 'react';
import {
   importFamilyChain,
   previewFamilyChainImport,
   searchPersonsInFamily
} from '../utils/api';

function TreeNode({ node }) {
   if (!node) return null;
   return (
      <li style={styles.treeItem}>
         <div style={styles.treeLabel}>
            <strong>{node.name}</strong>
            {node.generation ? <span style={styles.genBadge}>Gen {node.generation}</span> : null}
            {node.spouseNames?.length > 0 ? (
               <span style={styles.spouseInline}>Spouses: {node.spouseNames.join(', ')}</span>
            ) : null}
         </div>
         {node.children?.length > 0 && (
            <ul style={styles.treeList}>
               {node.children.map((child) => (
                  <TreeNode key={child.id} node={child} />
               ))}
            </ul>
         )}
      </li>
   );
}

export default function ImportChainTab({ selectedFamily, families, onImported }) {
   const [sourceFamilyId, setSourceFamilyId] = useState('');
   const [personQuery, setPersonQuery] = useState('');
   const [personSuggestions, setPersonSuggestions] = useState([]);
   const [selectedRootPerson, setSelectedRootPerson] = useState(null);
   const [generationLimit, setGenerationLimit] = useState(3);
   const [includeSpouses, setIncludeSpouses] = useState(true);
   const [includeFullSubtree, setIncludeFullSubtree] = useState(false);
   const [previewData, setPreviewData] = useState(null);
   const [showPreviewModal, setShowPreviewModal] = useState(false);
   const [loadingPreview, setLoadingPreview] = useState(false);
   const [loadingImport, setLoadingImport] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');

   const sourceFamilies = useMemo(
      () => families.filter(f => f.id !== selectedFamily?.id),
      [families, selectedFamily]
   );

   const canRun = Boolean(selectedFamily?.id && sourceFamilyId && selectedRootPerson?.id && Number(generationLimit) >= 1);

   const buildPayload = () => ({
      targetFamilyId: selectedFamily.id,
      sourceFamilyId,
      rootPersonId: selectedRootPerson.id,
      generationLimit: Math.max(1, Number(generationLimit) || 1),
      includeSpouses,
      includeFullSubtree
   });

   const handleRootSearch = async (query) => {
      setPersonQuery(query);
      setSelectedRootPerson(null);
      setError('');
      setSuccess('');
      setPreviewData(null);

      if (!sourceFamilyId || query.trim().length < 1) {
         setPersonSuggestions([]);
         return;
      }

      try {
         const results = await searchPersonsInFamily(query.trim(), sourceFamilyId, 30);
         setPersonSuggestions(results || []);
      } catch (err) {
         setError(err.message || 'Failed to search persons');
         setPersonSuggestions([]);
      }
   };

   const handleSelectSuggestion = (person) => {
      setSelectedRootPerson(person);
      setPersonQuery(person.name);
      setPersonSuggestions([]);
   };

   const handlePreview = async () => {
      if (!canRun) return;
      setLoadingPreview(true);
      setError('');
      setSuccess('');
      try {
         const data = await previewFamilyChainImport(buildPayload());
         setPreviewData(data);
         setShowPreviewModal(true);
      } catch (err) {
         setError(err.message || 'Failed to preview chain import');
      } finally {
         setLoadingPreview(false);
      }
   };

   const handleImport = async () => {
      if (!canRun) return;
      setLoadingImport(true);
      setError('');
      setSuccess('');
      try {
         const result = await importFamilyChain(buildPayload());
         setSuccess(`Imported ${result.imported} members. ${result.alreadyLinked} were already linked.`);
         if (onImported) await onImported();
      } catch (err) {
         setError(err.message || 'Failed to import chain');
      } finally {
         setLoadingImport(false);
      }
   };

   return (
      <div style={styles.wrap}>
         <h3 style={styles.title}>Import Chain</h3>
         <p style={styles.helpText}>
            Reuse existing lineage from another family and link it to <strong>{selectedFamily?.name}</strong>.
         </p>

         <div style={styles.grid}>
            <div style={styles.formGroup}>
               <label style={styles.label}>Source Family</label>
               <select
                  value={sourceFamilyId}
                  onChange={(e) => {
                     setSourceFamilyId(e.target.value);
                     setPersonQuery('');
                     setSelectedRootPerson(null);
                     setPersonSuggestions([]);
                     setGenerationLimit(3);
                     setPreviewData(null);
                     setError('');
                     setSuccess('');
                  }}
                  style={styles.input}
               >
                  <option value="">Select source family...</option>
                  {sourceFamilies.map(f => (
                     <option key={f.id} value={f.id}>{f.name}{f.region ? ` (${f.region})` : ''}</option>
                  ))}
               </select>
            </div>

            <div style={styles.formGroup}>
               <label style={styles.label}>Chain Root Person (from source family)</label>
               <div style={styles.searchBox}>
                  <input
                     type="text"
                     value={personQuery}
                     onChange={(e) => handleRootSearch(e.target.value)}
                     placeholder="Type person name..."
                     style={styles.input}
                     disabled={!sourceFamilyId}
                  />
                  {personSuggestions.length > 0 && (
                     <div style={styles.suggestions}>
                        {personSuggestions.map(person => (
                           <div
                              key={person.id}
                              onClick={() => handleSelectSuggestion(person)}
                              style={styles.suggestionItem}
                           >
                              <strong>{person.name}</strong>
                              {person.fatherName ? <small style={styles.suggestionMeta}> • Father: {person.fatherName}</small> : null}
                              {person.familyName ? <small style={styles.familyTag}>{person.familyName}</small> : null}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
               {selectedRootPerson ? (
                  <small style={styles.selectedHint}>Selected: {selectedRootPerson.name}</small>
               ) : null}
            </div>
         </div>

         <div style={styles.grid}>
            <div style={styles.formGroup}>
               <label style={styles.label}>Import Till Generation</label>
               <input
                  type="number"
                  min="1"
                  step="1"
                  value={generationLimit}
                  onChange={(e) => {
                     const value = Number(e.target.value);
                     setGenerationLimit(Number.isFinite(value) ? value : 1);
                     setPreviewData(null);
                     setError('');
                     setSuccess('');
                  }}
                  style={styles.input}
                  disabled={!sourceFamilyId}
               />
               <small style={styles.selectedHint}>Generation 1 = selected root person.</small>
            </div>
            <div style={styles.formGroup}>
               <label style={styles.label}>Options</label>
               <label style={styles.checkboxRow}>
                  <input
                     type="checkbox"
                     checked={includeSpouses}
                     onChange={(e) => {
                        setIncludeSpouses(e.target.checked);
                        setPreviewData(null);
                     }}
                  />
                  Include spouses
               </label>
               <label style={styles.checkboxRow}>
                  <input
                     type="checkbox"
                     checked={includeFullSubtree}
                     onChange={(e) => {
                        setIncludeFullSubtree(e.target.checked);
                        setPreviewData(null);
                     }}
                  />
                  Include full subtree (not only source family-linked members)
               </label>
            </div>
         </div>

         {previewData?.counts ? (
            <div style={styles.statsBox}>
               <div><strong>Descendants:</strong> {previewData.counts.descendants}</div>
               <div><strong>Already linked:</strong> {previewData.counts.alreadyLinked}</div>
               <div><strong>New links to create:</strong> {previewData.counts.toBeLinked}</div>
            </div>
         ) : null}

         {error ? <div style={styles.errorBox}>{error}</div> : null}
         {success ? <div style={styles.successBox}>{success}</div> : null}

         <div style={styles.actions}>
            <button
               type="button"
               style={{ ...styles.button, ...styles.previewBtn }}
               disabled={!canRun || loadingPreview || loadingImport}
               onClick={handlePreview}
            >
               {loadingPreview ? 'Previewing...' : 'Preview'}
            </button>
            <button
               type="button"
               style={{ ...styles.button, ...styles.importBtn }}
               disabled={!canRun || loadingImport || loadingPreview}
               onClick={handleImport}
            >
               {loadingImport ? 'Importing...' : 'Import'}
            </button>
         </div>

         {showPreviewModal && (
            <div style={styles.modalOverlay}>
               <div style={styles.modalCard}>
                  <div style={styles.modalHeader}>
                     <h4 style={{ margin: 0 }}>Chain Preview</h4>
                     <button
                        style={styles.closeBtn}
                        onClick={() => setShowPreviewModal(false)}
                     >
                        ✕
                     </button>
                  </div>
                  <div style={styles.modalBody}>
                     {previewData?.previewTree ? (
                        <ul style={styles.treeList}>
                           <TreeNode node={previewData.previewTree} />
                        </ul>
                     ) : (
                        <div>No preview available.</div>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

const styles = {
   wrap: {
      background: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '18px'
   },
   title: {
      marginTop: 0,
      marginBottom: '8px'
   },
   helpText: {
      marginTop: 0,
      marginBottom: '14px',
      color: '#555'
   },
   grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '12px'
   },
   formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
   },
   label: {
      fontSize: '13px',
      fontWeight: '600'
   },
   input: {
      width: '100%',
      padding: '9px 10px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      boxSizing: 'border-box',
      fontSize: '13px'
   },
   searchBox: {
      position: 'relative'
   },
   suggestions: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '100%',
      zIndex: 15,
      border: '1px solid #ddd',
      borderTop: 'none',
      borderRadius: '0 0 6px 6px',
      background: '#fff',
      maxHeight: '240px',
      overflowY: 'auto',
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
   },
   suggestionItem: {
      padding: '10px',
      borderBottom: '1px solid #efefef',
      cursor: 'pointer',
      fontSize: '12px'
   },
   suggestionMeta: {
      marginLeft: '6px',
      color: '#555'
   },
   familyTag: {
      marginLeft: '8px',
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: '3px',
      border: '1px solid #b3d9e8',
      background: '#e8f4f8',
      color: '#0077b6',
      fontSize: '10px'
   },
   selectedHint: {
      color: '#2a5298',
      fontSize: '12px'
   },
   muted: {
      color: '#666',
      fontSize: '11px'
   },
   checkboxRow: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      fontSize: '13px'
   },
   statsBox: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))',
      gap: '8px',
      border: '1px solid #c7dff6',
      background: '#edf5ff',
      borderRadius: '6px',
      padding: '10px',
      marginTop: '10px',
      fontSize: '12px'
   },
   actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '14px'
   },
   button: {
      border: 'none',
      borderRadius: '4px',
      padding: '9px 14px',
      color: '#fff',
      fontWeight: '600',
      cursor: 'pointer'
   },
   previewBtn: {
      background: '#007bff'
   },
   importBtn: {
      background: '#28a745'
   },
   errorBox: {
      marginTop: '10px',
      border: '1px solid #f5c6cb',
      background: '#f8d7da',
      color: '#721c24',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '13px'
   },
   successBox: {
      marginTop: '10px',
      border: '1px solid #c3e6cb',
      background: '#d4edda',
      color: '#155724',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '13px'
   },
   modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.45)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
   },
   modalCard: {
      width: 'min(900px, 94vw)',
      maxHeight: '85vh',
      background: '#fff',
      borderRadius: '8px',
      border: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
   },
   modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid #eee'
   },
   closeBtn: {
      border: 'none',
      background: 'none',
      fontSize: '20px',
      cursor: 'pointer'
   },
   modalBody: {
      padding: '14px 16px',
      overflow: 'auto'
   },
   treeList: {
      margin: 0,
      paddingLeft: '18px'
   },
   treeItem: {
      marginBottom: '6px'
   },
   treeLabel: {
      display: 'inline-flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap',
      fontSize: '13px'
   },
   genBadge: {
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '10px',
      background: '#eef2ff',
      border: '1px solid #c7d2fe',
      color: '#3730a3'
   },
   spouseInline: {
      fontSize: '11px',
      color: '#555'
   }
};
