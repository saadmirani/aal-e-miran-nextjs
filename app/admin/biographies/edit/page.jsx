'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TipTapEditor from '@/components/TipTapEditor';
import '../add/add.css';
import './edit.css';

const FIELDS = [
   { key: 'name',        label: 'Name',          type: 'text',      required: true, layout: 'bilingual' },
   { key: 'father',      label: 'Father Name',   type: 'text',                      layout: 'bilingual' },
   { key: 'mother',      label: 'Mother Name',   type: 'text',                      layout: 'bilingual' },
   { key: 'birthPlace',  label: 'Birth Place',   type: 'text',                      layout: 'bilingual' },
   { key: 'buriedPlace', label: 'Buried Place',  type: 'text',                      layout: 'bilingual' },
   { key: 'born',        label: 'Date of Birth', type: 'text',                      layout: 'shared'    },
   { key: 'died',        label: 'Date of Death', type: 'text',                      layout: 'shared'    },
   { key: 'nasbaNama',   label: 'Nasab Nama',    type: 'textarea',                  layout: 'bilingual', placeholder: 'Paternal lineage...' },
   { key: 'about',       label: 'About',         type: 'rich-text', required: true, layout: 'about'     },
];

const SHARED_KEYS = new Set(['born', 'died']);
const emptyLang  = () => FIELDS.reduce((acc, f) => { acc[f.key] = ''; return acc; }, {});
const emptyForm  = () => ({ urdu: emptyLang(), english: emptyLang() });

