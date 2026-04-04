'use client';

import { useState, useEffect } from 'react';

export default function DeleteBiographyModal({ isOpen, onClose, onDeleted }) {
   const [biographies, setBiographies] = useState([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [loading, setLoading] = useState(false);
   const [deleting, setDeleting] = useState(null);
   const [confirmDelete, setConfirmDelete] = useState(null);

   useEffect(() => {
      if (isOpen) {
         fetchBiographies();
      }
   }, [isOpen]);

   const fetchBiographies = async () => {
      try {
         setLoading(true);
         const response = await fetch('/api/biographies/list');

         if (!response.ok) {
            const error = await response.json();
            if (error.code === 'auth/id-token-expired') {
               alert('Session expired. Please login again.');
               return;
            }
            throw new Error(error.error || 'Failed to fetch biographies');
         }

         const data = await response.json();
         setBiographies(data.biographies || []);
      } catch (err) {
         alert(err.message || 'Error fetching biographies');
      } finally {
         setLoading(false);
      }
   };

   const handleDeleteClick = (bio) => {
      setConfirmDelete(bio);
   };

   const handleConfirmDelete = async () => {
      if (!confirmDelete) return;

      try {
         setDeleting(confirmDelete.id);

         const response = await fetch(`/api/biographies/${confirmDelete.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
         });

         if (!response.ok) {
            const error = await response.json();

            if (error.code === 'auth/id-token-expired') {
               alert('Session expired. Please login again.');
               onClose();
               return;
            }

            throw new Error(error.error || 'Failed to delete biography');
         }

         setBiographies(biographies.filter(b => b.id !== confirmDelete.id));
         setConfirmDelete(null);

         alert('Biography deleted successfully!');
         if (onDeleted) {
            onDeleted();
         }
      } catch (err) {
         alert(err.message || 'Error deleting biography');
      } finally {
         setDeleting(null);
      }
   };

   if (!isOpen) return null;

   const filteredBiographies = biographies.filter(bio =>
      bio.english?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bio.urdu?.name?.toLowerCase().includes(searchTerm.toLowerCase())
   );

   return (
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog">
         <div className="modal-dialog modal-xl" style={{ maxWidth: '1000px', alignSelf: 'center' }}>
            <div className="modal-content">
               {confirmDelete ? (
                  <>
                     {/* Confirmation Modal */}
                     <div className="modal-header border-0" style={{ background: '#1e3a5f' }}>
                        <h5 className="modal-title text-white">
                           <i className="fas fa-exclamation-triangle me-2"></i>
                           Confirm Deletion
                        </h5>
                     </div>
                     <div className="modal-body">
                        <p className="lead mb-3">Are you sure you want to delete this biography?</p>
                        <div className="alert alert-info mb-3">
                           <p className="mb-1"><strong>Name:</strong> {confirmDelete.urdu?.name || confirmDelete.english?.name}</p>
                           <p className="mb-0"><strong>Father:</strong> {confirmDelete.urdu?.father || 'N/A'}</p>
                        </div>
                        <div className="alert alert-warning">
                           <i className="fas fa-exclamation-circle me-2"></i>
                           <strong>Warning:</strong> This action cannot be undone. All data will be permanently deleted.
                        </div>
                     </div>
                     <div className="modal-footer border-top">
                        <button
                           type="button"
                           className="btn btn-secondary"
                           onClick={() => setConfirmDelete(null)}
                           disabled={deleting}
                        >
                           <i className="fas fa-times me-1"></i>Cancel
                        </button>
                        <button
                           type="button"
                           className="btn btn-danger"
                           onClick={handleConfirmDelete}
                           disabled={deleting}
                        >
                           <i className="fas fa-trash me-1"></i>
                           {deleting ? 'Deleting...' : 'Delete Permanently'}
                        </button>
                     </div>
                  </>
               ) : (
                  <>
                     {/* Main Modal */}
                     <div className="modal-header border-0" style={{ background: '#1e3a5f' }}>
                        <h5 className="modal-title text-white">
                           <i className="fas fa-trash-alt me-2"></i>
                           Delete Biography
                        </h5>
                        <button
                           type="button"
                           className="btn-close btn-close-white"
                           onClick={onClose}
                        ></button>
                     </div>

                     <div className="modal-body">
                        <div className="mb-3">
                           <input
                              type="text"
                              className="form-control form-control-lg"
                              placeholder="Search biographies by name..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                           />
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                           {loading ? (
                              <div className="text-center py-5">
                                 <div className="spinner-border text-primary me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                 </div>
                                 <span>Loading biographies...</span>
                              </div>
                           ) : filteredBiographies.length === 0 ? (
                              <div className="alert alert-info">
                                 <i className="fas fa-info-circle me-2"></i>
                                 {biographies.length === 0 ? 'No biographies found' : 'No matches found'}
                              </div>
                           ) : (
                              <div className="list-group">
                                 {filteredBiographies.map((bio) => (
                                    <div key={bio.id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                                       <div>
                                          <h6 className="mb-1">{bio.english?.name || bio.urdu?.name || 'Unnamed'}</h6>
                                          <small className="text-muted">
                                             {bio.english?.father ? `Son of ${bio.english.father}` : bio.urdu?.father ? `پسر ${bio.urdu.father}` : 'N/A'}
                                          </small>
                                       </div>
                                       <button
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => handleDeleteClick(bio)}
                                          disabled={deleting === bio.id}
                                       >
                                          <i className="fas fa-trash me-1"></i>
                                          {deleting === bio.id ? 'Deleting...' : 'Delete'}
                                       </button>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="modal-footer border-top">
                        <button
                           type="button"
                           className="btn btn-secondary"
                           onClick={onClose}
                        >
                           <i className="fas fa-times me-1"></i>Close
                        </button>
                     </div>
                  </>
               )}
            </div>
         </div>
      </div>
   );
}
