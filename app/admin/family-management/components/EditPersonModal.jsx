'use client';

import { useState, useEffect, useRef } from 'react';
import {
   createPerson,
   updatePerson,
   createBurialInfo,
   createMarriage,
   deleteMarriage,
   addPersonToFamily,
   searchPersons,
   fetchBurialInfo,
   fetchPersonDetails
} from '../utils/api';
import QuickFamilyModal from './QuickFamilyModal';

function QuickSpouseInlineForm({ data, errors, loading, onChange, onSave, onCancel, advisories = [], searchResults = [], onSelectSuggestion, duplicateWarning = '', isSearching = false, burialSuggestions = [], showBurialSuggestions = false, onBurialPlaceChange, onSelectBurialSuggestion, title = 'Add Spouse (Unknown Family)', hintText = 'This creates a person record with no family assignment. Their details will appear in the tree popup.', saveLabel = 'Save Spouse' }) {
   return (
      <div style={qsStyles.wrapper}>
         <div style={qsStyles.header}>
            <span style={qsStyles.headerTitle}>
               <i className="fa-solid fa-user-plus" style={{ marginRight: '6px' }}></i>
               {title}
            </span>
            <button type="button" onClick={onCancel} style={qsStyles.cancelX}>✕</button>
         </div>
         <p style={qsStyles.hint}>
            {hintText}
         </p>

         {advisories.length > 0 && (
            <div style={qsStyles.advisoryList}>
               {advisories.map((advisory, index) => (
                  <div
                     key={`${advisory.type}-${index}`}
                     style={advisory.type === 'warning' ? qsStyles.advisoryWarning : qsStyles.advisoryInfo}
                  >
                     {advisory.text}
                  </div>
               ))}
            </div>
         )}

         {duplicateWarning && (
            <div style={qsStyles.advisoryWarning}>{duplicateWarning}</div>
         )}

         <div style={qsStyles.row}>
            <div style={qsStyles.group}>
               <label style={qsStyles.label}>Name *</label>
               <input
                  type="text"
                  name="name"
                  value={data.name}
                  onChange={onChange}
                  placeholder="e.g., Fatima Bibi"
                  style={errors.name ? qsStyles.inputError : qsStyles.input}
               />
               {errors.name && <span style={qsStyles.errorText}>{errors.name}</span>}

               {isSearching && (
                  <div style={qsStyles.searchStatus}>
                     <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                     Searching existing people...
                  </div>
               )}

               {!isSearching && data.name.trim().length >= 2 && searchResults.length === 0 && (
                  <div style={qsStyles.searchStatusMuted}>No existing matches found.</div>
               )}

               {searchResults.length > 0 && (
                  <div style={qsStyles.searchResults}>
                     {searchResults.map((person) => (
                        <div key={person.id} onClick={() => onSelectSuggestion?.(person)} style={qsStyles.searchResult}>
                           <strong>{person.name}</strong>
                           <small> ({person.gender}, {person.alive ? 'Living' : 'Deceased'})</small>
                           {person.familyName && <small style={qsStyles.familyTag}>{person.familyName}</small>}
                        </div>
                     ))}
                  </div>
               )}
            </div>
            <div style={qsStyles.group}>
               <label style={qsStyles.label}>Gender *</label>
               <select name="gender" value={data.gender} onChange={onChange} style={qsStyles.input}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
               </select>
            </div>
         </div>

         <div style={qsStyles.row}>
            <div style={qsStyles.group}>
               <label style={qsStyles.label}>Father&apos;s Name</label>
               <input
                  type="text"
                  name="fatherName"
                  value={data.fatherName}
                  onChange={onChange}
                  placeholder="e.g., Abdul Qadir"
                  style={qsStyles.input}
               />
            </div>
            <div style={qsStyles.group}>
               <label style={qsStyles.label}>Status</label>
               <div style={qsStyles.radioRow}>
                  <label style={qsStyles.radioLabel}>
                     <input type="radio" name="quickSpouseAlive" value="true" checked={data.alive === true} onChange={onChange} />
                     {' '}Living
                  </label>
                  <label style={qsStyles.radioLabel}>
                     <input type="radio" name="quickSpouseAlive" value="false" checked={data.alive === false} onChange={onChange} />
                     {' '}Deceased
                  </label>
               </div>
            </div>
         </div>

         <div style={qsStyles.row}>
            <div style={qsStyles.group}>
               <label style={qsStyles.label}>Date of Birth</label>
               <input type="text" name="dateOfBirth" value={data.dateOfBirth} onChange={onChange} placeholder="e.g., 1920 CE" style={qsStyles.input} />
            </div>
            {data.alive === false && (
               <div style={qsStyles.group}>
                  <label style={qsStyles.label}>Date of Death</label>
                  <input type="text" name="dateOfDeath" value={data.dateOfDeath} onChange={onChange} placeholder="e.g., 1985 CE" style={qsStyles.input} />
               </div>
            )}
         </div>

         <div style={qsStyles.row}>
            <div style={{ ...qsStyles.group, gridColumn: '1 / -1' }}>
               <label style={qsStyles.label}>Place of Birth</label>
               <input type="text" name="placeOfBirth" value={data.placeOfBirth} onChange={onChange} placeholder="Village, District" style={qsStyles.input} />
            </div>
         </div>

         <div style={qsStyles.row}>
            <div style={qsStyles.group}>
               <label style={qsStyles.label}>Burial Place</label>
               <div style={qsStyles.burialInputWrap}>
                  <input
                     type="text"
                     name="burialPlace"
                     value={data.burialPlace}
                     onChange={onBurialPlaceChange || onChange}
                     onFocus={() => {
                        if (data.burialPlace?.trim().length > 0 && burialSuggestions.length > 0 && onBurialPlaceChange) {
                           onBurialPlaceChange({ target: { name: 'burialPlace', value: data.burialPlace, type: 'text' } });
                        }
                     }}
                     placeholder="Cemetery or burial location"
                     style={qsStyles.input}
                     autoComplete="off"
                  />
                  {showBurialSuggestions && burialSuggestions.length > 0 && (
                     <div style={qsStyles.burialDropdown}>
                        {burialSuggestions.map((s, i) => (
                           <div key={i} style={qsStyles.burialSuggestionItem} onMouseDown={() => onSelectBurialSuggestion?.(s)}>
                              <span style={{ fontWeight: 500 }}>{s.place}</span>
                              {s.mapUrl && <span style={qsStyles.burialMapBadge}>📍 has map</span>}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
            <div style={qsStyles.group}>
               <label style={qsStyles.label}>Burial Map Link</label>
               <input
                  type="url"
                  name="burialMapUrl"
                  value={data.burialMapUrl}
                  onChange={onChange}
                  placeholder="https://maps.app.goo.gl/..."
                  style={qsStyles.input}
               />
            </div>
         </div>

         <div style={qsStyles.row}>
            <div style={{ ...qsStyles.group, gridColumn: '1 / -1' }}>
               <label style={qsStyles.label}>Notes / About</label>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <textarea name="about" value={data.about} onChange={onChange} placeholder="Additional notes (optional)" rows={2} style={qsStyles.textarea} />
               </div>
            </div>
         </div>

         <div style={qsStyles.actions}>
            <button type="button" onClick={onCancel} style={qsStyles.cancelBtn} disabled={loading}>Cancel</button>
            <button type="button" onClick={onSave} style={qsStyles.saveBtn} disabled={loading}>
               {loading ? 'Saving...' : saveLabel}
            </button>
         </div>
      </div>
   );
}

function nameSuggestsFemale(name) {
   return /\b(?:sayeda|bibi|khatoon|begum)\b/i.test(String(name || ''));
}

function nameSuggestsMale(name) {
   return /\bsyed\b/i.test(String(name || ''));
}

function nameHasDeceasedMarker(name) {
   return /\br\.?\s?(?:h|z)\b/i.test(String(name || ''));
}

function getAutoSelectionFromName(name) {
   const notices = [];
   const next = {};

   if (nameSuggestsFemale(name)) {
      next.gender = 'female';
      notices.push('Gender auto-selected as Female because the name contains Sayeda, Bibi, Khatoon, or Begum.');
   } else if (nameSuggestsMale(name)) {
      next.gender = 'male';
      notices.push('Gender auto-selected as Male because the name contains Syed.');
   } else {
      next.gender = 'male';
      notices.push('Gender auto-selected as Male because the name does not contain Sayeda, Bibi, Khatoon, or Begum.');
   }

   if (nameHasDeceasedMarker(name)) {
      next.alive = false;
      notices.push('Status auto-selected as Deceased because the name contains R.H or R.Z.');
   }

   return { next, notices };
}

function getAdvisoryState(name, alive) {
   const advisories = [];

   if (!nameHasDeceasedMarker(name) && alive === false) {
      advisories.push({
         type: 'warning',
         text: 'Deceased is selected, but the name does not include R.H or R.Z.'
      });
   }

   if (nameHasDeceasedMarker(name) && alive === true) {
      advisories.push({
         type: 'warning',
         text: 'The name includes R.H or R.Z, but status is still set to Living.'
      });
   }

   return advisories;
}

const qsStyles = {
   wrapper: {
      border: '1px dashed #6c757d',
      borderRadius: '6px',
      padding: '14px 16px',
      backgroundColor: '#f8f9fa',
      marginTop: '6px'
   },
   header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px'
   },
   headerTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#495057'
   },
   cancelX: {
      background: 'none',
      border: 'none',
      fontSize: '16px',
      cursor: 'pointer',
      color: '#6c757d',
      padding: '0 4px'
   },
   hint: {
      fontSize: '11px',
      color: '#6c757d',
      marginBottom: '12px',
      marginTop: 0
   },
   advisoryList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginBottom: '12px'
   },
   advisoryInfo: {
      fontSize: '11px',
      color: '#0c5460',
      background: '#d1ecf1',
      border: '1px solid #bee5eb',
      borderRadius: '4px',
      padding: '6px 8px'
   },
   advisoryWarning: {
      fontSize: '11px',
      color: '#856404',
      background: '#fff3cd',
      border: '1px solid #ffeeba',
      borderRadius: '4px',
      padding: '6px 8px'
   },
   row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '10px'
   },
   group: {
      display: 'flex',
      flexDirection: 'column'
   },
   label: {
      fontSize: '12px',
      fontWeight: '500',
      marginBottom: '4px',
      color: '#333'
   },
   input: {
      width: '100%',
      padding: '7px 10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'inherit',
      boxSizing: 'border-box'
   },
   inputError: {
      width: '100%',
      padding: '7px 10px',
      border: '2px solid #dc3545',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      backgroundColor: '#fff5f5'
   },
   textarea: {
      width: '100%',
      padding: '7px 10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      resize: 'vertical'
   },
   radioRow: {
      display: 'flex',
      gap: '16px',
      marginTop: '6px'
   },
   radioLabel: {
      fontSize: '12px',
      cursor: 'pointer'
   },
   errorText: {
      fontSize: '11px',
      color: '#dc3545',
      marginTop: '3px'
   },
   actions: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
      marginTop: '12px',
      paddingTop: '10px',
      borderTop: '1px solid #dee2e6'
   },
   saveBtn: {
      backgroundColor: '#28a745',
      color: 'white',
      padding: '7px 18px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer'
   },
   cancelBtn: {
      backgroundColor: '#6c757d',
      color: 'white',
      padding: '7px 14px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer'
   },
   searchResults: {
      border: '1px solid #ddd',
      borderRadius: '4px',
      background: '#fff',
      maxHeight: '180px',
      overflowY: 'auto',
      marginTop: '6px'
   },
   searchResult: {
      padding: '8px 10px',
      borderBottom: '1px solid #eee',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
   },
   familyTag: {
      fontSize: '11px',
      color: '#495057'
   },
   searchStatus: {
      fontSize: '11px',
      color: '#2563eb',
      marginTop: '6px'
   },
   searchStatusMuted: {
      fontSize: '11px',
      color: '#6b7280',
      marginTop: '6px'
   },
   burialInputWrap: {
      position: 'relative'
   },
   burialDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: '#fff',
      border: '1px solid #ddd',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      maxHeight: '180px',
      overflowY: 'auto',
      zIndex: 50,
      boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
   },
   burialSuggestionItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      padding: '8px 10px',
      borderBottom: '1px solid #f1f1f1',
      cursor: 'pointer',
      fontSize: '12px'
   },
   burialMapBadge: {
      fontSize: '10px',
      color: '#2563eb',
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '3px',
      padding: '1px 5px',
      flexShrink: 0
   }
};

