'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TipTapEditor from '@/components/TipTapEditor';
import './add.css';

// layout:
//   'bilingual' — English col + Urdu col + AI translate button
//   'shared'    — single col, value synced to both languages (dates, nasab)
//   'about'     — two full-width editors (English + Urdu), NO AI
const FIELDS = [
   { key: 'name', label: 'Name', type: 'text', required: true, layout: 'bilingual' },
   { key: 'father', label: 'Father Name', type: 'text', layout: 'bilingual' },
   { key: 'mother', label: 'Mother Name', type: 'text', layout: 'bilingual' },
   { key: 'birthPlace', label: 'Birth Place', type: 'text', layout: 'bilingual' },
   { key: 'buriedPlace', label: 'Buried Place', type: 'text', layout: 'bilingual' },
   { key: 'born', label: 'Date of Birth', type: 'text', layout: 'shared' },
   { key: 'died', label: 'Date of Death', type: 'text', layout: 'shared' },
   { key: 'nasbaNama', label: 'Nasab Nama', type: 'textarea', layout: 'bilingual', placeholder: 'Paternal lineage — auto-filled when you select a person' },
   { key: 'about', label: 'About', type: 'rich-text', required: true, layout: 'about' },
];

// Single input → syncs value to both english & urdu
const SHARED_KEYS = new Set(['born', 'died']);

const emptyLang = () => FIELDS.reduce((acc, f) => { acc[f.key] = ''; return acc; }, {});
const emptyForm = () => ({ urdu: emptyLang(), english: emptyLang() });

