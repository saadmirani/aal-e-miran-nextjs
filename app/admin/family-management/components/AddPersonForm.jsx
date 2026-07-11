'use client';

import { useState, useRef, useEffect } from 'react';
import {
   createPerson,
   createBurialInfo,
   createMarriage,
   addPersonToFamily,
   searchPersons,
   updatePerson,
   fetchPersonDetails
} from '../utils/api';
import {
   validatePersonForm,
   formatPersonForApi,
   formatBurialForApi
} from '../utils/validation';
import QuickFamilyModal from './QuickFamilyModal';

// ============================================================
// QUICK-ADD SPOUSE INLINE FORM
// Creates a bare person (no family) for an unknown-family spouse
// ============================================================
function QuickSpouseInlineForm({ data, errors, loading, onChange, onSave, onCancel, advisories = [], searchResults = [], onSelectSuggestion, duplicateWarning = '', isSearching = false, burialSuggestions = [], showBurialSuggestions = false, onBurialPlaceChange, onSelectBurialSuggestion }) {
   return (
      <div style={qsStyles.wrapper}>
         <div style={qsStyles.header}>
            <span style={qsStyles.headerTitle}>
               <i className="fa-solid fa-user-plus" style={{ marginRight: '6px' }}></i>
               Add Spouse (Unknown Family)
            </span>
            <button type="button" onClick={onCancel} style={qsStyles.cancelX}>✕</button>
         </div>
         <p style={qsStyles.hint}>
            This creates a person record with no family assignment. Their details will appear in the tree popup.
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
                           {person.fatherName && (
                              <small style={{ color: '#555' }}>
                                 {' — '}{person.gender === 'female' ? 'D/O' : 'S/O'} {person.fatherName}
                              </small>
                           )}
                           <small style={{ color: '#888' }}> ({person.alive ? 'Living' : 'Deceased'})</small>
                           {person.familyName
                              ? <small style={qsStyles.familyTag}>{person.familyName}</small>
                              : <small style={qsStyles.unlinkedTag}>Unknown / No Family Linked</small>}
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

         {data.alive === false && (
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
                  <label style={qsStyles.label}>Google Maps Link</label>
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
         )}

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
               {loading ? 'Saving...' : 'Save Spouse'}
            </button>
         </div>
      </div>
   );
}