export default function EditBiography() {
   const router  = useRouter();
   const { isAdmin, loading: authLoading } = useAuth();

   const [biographies, setBiographies] = useState([]);
   const [bioLoading,  setBioLoading]  = useState(false);
   const [selectedId,  setSelectedId]  = useState(null);
   const [searchTerm,  setSearchTerm]  = useState('');
   const [formData,    setFormData]    = useState(emptyForm());
   const [errors,      setErrors]      = useState({});
   const [loading,     setLoading]     = useState(false);
   const [translating, setTranslating] = useState({});

   useEffect(() => {
      if (authLoading) return;
      if (!isAdmin) { router.push('/admin/login'); return; }
      fetchBiographies();
   }, [isAdmin, authLoading, router]);

   const fetchBiographies = async () => {
      setBioLoading(true);
      try {
         const res = await fetch('/api/biographies/list');
         if (!res.ok) throw new Error('Failed to fetch');
         const data = await res.json();
         setBiographies(data.biographies || []);
      } catch { /* silent */ }
      setBioLoading(false);
   };

   const loadBiography = async (id) => {
      setBioLoading(true);
      setSelectedId(id);
      setErrors({});
      try {
         const res = await fetch(`/api/biographies/${id}`);
         if (!res.ok) {
            const err = await res.json();
            if (err.code === 'auth/id-token-expired') { router.push('/admin/login'); return; }
            throw new Error(err.error || 'Failed to load');
         }
         const bio = await res.json();
         setFormData({
            english: { ...emptyLang(), ...(bio.english || {}) },
            urdu:    { ...emptyLang(), ...(bio.urdu    || {}) },
         });
      } catch (e) { alert(e.message || 'Error loading biography'); }
      setBioLoading(false);
   };

   const HONORIFICS = [
      { pattern: /S\.A\.W\.?/gi, urdu: '\uFDFA' },
      { pattern: /R\.Z\.?/gi,     urdu: '\u0613'  },
      { pattern: /R\.H\.?/gi,     urdu: '\u0612'  },
   ];

   const extractHonorific = (text) => {
      const trimmed = text.trim();
      for (const h of HONORIFICS) {
         const m = trimmed.match(new RegExp(`^(.+?)\\s+(${h.pattern.source})\\s*$`, 'i'));
         if (m && m[1].trim()) return { clean: m[1].trim(), honorificUrdu: h.urdu };
      }
      return { clean: trimmed, honorificUrdu: '' };
   };

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
      return data.translatedText.trimEnd() + honorificUrdu;
   };

   const translateField = async (fieldKey) => {
      const text = formData.english[fieldKey];
      if (!text?.trim()) return;
      setTranslating(prev => ({ ...prev, [fieldKey]: true }));
      try {
         let translated;
         if (fieldKey === 'nasbaNama') {
            const parts = text.split(' \u2190 ');
            const translatedParts = await Promise.all(parts.map(p => callTranslate(p.trim())));
            translated = translatedParts.join(' \u0628\u0646 ');
         } else {
            translated = await callTranslate(text);
         }
         setFormData(prev => ({ ...prev, urdu: { ...prev.urdu, [fieldKey]: translated } }));
      } catch { /* silent */ }
      setTranslating(prev => ({ ...prev, [fieldKey]: false }));
   };

   const handleFieldChange = (lang, fieldKey, value) => {
      if (SHARED_KEYS.has(fieldKey)) {
         setFormData(prev => ({
            ...prev,
            urdu:    { ...prev.urdu,    [fieldKey]: value },
            english: { ...prev.english, [fieldKey]: value },
         }));
      } else {
         setFormData(prev => ({ ...prev, [lang]: { ...prev[lang], [fieldKey]: value } }));
      }
      const errKey = `${lang}_${fieldKey}`;
      if (errors[errKey]) setErrors(prev => { const e = { ...prev }; delete e[errKey]; return e; });
   };

   const validateForm = () => {
      const errs = {};
      if (!formData.english.name?.trim()) errs.english_name = 'English name is required';
      if (!formData.urdu.name?.trim())    errs.urdu_name    = 'Urdu name is required';
      const engAbout  = (formData.english.about || '').replace(/<[^>]*>/g, '').trim();
      if (!engAbout  || engAbout.split(/\s+/).filter(w => w).length  < 3) errs.english_about = 'English About must be at least 3 words';
      const urduAbout = (formData.urdu.about    || '').replace(/<[^>]*>/g, '').trim();
      if (!urduAbout || urduAbout.split(/\s+/).filter(w => w).length < 3) errs.urdu_about    = 'Urdu About must be at least 3 words';
      setErrors(errs);
      return errs;
   };

   const scrollToFirstError = (errs) => {
      const ID_MAP   = { english_name: 'fg-en-name', urdu_name: 'fg-ur-name', english_about: 'fg-en-about', urdu_about: 'fg-ur-about' };
      const ORDER    = ['english_name', 'urdu_name', 'english_about', 'urdu_about'];
      const firstKey = ORDER.find(k => errs[k]);
      if (!firstKey) return;
      document.getElementById(ID_MAP[firstKey])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
   };

   const buildLangPayload = (lang) => {
      const result = {};
      FIELDS.forEach(f => {
         const v = formData[lang][f.key];
         if (typeof v === 'string' && v.trim()) result[f.key] = v.trim();
         else if (v && typeof v !== 'string')   result[f.key] = v;
      });
      return result;
   };

   const handleSubmit = async (e) => {
      e?.preventDefault();
      if (!selectedId) return;
      const errs = validateForm();
      if (Object.keys(errs).length > 0) { scrollToFirstError(errs); return; }
      setLoading(true);
      try {
         const res = await fetch(`/api/biographies/${selectedId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urdu: buildLangPayload('urdu'), english: buildLangPayload('english') }),
         });
         if (!res.ok) {
            const err = await res.json();
            if (err.code === 'auth/id-token-expired') { alert('Session expired.'); router.push('/admin/login'); return; }
            throw new Error(err.error || 'Failed to save');
         }
         alert('Biography updated successfully!');
         router.push('/admin/dashboard');
      } catch (e) { alert(e.message || 'Error saving biography'); }
      finally { setLoading(false); }
   };

   if (authLoading || !isAdmin) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#666' }}>Loading...</div>;
   }

   const filteredBios = biographies.filter(bio =>
      (bio.english?.name || bio.urdu?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bio.english?.father || '').toLowerCase().includes(searchTerm.toLowerCase())
   );

   return (
      <div className="edit-biography-layout">
         <div className="biographies-sidebar">
            <div className="sidebar-header">
               <h2><i className="fas fa-book me-2"></i>Biographies</h2>
               <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
            </div>
            {bioLoading && !selectedId ? (
               <div className="loading">Loading...</div>
            ) : filteredBios.length === 0 ? (
               <div className="no-biographies">No biographies found</div>
            ) : (
               <div className="biographies-list">
                  {filteredBios.map(bio => (
                     <button key={bio.id} className={`bio-item${bio.id === selectedId ? ' active' : ''}`} onClick={() => loadBiography(bio.id)}>
                        <div className="bio-item-name">{bio.english?.name || bio.urdu?.name || 'Unnamed'}</div>
                        <div className="bio-item-subtitle">
                           {bio.english?.father ? `S/O ${bio.english.father}` : bio.urdu?.father ? `\u0628\u0646 ${bio.urdu.father}` : ''}
                        </div>
                     </button>
                  ))}
               </div>
            )}
         </div>

         {!selectedId ? (
            <div className="empty-state"><p>Select a biography from the sidebar to edit</p></div>
         ) : (
            <div className="edit-biography-container">
               <div className="page-header">
                  <div>
                     <h1><i className="fas fa-pen-to-square me-2"></i>Edit Biography</h1>
                     <p>Edit English and Urdu versions side by side. Use \u21ba to auto-translate a field.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                     <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/dashboard')}>
                        <i className="fas fa-arrow-left me-2"></i>Back
                     </button>
                     <button type="submit" form="edit-bio-form" className="btn btn-success" disabled={loading || bioLoading}>
                        <i className="fas fa-save me-2"></i>{loading ? 'Saving\u2026' : 'Save Changes'}
                     </button>
                  </div>
               </div>

               {bioLoading && (
                  <p style={{ color: '#667eea', fontSize: 14, marginBottom: 16 }}>
                     <i className="fas fa-spinner fa-spin me-2"></i>Loading biography\u2026
                  </p>
               )}

               <form id="edit-bio-form" className="biography-form" onSubmit={handleSubmit}>
                  <div className="bio-form-grid">
                     <div className="bio-grid-header-row">
                        <div className="bio-grid-label-cell" />
                        <div className="bio-grid-header-cell bio-hdr-en">English</div>
                        <div className="bio-grid-header-cell bio-hdr-ur">\u0627\u0631\u062f\u0648 &nbsp;<span className="hdr-ai-note">\u21ba = AI translate</span></div>
                     </div>

                     {FIELDS.filter(f => f.layout === 'bilingual').map(field => {
                        const enKey = `english_${field.key}`;
                        const urKey = `urdu_${field.key}`;
                        const isTextarea = field.type === 'textarea';
                        return (
                           <div key={field.key} className={`bio-grid-row${isTextarea ? ' bio-row-about' : ''}`}>
                              <div className="bio-grid-label">{field.label}{field.required && <span className="required"> *</span>}</div>
                              <div id={`fg-en-${field.key}`} className="bio-cell bio-cell-en">
                                 {isTextarea ? (
                                    <textarea value={formData.english[field.key] || ''} onChange={e => handleFieldChange('english', field.key, e.target.value)} className={errors[enKey] ? 'input-error' : ''} placeholder={field.placeholder || 'English'} rows={3} />
                                 ) : (
                                    <input type="text" value={formData.english[field.key] || ''} onChange={e => handleFieldChange('english', field.key, e.target.value)} className={errors[enKey] ? 'input-error' : ''} placeholder="English" />
                                 )}
                                 {errors[enKey] && <span className="error-text">{errors[enKey]}</span>}
                              </div>
                              <div id={`fg-ur-${field.key}`} className="bio-cell bio-cell-ur">
                                 <div className="urdu-field-wrapper">
                                    {isTextarea ? (
                                       <textarea dir="rtl" value={formData.urdu[field.key] || ''} onChange={e => handleFieldChange('urdu', field.key, e.target.value)} className={`urdu-input${errors[urKey] ? ' input-error' : ''}`} placeholder="\u0627\u0631\u062f\u0648" rows={3} />
                                    ) : (
                                       <input type="text" dir="rtl" value={formData.urdu[field.key] || ''} onChange={e => handleFieldChange('urdu', field.key, e.target.value)} className={`urdu-input${errors[urKey] ? ' input-error' : ''}`} placeholder="\u0627\u0631\u062f\u0648" />
                                    )}
                                    <button type="button" className="translate-btn" title="Auto-translate from English to Urdu" onClick={() => translateField(field.key)} disabled={translating[field.key] || !formData.english[field.key]?.trim()}>
                                       {translating[field.key] ? '\u23f3' : '\u21ba'}
                                    </button>
                                 </div>
                                 {errors[urKey] && <span className="error-text">{errors[urKey]}</span>}
                              </div>
                           </div>
                        );
                     })}

                     {FIELDS.filter(f => f.layout === 'shared').map(field => (
                        <div key={field.key} className="bio-grid-row">
                           <div className="bio-grid-label">{field.label}</div>
                           <div className="bio-cell bio-cell-span">
                              <input type="text" value={formData.english[field.key] || ''} onChange={e => handleFieldChange('english', field.key, e.target.value)} placeholder="" />
                           </div>
                        </div>
                     ))}

                     <div id="fg-en-about" className="bio-grid-row bio-row-about">
                        <div className="bio-grid-label">About \u2013 English<span className="required"> *</span></div>
                        <div className="bio-cell bio-cell-span">
                           <div className={`rich-text-group${errors.english_about ? ' input-error' : ''}`}>
                              <TipTapEditor value={formData.english.about || ''} onChange={html => handleFieldChange('english', 'about', html)} isRTL={false} />
                           </div>
                           {errors.english_about && <span className="error-text">{errors.english_about}</span>}
                        </div>
                     </div>

                     <div id="fg-ur-about" className="bio-grid-row bio-row-about">
                        <div className="bio-grid-label">About \u2013 \u0627\u0631\u062f\u0648<span className="required"> *</span></div>
                        <div className="bio-cell bio-cell-span">
                           <div className={`rich-text-group${errors.urdu_about ? ' input-error' : ''}`}>
                              <TipTapEditor value={formData.urdu.about || ''} onChange={html => handleFieldChange('urdu', 'about', html)} isRTL={true} />
                           </div>
                           {errors.urdu_about && <span className="error-text">{errors.urdu_about}</span>}
                        </div>
                     </div>
                  </div>
               </form>
            </div>
         )}
      </div>
   );
}
