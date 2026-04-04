'use client';

import { useState, useEffect } from 'react';

export default function ContributorsModal({ isOpen, onClose, onContributorsUpdate }) {
   const [view, setView] = useState('list');
   const [contributors, setContributors] = useState([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedContributor, setSelectedContributor] = useState(null);
   const [formData, setFormData] = useState({ email: '', name: '' });
   const [addedContributor, setAddedContributor] = useState(null);

   const fetchContributors = async () => {
      try {
         setLoading(true);
         setError('');
         const res = await fetch('/api/contributors/list');
         if (!res.ok) throw new Error('Failed to fetch contributors');
         const data = await res.json();
         setContributors(Array.isArray(data) ? data : data.contributors || []);
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (isOpen && view === 'list') {
         fetchContributors();
      }
   }, [isOpen, view]);

   const handleAdd = async (e) => {
      e.preventDefault();
      try {
         setLoading(true);
         setError('');
         const res = await fetch('/api/contributors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
         });

         if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to add contributor');
         }

         const data = await res.json();
         setAddedContributor(data);
         setFormData({ email: '', name: '' });
         setView('success');
         fetchContributors();
         onContributorsUpdate?.();
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   const handleUpdate = async (e) => {
      e.preventDefault();
      try {
         setLoading(true);
         setError('');
         const res = await fetch('/api/contributors', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               id: selectedContributor.id,
               name: formData.name,
            }),
         });

         if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to update contributor');
         }

         setFormData({ email: '', name: '' });
         setSelectedContributor(null);
         setView('list');
         fetchContributors();
         onContributorsUpdate?.();
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   const handleDelete = async () => {
      try {
         setLoading(true);
         setError('');
         const res = await fetch('/api/contributors', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedContributor.id }),
         });

         if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to delete contributor');
         }

         setSelectedContributor(null);
         setView('list');
         fetchContributors();
         onContributorsUpdate?.();
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   const filteredContributors = contributors.filter(
      (c) =>
         c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         c.email.toLowerCase().includes(searchTerm.toLowerCase())
   );

   if (!isOpen) return null;

   return (
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog">
         <div className="modal-dialog modal-lg" style={{ maxWidth: '900px', alignSelf: 'center' }}>
            <div className="modal-content">
               <div className="modal-header border-0" style={{ background: '#1e3a5f' }}>
                  <h5 className="modal-title text-white">
                     <i className="fas fa-users me-2"></i>
                     Manage Contributors
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
               </div>

               {error && (
                  <div className="alert alert-danger m-3 mb-0">
                     <i className="fas fa-exclamation-circle me-2"></i>{error}
                  </div>
               )}

               {view === 'list' && (
                  <div className="modal-body">
                     <div className="row g-3 mb-3">
                        <div className="col-md-8">
                           <input
                              type="text"
                              className="form-control"
                              placeholder="Search contributors by name or email..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                           />
                        </div>
                        <div className="col-md-4">
                           <button
                              className="btn btn-primary w-100"
                              onClick={() => {
                                 setFormData({ email: '', name: '' });
                                 setView('add');
                              }}
                           >
                              <i className="fas fa-plus me-2"></i>Add Contributor
                           </button>
                        </div>
                     </div>

                     {loading ? (
                        <div className="text-center py-5">
                           <div className="spinner-border text-primary me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                           </div>
                           Loading contributors...
                        </div>
                     ) : filteredContributors.length === 0 ? (
                        <div className="alert alert-info">
                           <i className="fas fa-info-circle me-2"></i>
                           No contributors found
                        </div>
                     ) : (
                        <div className="table-responsive">
                           <table className="table table-hover">
                              <thead className="table-light">
                                 <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th className="text-end">Actions</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {filteredContributors.map((contributor) => (
                                    <tr key={contributor.id}>
                                       <td className="fw-medium">{contributor.name}</td>
                                       <td>{contributor.email}</td>
                                       <td className="text-end">
                                          <button
                                             className="btn btn-sm btn-outline-primary me-2"
                                             onClick={() => {
                                                setSelectedContributor(contributor);
                                                setFormData({ email: contributor.email, name: contributor.name });
                                                setView('edit');
                                             }}
                                          >
                                             <i className="fas fa-edit me-1"></i>Edit
                                          </button>
                                          <button
                                             className="btn btn-sm btn-outline-danger"
                                             onClick={() => {
                                                setSelectedContributor(contributor);
                                                setView('delete');
                                             }}
                                          >
                                             <i className="fas fa-trash me-1"></i>Delete
                                          </button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                  </div>
               )}

               {view === 'add' && (
                  <div className="modal-body">
                     <form onSubmit={handleAdd}>
                        <div className="alert alert-info mb-3">
                           <i className="fas fa-info-circle me-2"></i>
                           <strong>Note:</strong> Enter a valid, working email address (e.g., gmail.com, outlook.com). The contributor will receive a link to set their password.
                        </div>
                        <div className="mb-3">
                           <label className="form-label fw-bold">Email *</label>
                           <input
                              type="email"
                              className="form-control"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="contributor@gmail.com"
                           />
                        </div>
                        <div className="mb-3">
                           <label className="form-label fw-bold">Name *</label>
                           <input
                              type="text"
                              className="form-control"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Contributor name"
                           />
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                           <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                              <i className="fas fa-times me-1"></i>Cancel
                           </button>
                           <button type="submit" className="btn btn-primary" disabled={loading}>
                              <i className="fas fa-check me-1"></i>
                              {loading ? 'Adding...' : 'Add Contributor'}
                           </button>
                        </div>
                     </form>
                  </div>
               )}

               {view === 'edit' && (
                  <div className="modal-body">
                     <form onSubmit={handleUpdate}>
                        <div className="mb-3">
                           <label className="form-label fw-bold">Email</label>
                           <input
                              type="email"
                              className="form-control"
                              value={formData.email}
                              disabled
                           />
                        </div>
                        <div className="mb-3">
                           <label className="form-label fw-bold">Name *</label>
                           <input
                              type="text"
                              className="form-control"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Contributor name"
                           />
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                           <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                              <i className="fas fa-times me-1"></i>Cancel
                           </button>
                           <button type="submit" className="btn btn-primary" disabled={loading}>
                              <i className="fas fa-check me-1"></i>
                              {loading ? 'Updating...' : 'Update Contributor'}
                           </button>
                        </div>
                     </form>
                  </div>
               )}

               {view === 'delete' && (
                  <div className="modal-body">
                     <div className="alert alert-danger mb-3">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        <strong>Confirm Deletion</strong>
                     </div>
                     <p>
                        Are you sure you want to delete <strong>{selectedContributor.name}</strong> ({selectedContributor.email})?
                     </p>
                     <div className="alert alert-warning">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        This action cannot be undone.
                     </div>
                     <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-secondary" onClick={() => setView('list')}>
                           <i className="fas fa-times me-1"></i>Cancel
                        </button>
                        <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                           <i className="fas fa-trash me-1"></i>
                           {loading ? 'Deleting...' : 'Delete Contributor'}
                        </button>
                     </div>
                  </div>
               )}

               {view === 'success' && addedContributor && (
                  <div className="modal-body">
                     <div className="alert alert-success mb-3">
                        <i className="fas fa-check-circle me-2"></i>
                        <strong>Contributor Added Successfully!</strong>
                     </div>
                     <p>Share this password setup link with <strong>{addedContributor.email}</strong>:</p>
                     <div className="input-group mb-3">
                        <code className="form-control bg-light">{addedContributor.passwordResetLink}</code>
                        <button
                           className="btn btn-outline-primary"
                           onClick={() => {
                              navigator.clipboard.writeText(addedContributor.passwordResetLink);
                              alert('Link copied to clipboard!');
                           }}
                        >
                           <i className="fas fa-copy me-1"></i>Copy
                        </button>
                     </div>
                     <p className="text-muted small">
                        <i className="fas fa-info-circle me-1"></i>
                        You can send this link via email, message, or however you prefer. They'll click it to set their password.
                     </p>
                     <div className="d-flex justify-content-end">
                        <button className="btn btn-primary" onClick={() => setView('list')}>
                           <i className="fas fa-arrow-left me-1"></i>Back to List
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
