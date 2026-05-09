'use client';

import { useState, useEffect } from 'react';
import { createFamily, searchPersons } from '../utils/api';
import { validateFamilyForm, sanitizeQasba, formatFamilyForApi } from '../utils/validation';

export default function AddFamilyForm({ onFamilyAdded, onCancel, existingFamilies = [] }) {
   const [loading, setLoading] = useState(false);
   const [errors, setErrors] = useState({});
   const [successMessage, setSuccessMessage] = useState('');
   const [searchResults, setSearchResults] = useState([]);
   const [showSearch, setShowSearch] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');

   const [formData, setFormData] = useState({
      name: '',
      qasba: '',
      focusPersonId: null,
      focusPersonName: '',
      description: '',
      region: ''
   });

   // Handle search query changes (separate from form data)
   const handleSearchQueryChange = (query) => {
      setSearchQuery(query);
      handleSearchFocusPerson(query);
   };

   const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => {
         const updated = { ...prev, [name]: value };

         // Auto-generate qasba from name if not manually changed
         if (name === 'name') {
            updated.qasba = sanitizeQasba(value);
         }

         return updated;
      });

      // Clear error for this field
      if (errors[name]) {
         setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
         });
      }
   };

   const handleSearchFocusPerson = async (query) => {
      if (query.length < 2) {
         setSearchResults([]);
         return;
      }

      try {
         const results = await searchPersons(query);
         setSearchResults(results);
         setShowSearch(true);
      } catch (error) {
         console.error('Search error:', error);
      }
   };

   const handleSelectPerson = (person) => {
      setFormData(prev => ({
         ...prev,
         focusPersonId: person.id,
         focusPersonName: person.name
      }));
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setSuccessMessage('');

      try {
         // Validation
         const validation = validateFamilyForm({
            name: formData.name,
            qasba: formData.qasba
            // focusPersonId is now optional, so we don't validate it here
         });

         if (!validation.isValid) {
            setErrors(validation.errors);
            setLoading(false);
            return;
         }

         // Check for duplicate qasba
         if (existingFamilies.some(f => f.qasba === formData.qasba.toLowerCase())) {
            setErrors({ qasba: 'Family identifier already exists' });
            setLoading(false);
            return;
         }

         // Create family
         const familyPayload = {
            name: formData.name.trim(),
            qasba: formData.qasba.toLowerCase().trim(),
            focus_person_id: formData.focusPersonId,
            description: formData.description?.trim() || null,
            region: formData.region?.trim() || null
         };

         const newFamily = await createFamily(familyPayload);

         setSuccessMessage(`✅ Family "${formData.name}" created successfully!`);

         // Reset form
         setTimeout(() => {
            setFormData({
               name: '',
               qasba: '',
               focusPersonId: null,
               focusPersonName: '',
               description: '',
               region: ''
            });
            setErrors({});
            if (onFamilyAdded) onFamilyAdded(newFamily);
         }, 1500);
      } catch (error) {
         setErrors({ submit: error.message || 'Failed to create family' });
      } finally {
         setLoading(false);
      }
   };

   return (
      <div style={styles.container}>
         <h2>Add New Family</h2>

         {successMessage && (
            <div style={styles.successMessage}>{successMessage}</div>
         )}

         {errors.submit && (
            <div style={styles.errorBox}>{errors.submit}</div>
         )}

         <form onSubmit={handleSubmit}>
            {/* Family Name */}
            <div style={styles.formGroup}>
               <label>Family Name *</label>
               <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Nasab Simla, Nasab Miranbigha"
                  style={errors.name ? styles.inputError : styles.input}
               />
               {errors.name && <span style={styles.errorText}>{errors.name}</span>}
            </div>

            {/* Family Identifier (Qasba) */}
            <div style={styles.formGroup}>
               <label>Family Identifier (Qasba) *</label>
               <input
                  type="text"
                  name="qasba"
                  value={formData.qasba}
                  onChange={handleInputChange}
                  placeholder="Auto-generated from name (e.g., nasab-simla)"
                  style={errors.qasba ? styles.inputError : styles.input}
               />
               {errors.qasba && <span style={styles.errorText}>{errors.qasba}</span>}
               <small>Used in URLs - lowercase, hyphens, no spaces</small>
            </div>

            {/* Focus Person */}
            <div style={styles.formGroup}>
               <label>Focus Person (Reference/Root) - Optional</label>
               {!formData.focusPersonId ? (
                  <div style={styles.searchContainer}>
                     <input
                        type="text"
                        placeholder="Search for person (type at least 2 characters)..."
                        value={searchQuery}
                        onChange={(e) => handleSearchQueryChange(e.target.value)}
                        onFocus={() => searchQuery && setShowSearch(true)}
                        style={styles.input}
                     />
                     {errors.focusPersonId && <span style={styles.errorText}>{errors.focusPersonId}</span>}
                     {showSearch && searchResults.length > 0 && (
                        <div style={styles.searchResults}>
                           {searchResults.map(person => (
                              <div
                                 key={person.id}
                                 onClick={() => handleSelectPerson(person)}
                                 style={styles.searchResult}
                              >
                                 <div style={styles.resultName}>{person.name}</div>
                                 <div style={styles.resultMeta}>
                                    {person.gender === 'male' ? '👨' : '👩'} {person.alive ? '🟢 Living' : '⚫ Deceased'}
                                    {person.dateOfBirth && ` • ${person.dateOfBirth}`}
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                     {showSearch && searchResults.length === 0 && searchQuery.length >= 2 && (
                        <div style={styles.noResults}>No persons found</div>
                     )}
                  </div>
               ) : (
                  <div style={styles.selectedPersonBox}>
                     <div>
                        <strong>{formData.focusPersonName}</strong>
                        <small style={styles.selectedPersonId}> (Selected as focus person)</small>
                     </div>
                     <button
                        type="button"
                        onClick={() => {
                           setFormData(prev => ({
                              ...prev,
                              focusPersonId: null,
                              focusPersonName: ''
                           }));
                           setSearchQuery('');
                           setShowSearch(false);
                        }}
                        style={styles.changeFocusBtn}
                     >
                        Change
                     </button>
                  </div>
               )}
            </div>

            {/* Description */}
            <div style={styles.formGroup}>
               <label>Description (Optional)</label>
               <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this family branch"
                  rows="3"
                  style={styles.textarea}
               />
            </div>

            {/* Region */}
            <div style={styles.formGroup}>
               <label>Region (Optional)</label>
               <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  placeholder="e.g., Uttar Pradesh, Bihar, etc."
                  style={styles.input}
               />
            </div>

            {/* Action Buttons */}
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
                  {loading ? '⏳ Creating...' : '✓ Create Family'}
               </button>
            </div>
         </form>
      </div>
   );
}

// STYLES
const styles = {
   container: {
      background: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '25px',
      maxWidth: '500px'
   },
   formGroup: {
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column'
   },
   input: {
      padding: '12px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'inherit',
      marginTop: '6px'
   },
   inputError: {
      padding: '12px',
      border: '2px solid #dc3545',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'inherit',
      marginTop: '6px'
   },
   textarea: {
      padding: '12px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'inherit',
      marginTop: '6px',
      resize: 'vertical',
      minHeight: '80px'
   },
   errorText: {
      color: '#dc3545',
      fontSize: '12px',
      marginTop: '5px'
   },
   errorBox: {
      background: '#f8d7da',
      color: '#721c24',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '15px',
      border: '1px solid #f5c6cb'
   },
   successMessage: {
      background: '#d4edda',
      color: '#155724',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '15px',
      border: '1px solid #c3e6cb'
   },
   searchContainer: {
      position: 'relative'
   },
   searchResults: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '4px',
      maxHeight: '250px',
      overflowY: 'auto',
      zIndex: 10,
      marginTop: '-8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
   },
   searchResult: {
      padding: '12px',
      borderBottom: '1px solid #eee',
      cursor: 'pointer',
      fontSize: '13px',
      transition: 'background 0.2s'
   },
   resultName: {
      fontWeight: '600',
      marginBottom: '4px'
   },
   resultMeta: {
      fontSize: '12px',
      color: '#666'
   },
   selectedPerson: {
      color: '#28a745',
      display: 'block',
      marginTop: '5px'
   },
   buttonGroup: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
      marginTop: '25px'
   },
   cancelBtn: {
      background: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background 0.2s'
   },
   submitBtn: {
      background: '#28a745',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background 0.2s'
   },
   selectedPersonBox: {
      background: '#e7f3ff',
      border: '1px solid #b3d9ff',
      borderRadius: '4px',
      padding: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px'
   },
   selectedPersonId: {
      color: '#666',
      fontSize: '12px'
   },
   changeFocusBtn: {
      background: '#17a2b8',
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '12px',
      whiteSpace: 'nowrap'
   },
   noResults: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '12px',
      textAlign: 'center',
      color: '#999',
      fontSize: '13px',
      zIndex: 10,
      marginTop: '-8px'
   }
};
