'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TipTapEditor from '@/components/TipTapEditor';
import './add.css';

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

export default function AddBiography() {
   const router = useRouter();
   const [language, setLanguage] = useState('urdu');
   const [formData, setFormData] = useState({
      urdu: PREDEFINED_FIELDS.reduce((acc, field) => {
         acc[field.key] = '';
         return acc;
      }, {}),
      english: PREDEFINED_FIELDS.reduce((acc, field) => {
         acc[field.key] = '';
         return acc;
      }, {}),
   });
   const [errors, setErrors] = useState({});
   const [loading, setLoading] = useState(false);
   const [preview, setPreview] = useState(false);
   const [previewLanguage, setPreviewLanguage] = useState('english');
   const [customFields, setCustomFields] = useState([]);
   const [newFieldName, setNewFieldName] = useState('');
   const [newFieldType, setNewFieldType] = useState('text');

   // Handle field change with Born/Died auto-sync
   const handleFieldChange = (lang, fieldKey, value) => {
      // Auto-populate Born and Died in both languages
      if (fieldKey === 'born' || fieldKey === 'died') {
         setFormData((prev) => ({
            ...prev,
            urdu: {
               ...prev.urdu,
               [fieldKey]: value,
            },
            english: {
               ...prev.english,
               [fieldKey]: value,
            },
         }));
      } else {
         setFormData((prev) => ({
            ...prev,
            [lang]: {
               ...prev[lang],
               [fieldKey]: value,
            },
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
   const validateForm = () => {
      const newErrors = {};

      // Check required fields - INDEPENDENT per language
      if (!formData.urdu.name.trim()) {
         newErrors.urdu_name = 'Urdu Name is required';
      }
      if (!formData.english.name.trim()) {
         newErrors.english_name = 'English Name is required';
      }

      if (!formData.urdu.about.trim()) {
         newErrors.urdu_about = 'Urdu About is required';
      }
      if (!formData.english.about.trim()) {
         newErrors.english_about = 'English About is required';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   // Submit
   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) {
         return;
      }

      setLoading(true);

      try {
         const biographyData = {
            urdu: Object.entries(formData.urdu).reduce((acc, [key, value]) => {
               if (value && value.trim && value.trim() !== '') {
                  acc[key] = value.trim();
               } else if (value && typeof value !== 'string') {
                  acc[key] = value;
               }
               return acc;
            }, {}),
            english: Object.entries(formData.english).reduce((acc, [key, value]) => {
               if (value && value.trim && value.trim() !== '') {
                  acc[key] = value.trim();
               } else if (value && typeof value !== 'string') {
                  acc[key] = value;
               }
               return acc;
            }, {}),
            slug: (formData.urdu.name || formData.english.name)
               .toLowerCase()
               .replace(/\s+/g, '-')
               .replace(/[^\w-]/g, ''),
            createdAt: new Date().toISOString(),
         };

         const response = await fetch('/api/biographies/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(biographyData),
         });

         if (!response.ok) {
            const error = await response.json();

            // Handle expired session
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

   // Render field
   const renderField = (field, lang) => {
      const value = formData[lang][field.key];
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

   if (preview) {
      return (
         <div className="add-biography-container">
            <div className="page-header">
               <h1><i className="fas fa-search me-2"></i>Biography Preview</h1>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                     type="button"
                     className={`lang-tab ${previewLanguage === 'english' ? 'active' : ''}`}
                     onClick={() => setPreviewLanguage('english')}
                  >
                     English
                  </button>
                  <button
                     type="button"
                     className={`lang-tab ${previewLanguage === 'urdu' ? 'active' : ''}`}
                     onClick={() => setPreviewLanguage('urdu')}
                  >
                     Urdu
                  </button>
                  <button className="btn btn-secondary" onClick={() => setPreview(false)}>
                     <i className="fas fa-arrow-left me-2"></i>Back to Edit
                  </button>
                  <button type="submit" className="btn btn-success" onClick={handleSubmit} disabled={loading} style={{ marginLeft: 'auto' }}>
                     <i className="fas fa-save me-2"></i>
                     {loading ? 'Saving...' : 'Save'}
                  </button>
               </div>
            </div>
            <div className="preview-wrapper">
               {previewLanguage === 'english' ? (
                  <div className="preview-version">
                     <div className="preview-content">
                        <h3>{formData.english.name || formData.urdu.name || 'Title'}</h3>
                        {formData.english.father && <p><strong>Father:</strong> {formData.english.father}</p>}
                        {formData.english.mother && <p><strong>Mother:</strong> {formData.english.mother}</p>}
                        {formData.english.born && <p><strong>Born:</strong> {formData.english.born}</p>}
                        {formData.english.died && <p><strong>Died:</strong> {formData.english.died}</p>}
                        {formData.english.birthPlace && <p><strong>Birth Place:</strong> {formData.english.birthPlace}</p>}
                        {formData.english.buriedPlace && <p><strong>Buried Place:</strong> {formData.english.buriedPlace}</p>}
                        {formData.english.about && (
                           <div className="preview-section">
                              <h4>About</h4>
                              <p>{formData.english.about.replace(/<[^>]*>/g, '')}</p>
                           </div>
                        )}
                        {formData.english.nasbaNama && (
                           <div className="preview-section">
                              <h4>Family Tree (Nasab Nama)</h4>
                              <pre className="preview-code">{formData.english.nasbaNama}</pre>
                           </div>
                        )}
                     </div>
                  </div>
               ) : (
                  <div className="preview-version">
                     <div className="preview-content" dir="rtl">
                        <h3>{formData.urdu.name || 'ٹائٹل'}</h3>
                        {formData.urdu.father && <p><strong>والد:</strong> {formData.urdu.father}</p>}
                        {formData.urdu.mother && <p><strong>والدہ:</strong> {formData.urdu.mother}</p>}
                        {formData.urdu.born && <p><strong>پیدائش:</strong> {formData.urdu.born}</p>}
                        {formData.urdu.died && <p><strong>وفات:</strong> {formData.urdu.died}</p>}
                        {formData.urdu.birthPlace && <p><strong>جائے پیدائش:</strong> {formData.urdu.birthPlace}</p>}
                        {formData.urdu.buriedPlace && <p><strong>مدفن:</strong> {formData.urdu.buriedPlace}</p>}
                        {formData.urdu.about && (
                           <div className="preview-section">
                              <h4>تعارف</h4>
                              <p>{formData.urdu.about.replace(/<[^>]*>/g, '')}</p>
                           </div>
                        )}
                        {formData.urdu.nasbaNama && (
                           <div className="preview-section">
                              <h4>نسب نامہ</h4>
                              <pre className="preview-code">{formData.urdu.nasbaNama}</pre>
                           </div>
                        )}
                     </div>
                  </div>
               )}
            </div>

         </div>
      );
   }

   return (
      <div className="add-biography-container">
         <div className="page-header">
            <h1><i className="fas fa-book me-2"></i>Add New Biography</h1>
            <p>Create separate Urdu and English versions. Only Born/Died dates sync automatically.</p>
         </div>

         <form className="biography-form" onSubmit={handleSubmit}>
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
                     ? 'Fill Urdu biography details. Only Born/Died will auto-sync to English.'
                     : 'Fill English biography details independently. No auto-population from Urdu.'}
               </p>
            </div>

            <div className="form-section">
               {PREDEFINED_FIELDS.map((field) => renderField(field, language))}
               {customFields.map((field) => renderField(field, language))}
            </div>

            <div className="form-section">
               <h3>Add Custom Field</h3>
               <div className="custom-field-input-group">
                  <input
                     type="text"
                     placeholder="Field name (e.g., Achievements)"
                     value={newFieldName}
                     onChange={(e) => setNewFieldName(e.target.value)}
                     className="custom-field-input"
                  />
                  <select
                     value={newFieldType}
                     onChange={(e) => setNewFieldType(e.target.value)}
                     className="custom-field-select"
                  >
                     <option value="text">Text</option>
                     <option value="textarea">Textarea</option>
                     <option value="rich-text">Rich Text</option>
                  </select>
                  <button
                     type="button"
                     onClick={handleAddCustomField}
                     className="btn btn-primary custom-field-btn"
                  >
                     <i className="fas fa-plus me-2"></i>Add Field
                  </button>
               </div>
               {customFields.length > 0 && (
                  <div className="custom-fields-container">
                     <h4>Custom Fields ({customFields.length})</h4>
                     {customFields.map((field) => (
                        <div key={field.key} className="custom-field-row">
                           <span className="custom-field-label">{field.label} ({field.type})</span>
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

            <div className="form-actions">
               <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => router.push('/admin/dashboard')}
               >
                  <i className="fas fa-times me-2"></i>Cancel
               </button>

               <button
                  type="button"
                  className="btn btn-info"
                  onClick={() => setPreview(true)}
               >
                  <i className="fas fa-eye me-2"></i>Preview
               </button>

               <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading}
               >
                  <i className="fas fa-save me-2"></i>
                  {loading ? 'Saving...' : 'Save'}
               </button>
            </div>
         </form>
      </div>
   );
}