export default function AddBiography() {
   const router = useRouter();
   const { isAdmin, loading: authLoading } = useAuth();
   const [formData, setFormData] = useState(emptyForm());
   const [selectedPersonDbId, setSelectedPersonDbId] = useState(null); // persons.id UUID
   // Track which person is selected (for display)
   const [selectedPersonName, setSelectedPersonName] = useState('');
   const [errors, setErrors] = useState({});
   const [loading, setLoading] = useState(false);
   const [preview, setPreview] = useState(false);

   // Search state
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState([]);
   const [searchLoading, setSearchLoading] = useState(false);
   const [lineageLoading, setLineageLoading] = useState(false);
   const [showDropdown, setShowDropdown] = useState(false);
   const [translating, setTranslating] = useState({});   // { fieldKey: true } while AI translating
   const searchDebounceRef = useRef(null);
   const searchBoxRef = useRef(null);

   // Authentication check
   useEffect(() => {
      if (authLoading) return;
      if (!isAdmin) router.push('/admin/login');
   }, [isAdmin, authLoading, router]);

   // Close dropdown on outside click
   useEffect(() => {
      const handler = (e) => {
         if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
            setShowDropdown(false);
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, []);

   // Debounced person search
   const handleSearchChange = (value) => {
      setSearchQuery(value);
      setShowDropdown(true);
      clearTimeout(searchDebounceRef.current);
      if (!value.trim()) {
         setSearchResults([]);
         setShowDropdown(false);
         return;
      }
      searchDebounceRef.current = setTimeout(async () => {
         setSearchLoading(true);
         try {
            const res = await fetch(`/api/family-tree/search?q=${encodeURIComponent(value)}&limit=10`);
            if (res.ok) {
               const json = await res.json();
               setSearchResults(json.data || []);
               setShowDropdown(true);
            }
         } catch { /* silent */ }
         setSearchLoading(false);
      }, 300);
   };

   // Walk up father_id chain — now a single server-side API call instead of N browser→server round-trips
   const buildLineage = useCallback(async (startPersonId, personName) => {
      try {
         const res = await fetch(`/api/family-tree/ancestry/${encodeURIComponent(startPersonId)}`);
         if (!res.ok) return '';
         const { chain } = await res.json();
         // startPersonId is p.fatherId, so chain[0] = father, chain[1] = grandfather, …
         // prepend the selected person's own name before the chain
         const names = chain.map(c => c.name).filter(Boolean);
         return [personName, ...names].join(' ← ');
      } catch {
         return '';
      }
   }, []);

   // When a person is selected from search results
   const handlePersonSelect = useCallback(async (person) => {
      setSearchQuery(person.name || '');
      setSearchResults([]);
      setShowDropdown(false);
      setLineageLoading(true);
      try {
         const res = await fetch(`/api/family-tree/person/${encodeURIComponent(person.id)}`);
         const data = res.ok ? await res.json() : {};
         const p = data.person || {};
         const parents = data.parents || [];

         const fatherPerson = parents.find(par => par.id === p.fatherId);
         const motherPerson = parents.find(par => par.id === p.motherId);
         const fatherName = fatherPerson?.name || '';
         // motherName: prefer linked record, fall back to mother_name text column
         const motherName = motherPerson?.name || p.motherName || '';
         const personName = p.name || person.name || '';

         let nasbaNama = '';
         if (p.fatherId) {
            nasbaNama = await buildLineage(p.fatherId, personName);
         } else if (fatherName) {
            nasbaNama = `${personName} ← ${fatherName}`;
         }

         setSelectedPersonDbId(p.id || person.id);
         setSelectedPersonName(personName);
         // Auto-populate both English and Urdu with the same base data.
         // Shared fields (dates, places) are identical; name/father/mother/about the user fills in Urdu manually.
         const shared = {
            born: p.dateOfBirth || '',
            died: p.dateOfDeath || '',
            birthPlace: p.placeOfBirth || '',
            buriedPlace: data.burial?.place || '',
            nasbaNama,
         };
         setFormData({
            english: { ...emptyLang(), name: personName, father: fatherName, mother: motherName, ...shared },
            urdu: { ...emptyLang(), name: personName, father: fatherName, mother: motherName, ...shared },
         });
         setErrors({});
      } catch (e) {
         console.error('Failed to load person details', e);
      } finally {
         setLineageLoading(false);
      }
   }, [buildLineage]);

   // Islamic honorific abbreviations.
   // Strategy: strip the honorific from the ENGLISH text before sending to MyMemory
   // (so the API never sees or reorders it), then append the Urdu Unicode character
   // DIRECTLY — no space — so it attaches to the last letter as a combining superscript.
   //   ﷺ U+FDFA — ARABIC LIGATURE SALLALLAHOU ALAYHE WASALLAM
   //   ؓ U+0613 — ARABIC SIGN RADI ALLAHOU ANHU   (R.Z)
   //   ؒ U+0612 — ARABIC SIGN RAHMATOU ALLAHOU ALAIYH (R.H)
   const HONORIFICS = [
      { pattern: /S\.A\.W\.?/gi, urdu: '\uFDFA' },
      { pattern: /R\.Z\.?/gi, urdu: '\u0613' },
      { pattern: /R\.H\.?/gi, urdu: '\u0612' },
   ];

   // Extract trailing honorific from an English name.
   // "Syed Ali R.H" → { clean: "Syed Ali", honorificUrdu: "ؒ" }
   const extractHonorific = (text) => {
      const trimmed = text.trim();
      for (const h of HONORIFICS) {
         const m = trimmed.match(new RegExp(`^(.+?)\\s+(${h.pattern.source})\\s*$`, 'i'));
         if (m && m[1].trim()) return { clean: m[1].trim(), honorificUrdu: h.urdu };
      }
      return { clean: trimmed, honorificUrdu: '' };
   };

   // Single translation call: strips honorific → translates clean name → reattaches with NO space
   const callTranslate = async (text) => {
      if (!text.trim()) return text;
      const { clean, honorificUrdu } = extractHonorific(text.trim());
      const res = await fetch('/api/translate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ text: clean, sourceLang: 'en', targetLang: 'ur' }),
      });
      if (!res.ok) return text;
      const data = await res.json();
      if (!data.translatedText) return text;
      // No space before honorific — combining mark must touch the last letter
      return data.translatedText.trimEnd() + honorificUrdu;
   };

   // AI translate: English → Urdu (bilingual fields only; About excluded)
   const translateField = async (fieldKey) => {
      const text = formData.english[fieldKey];
      if (!text?.trim()) return;
      setTranslating(prev => ({ ...prev, [fieldKey]: true }));
      try {
         let translated;
         if (fieldKey === 'nasbaNama') {
            // Lineage: split on ← (English), translate each name individually
            // (avoids MyMemory's ~500-char limit & ← confusing the API),
            // then join with بن (Arabic/Urdu for "son of") for the Urdu output.
            const parts = text.split(' ← ');
            const translatedParts = await Promise.all(parts.map(p => callTranslate(p.trim())));
            translated = translatedParts.join(' بن ');
         } else {
            translated = await callTranslate(text);
         }
         setFormData(prev => ({ ...prev, urdu: { ...prev.urdu, [fieldKey]: translated } }));
      } catch { /* silent — leave Urdu field unchanged */ }
      setTranslating(prev => ({ ...prev, [fieldKey]: false }));
   };

   const handleFieldChange = (lang, fieldKey, value) => {
      if (SHARED_KEYS.has(fieldKey)) {
         // Sync shared fields (dates/places) to both languages
         setFormData(prev => ({
            ...prev,
            urdu: { ...prev.urdu, [fieldKey]: value },
            english: { ...prev.english, [fieldKey]: value },
         }));
      } else {
         setFormData(prev => ({ ...prev, [lang]: { ...prev[lang], [fieldKey]: value } }));
      }
      const errKey = `${lang}_${fieldKey}`;
      if (errors[errKey]) setErrors(prev => { const e = { ...prev }; delete e[errKey]; return e; });
   };

   // Checks in visual order (English section is above Urdu) so scroll targets the topmost error
   const validateForm = () => {
      const errs = {};
      if (!formData.english.name.trim()) errs.english_name = 'English name is required';
      if (!formData.urdu.name.trim()) errs.urdu_name = 'Urdu name is required';
      const engAbout = formData.english.about.replace(/<[^>]*>/g, '').trim();
      if (!engAbout || engAbout.split(/\s+/).filter(w => w.length > 0).length < 3) {
         errs.english_about = 'English About must be at least 3 words';
      }
      const urduAbout = formData.urdu.about.replace(/<[^>]*>/g, '').trim();
      if (!urduAbout || urduAbout.split(/\s+/).filter(w => w.length > 0).length < 3) {
         errs.urdu_about = 'Urdu About must be at least 3 words';
      }
      setErrors(errs);
      return errs;
   };

   const buildLangPayload = (lang) => {
      const result = {};
      FIELDS.forEach(f => {
         const v = formData[lang][f.key];
         if (typeof v === 'string' && v.trim()) result[f.key] = v.trim();
         else if (v && typeof v !== 'string') result[f.key] = v;
      });
      return result;
   };

   const scrollToFirstError = (errs) => {
      const ID_MAP = {
         english_name: 'fg-en-name',
         urdu_name: 'fg-ur-name',
         english_about: 'fg-en-about',
         urdu_about: 'fg-ur-about',
      };
      const ORDER = ['english_name', 'urdu_name', 'english_about', 'urdu_about'];
      const firstKey = ORDER.find(k => errs[k]);
      if (!firstKey) return;
      const el = document.getElementById(ID_MAP[firstKey]);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
   };

   // Submit
   const handleSubmit = async (e) => {
      e?.preventDefault();
      const errs = validateForm();
      if (Object.keys(errs).length > 0) {
         scrollToFirstError(errs);
         return;
      }
      setLoading(true);
      try {
         const slug = formData.english.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');

         const biographyData = {
            urdu: buildLangPayload('urdu'),
            english: buildLangPayload('english'),
            slug,
            supabasePersonId: selectedPersonDbId || null,
            createdAt: new Date().toISOString(),
         };

         const response = await fetch('/api/biographies/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(biographyData),
         });

         if (!response.ok) {
            const error = await response.json();
            if (error.code === 'auth/id-token-expired') {
               alert('Your session has expired. Please login again.');
               router.push('/admin/login');
               return;
            }
            throw new Error(error.error || 'Failed to save biography');
         }

         router.push('/admin/dashboard');
      } catch (err) {
         alert(err.message || 'Error saving biography');
      } finally {
         setLoading(false);
      }
   };

   if (authLoading || !isAdmin) {
      return (
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#666' }}>
            Loading...
         </div>
      );
   }

   if (preview) {
      const PreviewSection = ({ lang, label, dir }) => (
         <div className="preview-version" style={{ marginBottom: 24 }}>
            <p className="version-header">{label}</p>
            <div className="preview-content" dir={dir}>
               <h3>{formData[lang].name || (lang === 'urdu' ? 'ٹائٹل' : 'Title')}</h3>
               {formData[lang].father && <p><strong>{lang === 'urdu' ? 'والد:' : 'Father:'}</strong> {formData[lang].father}</p>}
               {formData[lang].mother && <p><strong>{lang === 'urdu' ? 'والدہ:' : 'Mother:'}</strong> {formData[lang].mother}</p>}
               {formData[lang].born && <p><strong>{lang === 'urdu' ? 'پیدائش:' : 'Born:'}</strong> {formData[lang].born}</p>}
               {formData[lang].died && <p><strong>{lang === 'urdu' ? 'وفات:' : 'Died:'}</strong> {formData[lang].died}</p>}
               {formData[lang].birthPlace && <p><strong>{lang === 'urdu' ? 'جائے پیدائش:' : 'Birth Place:'}</strong> {formData[lang].birthPlace}</p>}
               {formData[lang].buriedPlace && <p><strong>{lang === 'urdu' ? 'مدفن:' : 'Buried Place:'}</strong> {formData[lang].buriedPlace}</p>}
               {formData[lang].nasbaNama && (
                  <div className="preview-section">
                     <h4>{lang === 'urdu' ? 'نسب نامہ' : 'Nasab Nama'}</h4>
                     <pre className="preview-code">{formData[lang].nasbaNama}</pre>
                  </div>
               )}
               {formData[lang].about && (
                  <div className="preview-section">
                     <h4>{lang === 'urdu' ? 'تعارف' : 'About'}</h4>
                     <div dangerouslySetInnerHTML={{ __html: formData[lang].about }} />
                  </div>
               )}
            </div>
         </div>
      );

      return (
         <div className="add-biography-container">
            <div className="page-header">
               <div>
                  <h1><i className="fas fa-search me-2"></i>Biography Preview</h1>
               </div>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setPreview(false)}>
                     <i className="fas fa-arrow-left me-2"></i>Back to Edit
                  </button>
                  <button type="button" className="btn btn-success" onClick={handleSubmit} disabled={loading}>
                     <i className="fas fa-save me-2"></i>{loading ? 'Saving...' : 'Save'}
                  </button>
               </div>
            </div>
            <div className="preview-wrapper">
               <PreviewSection lang="english" label="English" dir="ltr" />
               <PreviewSection lang="urdu" label="Urdu" dir="rtl" />
            </div>
         </div>
      );
   }

   return (
      <div className="add-biography-container">
         <div className="page-header">
            <div>
               <h1><i className="fas fa-book me-2"></i>Add New Biography</h1>
               <p>Search for a person to auto-populate their details, then write the biography.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/dashboard')}>
                  <i className="fas fa-arrow-left me-2"></i>Back
               </button>
               <button type="button" className="btn btn-preview" onClick={() => setPreview(true)} disabled={loading}>
                  <i className="fas fa-eye me-2"></i>Preview
               </button>
               <button type="submit" form="bio-form" className="btn btn-success" disabled={loading}>
                  <i className="fas fa-save me-2"></i>{loading ? 'Saving...' : 'Save'}
               </button>
            </div>
         </div>

         {/* Person Search */}
         <div className="form-section person-search-section">
            <h2>Find Person from Database</h2>
            <p>Select a person to auto-fill their name, lineage, and personal details.</p>
            <div className="person-search-box" ref={searchBoxRef}>
               <input
                  type="text"
                  className="person-search-input"
                  placeholder="Type a name to search..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  autoComplete="off"
               />
               {searchLoading && <div className="search-spinner">Searching...</div>}
               {showDropdown && searchResults.length > 0 && (
                  <ul className="search-results-dropdown">
                     {searchResults.map(p => (
                        <li key={p.id} onMouseDown={() => handlePersonSelect(p)}>
                           <span className="result-name">{p.name}</span>
                           {p.fatherName && <span className="result-meta"> — S/O {p.fatherName}</span>}
                           {p.familyName && <span className="result-family">{p.familyName}</span>}
                        </li>
                     ))}
                  </ul>
               )}
            </div>
            {lineageLoading && (
               <p style={{ color: '#667eea', fontSize: 14, marginTop: 8 }}>
                  <i className="fas fa-spinner fa-spin me-2"></i>Building paternal lineage...
               </p>
            )}
         </div>

         {/* Main Form */}
         <form id="bio-form" className="biography-form" onSubmit={handleSubmit}>
            <div className="bio-form-grid">

               {/* ── Column headers ── */}
               <div className="bio-grid-header-row">
                  <div className="bio-grid-label-cell" />
                  <div className="bio-grid-header-cell bio-hdr-en">English</div>
                  <div className="bio-grid-header-cell bio-hdr-ur">
                     اردو &nbsp;<span className="hdr-ai-note">↺ = AI translate</span>
                  </div>
               </div>

               {/* ── Bilingual rows: Name, Father, Mother, Places, Nasab Nama ── */}
               {FIELDS.filter(f => f.layout === 'bilingual').map(field => {
                  const enKey = `english_${field.key}`;
                  const urKey = `urdu_${field.key}`;
                  const isTextarea = field.type === 'textarea';
                  return (
                     <div key={field.key} className={`bio-grid-row${isTextarea ? ' bio-row-about' : ''}`}>
                        <div className="bio-grid-label">
                           {field.label}{field.required && <span className="required"> *</span>}
                        </div>

                        {/* English cell */}
                        <div id={`fg-en-${field.key}`} className="bio-cell bio-cell-en">
                           {isTextarea ? (
                              <textarea
                                 value={formData.english[field.key]}
                                 onChange={e => handleFieldChange('english', field.key, e.target.value)}
                                 className={errors[enKey] ? 'input-error' : ''}
                                 placeholder={field.placeholder || 'English'}
                                 rows={3}
                              />
                           ) : (
                              <input
                                 type="text"
                                 value={formData.english[field.key]}
                                 onChange={e => handleFieldChange('english', field.key, e.target.value)}
                                 className={errors[enKey] ? 'input-error' : ''}
                                 placeholder="English"
                              />
                           )}
                           {errors[enKey] && <span className="error-text">{errors[enKey]}</span>}
                        </div>

                        {/* Urdu cell + AI translate */}
                        <div id={`fg-ur-${field.key}`} className="bio-cell bio-cell-ur">
                           <div className="urdu-field-wrapper">
                              {isTextarea ? (
                                 <textarea
                                    dir="rtl"
                                    value={formData.urdu[field.key]}
                                    onChange={e => handleFieldChange('urdu', field.key, e.target.value)}
                                    className={`urdu-input${errors[urKey] ? ' input-error' : ''}`}
                                    placeholder="اردو"
                                    rows={3}
                                 />
                              ) : (
                                 <input
                                    type="text"
                                    dir="rtl"
                                    value={formData.urdu[field.key]}
                                    onChange={e => handleFieldChange('urdu', field.key, e.target.value)}
                                    className={`urdu-input${errors[urKey] ? ' input-error' : ''}`}
                                    placeholder="اردو"
                                 />
                              )}
                              <button
                                 type="button"
                                 className="translate-btn"
                                 title="Auto-translate from English to Urdu"
                                 onClick={() => translateField(field.key)}
                                 disabled={translating[field.key] || !formData.english[field.key]?.trim()}
                              >
                                 {translating[field.key] ? '⏳' : '↺'}
                              </button>
                           </div>
                           {errors[urKey] && <span className="error-text">{errors[urKey]}</span>}
                        </div>
                     </div>
                  );
               })}

               {/* ── Shared rows: single column for both languages (dates, nasab) ── */}
               {FIELDS.filter(f => f.layout === 'shared').map(field => (
                  <div key={field.key} className="bio-grid-row">
                     <div className="bio-grid-label">{field.label}</div>
                     <div className="bio-cell bio-cell-span">
                        {field.type === 'textarea' ? (
                           <textarea
                              value={formData.english[field.key]}
                              onChange={e => handleFieldChange('english', field.key, e.target.value)}
                              rows={3}
                              placeholder={field.placeholder || ''}
                           />
                        ) : (
                           <input
                              type="text"
                              value={formData.english[field.key]}
                              onChange={e => handleFieldChange('english', field.key, e.target.value)}
                              placeholder={field.placeholder || ''}
                           />
                        )}
                     </div>
                  </div>
               ))}

               {/* ── About (English) — written manually, no AI ── */}
               <div id="fg-en-about" className="bio-grid-row bio-row-about">
                  <div className="bio-grid-label">
                     About – English<span className="required"> *</span>
                  </div>
                  <div className="bio-cell bio-cell-span">
                     <div className={`rich-text-group${errors.english_about ? ' input-error' : ''}`}>
                        <TipTapEditor
                           value={formData.english.about}
                           onChange={html => handleFieldChange('english', 'about', html)}
                           isRTL={false}
                        />
                     </div>
                     {errors.english_about && <span className="error-text">{errors.english_about}</span>}
                  </div>
               </div>

               {/* ── About (Urdu) — written manually, no AI ── */}
               <div id="fg-ur-about" className="bio-grid-row bio-row-about">
                  <div className="bio-grid-label">
                     About – اردو<span className="required"> *</span>
                  </div>
                  <div className="bio-cell bio-cell-span">
                     <div className={`rich-text-group${errors.urdu_about ? ' input-error' : ''}`}>
                        <TipTapEditor
                           value={formData.urdu.about}
                           onChange={html => handleFieldChange('urdu', 'about', html)}
                           isRTL={true}
                        />
                     </div>
                     {errors.urdu_about && <span className="error-text">{errors.urdu_about}</span>}
                  </div>
               </div>

            </div>
         </form>
      </div>
   );
}
