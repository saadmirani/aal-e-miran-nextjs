'use client';

import { useState } from 'react';
import { createFamily } from '../utils/api';
import { sanitizeQasba } from '../utils/validation';

export default function QuickFamilyModal({ onFamilyCreated, onClose }) {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [formData, setFormData] = useState({ name: '', qasba: '', region: '' });

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => {
         const updated = { ...prev, [name]: value };
         if (name === 'name') updated.qasba = sanitizeQasba(value);
         return updated;
      });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.name.trim()) { setError('Family name is required'); return; }
      if (!formData.qasba.trim()) { setError('Family identifier is required'); return; }

      try {
         setLoading(true);
         setError('');
         const newFamily = await createFamily({
            name: formData.name.trim(),
            qasba: formData.qasba.trim().toLowerCase(),
            region: formData.region.trim() || null,
            description: null
         });
         onFamilyCreated(newFamily);
      } catch (err) {
         setError(err.message || 'Failed to create family');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div style={styles.overlay} onClick={onClose}>
         <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.header}>
               <h4 style={{ margin: 0 }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>
                  Quick Create Family
               </h4>
               <button style={styles.closeBtn} onClick={onClose}>
                  <i className="fa-solid fa-xmark"></i>
               </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
               <div style={styles.formGroup}>
                  <label style={styles.label}>Family Name *</label>
                  <input
                     type="text"
                     name="name"
                     value={formData.name}
                     onChange={handleChange}
                     style={styles.input}
                     placeholder="e.g., Miran Bigha"
                     autoFocus
                     required
                  />
               </div>

               <div style={styles.formGroup}>
                  <label style={styles.label}>Identifier (auto-generated)</label>
                  <input
                     type="text"
                     name="qasba"
                     value={formData.qasba}
                     onChange={handleChange}
                     style={{ ...styles.input, backgroundColor: '#f5f5f5' }}
                     placeholder="auto-generated-from-name"
                  />
               </div>

               <div style={styles.formGroup}>
                  <label style={styles.label}>Region</label>
                  <input
                     type="text"
                     name="region"
                     value={formData.region}
                     onChange={handleChange}
                     style={styles.input}
                     placeholder="e.g., Tekari, Gaya, Bihar"
                  />
               </div>

               <div style={styles.actions}>
                  <button type="button" onClick={onClose} style={styles.cancelBtn} disabled={loading}>Cancel</button>
                  <button type="submit" style={styles.saveBtn} disabled={loading}>
                     {loading
                        ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>Creating...</>
                        : <><i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i>Create Family</>
                     }
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}

const styles = {
   overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
   },
   modal: {
      background: 'white',
      borderRadius: '8px',
      padding: '24px',
      width: '90%',
      maxWidth: '420px',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
   },
   header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      paddingBottom: '10px',
      borderBottom: '2px solid #eee'
   },
   closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      color: '#666',
      padding: '4px 8px'
   },
   error: {
      padding: '8px 12px',
      background: '#fff3f3',
      border: '1px solid #ffcdd2',
      color: '#c62828',
      borderRadius: '4px',
      marginBottom: '12px',
      fontSize: '13px'
   },
   formGroup: {
      marginBottom: '14px'
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
   actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '18px',
      paddingTop: '14px',
      borderTop: '1px solid #eee'
   },
   cancelBtn: {
      padding: '8px 16px',
      background: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '13px',
      cursor: 'pointer'
   },
   saveBtn: {
      padding: '8px 16px',
      background: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer'
   }
};