function buildInitialFormData(initialValues = {}) {
   return {
      name: '',
      gender: 'male',
      alive: true,
      dateOfBirth: '',
      dateOfDeath: '',
      placeOfBirth: '',
      placeOfDeath: '',
      about: '',
      fatherId: null,
      fatherName: '',
      motherId: null,
      motherName: '',
      motherFamilyId: null,
      motherFamilyName: null,
      isLawald: false,
      burialPlace: '',
      burialMapUrl: '',
      displayBadge: '',
      spouseId: null,
      spouseName: '',
      spouseFamilyId: null,
      spouseFamilyName: null,
      ...initialValues
   };
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
   hintText: {
      fontSize: '11px',
      color: '#6c757d',
      marginTop: '5px',
      display: 'block',
      lineHeight: '1.4'
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
   unlinkedTag: {
      fontSize: '11px',
      color: '#9a3412',
      background: '#ffedd5',
      border: '1px solid #fdba74',
      borderRadius: '3px',
      padding: '1px 6px',
      display: 'inline-block'
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
      background: 'white',
      border: '1px solid #ccc',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      zIndex: 200,
      maxHeight: '180px',
      overflowY: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
   },
   burialSuggestionItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 10px',
      cursor: 'pointer',
      fontSize: '12px',
      borderBottom: '1px solid #f3f4f6'
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

export default function AddPersonForm({
   familyId,
   allFamilies = [],
   existingPersonIds = [],
   onPersonAdded,
   onFamilyCreated,
   onCancel,
   initialValues = {},
   lockedSelections = {},
   duplicateNameCandidates = [],
   title = 'Add New Person'
}) {
   const [loading, setLoading] = useState(false);
   const [errors, setErrors] = useState({});
   const [successMessage, setSuccessMessage] = useState('');
   const [selectedExistingPerson, setSelectedExistingPerson] = useState(null);

   const [formData, setFormData] = useState(buildInitialFormData(initialValues));
   const nameFocusLock = useRef(false);
   const applyFormData = (updater) => {
      setFormData(prev => {
         const next = typeof updater === 'function' ? updater(prev) : updater;
         try {
            // if user is actively typing in the name input, avoid overwriting it
            if (nameFocusLock.current) {
               return { ...next, name: prev.name };
            }
         } catch (e) {
            // ignore
         }
         return next;
      });
   };

   const [searchResults, setSearchResults] = useState([]);
   const [showSearch, setShowSearch] = useState(false);
   const [activeSearchField, setActiveSearchField] = useState(null);
   const [searchQuery, setSearchQuery] = useState('');
   const [fatherSpouseOptions, setFatherSpouseOptions] = useState([]);
   const [addedSpouses, setAddedSpouses] = useState([]);
   const [searching, setSearching] = useState(false);
   const [showQuickFamilyModal, setShowQuickFamilyModal] = useState(false);
   const [quickFamilyTarget, setQuickFamilyTarget] = useState(null); // 'primary' or index for additional

   // Burial place autocomplete
   const [burialSuggestions, setBurialSuggestions] = useState([]);
   const [showBurialSuggestions, setShowBurialSuggestions] = useState(false);
   const [showCustomBadgeInput, setShowCustomBadgeInput] = useState(
      !!initialValues.displayBadge && !['Ahl-e-Bait', 'Sahaba', 'Shared Ancestor', 'Usmani', 'Abbasi', 'Qaadri'].includes(initialValues.displayBadge)
   );
   const burialDebounce = useRef(null);
   const burialRef = useRef(null);
   const nameSearchRef = useRef(null);
   const nameSearchTimeout = useRef(null);

   useEffect(() => {
      const handler = (e) => {
         if (burialRef.current && !burialRef.current.contains(e.target)) {
            setShowBurialSuggestions(false);
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, []);

   useEffect(() => {
      const handleClickOutsideNameSearch = (e) => {
         if (!showSearch || activeSearchField !== 'name') return;
         if (nameSearchRef.current && !nameSearchRef.current.contains(e.target)) {
            setShowSearch(false);
         }
      };

      document.addEventListener('mousedown', handleClickOutsideNameSearch);
      return () => {
         document.removeEventListener('mousedown', handleClickOutsideNameSearch);
         if (nameSearchTimeout.current) clearTimeout(nameSearchTimeout.current);
      };
   }, [showSearch, activeSearchField]);

   useEffect(() => {
      // Use applyFormData to avoid clobbering the `name` while user is actively typing.
      applyFormData(() => buildInitialFormData(initialValues));
      setSelectedExistingPerson(null);
      setFatherSpouseOptions([]);
      setAddedSpouses([]);
      setErrors({});
      setSuccessMessage('');
      setAutoSelectionNotices([]);
      setShowCustomBadgeInput(
         !!initialValues.displayBadge && !['Ahl-e-Bait', 'Sahaba', 'Shared Ancestor', 'Usmani', 'Abbasi', 'Qaadri'].includes(initialValues.displayBadge)
      );
   }, [initialValues]);

   const duplicateNameWarning = formData.name.trim()
      ? duplicateNameCandidates.find(candidate => candidate.trim().toLowerCase() === formData.name.trim().toLowerCase())
      : null;

   const handleBurialPlaceChange = (e) => {
      const value = e.target.value;
      handleInputChange(e);
      clearTimeout(burialDebounce.current);
      if (value.trim().length < 1) {
         setBurialSuggestions([]);
         setShowBurialSuggestions(false);
         return;
      }
      burialDebounce.current = setTimeout(async () => {
         try {
            const res = await fetch(`/api/admin/burial-info?q=${encodeURIComponent(value.trim())}`);
            const json = await res.json();
            setBurialSuggestions(json.data || []);
            setShowBurialSuggestions((json.data || []).length > 0);
         } catch { /* ignore */ }
      }, 300);
   };

   const handleSelectBurialSuggestion = (suggestion) => {
      setFormData(prev => ({
         ...prev,
         burialPlace: suggestion.place,
         burialMapUrl: suggestion.mapUrl || prev.burialMapUrl
      }));
      setBurialSuggestions([]);
      setShowBurialSuggestions(false);
   };

   // Quick-add spouse state: 'primary' | 'additional' | null
   const [quickSpouseTarget, setQuickSpouseTarget] = useState(null);
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
   const quickSpouseSearchTokenRef = useRef(0);
   const quickSpouseBurialDebounce = useRef(null);

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

   const getCurrentFamilyMeta = () => {
      if (!familyId) return null;
      const current = allFamilies.find(f => String(f.id) === String(familyId));
      return current ? { familyId: current.id, familyName: current.name } : { familyId, familyName: null };
   };



   const normalizeSpouseWithFamily = (person) => {
      return {
         id: person.id,
         name: person.name,
         familyId: person.familyId || null,
         familyName: person.familyName || null
      };
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
                  formData.spouseId,
                  ...addedSpouses.map(sp => sp.id)
               ].filter(Boolean));

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

      if (duplicateQuickSpouseMatch) {
         const proceed = window.confirm(
            `A person named "${duplicateQuickSpouseMatch.name}" already exists in the database.\n\nIf this is a different person with the same name, click OK to create a new record.\nIf it is the same person, click Cancel and select them from the suggestions list below.`
         );
         if (!proceed) return;
      }

      setQuickSpouseLoading(true);
      try {
         // Build about: prepend father name if provided
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
         // Do NOT add to any family — intentionally unassigned

         if (quickSpouseData.burialPlace?.trim() || quickSpouseData.burialMapUrl?.trim()) {
            await createBurialInfo(newSpouse.id, {
               burial_place: quickSpouseData.burialPlace?.trim() || null,
               burial_map_url: quickSpouseData.burialMapUrl?.trim() || null
            });
         }

         if (quickSpouseTarget === 'primary') {
            setFormData(prev => ({
               ...prev,
               spouseId: newSpouse.id,
               spouseName: newSpouse.name,
               spouseFamilyId: null,
               spouseFamilyName: null
            }));
         } else {
            setAddedSpouses(prev => [...prev, {
               id: newSpouse.id,
               name: newSpouse.name,
               familyId: null,
               familyName: null
            }]);
         }

         // Reset quick-add form
         setQuickSpouseTarget(null);
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
         quickSpouseSearchTokenRef.current += 1;
         setQuickSpouseSearchResults([]);
         setQuickSpouseSearching(false);
         setQuickSpouseAutoSelectionNotices([]);
         setQuickSpouseErrors({});
      } catch (err) {
         setQuickSpouseErrors({ name: err.message || 'Failed to create spouse' });
      } finally {
         setQuickSpouseLoading(false);
      }
   };

   const handleQuickSpouseSelectSuggestion = (selected) => {
      const nextSpouse = normalizeSpouseWithFamily(selected);

      if (quickSpouseTarget === 'primary') {
         setFormData(prev => ({
            ...prev,
            spouseId: nextSpouse.id,
            spouseName: nextSpouse.name,
            spouseFamilyId: nextSpouse.familyId,
            spouseFamilyName: nextSpouse.familyName
         }));
      } else {
         setAddedSpouses(prev => [...prev.filter(sp => sp.id !== nextSpouse.id), nextSpouse]);
      }

      setQuickSpouseTarget(null);
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
      quickSpouseSearchTokenRef.current += 1;
      setQuickSpouseSearchResults([]);
      setQuickSpouseSearching(false);
      setQuickSpouseAutoSelectionNotices([]);
      setQuickSpouseErrors({});
   };

   // HANDLERS
   const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      if (name === 'name' && selectedExistingPerson) {
         setSelectedExistingPerson(null);
      }
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
      if (errors[name]) {
         setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
         });
      }

      // Debounce name search to avoid flicker / frequent requests
      if (name === 'name') {
         if (nameSearchTimeout.current) clearTimeout(nameSearchTimeout.current);
         const nv = value || '';
         if (nv.trim().length < 1) {
            setSearchResults([]);
            setShowSearch(false);
            setSearching(false);
         } else {
            nameSearchTimeout.current = setTimeout(() => {
               handleSearch(nv, 'name');
            }, 300);
         }
      }
   };

   const handleSearch = async (query, field) => {
      setActiveSearchField(field);
      setSearchQuery(query);

      if (query.length < 1) {
         setSearchResults([]);
         setShowSearch(false);
         setSearching(false);
         return;
      }

      setSearching(true);
      setShowSearch(true);

      try {
         const results = await searchPersons(query);
         setSearchResults(results || []);
      } catch (error) {
         console.error('Search error:', error);
         setSearchResults([]);
      } finally {
         setSearching(false);
      }
   };

   const handleSelectPerson = async (person, field) => {
      if (field === 'name') {
         setSelectedExistingPerson(person);
         setFormData(prev => ({
            ...prev,
            name: person.name || '',
            gender: person.gender || prev.gender,
            alive: typeof person.alive === 'boolean' ? person.alive : prev.alive,
            dateOfBirth: person.dateOfBirth || '',
            dateOfDeath: person.dateOfDeath || ''
         }));
      } else if (field === 'additionalSpouse') {
         const normalizedSpouse = normalizeSpouseWithFamily(person);
         setAddedSpouses(prev => [...prev.filter(sp => sp.id !== normalizedSpouse.id), normalizedSpouse]);
      } else if (field === 'spouseId') {
         const normalizedSpouse = normalizeSpouseWithFamily(person);
         setFormData(prev => ({
            ...prev,
            spouseId: normalizedSpouse.id,
            spouseName: normalizedSpouse.name,
            spouseFamilyId: normalizedSpouse.familyId,
            spouseFamilyName: normalizedSpouse.familyName
         }));
      } else if (field === 'motherId') {
         setFormData(prev => ({
            ...prev,
            motherId: person.id,
            motherName: person.name,
            motherFamilyId: person.familyId || null,
            motherFamilyName: person.familyName || null
         }));
      } else {
         const nameField = field.replace('Id', 'Name');
         setFormData(prev => ({
            ...prev,
            [field]: person.id,
            [nameField]: person.name
         }));

         if (field === 'fatherId') {
            try {
               const details = await fetchPersonDetails(person.id);
               const spouseCandidates = Array.isArray(details?.spouses)
                  ? details.spouses
                     .filter(sp => sp?.id && sp.id !== person.id)
                     .map(sp => ({
                        id: sp.id,
                        name: sp.name || '',
                        gender: sp.gender || null,
                        familyId: sp.familyId || null,
                        familyName: sp.familyName || null
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

               if (uniqueSpouses.length === 1 && !lockedSelections.motherId) {
                  const spouse = uniqueSpouses[0];
                  setFormData(prev => ({
                     ...prev,
                     motherId: spouse.id,
                     motherName: spouse.name,
                     motherFamilyId: spouse.familyId,
                     motherFamilyName: spouse.familyName
                  }));
               }
            } catch {
               // Ignore auto-fill errors and keep manual mother selection available.
               setFatherSpouseOptions([]);
            }
         }
      }
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      setActiveSearchField(null);
   };

   const renderSearchResultItem = (person, onClick) => (
      <div key={person.id} onClick={onClick} style={styles.searchResult}>
         <strong>{person.name}</strong>
         {person.fatherName && <small style={styles.fatherText}> • Father: {person.fatherName}</small>}
         <small> ({person.gender}, {person.alive ? 'Living' : 'Deceased'})</small>
         {person.familyName
            ? <small style={styles.familyTag}>{person.familyName}</small>
            : <small style={styles.unlinkedTag}>Unknown / No Family Linked</small>}
      </div>
   );

   const handleClearSelection = (field) => {
      if (lockedSelections[field]) return;

      if (field === 'spouseId') {
         setFormData(prev => ({
            ...prev,
            spouseId: null,
            spouseName: '',
            spouseFamilyId: null,
            spouseFamilyName: null
         }));
      } else if (field === 'motherId') {
         setFormData(prev => ({
            ...prev,
            motherId: null,
            motherName: '',
            motherFamilyId: null,
            motherFamilyName: null
         }));
      } else if (field === 'fatherId') {
         setFatherSpouseOptions([]);
         setFormData(prev => ({
            ...prev,
            fatherId: null,
            fatherName: '',
            motherId: null,
            motherName: '',
            motherFamilyId: null,
            motherFamilyName: null
         }));
      } else {
         const nameField = field.replace('Id', 'Name');
         setFormData(prev => ({
            ...prev,
            [field]: null,
            [nameField]: ''
         }));
      }
   };

   const ensurePersonLinkedToFamily = async (personId, targetFamilyId) => {
      if (!personId || !targetFamilyId) return;

      const hasMembership = async () => {
         const detail = await fetchPersonDetails(personId);
         const families = Array.isArray(detail?.person?.families) ? detail.person.families : [];
         return families.some(f => String(f.id) === String(targetFamilyId));
      };

      // First read-after-write check.
      if (await hasMembership()) return;

      // Retry insert once if mapping is still missing.
      await addPersonToFamily(targetFamilyId, personId);

      // Final verification.
      if (!(await hasMembership())) {
         throw new Error('Family link was not persisted. Please try once more.');
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      // Prevent duplicate submissions
      if (loading) return;

      setLoading(true);
      setSuccessMessage('');
      setErrors({});

      try {
         if (selectedExistingPerson) {
            if (!familyId) {
               setErrors({ submit: 'Please select a family before linking an existing person.' });
               setLoading(false);
               return;
            }

            // Keep existing person linked to selected parent context (e.g., Add Child flow)
            // so they persist in tree after refresh.
            if (formData.fatherId || formData.motherId) {
               try {
                  await updatePerson(selectedExistingPerson.id, {
                     father_id: formData.fatherId || null,
                     mother_id: formData.motherId || null
                  });
               } catch (relErr) {
                  setErrors({ submit: 'Failed to link selected person to parent context: ' + relErr.message });
                  setLoading(false);
                  return;
               }
            }

            await addPersonToFamily(familyId, selectedExistingPerson.id);
            await ensurePersonLinkedToFamily(selectedExistingPerson.id, familyId);
            setSuccessMessage(`✅ Existing person "${selectedExistingPerson.name}" linked to this family successfully!`);

            await new Promise(resolve => setTimeout(resolve, 1500));

            setFormData({
               name: '',
               gender: 'male',
               alive: true,
               dateOfBirth: '',
               dateOfDeath: '',
               placeOfBirth: '',
               placeOfDeath: '',
               about: '',
               fatherId: null,
               fatherName: '',
               motherId: null,
               motherName: '',
               motherFamilyId: null,
               motherFamilyName: null,
               isLawald: false,
               burialPlace: '',
               burialMapUrl: '',
               displayBadge: '',
               spouseId: null,
               spouseName: '',
               spouseFamilyId: null,
               spouseFamilyName: null
            });
            setSelectedExistingPerson(null);
            setAddedSpouses([]);
            setErrors({});
            setSuccessMessage('');

            if (onPersonAdded) {
               onPersonAdded(selectedExistingPerson);
            }
            return;
         }

         const personValidation = validatePersonForm(formData);
         if (!personValidation.isValid) {
            setErrors(personValidation.errors);
            setLoading(false);
            return;
         }

         if (duplicateNameWarning && !window.confirm(`A child named "${duplicateNameWarning}" already exists in this branch. Create another record anyway?`)) {
            setLoading(false);
            return;
         }

         const personPayload = formatPersonForApi(formData);

         // Default badge to current family name when admin doesn't explicitly set one.
         if (!personPayload.display_badge && familyId) {
            const currentFamily = allFamilies.find(f => String(f.id) === String(familyId));
            if (currentFamily?.name) {
               personPayload.display_badge = currentFamily.name;
            }
         }

         const newPerson = await createPerson(personPayload);

         if (familyId) {
            try {
               await addPersonToFamily(familyId, newPerson.id);
               await ensurePersonLinkedToFamily(newPerson.id, familyId);
            } catch (addErr) {
               setErrors({ submit: 'Failed to add person to family: ' + addErr.message });
               setLoading(false);
               return;
            }
         }

         if (formData.burialPlace || formData.burialMapUrl) {
            const burialPayload = formatBurialForApi(formData);
            await createBurialInfo(newPerson.id, burialPayload);
         }

         const spousesToAdd = [];
         if (formData.spouseId) {
            spousesToAdd.push({ id: formData.spouseId, familyId: formData.spouseFamilyId });
         }
         for (const s of addedSpouses) {
            spousesToAdd.push({ id: s.id, familyId: s.familyId });
         }

         for (const spouse of spousesToAdd) {
            try {
               await createMarriage(newPerson.id, spouse.id);
               // Link spouse to their selected family (if they have one and aren't already linked)
               if (spouse.familyId) {
                  try { await addPersonToFamily(spouse.familyId, spouse.id); } catch { /* may already be linked */ }
               }
            } catch (err) {
               console.warn('Failed to create marriage with spouse', spouse.id, err);
            }
         }
         setSuccessMessage(`✅ Person "${formData.name}" created successfully!`);

         // Reset form after 2 seconds
         await new Promise(resolve => setTimeout(resolve, 2000));

         setFormData({
            name: '',
            gender: 'male',
            alive: true,
            dateOfBirth: '',
            dateOfDeath: '',
            placeOfBirth: '',
            placeOfDeath: '',
            about: '',
            fatherId: null,
            fatherName: '',
            motherId: null,
            motherName: '',
            motherFamilyId: null,
            motherFamilyName: null,
            isLawald: false,
            burialPlace: '',
            burialMapUrl: '',
            displayBadge: '',
            spouseId: null,
            spouseName: '',
            spouseFamilyId: null,
            spouseFamilyName: null
         });
         setAddedSpouses([]);
         setErrors({});
         setSuccessMessage('');

         if (onPersonAdded) {
            onPersonAdded(newPerson, {
               spouseIds: spousesToAdd.map(s => s.id).filter(Boolean),
               fatherId: formData.fatherId || null,
               motherId: formData.motherId || null
            });
         }
      } catch (error) {
         console.error('Error creating person:', error);
         setErrors({ submit: error.message || 'Failed to create person' });
      } finally {
         setLoading(false);
      }
   };

   // RENDER
   return (
      <div style={styles.container}>
         <h2 style={styles.title}>{title}</h2>

         {successMessage && <div style={styles.successMessage}>{successMessage}</div>}
         {errors.submit && <div style={styles.errorBox}>{errors.submit}</div>}

         <form onSubmit={handleSubmit}>
            {/* BASIC INFORMATION */}
            <fieldset style={styles.fieldset}>
               <legend style={styles.legend}>📋 Basic Information</legend>

               <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  {selectedExistingPerson ? (
                     <div style={styles.selectedExistingCard}>
                        <span>
                           Existing record selected: <strong>{selectedExistingPerson.name}</strong>
                        </span>
                        <button
                           type="button"
                           onClick={() => {
                              setSelectedExistingPerson(null);
                              setFormData(prev => ({ ...prev, name: '' }));
                           }}
                           style={styles.clearBtn}
                        >
                           ✕
                        </button>
                     </div>
                  ) : (
                     <div style={styles.searchContainer} ref={nameSearchRef}>
                        <input
                           type="text"
                           name="name"
                           value={formData.name}
                           onChange={handleInputChange}
                           onFocus={(e) => {
                              nameFocusLock.current = true;
                              if (formData.name.trim().length >= 2) {
                                 handleSearch(formData.name, 'name');
                              }
                           }}
                           onBlur={() => { nameFocusLock.current = false; }}
                           placeholder="Type full name"
                           style={errors.name ? styles.inputError : styles.input}
                        />
                        {showSearch && activeSearchField === 'name' && (
                           <div style={styles.searchResults}>
                              {searching ? (
                                 <div style={styles.searchMessage}>Searching...</div>
                              ) : searchResults.length > 0 ? (
                                 searchResults.map(person => renderSearchResultItem(person, () => handleSelectPerson(person, 'name')))
                              ) : searchQuery.length > 1 ? (
                                 <div style={styles.searchMessage}>No existing person found</div>
                              ) : null}
                           </div>
                        )}
                     </div>
                  )}
                  <small style={styles.existingHint}>
                     Tip: select an existing person from suggestions to link them to this family instead of creating a duplicate.
                  </small>
                  {duplicateNameWarning && <span style={styles.warningText}>Warning: a child with this same name already exists in the selected branch.</span>}
                  {errors.name && <span style={styles.errorText}>{errors.name}</span>}
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

               <div style={styles.twoColumns}>
                  <div style={styles.formGroup}>
                     <label style={styles.label}>Gender *</label>
                     <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        style={styles.input}
                     >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                     </select>
                     {errors.gender && <span style={styles.errorText}>{errors.gender}</span>}
                  </div>

                  <div style={styles.formGroup}>
                     <label style={styles.label}>Status *</label>
                     <div style={styles.radioGroup}>
                        <label style={styles.radioLabel}>
                           <input
                              type="radio"
                              name="alive"
                              value="true"
                              checked={formData.alive === true}
                              onChange={handleInputChange}
                           />
                           {' '}Living
                        </label>
                        <label style={styles.radioLabel}>
                           <input
                              type="radio"
                              name="alive"
                              value="false"
                              checked={formData.alive === false}
                              onChange={handleInputChange}
                           />
                           {' '}Deceased
                        </label>
                     </div>
                     {errors.alive && <span style={styles.errorText}>{errors.alive}</span>}
                  </div>
               </div>

               <div style={styles.twoColumns}>
                  <div style={styles.formGroup}>
                     <label style={styles.label}>Date of Birth</label>
                     <input
                        type="text"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        placeholder="e.g., 600 CE / 3 AH / 04/03/625"
                        style={styles.input}
                     />
                  </div>

                  <div style={styles.formGroup}>
                     <label style={styles.label}>Place of Birth</label>
                     <input
                        type="text"
                        name="placeOfBirth"
                        value={formData.placeOfBirth}
                        onChange={handleInputChange}
                        placeholder="City, Region, Country"
                        style={styles.input}
                     />
                  </div>
               </div>

               {!formData.alive && (
                  <>
                     <div style={styles.twoColumns}>
                        <div style={styles.formGroup}>
                           <label style={styles.label}>Date of Death</label>
                           <input
                              type="text"
                              name="dateOfDeath"
                              value={formData.dateOfDeath}
                              onChange={handleInputChange}
                              placeholder="e.g., 28/01/661 CE / 40 AH"
                              style={errors.dateOfDeath ? styles.inputError : styles.input}
                           />
                           {errors.dateOfDeath && <span style={styles.errorText}>{errors.dateOfDeath}</span>}
                        </div>

                        <div style={styles.formGroup} ref={burialRef}>
                           <label style={styles.label}>Burial Place</label>
                           <div style={{ position: 'relative' }}>
                              <input
                                 type="text"
                                 name="burialPlace"
                                 value={formData.burialPlace}
                                 onChange={handleBurialPlaceChange}
                                 onFocus={() => burialSuggestions.length > 0 && setShowBurialSuggestions(true)}
                                 placeholder="Cemetery or burial location"
                                 style={styles.input}
                                 autoComplete="off"
                              />
                              {showBurialSuggestions && (
                                 <div style={styles.burialDropdown}>
                                    {burialSuggestions.map((s, i) => (
                                       <div
                                          key={i}
                                          style={styles.burialSuggestionItem}
                                          onMouseDown={() => handleSelectBurialSuggestion(s)}
                                       >
                                          <span style={{ fontWeight: 500 }}>{s.place}</span>
                                          {s.mapUrl && (
                                             <span style={styles.burialMapBadge}>📍 has map</span>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     <div style={styles.formGroup}>
                        <label style={styles.label}>Google Maps Link</label>
                        <input
                           type="url"
                           name="burialMapUrl"
                           value={formData.burialMapUrl}
                           onChange={handleInputChange}
                           placeholder="https://maps.app.goo.gl/..."
                           style={errors.burialMapUrl ? styles.inputError : styles.input}
                        />
                        {errors.burialMapUrl && <span style={styles.errorText}>{errors.burialMapUrl}</span>}
                     </div>
                  </>
               )}

               <div style={styles.formGroup}>
                  <label style={styles.label}>About / Biography</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                     <textarea
                        name="about"
                        value={formData.about}
                        onChange={handleInputChange}
                        placeholder="Short biography or notes about this person"
                        rows="3"
                        style={styles.textarea}
                     />
                  </div>
               </div>

               <div style={styles.formGroup}>
                  <label style={{ ...styles.checkboxLabel, color: '#b91c1c' }}>
                     <input
                        type="checkbox"
                        name="isLawald"
                        checked={Boolean(formData.isLawald)}
                        onChange={handleInputChange}
                        style={{ marginRight: '8px' }}
                     />
                     Mark as confirmed no children (red name + cross in tree)
                  </label>
               </div>
            </fieldset>

            {/* FAMILY LINKS */}
            <fieldset style={styles.fieldset}>
               <legend style={styles.legend}>👨‍👩‍👧‍👦 Family Links (Optional)</legend>

               <div style={styles.twoColumns}>
                  <div style={styles.formGroup}>
                     <label style={styles.label}>Father</label>
                     {formData.fatherId ? (
                        <div style={styles.selectedItem}>
                           <span>{formData.fatherName}</span>
                           {!lockedSelections.fatherId && (
                              <button
                                 type="button"
                                 onClick={() => handleClearSelection('fatherId')}
                                 style={styles.clearBtn}
                              >
                                 ✕
                              </button>
                           )}
                        </div>
                     ) : (
                        <div style={styles.searchContainer}>
                           <input
                              type="text"
                              placeholder="Search for father..."
                              onChange={(e) => handleSearch(e.target.value, 'fatherId')}
                              onFocus={() => setShowSearch(true)}
                              style={styles.input}
                           />
                           {showSearch && activeSearchField === 'fatherId' && (
                              <div style={styles.searchResults}>
                                 {searching ? (
                                    <div style={styles.searchMessage}>Searching...</div>
                                 ) : searchResults.length > 0 ? (
                                    searchResults.map(person => renderSearchResultItem(person, () => handleSelectPerson(person, 'fatherId')))
                                 ) : searchQuery.length > 0 ? (
                                    <div style={styles.searchMessage}>No results found</div>
                                 ) : null}
                              </div>
                           )}
                        </div>
                     )}
                  </div>

                  <div style={styles.formGroup}>
                     <label style={styles.label}>Mother</label>
                     {formData.motherId ? (
                        <div style={styles.selectedItem}>
                           <span>{formData.motherName}</span>
                           {!lockedSelections.motherId && (
                              <button
                                 type="button"
                                 onClick={() => handleClearSelection('motherId')}
                                 style={styles.clearBtn}
                              >
                                 ✕
                              </button>
                           )}
                        </div>
                     ) : (
                        <div style={styles.searchContainer}>
                           <input
                              type="text"
                              placeholder="Search for mother..."
                              onChange={(e) => handleSearch(e.target.value, 'motherId')}
                              onFocus={() => setShowSearch(true)}
                              style={styles.input}
                           />
                           {showSearch && activeSearchField === 'motherId' && (
                              <div style={styles.searchResults}>
                                 {searching ? (
                                    <div style={styles.searchMessage}>Searching...</div>
                                 ) : searchResults.length > 0 ? (
                                    searchResults.map(person => renderSearchResultItem(person, () => handleSelectPerson(person, 'motherId')))
                                 ) : searchQuery.length > 0 ? (
                                    <div style={styles.searchMessage}>No results found</div>
                                 ) : null}
                              </div>
                           )}
                        </div>
                     )}
                     {formData.fatherId && fatherSpouseOptions.length > 1 && !formData.motherId && (
                        <div style={styles.motherSuggestionBox}>
                           <small style={styles.hintText}>Multiple spouses found for selected father. Optionally choose one:</small>
                           <div style={styles.motherSuggestionList}>
                              {fatherSpouseOptions.map(option => (
                                 <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                       setFormData(prev => ({
                                          ...prev,
                                          motherId: option.id,
                                          motherName: option.name,
                                          motherFamilyId: option.familyId || null,
                                          motherFamilyName: option.familyName || null
                                       }));
                                    }}
                                    style={styles.motherSuggestionChip}
                                 >
                                    {option.name}
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               <div style={styles.formGroup}>
                  <label style={styles.label}>Primary Spouse</label>
                  {formData.spouseId ? (
                     <div>
                        <div style={styles.selectedItem}>
                           <span>{formData.spouseName}</span>
                           {!lockedSelections.spouseId && (
                              <button
                                 type="button"
                                 onClick={() => handleClearSelection('spouseId')}
                                 style={styles.clearBtn}
                              >
                                 ✕
                              </button>
                           )}
                        </div>
                        {/* Family selector for primary spouse */}
                        <div style={styles.familySelectorRow}>
                           <label style={styles.familySelectorLabel}>Family:</label>
                           <select
                              value={formData.spouseFamilyId || ''}
                              onChange={(e) => {
                                 const selected = allFamilies.find(f => f.id === e.target.value);
                                 setFormData(prev => ({
                                    ...prev,
                                    spouseFamilyId: e.target.value || null,
                                    spouseFamilyName: selected?.name || null
                                 }));
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
                              onClick={() => { setQuickFamilyTarget('primary'); setShowQuickFamilyModal(true); }}
                              style={styles.newFamilyBtn}
                              title="Create new family"
                           >
                              <i className="fa-solid fa-plus"></i> New
                           </button>
                        </div>
                     </div>
                  ) : quickSpouseTarget === 'primary' ? (
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
                        searchResults={quickSpouseSearchResults}
                        onSelectSuggestion={handleQuickSpouseSelectSuggestion}
                        duplicateWarning={duplicateQuickSpouseMatch ? 'Matching existing spouse found below. Select it to avoid creating a duplicate record.' : ''}
                        isSearching={quickSpouseSearching}
                        onCancel={() => {
                           setQuickSpouseTarget(null);
                           setQuickSpouseErrors({});
                           setQuickSpouseBurialSuggestions([]);
                           setShowQuickSpouseBurialSuggestions(false);
                           quickSpouseSearchTokenRef.current += 1;
                           setQuickSpouseSearchResults([]);
                           setQuickSpouseSearching(false);
                        }}

                     />
                  ) : (
                     <div>
                        <div style={styles.searchContainer}>
                           <input
                              type="text"
                              placeholder="Search for spouse..."
                              onChange={(e) => handleSearch(e.target.value, 'spouseId')}
                              onFocus={() => setShowSearch(true)}
                              style={styles.input}
                           />
                           {showSearch && (activeSearchField === 'spouseId' || activeSearchField === 'additionalSpouse') && (
                              <div style={styles.searchResults}>
                                 {searching ? (
                                    <div style={styles.searchMessage}>Searching...</div>
                                 ) : searchResults.length > 0 ? (
                                    searchResults.map(person => renderSearchResultItem(person, () => handleSelectPerson(person, activeSearchField)))
                                 ) : searchQuery.length > 0 ? (
                                    <div style={styles.searchMessage}>No results found</div>
                                 ) : null}
                              </div>
                           )}
                        </div>
                        <button
                           type="button"
                           onClick={() => {
                              setQuickSpouseTarget('primary');
                              setShowSearch(false);
                              setSearchResults([]);
                              setSearchQuery('');
                           }}
                           style={styles.unknownSpouseBtn}
                           title="Spouse from unknown family — enter basic details only"
                        >
                           <i className="fa-solid fa-user-plus"></i> Unknown Primary Spouse
                        </button>
                     </div>
                  )}
               </div>

               {/* ADDITIONAL SPOUSES */}
               {addedSpouses.length > 0 && (
                  <div style={styles.formGroup}>
                     <label style={styles.label}>Additional Spouses</label>
                     <div style={styles.addedSpousesList}>
                        {addedSpouses.map((spouse, idx) => {
                           const spouseName = typeof spouse === 'object' ? spouse.name : spouse;
                           return (
                              <div key={idx}>
                                 <div style={styles.addedSpouseItem}>
                                    <span>{spouseName}</span>
                                    <button
                                       type="button"
                                       onClick={() => setAddedSpouses(addedSpouses.filter((_, i) => i !== idx))}
                                       style={styles.removeBtn}
                                    >
                                       ✕ Remove
                                    </button>
                                 </div>
                                 <div style={styles.familySelectorRow}>
                                    <label style={styles.familySelectorLabel}>Family:</label>
                                    <select
                                       value={spouse.familyId || ''}
                                       onChange={(e) => {
                                          const selected = allFamilies.find(f => f.id === e.target.value);
                                          setAddedSpouses(prev => prev.map((s, i) => i === idx ? {
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
                                       onClick={() => { setQuickFamilyTarget(idx); setShowQuickFamilyModal(true); }}
                                       style={styles.newFamilyBtn}
                                       title="Create new family"
                                    >
                                       <i className="fa-solid fa-plus"></i> New
                                    </button>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               )}

               {/* ADD MORE SPOUSE BUTTON */}
               <div style={styles.formGroup}>
                  {quickSpouseTarget === 'additional' ? (
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
                        searchResults={quickSpouseSearchResults}
                        onSelectSuggestion={handleQuickSpouseSelectSuggestion}
                        duplicateWarning={duplicateQuickSpouseMatch ? 'Matching existing spouse found below. Select it to avoid creating a duplicate record.' : ''}
                        isSearching={quickSpouseSearching}
                        onCancel={() => {
                           setQuickSpouseTarget(null);
                           setQuickSpouseErrors({});
                           setQuickSpouseBurialSuggestions([]);
                           setShowQuickSpouseBurialSuggestions(false);
                           quickSpouseSearchTokenRef.current += 1;
                           setQuickSpouseSearchResults([]);
                           setQuickSpouseSearching(false);
                        }}

                     />
                  ) : activeSearchField !== 'additionalSpouse' ? (
                     <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                           type="button"
                           onClick={() => {
                              setActiveSearchField('additionalSpouse');
                              setShowSearch(true);
                           }}
                           style={styles.addSpouseBtn}
                        >
                           + Add Additional Spouse
                        </button>
                        <button
                           type="button"
                           onClick={() => {
                              setQuickSpouseTarget('additional');
                              setActiveSearchField(null);
                              setShowSearch(false);
                              setSearchResults([]);
                              setSearchQuery('');
                           }}
                           style={styles.unknownSpouseBtn}
                           title="Spouse from unknown family — enter basic details only"
                        >
                           <i className="fa-solid fa-user-plus"></i> Unknown Additional Spouse
                        </button>
                     </div>
                  ) : (
                     <div style={{ ...styles.searchContainer, marginTop: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                           <input
                              type="text"
                              placeholder="Search for additional spouse..."
                              onChange={(e) => handleSearch(e.target.value, 'additionalSpouse')}
                              autoFocus
                              style={{ ...styles.input, flex: 1 }}
                           />
                           <button
                              type="button"
                              onClick={() => {
                                 setActiveSearchField(null);
                                 setShowSearch(false);
                                 setSearchResults([]);
                                 setSearchQuery('');
                              }}
                              style={{ ...styles.cancelBtn, padding: '8px 12px', fontSize: '12px' }}
                           >
                              Cancel
                           </button>
                        </div>
                        {showSearch && (
                           <div style={styles.searchResults}>
                              {searching ? (
                                 <div style={styles.searchMessage}>Searching...</div>
                              ) : searchResults.length > 0 ? (
                                 searchResults.map(person => renderSearchResultItem(person, () => handleSelectPerson(person, 'additionalSpouse')))
                              ) : searchQuery.length > 0 ? (
                                 <div style={styles.searchMessage}>No results found</div>
                              ) : null}
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </fieldset>

            {/* CUSTOM BADGE */}
            <fieldset style={styles.fieldset}>
               <legend style={styles.legend}>🏷️ Custom Badge (Optional)</legend>
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
                                 handleInputChange({ target: { name: 'displayBadge', value: isSelected ? '' : opt } });
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
                              handleInputChange({ target: { name: 'displayBadge', value: '' } });
                           } else {
                              setShowCustomBadgeInput(true);
                              handleInputChange({ target: { name: 'displayBadge', value: '' } });
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
                        onChange={handleInputChange}
                        placeholder="Type badge name..."
                        style={styles.input}
                        autoFocus
                     />
                  )}
                  <small style={styles.hintText}>
                     When set, this badge replaces the family name in search results everywhere.
                     Leave blank to show the family name badge normally.
                  </small>
               </div>
            </fieldset>

            {/* BUTTONS */}
            <div style={styles.buttonGroup}>
               <button
                  type="button"
                  onClick={onCancel}
                  style={styles.cancelBtn}
                  disabled={loading}
               >
                  Cancel
               </button>
               <button
                  type="submit"
                  style={styles.submitBtn}
                  disabled={loading}
               >
                  {loading ? '⏳ Creating...' : '✓ Create Person'}
               </button>
            </div>
         </form>

         {/* QUICK FAMILY MODAL */}
         {showQuickFamilyModal && (
            <QuickFamilyModal
               onFamilyCreated={(newFamily) => {
                  if (quickFamilyTarget === 'primary') {
                     setFormData(prev => ({
                        ...prev,
                        spouseFamilyId: newFamily.id,
                        spouseFamilyName: newFamily.name
                     }));
                  } else if (typeof quickFamilyTarget === 'number') {
                     setAddedSpouses(prev => prev.map((s, i) => i === quickFamilyTarget ? {
                        ...s,
                        familyId: newFamily.id,
                        familyName: newFamily.name
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

// STYLES
const styles = {
   container: {
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '24px'
   },
   title: {
      marginTop: 0,
      marginBottom: '20px',
      fontSize: '20px',
      fontWeight: '600',
      color: '#333'
   },
   fieldset: {
      border: '1px solid #ddd',
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '20px',
      backgroundColor: '#fff'
   },
   legend: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#333',
      padding: '0 8px',
      marginBottom: '12px'
   },
   formGroup: {
      marginBottom: '15px',
      display: 'flex',
      flexDirection: 'column'
   },
   twoColumns: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
   },
   label: {
      fontSize: '13px',
      fontWeight: '500',
      marginBottom: '6px',
      color: '#333'
   },
   input: {
      width: '100%',
      padding: '9px 12px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '13px',
      fontFamily: 'inherit',
      boxSizing: 'border-box'
   },
   inputError: {
      width: '100%',
      padding: '9px 12px',
      border: '2px solid #dc3545',
      borderRadius: '4px',
      fontSize: '13px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      backgroundColor: '#fff5f5'
   },
   textarea: {
      width: '100%',
      padding: '9px 12px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '13px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      resize: 'vertical',
      minHeight: '80px'
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
   checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500'
   },
   errorText: {
      fontSize: '12px',
      color: '#dc3545',
      marginTop: '4px'
   },
   warningText: {
      fontSize: '12px',
      color: '#b45309',
      marginTop: '4px'
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
   errorBox: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '12px 15px',
      borderRadius: '4px',
      marginBottom: '15px',
      border: '1px solid #f5c6cb',
      fontSize: '13px'
   },
   successMessage: {
      backgroundColor: '#d4edda',
      color: '#155724',
      padding: '12px 15px',
      borderRadius: '4px',
      marginBottom: '15px',
      border: '1px solid #c3e6cb',
      fontSize: '13px'
   },
   selectedItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '9px 12px',
      backgroundColor: '#e8f4f8',
      border: '1px solid #b3d9e8',
      borderRadius: '4px',
      fontSize: '13px'
   },
   selectedExistingCard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      padding: '9px 12px',
      backgroundColor: '#eef7ee',
      border: '1px solid #b8ddb8',
      borderRadius: '4px',
      fontSize: '13px'
   },
   existingHint: {
      marginTop: '6px',
      fontSize: '11px',
      color: '#4d6b4d'
   },
   clearBtn: {
      background: 'none',
      border: 'none',
      color: '#dc3545',
      fontSize: '16px',
      cursor: 'pointer',
      padding: '0 4px'
   },
   addedSpousesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
   },
   addedSpouseItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 10px',
      backgroundColor: '#e8f8f3',
      border: '1px solid #a8d8d8',
      borderRadius: '4px',
      fontSize: '12px'
   },
   removeBtn: {
      background: 'none',
      border: 'none',
      color: '#dc3545',
      fontSize: '12px',
      cursor: 'pointer',
      padding: '0 4px',
      textDecoration: 'none'
   },
   addSpouseBtn: {
      backgroundColor: '#17a2b8',
      color: 'white',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '8px',
      transition: 'background-color 0.2s'
   },
   searchContainer: {
      position: 'relative'
   },
   searchResults: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      maxHeight: '150px',
      overflowY: 'auto',
      zIndex: 10,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
   },
   searchMessage: {
      padding: '10px 12px',
      fontSize: '12px',
      color: '#888',
      textAlign: 'center'
   },
   searchResult: {
      padding: '10px 12px',
      borderBottom: '1px solid #eee',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'backgroundColor 0.15s'
   },
   fatherText: {
      display: 'inline-block',
      marginLeft: '6px',
      color: '#555'
   },
   motherSuggestionBox: {
      marginTop: '8px',
      padding: '8px 10px',
      border: '1px solid #dbeafe',
      backgroundColor: '#f8fbff',
      borderRadius: '6px'
   },
   motherSuggestionList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      marginTop: '6px'
   },
   motherSuggestionChip: {
      border: '1px solid #bfdbfe',
      backgroundColor: '#eff6ff',
      color: '#1d4ed8',
      borderRadius: '999px',
      padding: '3px 10px',
      fontSize: '12px',
      cursor: 'pointer'
   },
   buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: '1px solid #ddd'
   },
   submitBtn: {
      backgroundColor: '#28a745',
      color: 'white',
      padding: '10px 24px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
   },
   cancelBtn: {
      backgroundColor: '#6c757d',
      color: 'white',
      padding: '10px 24px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
   },
   familySelectorRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '6px',
      padding: '6px 0'
   },
   burialDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      border: '1px solid #ccc',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      zIndex: 200,
      maxHeight: '180px',
      overflowY: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
   },
   burialSuggestionItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 10px',
      cursor: 'pointer',
      fontSize: '13px',
      borderBottom: '1px solid #f3f4f6',
      transition: 'background 0.15s'
   },
   burialMapBadge: {
      fontSize: '11px',
      color: '#2563eb',
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '3px',
      padding: '1px 5px',
      flexShrink: 0
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
   },
   unlinkedTag: {
      display: 'inline-block',
      marginLeft: '6px',
      padding: '1px 6px',
      backgroundColor: '#ffedd5',
      border: '1px solid #fdba74',
      borderRadius: '3px',
      fontSize: '10px',
      color: '#9a3412'
   },
   unknownSpouseBtn: {
      backgroundColor: '#6c757d',
      color: 'white',
      padding: '8px 14px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '6px'
   }
};
