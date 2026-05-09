'use client';

import { useState, useEffect } from 'react';
import './KhanqahManagementModal.css';

export default function KhanqahManagementModal({ isOpen, onClose }) {
   const [khanqahs, setKhanqahs] = useState([]);
   const [loading, setLoading] = useState(false);
   const [editingId, setEditingId] = useState(null);
   const [formData, setFormData] = useState({
      name: '',
      sajjadaNashin: '',
      location: '',
      contactNumber: '',
   });

   useEffect(() => {
      if (isOpen) {
         fetchKhanqahs();
      }
   }, [isOpen]);

   const fetchKhanqahs = async () => {
      try {
         setLoading(true);
         const response = await fetch('/api/khanqahs', {
            credentials: 'include',
         });
         if (!response.ok) throw new Error('Failed to fetch');
         const data = await response.json();
         setKhanqahs(data.khanqahs);
      } catch (error) {
         alert('Error fetching khanqahs: ' + error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleAddNew = () => {
      setEditingId(null);
      setFormData({
         name: '',
         sajjadaNashin: '',
         location: '',
         contactNumber: '',
      });
   };

   const handleEdit = (khanqah) => {
      setEditingId(khanqah.id);
      setFormData({
         name: khanqah.name,
         sajjadaNashin: khanqah.sajjadaNashin,
         location: khanqah.location,
         contactNumber: khanqah.contactNumber,
      });
   };

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: value,
      }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!formData.name || !formData.sajjadaNashin || !formData.location || !formData.contactNumber) {
         alert('Please fill in all fields');
         return;
      }

      try {
         const method = editingId ? 'PUT' : 'POST';
         const url = editingId ? `/api/khanqahs/${editingId}` : '/api/khanqahs';

         const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData),
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save');
         }

         alert(editingId ? 'Khanqah updated successfully' : 'Khanqah added successfully');
         setFormData({ name: '', sajjadaNashin: '', location: '', contactNumber: '' });
         setEditingId(null);
         fetchKhanqahs();
      } catch (error) {
         alert('Error: ' + error.message);
      }
   };

   const handleDelete = async (id) => {
      if (!confirm('Are you sure you want to delete this Khanqah?')) return;

      try {
         const response = await fetch(`/api/khanqahs/${id}`, {
            method: 'DELETE',
            credentials: 'include',
         });
         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete');
         }
         alert('Khanqah deleted successfully');
         fetchKhanqahs();
      } catch (error) {
         alert('Error: ' + error.message);
      }
   };

   if (!isOpen) return null;

   return (
      <div className="khanqah-modal-overlay" onClick={onClose}>
         <div className="khanqah-modal" onClick={(e) => e.stopPropagation()}>
            <div className="khanqah-modal-header">
               <h2>Manage Khanqahs</h2>
               <button className="khanqah-modal-close" onClick={onClose}>×</button>
            </div>

            <div className="khanqah-modal-content">
               {/* Add/Edit Form */}
               <div className="khanqah-form-section">
                  <h3>{editingId ? 'Edit Khanqah' : 'Add New Khanqah'}</h3>
                  <form onSubmit={handleSubmit} className="khanqah-form">
                     <div className="khanqah-form-group">
                        <label htmlFor="name">Khanqah Name *</label>
                        <input
                           type="text"
                           id="name"
                           name="name"
                           value={formData.name}
                           onChange={handleChange}
                           placeholder="Enter Khanqah name"
                        />
                     </div>
                     <div className="khanqah-form-group">
                        <label htmlFor="sajjadaNashin">Sajjada Nashin *</label>
                        <input
                           type="text"
                           id="sajjadaNashin"
                           name="sajjadaNashin"
                           value={formData.sajjadaNashin}
                           onChange={handleChange}
                           placeholder="Enter Sajjada Nashin name"
                        />
                     </div>
                     <div className="khanqah-form-group">
                        <label htmlFor="location">Location *</label>
                        <input
                           type="text"
                           id="location"
                           name="location"
                           value={formData.location}
                           onChange={handleChange}
                           placeholder="Enter location"
                        />
                     </div>
                     <div className="khanqah-form-group">
                        <label htmlFor="contactNumber">Contact Number *</label>
                        <input
                           type="tel"
                           id="contactNumber"
                           name="contactNumber"
                           value={formData.contactNumber}
                           onChange={handleChange}
                           placeholder="Enter contact number"
                        />
                     </div>
                     <div className="khanqah-form-buttons">
                        <button type="submit" className="btn btn-primary">
                           {editingId ? 'Update' : 'Add'} Khanqah
                        </button>
                        {editingId && (
                           <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleAddNew}
                           >
                              Clear
                           </button>
                        )}
                     </div>
                  </form>
               </div>

               {/* Khanqah List */}
               <div className="khanqah-list-section">
                  <h3>Khanqahs List</h3>
                  {loading ? (
                     <p>Loading...</p>
                  ) : khanqahs.length === 0 ? (
                     <p className="no-data">No Khanqahs found. Add one to get started.</p>
                  ) : (
                     <div className="khanqah-table-wrapper">
                        <table className="khanqah-table">
                           <thead>
                              <tr>
                                 <th>Name</th>
                                 <th>Sajjada Nashin</th>
                                 <th>Location</th>
                                 <th>Contact</th>
                                 <th>Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {khanqahs.map((khanqah) => (
                                 <tr key={khanqah.id}>
                                    <td>{khanqah.name}</td>
                                    <td>{khanqah.sajjadaNashin}</td>
                                    <td>{khanqah.location}</td>
                                    <td>{khanqah.contactNumber}</td>
                                    <td>
                                       <button
                                          className="btn-small btn-edit"
                                          onClick={() => handleEdit(khanqah)}
                                       >
                                          Edit
                                       </button>
                                       <button
                                          className="btn-small btn-delete"
                                          onClick={() => handleDelete(khanqah.id)}
                                       >
                                          Delete
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
