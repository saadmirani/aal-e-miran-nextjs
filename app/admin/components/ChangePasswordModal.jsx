'use client';

import { useState } from 'react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

export default function ChangePasswordModal({ isOpen, onClose, userEmail }) {
   const [view, setView] = useState('form'); // 'form', 'success', 'error'
   const [currentPassword, setCurrentPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
   const [showNewPassword, setShowNewPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

   const validatePassword = (password) => {
      if (password.length < 6) {
         return 'Password must be at least 6 characters long';
      }
      return '';
   };

   const handleChangePassword = async (e) => {
      e.preventDefault();
      try {
         setLoading(true);
         setError('');

         // Validate passwords
         const validationError = validatePassword(newPassword);
         if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
         }

         if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
         }

         if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            setLoading(false);
            return;
         }

         const user = auth.currentUser;
         if (!user) {
            setError('No user logged in');
            setLoading(false);
            return;
         }

         // Reauthenticate user with current password
         try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
         } catch (authError) {
            if (authError.code === 'auth/wrong-password') {
               setError('Current password is incorrect');
            } else {
               setError('Authentication failed. Please try again.');
            }
            setLoading(false);
            return;
         }

         // Update password
         await updatePassword(user, newPassword);

         // Success
         setView('success');
         setCurrentPassword('');
         setNewPassword('');
         setConfirmPassword('');
      } catch (err) {
         setError(err.message || 'Failed to change password');
         console.error('Change password error:', err);
      } finally {
         setLoading(false);
      }
   };

   const handleClose = () => {
      setView('form');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      onClose();
   };

   if (!isOpen) return null;

   return (
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog">
         <div className="modal-dialog" style={{ maxWidth: '500px', alignSelf: 'center' }}>
            <div className="modal-content">
               <div className="modal-header border-0" style={{ background: '#1e3a5f' }}>
                  <h5 className="modal-title text-white">
                     <i className="fas fa-lock me-2"></i>
                     Change Password
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleClose}></button>
               </div>

               {view === 'form' && (
                  <div className="modal-body">
                     <form onSubmit={handleChangePassword}>
                        <p className="text-muted small mb-3">
                           <i className="fas fa-info-circle me-2"></i>
                           Enter your current password and create a new one. For security, your new password must be at least 6 characters long.
                        </p>

                        {error && (
                           <div className="alert alert-danger" role="alert">
                              <i className="fas fa-exclamation-circle me-2"></i>{error}
                           </div>
                        )}

                        <div className="mb-3">
                           <label className="form-label fw-bold">Current Password *</label>
                           <div className="input-group">
                              <input
                                 type={showCurrentPassword ? 'text' : 'password'}
                                 className="form-control"
                                 value={currentPassword}
                                 onChange={(e) => setCurrentPassword(e.target.value)}
                                 placeholder="Enter your current password"
                                 required
                                 disabled={loading}
                              />
                              <button
                                 type="button"
                                 className="btn btn-outline-secondary"
                                 onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                 disabled={loading}
                              >
                                 <i className={`fas fa-eye${!showCurrentPassword ? '' : '-slash'}`}></i>
                              </button>
                           </div>
                        </div>

                        <div className="mb-3">
                           <label className="form-label fw-bold">New Password *</label>
                           <div className="input-group">
                              <input
                                 type={showNewPassword ? 'text' : 'password'}
                                 className="form-control"
                                 value={newPassword}
                                 onChange={(e) => setNewPassword(e.target.value)}
                                 placeholder="Enter your new password"
                                 required
                                 disabled={loading}
                              />
                              <button
                                 type="button"
                                 className="btn btn-outline-secondary"
                                 onClick={() => setShowNewPassword(!showNewPassword)}
                                 disabled={loading}
                              >
                                 <i className={`fas fa-eye${!showNewPassword ? '' : '-slash'}`}></i>
                              </button>
                           </div>
                        </div>

                        <div className="mb-3">
                           <label className="form-label fw-bold">Confirm New Password *</label>
                           <div className="input-group">
                              <input
                                 type={showConfirmPassword ? 'text' : 'password'}
                                 className="form-control"
                                 value={confirmPassword}
                                 onChange={(e) => setConfirmPassword(e.target.value)}
                                 placeholder="Confirm your new password"
                                 required
                                 disabled={loading}
                              />
                              <button
                                 type="button"
                                 className="btn btn-outline-secondary"
                                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                 disabled={loading}
                              >
                                 <i className={`fas fa-eye${!showConfirmPassword ? '' : '-slash'}`}></i>
                              </button>
                           </div>
                        </div>

                        <div className="d-flex gap-2 justify-content-end">
                           <button type="button" className="btn btn-danger" onClick={handleClose} disabled={loading}>
                              <i className="fas fa-times me-1"></i>Cancel
                           </button>
                           <button type="submit" className="btn btn-success" disabled={loading}>
                              <i className="fas fa-check me-1"></i>
                              {loading ? 'Changing...' : 'Change Password'}
                           </button>
                        </div>
                     </form>
                  </div>
               )}

               {view === 'success' && (
                  <div className="modal-body">
                     <div className="text-center py-3">
                        <div className="mb-3">
                           <i className="fas fa-check-circle text-success" style={{ fontSize: '48px' }}></i>
                        </div>
                        <h5>Password Changed Successfully</h5>
                        <p className="text-muted mb-3">Your password has been updated. Use your new password to log in next time.</p>
                        <button className="btn btn-primary w-100" onClick={handleClose}>
                           <i className="fas fa-check me-1"></i>Close
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