export default function EditPersonModal({ person, marriages = [], persons = [], allFamilies = [], onSave, onFamilyCreated, onClose }) {
   const [loading, setLoading] = useState(false);
   const [loadingBurial, setLoadingBurial] = useState(true);
   const [error, setError] = useState('');
   const [hadExistingBurialInfo, setHadExistingBurialInfo] = useState(false);

   // Resolve father/mother names from persons list
   const findPerson = (id) => persons.find(p => p.id === id);
   const fatherPerson = person.fatherId ? findPerson(person.fatherId) : null;
   const motherPerson = person.motherId ? findPerson(person.motherId) : null;

   // Find existing spouses from marriages
   const existingSpouses = marriages
      .filter(m => m.spouse1Id === person.id || m.spouse2Id === person.id)
      .map(m => {
         const spouseId = m.spouse1Id === person.id ? m.spouse2Id : m.spouse1Id;
         const sp = findPerson(spouseId);
         return { marriageId: m.id, id: spouseId, name: sp ? sp.name : `Person #${spouseId}`, familyId: null, familyName: null };
      });

   const [formData, setFormData] = useState({
      name: person.name || '',
      gender: person.gender || 'male',
      alive: person.alive ?? false,
      dateOfBirth: person.dateOfBirth || '',
      dateOfDeath: person.dateOfDeath || '',
      placeOfBirth: person.placeOfBirth || '',
      placeOfDeath: person.placeOfDeath || '',
      about: person.about || '',
      fatherId: person.fatherId || null,
      fatherName: person.fatherName || fatherPerson?.name || '',
      motherId: person.motherId || null,
      motherName: person.motherName || motherPerson?.name || '',
      isLawald: Boolean(person.isLawald),
      burialPlace: '',
      burialMapUrl: '',
      displayBadge: person.displayBadge || ''
   });

   const [spouses, setSpouses] = useState(existingSpouses);
   const [removedMarriageIds, setRemovedMarriageIds] = useState([]);
   const [newSpouses, setNewSpouses] = useState([]);

   // Search state
   const [searchResults, setSearchResults] = useState([]);
   const [showSearch, setShowSearch] = useState(false);
   const [activeSearchField, setActiveSearchField] = useState(null);
   const [fatherSpouseOptions, setFatherSpouseOptions] = useState([]);
   const [motherSpouseOptions, setMotherSpouseOptions] = useState([]);
   const [loadingSpouseTarget, setLoadingSpouseTarget] = useState(null); // 'father' | 'mother' | null
   const [showQuickFamilyModal, setShowQuickFamilyModal] = useState(false);
   const [quickFamilyTarget, setQuickFamilyTarget] = useState(null); // { type: 'existing'|'new', index: number }
   const [quickSpouseTarget, setQuickSpouseTarget] = useState(null); // 'primary' | 'additional' | null
   const [quickSpouseData, setQuickSpouseData] = useState({
      name: '', gender: 'female', alive: true,
      dateOfBirth: '', dateOfDeath: '', placeOfBirth: '', fatherName: '', about: '',
      burialPlace: '', burialMapUrl: ''
   });
   const [quickSpouseErrors, setQuickSpouseErrors] = useState({});
   const [quickSpouseLoading, setQuickSpouseLoading] = useState(false);



   const [autoSelectionNotices, setAutoSelectionNotices] = useState([]);
   const [quickSpouseAutoSelectionNotices, setQuickSpouseAutoSelectionNotices] = useState([]);
   const [quickSpouseSearchResults, setQuickSpouseSearchResults] = useState([]);
   const [quickSpouseSearching, setQuickSpouseSearching] = useState(false);
   const [quickSpouseBurialSuggestions, setQuickSpouseBurialSuggestions] = useState([]);
   const [showQuickSpouseBurialSuggestions, setShowQuickSpouseBurialSuggestions] = useState(false);
   const [quickSpouseEditTarget, setQuickSpouseEditTarget] = useState(null); // { source: 'existing'|'new', index: number, spouseId: string|number }
   const [quickSpouseHadExistingBurialInfo, setQuickSpouseHadExistingBurialInfo] = useState(false);
   const quickSpouseSearchTokenRef = useRef(0);
   const quickSpouseBurialDebounce = useRef(null);
   const [showCustomBadgeInput, setShowCustomBadgeInput] = useState(
      !!person.displayBadge && !['Ahl-e-Bait', 'Sahaba', 'Shared Ancestor', 'Usmani', 'Abbasi', 'Qaadri'].includes(person.displayBadge)
   );

   const advisoryMessages = [
      ...autoSelectionNotices.map(text => ({ type: 'info', text })),
      ...getAdvisoryState(formData.name, formData.alive)
   ];

   const quickSpouseAdvisories = [
      ...quickSpouseAutoSelectionNotices.map(text => ({ type: 'info', text })),
      ...getAdvisoryState(quickSpouseData.name, quickSpouseData.alive)
   ];

   const duplicateQuickSpouseMatch = quickSpouseSearchResults.find((candidate) =>
      String(candidate.name || '').trim().toLowerCase() === String(quickSpouseData.name || '').trim().toLowerCase()
   );

   const isQuickSpouseEditMode = quickSpouseTarget === 'edit-existing' || quickSpouseTarget === 'edit-new';

   const resetQuickSpouseEditor = () => {
      setQuickSpouseTarget(null);
      setQuickSpouseEditTarget(null);
      setQuickSpouseHadExistingBurialInfo(false);
      setQuickSpouseErrors({});
      setQuickSpouseBurialSuggestions([]);
      setShowQuickSpouseBurialSuggestions(false);
      quickSpouseSearchTokenRef.current += 1;
      setQuickSpouseSearchResults([]);
      setQuickSpouseSearching(false);
      setQuickSpouseAutoSelectionNotices([]);
      setQuickSpouseData({
         name: '',
         gender: 'female',
         alive: true,
         dateOfBirth: '',
         dateOfDeath: '',
         placeOfBirth: '',
         fatherName: '',
         about: '',
         burialPlace: '',
         burialMapUrl: ''
      });
   };

   const handleStartEditSpouse = async (source, index) => {
      const list = source === 'existing' ? spouses : newSpouses;
      const target = list[index];
      if (!target?.id) return;

      setQuickSpouseLoading(true);
      setQuickSpouseTarget(source === 'existing' ? 'edit-existing' : 'edit-new');
      setQuickSpouseEditTarget({ source, index, spouseId: target.id });
      setQuickSpouseErrors({});
      setQuickSpouseAutoSelectionNotices([]);
      setQuickSpouseBurialSuggestions([]);
      setShowQuickSpouseBurialSuggestions(false);

      try {
         const [detail, burial] = await Promise.all([
            fetchPersonDetails(target.id),
            fetchBurialInfo(target.id)
         ]);

         const personDetail = detail?.person || {};
         const parents = Array.isArray(detail?.parents) ? detail.parents : [];
         const fatherFromParents = parents.find((p) => p?.gender === 'male');

         const nextData = {
            name: personDetail.name || target.name || '',
            gender: personDetail.gender || 'female',
            alive: typeof personDetail.alive === 'boolean' ? personDetail.alive : true,
            dateOfBirth: personDetail.dateOfBirth || personDetail.date_of_birth || '',
            dateOfDeath: personDetail.dateOfDeath || personDetail.date_of_death || '',
            placeOfBirth: personDetail.placeOfBirth || personDetail.place_of_birth || '',
            fatherName: fatherFromParents?.name || personDetail.fatherName || personDetail.father_name || '',
            about: personDetail.about || '',
            burialPlace: burial?.place || '',
            burialMapUrl: burial?.mapUrl || ''
         };

         setQuickSpouseHadExistingBurialInfo(Boolean(burial));
         setQuickSpouseData(nextData);
      } catch (err) {
         setError(err?.message || 'Failed to load spouse details');
      } finally {
         setQuickSpouseLoading(false);
      }
   };

   // Load burial info and resolve missing names on mount
   useEffect(() => {
      (async () => {
         try {
            // Fetch burial info
            const burial = await fetchBurialInfo(person.id);
            if (burial) {
               setHadExistingBurialInfo(true);
               setFormData(prev => ({
                  ...prev,
                  burialPlace: burial.place || '',
                  burialMapUrl: burial.mapUrl || ''
               }));
            } else {
               setHadExistingBurialInfo(false);
            }

            // Resolve father name if linked but not in local persons list
            if (person.fatherId && !fatherPerson) {
               try {
                  const data = await fetchPersonDetails(person.fatherId);
                  if (data?.person?.name) {
                     setFormData(prev => ({ ...prev, fatherName: data.person.name }));
                  }
               } catch { /* ignore */ }
            }

            // Resolve mother name
            if (person.motherId && !motherPerson) {
               try {
                  const data = await fetchPersonDetails(person.motherId);
                  if (data?.person?.name) {
                     setFormData(prev => ({ ...prev, motherName: data.person.name }));
                  }
               } catch { /* ignore */ }
            }

            // Resolve spouse names and family memberships
            const updatedSpouses = [];
            for (const sp of existingSpouses) {
               let resolved = { ...sp };
               if (sp.name.startsWith('Person #')) {
                  try {
                     const data = await fetchPersonDetails(sp.id);
                     if (data?.person?.name) resolved.name = data.person.name;
                  } catch { /* ignore */ }
               }
               // Try to resolve family via search
               if (resolved.name && !resolved.name.startsWith('Person #')) {
                  try {
                     const results = await searchPersons(resolved.name);
                     const match = results?.find(r => r.id === sp.id);
                     if (match?.familyId) {
                        resolved.familyId = match.familyId;
                        resolved.familyName = match.familyName;
                     }
                  } catch { /* ignore */ }
               }
               updatedSpouses.push(resolved);
            }
            if (updatedSpouses.length > 0) setSpouses(updatedSpouses);
         } finally {
            setLoadingBurial(false);
         }
      })();
   }, [person.id]);

   const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      const nextValue = type === 'checkbox' ? checked : (type === 'radio' ? value === 'true' : value);
      setFormData(prev => {
         const next = {
            ...prev,
            [name]: nextValue
         };

         if (name === 'name') {
            const notices = [];

            const autoSelection = getAutoSelectionFromName(nextValue);
            Object.assign(next, autoSelection.next);
            notices.push(...autoSelection.notices);

            setAutoSelectionNotices(notices);
         } else if (name === 'alive') {
            setAutoSelectionNotices([]);
         }

         return next;
      });
   };

   const handleQuickSpouseChange = (e) => {
      const { name, value, type } = e.target;
      const fieldName = name === 'quickSpouseAlive' ? 'alive' : name;
      const nextValue = type === 'radio' ? value === 'true' : value;
      setQuickSpouseData(prev => {
         const next = {
            ...prev,
            [fieldName]: nextValue
         };

         if (fieldName === 'name') {
            const autoSelection = getAutoSelectionFromName(nextValue);
            Object.assign(next, autoSelection.next);
            setQuickSpouseAutoSelectionNotices(autoSelection.notices);

            const normalizedQuery = String(nextValue || '').trim();
            if (normalizedQuery.length >= 2) {
               const alreadySelectedIds = new Set([
                  person.id,
                  ...spouses.map(sp => sp.id),
                  ...newSpouses.map(sp => sp.id)
               ]);

               const currentToken = quickSpouseSearchTokenRef.current + 1;
               quickSpouseSearchTokenRef.current = currentToken;
               setQuickSpouseSearching(true);

               searchPersons(normalizedQuery)
                  .then((results) => {
                     if (quickSpouseSearchTokenRef.current !== currentToken) return;
                     const filtered = (results || []).filter(candidate => !alreadySelectedIds.has(candidate.id)).slice(0, 8);
                     setQuickSpouseSearchResults(filtered);
                  })
                  .catch(() => {
                     if (quickSpouseSearchTokenRef.current !== currentToken) return;
                     setQuickSpouseSearchResults([]);
                  })
                  .finally(() => {
                     if (quickSpouseSearchTokenRef.current !== currentToken) return;
                     setQuickSpouseSearching(false);
                  });
            } else {
               quickSpouseSearchTokenRef.current += 1;
               setQuickSpouseSearchResults([]);
               setQuickSpouseSearching(false);
            }
         } else if (fieldName === 'alive') {
            setQuickSpouseAutoSelectionNotices([]);
         }

         return next;
      });
      if (quickSpouseErrors[fieldName]) {
         setQuickSpouseErrors(prev => { const n = { ...prev }; delete n[fieldName]; return n; });
      }
   };

   const handleQuickSpouseBurialPlaceChange = (e) => {
      const value = e.target?.value || '';
      handleQuickSpouseChange({ target: { name: 'burialPlace', value, type: 'text' } });

      clearTimeout(quickSpouseBurialDebounce.current);
      if (value.trim().length < 1) {
         setQuickSpouseBurialSuggestions([]);
         setShowQuickSpouseBurialSuggestions(false);
         return;
      }

      quickSpouseBurialDebounce.current = setTimeout(async () => {
         try {
            const res = await fetch(`/api/admin/burial-info?q=${encodeURIComponent(value.trim())}`);
            const json = await res.json();
            const suggestions = json.data || [];
            setQuickSpouseBurialSuggestions(suggestions);
            setShowQuickSpouseBurialSuggestions(suggestions.length > 0);
         } catch {
            setQuickSpouseBurialSuggestions([]);
            setShowQuickSpouseBurialSuggestions(false);
         }
      }, 300);
   };

   const handleQuickSpouseSelectBurialSuggestion = (suggestion) => {
      setQuickSpouseData(prev => ({
         ...prev,
         burialPlace: suggestion.place,
         burialMapUrl: suggestion.mapUrl || prev.burialMapUrl
      }));
      setQuickSpouseBurialSuggestions([]);
      setShowQuickSpouseBurialSuggestions(false);
   };

   const handleQuickSpouseSave = async () => {
      if (!quickSpouseData.name || quickSpouseData.name.trim().length < 2) {
         setQuickSpouseErrors({ name: 'Name is required (min 2 characters)' });
         return;
      }

      if (isQuickSpouseEditMode && quickSpouseEditTarget?.spouseId) {
         setQuickSpouseLoading(true);
         try {
            let aboutText = quickSpouseData.about?.trim() || '';
            if (quickSpouseData.fatherName?.trim()) {
               const fatherLine = `Father: ${quickSpouseData.fatherName.trim()}`;
               aboutText = aboutText ? `${fatherLine}\n${aboutText}` : fatherLine;
            }

            await updatePerson(quickSpouseEditTarget.spouseId, {
               name: quickSpouseData.name.trim(),
               gender: quickSpouseData.gender,
               alive: quickSpouseData.alive,
               date_of_birth: quickSpouseData.dateOfBirth?.trim() || null,
               date_of_death: quickSpouseData.alive ? null : (quickSpouseData.dateOfDeath?.trim() || null),
               place_of_birth: quickSpouseData.placeOfBirth?.trim() || null,
               about: aboutText || null
            });

            if (quickSpouseHadExistingBurialInfo || quickSpouseData.burialPlace?.trim() || quickSpouseData.burialMapUrl?.trim()) {
               await createBurialInfo(quickSpouseEditTarget.spouseId, {
                  burial_place: quickSpouseData.burialPlace?.trim() || null,
                  burial_map_url: quickSpouseData.burialMapUrl?.trim() || null
               });
            }

            if (quickSpouseEditTarget.source === 'existing') {
               setSpouses(prev => prev.map((sp, idx) => idx === quickSpouseEditTarget.index ? { ...sp, name: quickSpouseData.name.trim() } : sp));
            } else {
               setNewSpouses(prev => prev.map((sp, idx) => idx === quickSpouseEditTarget.index ? { ...sp, name: quickSpouseData.name.trim() } : sp));
            }

            resetQuickSpouseEditor();
         } catch (err) {
            setQuickSpouseErrors({ name: err.message || 'Failed to update spouse details' });
         } finally {
            setQuickSpouseLoading(false);
         }
         return;
      }

      if (duplicateQuickSpouseMatch) {
         setQuickSpouseErrors({ name: 'A person with this name already exists. Select the suggested spouse instead of creating a duplicate.' });
         return;
      }

      setQuickSpouseLoading(true);
      try {
         let aboutText = quickSpouseData.about?.trim() || '';
         if (quickSpouseData.fatherName?.trim()) {
            const fatherLine = `Father: ${quickSpouseData.fatherName.trim()}`;
            aboutText = aboutText ? `${fatherLine}\n${aboutText}` : fatherLine;
         }

         const payload = {
            name: quickSpouseData.name.trim(),
            gender: quickSpouseData.gender,
            alive: quickSpouseData.alive,
            date_of_birth: quickSpouseData.dateOfBirth?.trim() || null,
            date_of_death: quickSpouseData.alive ? null : (quickSpouseData.dateOfDeath?.trim() || null),
            place_of_birth: quickSpouseData.placeOfBirth?.trim() || null,
            about: aboutText || null,
            father_name: quickSpouseData.fatherName?.trim() || null,
            father_id: null,
            mother_id: null
         };

         const newSpouse = await createPerson(payload);

         // Persist burial metadata for unknown spouse profile popup in tree view.
         if (quickSpouseData.burialPlace?.trim() || quickSpouseData.burialMapUrl?.trim()) {
            await createBurialInfo(newSpouse.id, {
               burial_place: quickSpouseData.burialPlace?.trim() || null,
               burial_map_url: quickSpouseData.burialMapUrl?.trim() || null
            });
         }

         setNewSpouses(prev => quickSpouseTarget === 'primary'
            ? [{ id: newSpouse.id, name: newSpouse.name, familyId: null, familyName: null }, ...prev]
            : [...prev, { id: newSpouse.id, name: newSpouse.name, familyId: null, familyName: null }]
         );

         resetQuickSpouseEditor();
      } catch (err) {
         setQuickSpouseErrors({ name: err.message || 'Failed to create spouse' });
      } finally {
         setQuickSpouseLoading(false);
      }
   };

   const handleQuickSpouseSelectSuggestion = (selected) => {
      const nextSpouse = {
         id: selected.id,
         name: selected.name,
         familyId: selected.familyId || null,
         familyName: selected.familyName || null
      };

      setNewSpouses(prev => quickSpouseTarget === 'primary'
         ? [nextSpouse, ...prev.filter(sp => sp.id !== selected.id)]
         : [...prev.filter(sp => sp.id !== selected.id), nextSpouse]
      );

      resetQuickSpouseEditor();
   };

   const handleSearch = async (query, field) => {
      setActiveSearchField(field);
      if (query.length < 1) {
         setSearchResults([]);
         setShowSearch(false);
         return;
      }
      try {
         const results = await searchPersons(query);
         setSearchResults(results || []);
         setShowSearch(true);
      } catch {
         setSearchResults([]);
      }
   };

   const handleSelectPerson = (selected, field) => {
      if (field === 'additionalSpouse') {
         setNewSpouses(prev => [...prev, {
            id: selected.id,
            name: selected.name,
            familyId: selected.familyId || null,
            familyName: selected.familyName || null
         }]);
      } else {
         const nameField = field.replace('Id', 'Name');
         setFormData(prev => ({ ...prev, [field]: selected.id, [nameField]: selected.name }));
      }
      setShowSearch(false);
      setSearchResults([]);
      setActiveSearchField(null);
   };

   const handleClearSelection = (field) => {
      const nameField = field.replace('Id', 'Name');
      setFormData(prev => ({ ...prev, [field]: null, [nameField]: '' }));
   };

   useEffect(() => {
      const loadFatherSpouses = async () => {
         const personId = formData.fatherId;
         if (!personId) {
            setFatherSpouseOptions([]);
            return;
         }

         setLoadingSpouseTarget('father');
         try {
            const details = await fetchPersonDetails(personId);
            const spouseCandidates = Array.isArray(details?.spouses)
               ? details.spouses
                  .filter(sp => sp?.id && sp.id !== personId)
                  .map(sp => ({
                     id: sp.id,
                     name: sp.name || '',
                     gender: sp.gender || null,
                     familyId: sp.familyId || null,
                     familyName: sp.familyName || null,
                     fatherName: sp.fatherName || ''
                  }))
               : [];

            const uniqueSpouses = [];
            const seen = new Set();
            for (const spouse of spouseCandidates) {
               if (seen.has(spouse.id)) continue;
               seen.add(spouse.id);
               uniqueSpouses.push(spouse);
            }

            setFatherSpouseOptions(uniqueSpouses);
            if (uniqueSpouses.length === 1 && !formData.motherId) {
               const spouse = uniqueSpouses[0];
               setFormData(prev => ({
                  ...prev,
                  motherId: spouse.id,
                  motherName: spouse.name,
                  motherFamilyId: spouse.familyId || null,
                  motherFamilyName: spouse.familyName || null
               }));
            }
         } catch (err) {
            console.debug('EditPersonModal: failed loading father spouses', { personId, err });
            setFatherSpouseOptions([]);
         } finally {
            setLoadingSpouseTarget(null);
         }
      };

      loadFatherSpouses();
   }, [formData.fatherId]);

   useEffect(() => {
      const loadMotherSpouses = async () => {
         const personId = formData.motherId;
         if (!personId || formData.fatherId) {
            setMotherSpouseOptions([]);
            return;
         }

         setLoadingSpouseTarget('mother');
         try {
            const details = await fetchPersonDetails(personId);
            const spouseCandidates = Array.isArray(details?.spouses)
               ? details.spouses
                  .filter(sp => sp?.id && sp.id !== personId)
                  .map(sp => ({
                     id: sp.id,
                     name: sp.name || '',
                     gender: sp.gender || null,
                     familyId: sp.familyId || null,
                     familyName: sp.familyName || null,
                     fatherName: sp.fatherName || ''
                  }))
               : [];

            const uniqueSpouses = [];
            const seen = new Set();
            for (const spouse of spouseCandidates) {
               if (seen.has(spouse.id)) continue;
               seen.add(spouse.id);
               uniqueSpouses.push(spouse);
            }

            setMotherSpouseOptions(uniqueSpouses);
            if (uniqueSpouses.length === 1 && !formData.fatherId) {
               const spouse = uniqueSpouses[0];
               setFormData(prev => ({
                  ...prev,
                  fatherId: spouse.id,
                  fatherName: spouse.name,
                  fatherFamilyId: spouse.familyId || null,
                  fatherFamilyName: spouse.familyName || null
               }));
            }
         } catch (err) {
            console.debug('EditPersonModal: failed loading mother spouses', { personId, err });
            setMotherSpouseOptions([]);
         } finally {
            setLoadingSpouseTarget(null);
         }
      };

      loadMotherSpouses();
   }, [formData.motherId]);

   const handleRemoveSpouse = (marriageId) => {
      setRemovedMarriageIds(prev => [...prev, marriageId]);
      setSpouses(prev => prev.filter(s => s.marriageId !== marriageId));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.name.trim()) { setError('Name is required'); return; }

      try {
         setLoading(true);
         setError('');

         // 1. Update person
         await updatePerson(person.id, {
            name: formData.name.trim(),
            gender: formData.gender,
            alive: formData.alive,
            is_lawald: Boolean(formData.isLawald),
            date_of_birth: formData.dateOfBirth || null,
            date_of_death: formData.dateOfDeath || null,
            place_of_birth: formData.placeOfBirth || null,
            place_of_death: formData.placeOfDeath || null,
            about: formData.about || null,
            father_id: formData.fatherId || null,
            mother_id: formData.motherId || null,
            display_badge: formData.displayBadge?.trim() || null
         });

         // 2. Upsert or clear burial info
         if (hadExistingBurialInfo || formData.burialPlace || formData.burialMapUrl) {
            await createBurialInfo(person.id, {
               burial_place: formData.burialPlace || null,
               burial_map_url: formData.burialMapUrl || null
            });
         }

         // 3. Remove deleted marriages
         for (const mId of removedMarriageIds) {
            try { await deleteMarriage(mId); } catch { /* ignore */ }
         }

         // 4. Create new marriages & link spouses to families
         for (const sp of newSpouses) {
            try { await createMarriage(person.id, sp.id); } catch { /* ignore */ }
            if (sp.familyId) {
               try { await addPersonToFamily(sp.familyId, sp.id); } catch { /* may already be linked */ }
            }
         }

         // 5. Update family assignments for existing spouses that changed
         for (const sp of spouses) {
            if (sp.familyId) {
               try { await addPersonToFamily(sp.familyId, sp.id); } catch { /* may already be linked */ }
            }
         }

         onSave();
      } catch (err) {
         setError(err.message || 'Failed to update person');
      } finally {
         setLoading(false);
      }
   };

   const renderSearchField = (field, placeholder) => (
      <div style={styles.searchContainer}>
         <input
            type="text"
            placeholder={placeholder}
            onChange={(e) => handleSearch(e.target.value, field)}
            onFocus={() => setShowSearch(true)}
            style={styles.input}
         />
         {showSearch && activeSearchField === field && searchResults.length > 0 && (
            <div style={styles.searchResults}>
               {searchResults.map(p => (
                  <div key={p.id} onClick={() => handleSelectPerson(p, field)} style={styles.searchResult}>
                     <strong>{p.name}</strong>
                     <small> ({p.gender}, {p.alive ? 'Living' : 'Deceased'})</small>
                     {p.familyName && <small style={styles.familyTag}>{p.familyName}</small>}
                  </div>
               ))}
            </div>
         )}
      </div>
   );

   const renderSelectedItem = (name, field) => (
      <div style={styles.selectedItem}>
         <span>{name}</span>
         <button type="button" onClick={() => handleClearSelection(field)} style={styles.clearBtn}>
            <i className="fa-solid fa-xmark"></i>
         </button>
      </div>
   );

   return (
      <div style={styles.overlay} onClick={onClose}>
         <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
               <h3 style={{ margin: 0 }}>
                  <i className="fa-solid fa-user-pen" style={{ marginRight: '8px' }}></i>
                  Edit Person
               </h3>
               <button style={styles.closeBtn} onClick={onClose}>
                  <i className="fa-solid fa-xmark"></i>
               </button>
            </div>

            {error && (
               <div style={styles.error}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>{error}
               </div>
            )}

            <form onSubmit={handleSubmit}>
               {/* BASIC INFORMATION */}
               <fieldset style={styles.fieldset}>
                  <legend style={styles.legend}>
                     <i className="fa-solid fa-clipboard-list" style={{ marginRight: '6px' }}></i>Basic Information
                  </legend>

                  <div style={styles.formGroup}>
                     <label style={styles.label}>Full Name *</label>
                     <input type="text" name="name" value={formData.name} onChange={handleChange} style={styles.input} required />
                  </div>

                  {advisoryMessages.length > 0 && (
                     <div style={styles.advisoryStack}>
                        {advisoryMessages.map((message, index) => (
                           <div
                              key={`${message.type}-${index}`}
                              style={message.type === 'warning' ? styles.advisoryWarning : styles.advisoryInfo}
                           >
                              {message.text}
                           </div>
                        ))}
                     </div>
                  )}

                  <div style={styles.row}>
                     <div style={styles.formGroup}>
                        <label style={styles.label}>Gender *</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} style={styles.input}>
                           <option value="male">Male</option>
                           <option value="female">Female</option>
                        </select>
                     </div>
                     <div style={styles.formGroup}>
                        <label style={styles.label}>Status *</label>
                        <div style={styles.radioGroup}>
                           <label style={styles.radioLabel}>
                              <input type="radio" name="alive" value="true" checked={formData.alive === true} onChange={handleChange} /> Living
                           </label>
                           <label style={styles.radioLabel}>
                              <input type="radio" name="alive" value="false" checked={formData.alive === false} onChange={handleChange} /> Deceased
                           </label>
                        </div>
                     </div>
                  </div>

                  <div style={styles.row}>
                     <div style={styles.formGroup}>
                        <label style={styles.label}>Date of Birth</label>
                        <input type="text" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} style={styles.input} placeholder="e.g., 600 CE / 3 AH / 04/03/625" />
                     </div>
                     <div style={styles.formGroup}>
                        <label style={styles.label}>Place of Birth</label>
                        <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} style={styles.input} placeholder="City, Region, Country" />
                     </div>
                  </div>

                  {!formData.alive && (
                     <div style={styles.row}>
                        <div style={styles.formGroup}>
                           <label style={styles.label}>Date of Death</label>
                           <input type="text" name="dateOfDeath" value={formData.dateOfDeath} onChange={handleChange} style={styles.input} placeholder="e.g., 28/01/661 CE / 40 AH" />
                        </div>
                        <div style={styles.formGroup}>
                           <label style={styles.label}>Place of Death</label>
                           <input type="text" name="placeOfDeath" value={formData.placeOfDeath} onChange={handleChange} style={styles.input} placeholder="City, Region, Country" />
                        </div>
                     </div>
                  )}

                  <div style={styles.formGroup}>
                     <label style={styles.label}>About / Biography</label>
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <textarea name="about" value={formData.about} onChange={handleChange} rows="3" style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="Short biography or notes" />
                     </div>
                  </div>

                  <div style={styles.formGroup}>
                     <label style={{ ...styles.checkboxLabel, color: '#b91c1c' }}>
                        <input
                           type="checkbox"
                           name="isLawald"
                           checked={Boolean(formData.isLawald)}
                           onChange={handleChange}
                           style={{ marginRight: '8px' }}
                        />
                        Mark as confirmed no children (red name + cross in tree)
                     </label>
                  </div>
               </fieldset>

               {/* FAMILY LINKS */}
               <fieldset style={styles.fieldset}>
                  <legend style={styles.legend}>
                     <i className="fa-solid fa-people-roof" style={{ marginRight: '6px' }}></i>Family Links
                  </legend>

                  <div style={styles.row}>
                     <div style={styles.formGroup}>
                        <label style={styles.label}>
                           Father
                           {loadingSpouseTarget === 'father' && (
                              <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center' }}>
                                 <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              </span>
                           )}
                        </label>
                        {formData.fatherId
                           ? renderSelectedItem(formData.fatherName, 'fatherId')
                           : renderSearchField('fatherId', 'Search for father...')
                        }
                     </div>
                     <div style={styles.formGroup}>
                        <label style={styles.label}>
                           Mother
                           {loadingSpouseTarget === 'mother' && (
                              <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center' }}>
                                 <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              </span>
                           )}
                        </label>
                        {formData.motherId
                           ? renderSelectedItem(formData.motherName, 'motherId')
                           : renderSearchField('motherId', 'Search for mother...')
                        }
                        {formData.fatherId && fatherSpouseOptions.length > 0 && (
                           <div style={{ marginTop: '12px', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fafafa' }}>
                              <small style={{ color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                                 Multiple spouses found for selected father. Optionally choose one:
                              </small>
                              <div style={{ display: 'grid', gap: '8px' }}>
                                 {fatherSpouseOptions.map(option => (
                                    <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                       <input
                                          type="checkbox"
                                          checked={String(formData.motherId) === String(option.id)}
                                          onChange={() => {
                                             if (String(formData.motherId) === String(option.id)) {
                                                setFormData(prev => ({ ...prev, motherId: null, motherName: '', motherFamilyId: null, motherFamilyName: null }));
                                             } else {
                                                setFormData(prev => ({ ...prev, motherId: option.id, motherName: option.name || '', motherFamilyId: option.familyId || null, motherFamilyName: option.familyName || null }));
                                             }
                                          }}
                                          style={{ marginRight: '8px' }}
                                       />
                                       <span style={{ marginRight: '10px' }}>{option.name}</span>
                                       {option.fatherName ? (
                                          <small style={{ fontSize: '12px', color: '#6b7280' }}> • Father: {option.fatherName}</small>
                                       ) : option.familyName ? (
                                          <small style={{ fontSize: '12px', padding: '2px 6px', background: '#f3f4f6', borderRadius: '999px' }}>{option.familyName}</small>
                                       ) : null}
                                    </label>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Existing spouses */}
                  {spouses.length > 0 && (
                     <div style={styles.formGroup}>
                        <label style={styles.label}>Spouses</label>
                        {spouses.map((sp, idx) => (
                           <div key={sp.marriageId}>
                              <div style={styles.selectedItem}>
                                 <span>{sp.name}</span>
                                 <div style={styles.spouseActions}>
                                    <button type="button" onClick={() => handleStartEditSpouse('existing', idx)} style={styles.editSpouseBtn}>
                                       <i className="fa-solid fa-pen" style={{ marginRight: '4px' }}></i>Edit Details
                                    </button>
                                    <button type="button" onClick={() => handleRemoveSpouse(sp.marriageId)} style={styles.clearBtn}>
                                       <i className="fa-solid fa-xmark"></i> Remove
                                    </button>
                                 </div>
                              </div>
                              <div style={styles.familySelectorRow}>
                                 <label style={styles.familySelectorLabel}>Family:</label>
                                 <select
                                    value={sp.familyId || ''}
                                    onChange={(e) => {
                                       const selected = allFamilies.find(f => f.id === e.target.value);
                                       setSpouses(prev => prev.map((s, i) => i === idx ? {
                                          ...s,
                                          familyId: e.target.value || null,
                                          familyName: selected?.name || null
                                       } : s));
                                    }}
                                    style={styles.familySelect}
                                 >
                                    <option value="">-- No Family --</option>
                                    {allFamilies.map(f => (
                                       <option key={f.id} value={f.id}>{f.name}{f.region ? ` (${f.region})` : ''}</option>
                                    ))}
                                 </select>
                                 <button
                                    type="button"
                                    onClick={() => { setQuickFamilyTarget({ type: 'existing', index: idx }); setShowQuickFamilyModal(true); }}
                                    style={styles.newFamilyBtn}
                                    title="Create new family"
                                 >
                                    <i className="fa-solid fa-plus"></i> New
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}

                  {/* Newly added spouses */}
                  {newSpouses.length > 0 && (
                     <div style={styles.formGroup}>
                        <label style={styles.label}>New Spouses (will be added)</label>
                        {newSpouses.map((sp, idx) => (
                           <div key={idx}>
                              <div style={{ ...styles.selectedItem, background: '#e8f8f3', borderColor: '#a8d8d8' }}>
                                 <span>{sp.name}</span>
                                 <div style={styles.spouseActions}>
                                    <button type="button" onClick={() => handleStartEditSpouse('new', idx)} style={styles.editSpouseBtn}>
                                       <i className="fa-solid fa-pen" style={{ marginRight: '4px' }}></i>Edit Details
                                    </button>
                                    <button type="button" onClick={() => setNewSpouses(prev => prev.filter((_, i) => i !== idx))} style={styles.clearBtn}>
                                       <i className="fa-solid fa-xmark"></i>
                                    </button>
                                 </div>
                              </div>
                              <div style={styles.familySelectorRow}>
                                 <label style={styles.familySelectorLabel}>Family:</label>
                                 <select
                                    value={sp.familyId || ''}
                                    onChange={(e) => {
                                       const selected = allFamilies.find(f => f.id === e.target.value);
                                       setNewSpouses(prev => prev.map((s, i) => i === idx ? {
                                          ...s,
                                          familyId: e.target.value || null,
                                          familyName: selected?.name || null
                                       } : s));
                                    }}
                                    style={styles.familySelect}
                                 >
                                    <option value="">-- No Family --</option>
                                    {allFamilies.map(f => (
                                       <option key={f.id} value={f.id}>{f.name}{f.region ? ` (${f.region})` : ''}</option>
                                    ))}
                                 </select>
                                 <button
                                    type="button"
                                    onClick={() => { setQuickFamilyTarget({ type: 'new', index: idx }); setShowQuickFamilyModal(true); }}
                                    style={styles.newFamilyBtn}
                                    title="Create new family"
                                 >
                                    <i className="fa-solid fa-plus"></i> New
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}

                  {/* Add spouse search */}
                  <div style={styles.formGroup}>
                     {quickSpouseTarget ? (
                        <QuickSpouseInlineForm
                           data={quickSpouseData}
                           errors={quickSpouseErrors}
                           loading={quickSpouseLoading}
                           onChange={handleQuickSpouseChange}
                           onBurialPlaceChange={handleQuickSpouseBurialPlaceChange}
                           burialSuggestions={quickSpouseBurialSuggestions}
                           showBurialSuggestions={showQuickSpouseBurialSuggestions}
                           onSelectBurialSuggestion={handleQuickSpouseSelectBurialSuggestion}
                           onSave={handleQuickSpouseSave}
                           advisories={quickSpouseAdvisories}
                           searchResults={isQuickSpouseEditMode ? [] : quickSpouseSearchResults}
                           onSelectSuggestion={handleQuickSpouseSelectSuggestion}
                           duplicateWarning={isQuickSpouseEditMode ? '' : (duplicateQuickSpouseMatch ? 'Matching existing spouse found below. Select it to avoid creating a duplicate record.' : '')}
                           isSearching={isQuickSpouseEditMode ? false : quickSpouseSearching}
                           title={isQuickSpouseEditMode ? 'Edit Spouse Details' : 'Add Spouse (Unknown Family)'}
                           hintText={isQuickSpouseEditMode ? 'Update spouse profile details. This changes the existing spouse record.' : 'This creates a person record with no family assignment. Their details will appear in the tree popup.'}
                           saveLabel={isQuickSpouseEditMode ? 'Update Spouse' : 'Save Spouse'}
                           onCancel={() => {
                              resetQuickSpouseEditor();
                           }}

                        />
                     ) : activeSearchField !== 'additionalSpouse' ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                           <button
                              type="button"
                              onClick={() => { setActiveSearchField('additionalSpouse'); setShowSearch(true); }}
                              style={styles.addSpouseBtn}
                           >
                              <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i>Add Known Spouse
                           </button>
                           <button
                              type="button"
                              onClick={() => {
                                 setQuickSpouseTarget('primary');
                                 setActiveSearchField(null);
                                 setShowSearch(false);
                                 setSearchResults([]);
                              }}
                              style={styles.unknownSpouseBtn}
                           >
                              <i className="fa-solid fa-user-plus" style={{ marginRight: '6px' }}></i>Unknown Primary Spouse
                           </button>
                           <button
                              type="button"
                              onClick={() => {
                                 setQuickSpouseTarget('additional');
                                 setActiveSearchField(null);
                                 setShowSearch(false);
                                 setSearchResults([]);
                              }}
                              style={styles.unknownSpouseBtn}
                           >
                              <i className="fa-solid fa-user-plus" style={{ marginRight: '6px' }}></i>Unknown Additional Spouse
                           </button>
                        </div>
                     ) : (
                        <div style={styles.searchContainer}>
                           <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                 type="text"
                                 placeholder="Search for spouse..."
                                 onChange={(e) => handleSearch(e.target.value, 'additionalSpouse')}
                                 autoFocus
                                 style={{ ...styles.input, flex: 1 }}
                              />
                              <button type="button" onClick={() => { setActiveSearchField(null); setShowSearch(false); setSearchResults([]); }} style={styles.cancelSmallBtn}>
                                 Cancel
                              </button>
                           </div>
                           {showSearch && searchResults.length > 0 && (
                              <div style={styles.searchResults}>
                                 {searchResults.map(p => (
                                    <div key={p.id} onClick={() => handleSelectPerson(p, 'additionalSpouse')} style={styles.searchResult}>
                                       <strong>{p.name}</strong>
                                       <small> ({p.gender}, {p.alive ? 'Living' : 'Deceased'})</small>
                                       {p.familyName && <small style={styles.familyTag}>{p.familyName}</small>}
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </fieldset>

               {/* BURIAL INFORMATION */}
               <fieldset style={styles.fieldset}>
                  <legend style={styles.legend}>
                     <i className="fa-solid fa-cross" style={{ marginRight: '6px' }}></i>Burial Information
                  </legend>

                  {loadingBurial ? (
                     <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>Loading burial info...
                     </div>
                  ) : (
                     <div style={styles.row}>
                        <div style={styles.formGroup}>
                           <label style={styles.label}>Burial Place</label>
                           <input type="text" name="burialPlace" value={formData.burialPlace} onChange={handleChange} style={styles.input} placeholder="Cemetery or burial location" />
                        </div>
                        <div style={styles.formGroup}>
                           <label style={styles.label}>Google Maps Link</label>
                           <input type="url" name="burialMapUrl" value={formData.burialMapUrl} onChange={handleChange} style={styles.input} placeholder="https://maps.app.goo.gl/..." />
                        </div>
                     </div>
                  )}
               </fieldset>

               {/* CUSTOM BADGE */}
               <fieldset style={styles.fieldset}>
                  <legend style={styles.legend}>
                     <i className="fa-solid fa-tag" style={{ marginRight: '6px' }}></i>Custom Badge
                  </legend>
                  <div style={styles.formGroup}>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                        {['Ahl-e-Bait', 'Sahaba', 'Shared Ancestor', 'Usmani', 'Abbasi', 'Qaadri'].map(opt => {
                           const isSelected = formData.displayBadge === opt && !showCustomBadgeInput;
                           return (
                              <button
                                 key={opt}
                                 type="button"
                                 onClick={() => {
                                    setShowCustomBadgeInput(false);
                                    handleChange({ target: { name: 'displayBadge', value: isSelected ? '' : opt } });
                                 }}
                                 style={{
                                    padding: '4px 14px',
                                    borderRadius: '999px',
                                    border: `1.5px solid ${isSelected ? '#7e22ce' : '#d1d5db'}`,
                                    background: isSelected ? '#fdf4ff' : '#f9fafb',
                                    color: isSelected ? '#7e22ce' : '#374151',
                                    fontSize: '13px',
                                    fontWeight: isSelected ? '600' : '400',
                                    cursor: 'pointer',
                                 }}
                              >
                                 {opt}
                              </button>
                           );
                        })}
                        <button
                           type="button"
                           onClick={() => {
                              if (showCustomBadgeInput) {
                                 setShowCustomBadgeInput(false);
                                 handleChange({ target: { name: 'displayBadge', value: '' } });
                              } else {
                                 setShowCustomBadgeInput(true);
                                 handleChange({ target: { name: 'displayBadge', value: '' } });
                              }
                           }}
                           style={{
                              padding: '4px 14px',
                              borderRadius: '999px',
                              border: `1.5px solid ${showCustomBadgeInput ? '#7e22ce' : '#d1d5db'}`,
                              background: showCustomBadgeInput ? '#fdf4ff' : '#f9fafb',
                              color: showCustomBadgeInput ? '#7e22ce' : '#374151',
                              fontSize: '13px',
                              fontWeight: showCustomBadgeInput ? '600' : '400',
                              cursor: 'pointer',
                           }}
                        >
                           ✏️ Custom
                        </button>
                     </div>
                     {showCustomBadgeInput && (
                        <input
                           type="text"
                           name="displayBadge"
                           value={formData.displayBadge}
                           onChange={handleChange}
                           placeholder="Type badge name..."
                           style={styles.input}
                           autoFocus
                        />
                     )}
                     <small style={{ fontSize: '11px', color: '#6c757d', marginTop: '5px', display: 'block' }}>
                        When set, replaces the family name badge in search results. Leave blank to show family name normally.
                     </small>
                  </div>
               </fieldset>

               {/* ACTIONS */}
               <div style={styles.actions}>
                  <button type="button" onClick={onClose} style={styles.cancelBtn} disabled={loading}>
                     <i className="fa-solid fa-xmark" style={{ marginRight: '6px' }}></i>Cancel
                  </button>
                  <button type="submit" style={styles.saveBtn} disabled={loading}>
                     {loading
                        ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>Saving...</>
                        : <><i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>Save Changes</>
                     }
                  </button>
               </div>
            </form>
         </div>

         {/* QUICK FAMILY MODAL */}
         {showQuickFamilyModal && (
            <QuickFamilyModal
               onFamilyCreated={(newFamily) => {
                  if (quickFamilyTarget?.type === 'existing') {
                     setSpouses(prev => prev.map((s, i) => i === quickFamilyTarget.index ? {
                        ...s, familyId: newFamily.id, familyName: newFamily.name
                     } : s));
                  } else if (quickFamilyTarget?.type === 'new') {
                     setNewSpouses(prev => prev.map((s, i) => i === quickFamilyTarget.index ? {
                        ...s, familyId: newFamily.id, familyName: newFamily.name
                     } : s));
                  }
                  setShowQuickFamilyModal(false);
                  setQuickFamilyTarget(null);
                  if (onFamilyCreated) onFamilyCreated(newFamily);
               }}
               onClose={() => { setShowQuickFamilyModal(false); setQuickFamilyTarget(null); }}
            />
         )}
      </div>
   );
}

const styles = {
   overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
   },
   modal: {
      background: 'white',
      borderRadius: '8px',
      padding: '25px',
      width: '90%',
      maxWidth: '700px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
   },
   modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '12px',
      borderBottom: '2px solid #eee'
   },
   closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#666',
      padding: '4px 8px'
   },
   error: {
      padding: '10px 14px',
      background: '#fff3f3',
      border: '1px solid #ffcdd2',
      color: '#c62828',
      borderRadius: '4px',
      marginBottom: '15px',
      fontSize: '14px'
   },
   fieldset: {
      border: '1px solid #ddd',
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '18px',
      backgroundColor: '#fafafa'
   },
   legend: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#333',
      padding: '0 8px'
   },
   row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px'
   },
   formGroup: {
      marginBottom: '12px'
   },
   label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: '600',
      fontSize: '13px',
      color: '#333'
   },
   input: {
      width: '100%',
      padding: '8px 10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '13px',
      fontFamily: 'inherit',
      boxSizing: 'border-box'
   },
   radioGroup: {
      display: 'flex',
      gap: '20px',
      marginTop: '6px'
   },
   radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      fontSize: '13px'
   },
   advisoryStack: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '14px'
   },
   advisoryInfo: {
      backgroundColor: '#eff6ff',
      color: '#1d4ed8',
      border: '1px solid #bfdbfe',
      borderRadius: '4px',
      padding: '10px 12px',
      fontSize: '12px'
   },
   advisoryWarning: {
      backgroundColor: '#fff7ed',
      color: '#c2410c',
      border: '1px solid #fdba74',
      borderRadius: '4px',
      padding: '10px 12px',
      fontSize: '12px'
   },
   checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500'
   },
   searchContainer: {
      position: 'relative'
   },
   searchResults: {
      position: 'absolute',
      top: '100%',
      left: 0, right: 0,
      background: '#fff',
      border: '1px solid #ddd',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      maxHeight: '150px',
      overflowY: 'auto',
      zIndex: 10,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
   },
   searchResult: {
      padding: '10px 12px',
      borderBottom: '1px solid #eee',
      cursor: 'pointer',
      fontSize: '12px'
   },
   selectedItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      backgroundColor: '#e8f4f8',
      border: '1px solid #b3d9e8',
      borderRadius: '4px',
      fontSize: '13px',
      marginBottom: '6px'
   },
   clearBtn: {
      background: 'none',
      border: 'none',
      color: '#dc3545',
      fontSize: '13px',
      cursor: 'pointer',
      padding: '0 4px'
   },
   spouseActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
   },
   editSpouseBtn: {
      background: '#eff6ff',
      color: '#1d4ed8',
      border: '1px solid #bfdbfe',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '11px',
      cursor: 'pointer',
      fontWeight: '600'
   },
   addSpouseBtn: {
      backgroundColor: '#17a2b8',
      color: 'white',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer'
   },
   unknownSpouseBtn: {
      backgroundColor: '#6b7280',
      color: 'white',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer'
   },
   cancelSmallBtn: {
      padding: '8px 12px',
      background: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer'
   },
   actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '20px',
      paddingTop: '15px',
      borderTop: '1px solid #eee'
   },
   cancelBtn: {
      padding: '9px 18px',
      background: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
   },
   saveBtn: {
      padding: '9px 18px',
      background: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
   },
   familySelectorRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '4px',
      marginBottom: '8px',
      padding: '4px 0'
   },
   familySelectorLabel: {
      fontSize: '12px',
      fontWeight: '500',
      color: '#555',
      whiteSpace: 'nowrap'
   },
   familySelect: {
      flex: 1,
      padding: '5px 8px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'inherit',
      boxSizing: 'border-box'
   },
   newFamilyBtn: {
      padding: '5px 10px',
      backgroundColor: '#17a2b8',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
   },
   familyTag: {
      display: 'inline-block',
      marginLeft: '6px',
      padding: '1px 6px',
      backgroundColor: '#e8f4f8',
      border: '1px solid #b3d9e8',
      borderRadius: '3px',
      fontSize: '10px',
      color: '#0077b6'
   }
};
