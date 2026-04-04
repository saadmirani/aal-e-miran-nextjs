'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TipTapEditor from '@/components/TipTapEditor';
import './edit.css';

const PREDEFINED_FIELDS = [
   { key: 'name', label: 'Name', type: 'text', required: true },
   { key: 'father', label: 'Father', type: 'text' },
   { key: 'mother', label: 'Mother', type: 'text' },
   { key: 'born', label: 'Born', type: 'text' },
   { key: 'died', label: 'Died', type: 'text' },
   { key: 'birthPlace', label: 'Birth Place', type: 'text' },
   { key: 'buriedPlace', label: 'Buried Place', type: 'text' },
   { key: 'nasbaNama', label: 'Nasab Nama', type: 'textarea' },
   { key: 'about', label: 'About', type: 'rich-text', required: true },
];

export default function EditBiography() {
   const router = useRouter();
   const [biographies, setBiographies] = useState([]);
   const [selectedId, setSelectedId] = useState(null);
   const [selectedBio, setSelectedBio] = useState(null);
   const [language, setLanguage] = useState('urdu');
   const [formData, setFormData] = useState({
      urdu: {},
      english: {},
   });
   const [customFields, setCustomFields] = useState([]);
   const [newFieldName, setNewFieldName] = useState('');
   const [newFieldType, setNewFieldType] = useState('text');
   const [errors, setErrors] = useState({});
   const [loading, setLoading] = useState(false);
   const [bioLoading, setBioLoading] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');

   // Fetch biographies list
   useEffect(() => {
      fetchBiographies();
   }, []);

   const fetchBiographies = async () => {
      try {
         setBioLoading(true);
         const response = await fetch('/api/biographies/list');

         if (!response.ok) {
            const error = await response.json();
            if (error.code === 'auth/id-token-expired') {
               router.push('/admin/login');
               return;
            }
            throw new Error(error.error || 'Failed to fetch biographies');
         }

         const data = await response.json();
         setBiographies(data.biographies || []);
      } catch (err) {
         alert(err.message || 'Error fetching biographies');
      } finally {
         setBioLoading(false);
      }
   };

   // Load selected biography
   const loadBiography = async (id) => {
      try {
         setBioLoading(true);
         setSelectedId(id);

         const response = await fetch(`/api/biographies/${id}`);

         if (!response.ok) {
            const error = await response.json();
            if (error.code === 'auth/id-token-expired') {
               router.push('/admin/login');
               return;
            }
            throw new Error(error.error || 'Failed to load biography');
         }

         const bio = await response.json();
         setSelectedBio(bio);
         setFormData({
            urdu: bio.urdu || {},
            english: bio.english || {},
         });
         setCustomFields([]);
         setErrors({});
      } catch (err) {
         alert(err.message || 'Error loading biography');
      } finally {
         setBioLoading(false);
      }
   };

   // Handle field change
   const handleFieldChange = (lang, fieldKey, value) => {
      if (fieldKey === 'born' || fieldKey === 'died') {
         setFormData((prev) => ({
            ...prev,
            urdu: { ...prev.urdu, [fieldKey]: value },
            english: { ...prev.english, [fieldKey]: value },
         }));
      } else {
         setFormData((prev) => ({
            ...prev,
            [lang]: { ...prev[lang], [fieldKey]: value },
         }));
      }

      if (errors[fieldKey]) {
         setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldKey];
            return newErrors;
         });
      }
   };

   // Add custom field
   const handleAddCustomField = () => {
      if (!newFieldName.trim()) {
         alert('Please enter a field name');
         return;
      }
      const newField = {
         key: newFieldName.toLowerCase().replace(/\s+/g, '_'),
         label: newFieldName,
         type: newFieldType,
         custom: true,
      };
      setCustomFields([...customFields, newField]);
      setFormData((prev) => ({
         ...prev,
         urdu: { ...prev.urdu, [newField.key]: '' },
         english: { ...prev.english, [newField.key]: '' },
      }));
      setNewFieldName('');
      setNewFieldType('text');
   };

   // Remove custom field
   const handleRemoveCustomField = (fieldKey) => {
      setCustomFields(customFields.filter(f => f.key !== fieldKey));
      setFormData((prev) => ({
         urdu: Object.fromEntries(Object.entries(prev.urdu).filter(([k]) => k !== fieldKey)),
         english: Object.fromEntries(Object.entries(prev.english).filter(([k]) => k !== fieldKey)),
      }));
   };

   // Validate form
   const validateForm = () => {
      const newErrors = {};

      if (!formData.urdu.name?.trim()) {
         newErrors.urdu_name = 'Urdu Name is required';
      }
      if (!formData.english.name?.trim()) {
         newErrors.english_name = 'English Name is required';
      }

      if (!formData.urdu.about?.trim()) {
         newErrors.urdu_about = 'Urdu About is required';
      }
      if (!formData.english.about?.trim()) {
         newErrors.english_about = 'English About is required';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   // Submit (save changes)
   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm() || !selectedId) return;

      setLoading(true);

      try {
         const response = await fetch(`/api/biographies/${selectedId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               urdu: Object.fromEntries(
                  Object.entries(formData.urdu).filter(([, v]) => v !== null && v !== undefined)
               ),
               english: Object.fromEntries(
                  Object.entries(formData.english).filter(([, v]) => v !== null && v !== undefined)
               ),
            }),
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

         alert('Biography updated successfully!');
         router.push('/admin/dashboard');
      } catch (err) {
         alert(err.message || 'Error saving biography');
      } finally {
         setLoading(false);
      }
   };

   // Render field
   const renderField = (field, lang) => {
      const value = formData[lang]?.[field.key] || '';
      let errorKey = null;

      if (field.key === 'name') {
         errorKey = lang === 'urdu' ? 'urdu_name' : 'english_name';
      } else if (field.key === 'about') {
         errorKey = lang === 'urdu' ? 'urdu_about' : 'english_about';
      }

      return (
         <div key={field.key} className="form-group">
            <label htmlFor={`${lang}-${field.key}`}>
               {field.label}
               {field.required && <span className="required">*</span>}
            </label>

            {field.type === 'text' && (
               <input
                  id={`${lang}-${field.key}`}
                  type="text"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  value={value}
                  onChange={(e) => handleFieldChange(lang, field.key, e.target.value)}
                  className={errorKey && errors[errorKey] ? 'input-error' : ''}
                  dir={lang === 'urdu' ? 'rtl' : 'ltr'}
               />
            )}

            {field.type === 'textarea' && (
               <textarea
                  id={`${lang}-${field.key}`}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  value={value}
                  onChange={(e) => handleFieldChange(lang, field.key, e.target.value)}
                  rows={4}
                  dir={lang === 'urdu' ? 'rtl' : 'ltr'}
                  className={errorKey && errors[errorKey] ? 'input-error' : ''}
               />
            )}

            {field.type === 'rich-text' && (
               <div className="rich-text-group">
                  <TipTapEditor
                     value={value}
                     onChange={(html) => handleFieldChange(lang, field.key, html)}
                     isRTL={lang === 'urdu'}
                  />
               </div>
            )}

            {errorKey && errors[errorKey] && (
               <span className="error-text">{errors[errorKey]}</span>
            )}
         </div>
      );
   };

   if (!selectedBio) {
      return (
         <div className="edit-biography-layout">
            {/* Left Sidebar */}
            <div className="biographies-sidebar">
               <div className="sidebar-header">
                  <h2><i className="fas fa-book me-2"></i>Biographies</h2>
                  <input
                     type="text"
                     placeholder="Search..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="search-input"
                  />
               </div>

               {bioLoading ? (
                  <div className="loading">Loading biographies...</div>
               ) : biographies.length === 0 ? (
                  <div className="no-biographies">No biographies found</div>
               ) : (
                  <div className="biographies-list">
                     {biographies
                        .filter(bio =>
                           bio.urdu?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bio.english?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((bio) => (
                           <button
                              key={bio.id}
                              className="bio-item"
                              onClick={() => loadBiography(bio.id)}
                           >
                              <div className="bio-item-name">
                                 {bio.english?.name || bio.urdu?.name || 'Unnamed'}
                              </div>
                              <div className="bio-item-subtitle">
                                 {bio.english?.father ? `Son of ${bio.english.father}` : bio.urdu?.father ? `Son of ${bio.urdu.father}` : ''}
                              </div>
                           </button>
                        ))}
                  </div>
               )}
            </div>

            {/* Empty State */}
            <div className="empty-state">
               <p>Select a biography to edit</p>
            </div>
         </div>
      );
   }

   return (
      <div className="edit-biography-layout">
         {/* Left Sidebar */}
         <div className="biographies-sidebar">
            <div className="sidebar-header">
               <h2><i className="fas fa-scroll"></i> Biographies</h2>
               <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
               />
            </div>

            {bioLoading ? (
               <div className="loading">Loading...</div>
            ) : (
               <div className="biographies-list">
                  {biographies
                     .filter(bio =>
                        bio.urdu?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        bio.english?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                     )
                     .map((bio) => (
                        <button
                           key={bio.id}
                           className={`bio-item ${bio.id === selectedId ? 'active' : ''}`}
                           onClick={() => loadBiography(bio.id)}
                        >
                           <div className="bio-item-name">
                              {bio.english?.name || bio.urdu?.name || 'Unnamed'}
                           </div>
                           <div className="bio-item-subtitle">
                              {bio.english?.father ? `Son of ${bio.english.father}` : bio.urdu?.father ? `Son of ${bio.urdu.father}` : ''}
                           </div>
                        </button>
                     ))}
               </div>
            )}
         </div>

         {/* Main Content */}
         <div className="edit-biography-container">
            <div className="page-header">
               <h1><i className="fas fa-pen-to-square me-2"></i>Edit Biography</h1>
               <p style={{ fontSize: '28px', fontWeight: '700', color: '#062e7e', margin: '20px 0 0 0' }}>{selectedBio?.english?.name || selectedBio?.urdu?.name}</p>
            </div>

            <form className="biography-form" onSubmit={handleSubmit}>
               {/* Language Tabs */}
               <div className="form-section">
                  <div className="language-tabs">
                     <button
                        type="button"
                        className={`lang-tab ${language === 'urdu' ? 'active' : ''}`}
                        onClick={() => setLanguage('urdu')}
                     >
                        Urdu
                     </button>
                     <button
                        type="button"
                        className={`lang-tab ${language === 'english' ? 'active' : ''}`}
                        onClick={() => setLanguage('english')}
                     >
                        English
                     </button>
                  </div>
                  <p className="lang-note">
                     {language === 'urdu'
                        ? 'Edit Urdu biography details. Only Born/Died will sync to English.'
                        : 'Edit English biography details independently.'}
                  </p>
               </div>

               {/* Form Fields */}
               <div className="form-section">
                  {PREDEFINED_FIELDS.map((field) => renderField(field, language))}
                  {customFields.map((field) => renderField(field, language))}
               </div>

               {/* Custom Fields Section */}
               <div className="form-section">
                  <h3>Add Custom Field</h3>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                     <input
                        type="text"
                        placeholder="Field name"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        style={{
                           padding: '10px',
                           border: '1px solid #cbd5e0',
                           borderRadius: '6px',
                           flex: 1,
                        }}
                     />
                     <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value)}
                        style={{
                           padding: '10px',
                           border: '1px solid #cbd5e0',
                           borderRadius: '6px',
                        }}
                     >
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="rich-text">Rich Text</option>
                     </select>
                     <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="btn btn-dark"
                     >
                        <i className="fas fa-plus me-2"></i>Add
                     </button>
                  </div>

                  {customFields.length > 0 && (
                     <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px' }}>
                        <h4 style={{ margin: '0 0 12px 0' }}>Custom Fields</h4>
                        {customFields.map((field) => (
                           <div
                              key={field.key}
                              style={{
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center',
                                 padding: '8px 0',
                                 borderBottom: '1px solid #e2e8f0',
                              }}
                           >
                              <span>{field.label}</span>
                              <button
                                 type="button"
                                 onClick={() => handleRemoveCustomField(field.key)}
                                 className="btn btn-danger btn-sm"
                              >
                                 <i className="fas fa-trash-alt me-1"></i>Remove
                              </button>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* Action Buttons */}
               <div className="form-actions">
                  <button
                     type="button"
                     className="btn btn-danger"
                     onClick={() => router.push('/admin/dashboard')}
                  >
                     <i className="fas fa-times me-2"></i>Cancel
                  </button>

                  <button
                     type="submit"
                     className="btn btn-success"
                     disabled={loading}
                  >
                     <i className="fas fa-save me-2"></i>{loading ? 'Saving...' : 'Save'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}
