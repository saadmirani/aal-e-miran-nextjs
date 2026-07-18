'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebaseClient';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DeleteBiographyModal from '@/app/admin/components/DeleteBiographyModal';
import ContributorsModal from '@/app/admin/components/ContributorsModal';
import AdminsModal from '@/app/admin/components/AdminsModal';
import ChangePasswordModal from '@/app/admin/components/ChangePasswordModal';
import KhanqahManagementModal from '@/app/admin/components/KhanqahManagementModal';
import GlobalDataTab from '@/app/admin/components/GlobalDataTab';
import './dashboard.css';

export default function AdminDashboard() {
   const router = useRouter();
   const { isAdmin, logout: logoutAuth, loading: authLoading } = useAuth();
   const [user, setUser] = useState(null);
   const [adminName, setAdminName] = useState('');
   const [userRole, setUserRole] = useState(''); // 'admin' or 'contributor'
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [activeTab, setActiveTab] = useState('biographies'); // active tab
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [showContributorsModal, setShowContributorsModal] = useState(false);
   const [showAdminsModal, setShowAdminsModal] = useState(false);
   const [showUserDropdown, setShowUserDropdown] = useState(false);
   const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
   const [showKhanqahModal, setShowKhanqahModal] = useState(false);

   // Close dropdown when clicking outside - MUST be called before early returns
   useEffect(() => {
      const handleClickOutside = (event) => {
         const userMenu = document.querySelector('.user-menu');
         if (userMenu && !userMenu.contains(event.target)) {
            setShowUserDropdown(false);
         }
      };

      if (showUserDropdown) {
         document.addEventListener('mousedown', handleClickOutside);
         return () => document.removeEventListener('mousedown', handleClickOutside);
      }
   }, [showUserDropdown]);

   // Check authentication on mount - HIGHEST PRIORITY
   useEffect(() => {
      if (authLoading) return;

      // If user is not admin according to context, redirect immediately
      if (!isAdmin) {
         router.push('/admin/login');
         return;
      }

      // Get user data from localStorage
      const adminData = localStorage.getItem('adminData');
      if (!adminData) {
         // No data in localStorage but context says admin? Force logout
         logoutAuth();
         router.push('/admin/login');
         return;
      }

      const parsed = JSON.parse(adminData);
      setAdminName(parsed.name);
      setUserRole(parsed.role);
      setActiveTab(parsed.role === 'admin' ? 'biographies' : 'biographies');

      const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
         if (currentUser) {
            setUser(currentUser);
            // Refresh the ID token and update the session cookie
            try {
               const freshToken = await currentUser.getIdToken(true);
               await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: freshToken }),
               });
            } catch (err) {
               console.error('Token refresh failed:', err);
            }
         } else {
            // Fallback redirect if Firebase says not authenticated
            logoutAuth();
            router.push('/admin/login');
         }
         setLoading(false);
      });

      return () => unsubscribe();
   }, [isAdmin, authLoading, router, logoutAuth]);

   // Return early if still checking auth or not authenticated
   if (authLoading || !isAdmin) {
      return (
         <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Checking authentication...</p>
         </div>
      );
   }

   const handleLogout = async () => {
      try {
         // Sign out from Firebase
         await signOut(auth);

         // Clear session cookie via API
         await fetch('/api/auth/logout', { method: 'POST' });

         // Clear localStorage and update context
         localStorage.removeItem('adminData');
         logoutAuth();

         // Close dropdown
         setShowUserDropdown(false);

         // Redirect to home
         router.push('/');
      } catch (err) {
         setError(err.message || 'Logout failed');
      }
   };

   if (loading) {
      return (
         <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
         </div>
      );
   }

   return (
      <div className="admin-dashboard">
         {/* Header */}
         <header className="dashboard-header">
            <div className="header-content">
               <h1>{userRole === 'admin' ? 'Admin Dashboard' : 'Contributor Dashboard'}</h1>
               <p>Bazm-e-Ansaab Genealogy Management</p>
            </div>
            <div className="header-actions">
               <span className="user-role-badge">{userRole.toUpperCase()}</span>
               {adminName && (
                  <div className="user-menu">
                     <button
                        className="user-name-button"
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                     >
                        {adminName}
                        <span className="dropdown-arrow">▼</span>
                     </button>
                     {showUserDropdown && (
                        <div className="user-dropdown-menu">
                           <button
                              className="dropdown-item"
                              onClick={() => {
                                 setShowChangePasswordModal(true);
                                 setShowUserDropdown(false);
                              }}
                           >
                              <i className="fas fa-lock"></i> Change Password
                           </button>
                           <button className="dropdown-item logout-item" onClick={handleLogout}>
                              <i className="fas fa-sign-out-alt"></i> Logout
                           </button>
                        </div>
                     )}
                  </div>
               )}
            </div>
         </header>

         {/* Main Content */}
         <main className="dashboard-main">
            <div className="dashboard-container">
               {/* Navigation Tabs */}
               <nav className="dashboard-tabs">
                  <button
                     className={`tab ${activeTab === 'biographies' ? 'active' : ''}`}
                     onClick={() => setActiveTab('biographies')}
                  >
                     <i className="fas fa-scroll"></i> Manage Biographies
                  </button>
                  <button
                     className={`tab ${activeTab === 'khanqahs' ? 'active' : ''}`}
                     onClick={() => setActiveTab('khanqahs')}
                  >
                     <i className="fas fa-mosque"></i> Manage Khanqahs
                  </button>
                  <button
                     className={`tab ${activeTab === 'families' ? 'active' : ''}`}
                     onClick={() => setActiveTab('families')}
                  >
                     <i className="fas fa-tree"></i> Manage Families
                  </button>
                  <button
                     className={`tab ${activeTab === 'global-data' ? 'active' : ''}`}
                     onClick={() => setActiveTab('global-data')}
                  >
                     <i className="fas fa-database"></i> Manage Global Data
                  </button>
                  {userRole === 'admin' && (
                     <>
                        <button
                           className={`tab ${activeTab === 'contributors' ? 'active' : ''}`}
                           onClick={() => setActiveTab('contributors')}
                        >
                           <i className="fas fa-users"></i> Manage Contributors
                        </button>
                        <button
                           className={`tab ${activeTab === 'admins' ? 'active' : ''}`}
                           onClick={() => setActiveTab('admins')}
                        >
                           <i className="fas fa-lock"></i> Manage Admins
                        </button>
                     </>
                  )}
               </nav>

               {/* Two-column layout: main content + system status */}
               <div className="dashboard-body">
                  <div className="dashboard-content">
                     {/* Biographies Tab */}
                     {activeTab === 'biographies' && (
                        <section className="tab-content">
                           <h2>Manage Biographies</h2>
                           <div className="action-grid">
                              <button
                                 className="action-button"
                                 onClick={() => router.push('/admin/biographies/add')}
                              >
                                 <span className="action-icon">📝</span>
                                 <span>Add Biography</span>
                              </button>
                              <button
                                 className="action-button"
                                 onClick={() => router.push('/admin/biographies/edit')}
                              >
                                 <span className="action-icon">✏️</span>
                                 <span>Edit Biography</span>
                              </button>
                              {userRole === 'admin' && (
                                 <button
                                    className="action-button"
                                    onClick={() => setShowDeleteModal(true)}
                                 >
                                    <span className="action-icon">🗑️</span>
                                    <span>Delete Biography</span>
                                 </button>
                              )}
                              <button
                                 className="action-button"
                                 onClick={() => router.push('/biographies/view-all')}
                              >
                                 <span className="action-icon">📋</span>
                                 <span>View All</span>
                              </button>
                           </div>
                           <div className="content-info">
                              <p>
                                 {userRole === 'admin'
                                    ? 'You have full control over all biographies. You can create, edit, and delete entries.'
                                    : 'You can add new biographies and edit your contributions. Admins can delete entries.'}
                              </p>
                           </div>
                        </section>
                     )}

                     {/* Khanqah Tab */}
                     {activeTab === 'khanqahs' && (
                        <section className="tab-content">
                           <h2>Manage Khanqahs</h2>
                           <div className="action-grid">
                              <button
                                 className="action-button"
                                 onClick={() => setShowKhanqahModal(true)}
                              >
                                 <span className="action-icon">🏛️</span>
                                 <span>Manage Khanqahs</span>
                              </button>
                              <button
                                 className="action-button"
                                 onClick={() => router.push('/khanqahs')}
                              >
                                 <span className="action-icon">📋</span>
                                 <span>View All Khanqahs</span>
                              </button>
                           </div>
                           <div className="content-info">
                              <p>
                                 Manage the database of Khanqahs. Add, edit, or remove entries directly from the modal.
                              </p>
                           </div>
                        </section>
                     )}

                     {/* Family Management Tab */}
                     {activeTab === 'families' && (
                        <section className="tab-content">
                           <h2>Manage Family Trees</h2>
                           <div className="action-grid">
                              <button
                                 className="action-button"
                                 onClick={() => router.push('/admin/family-management')}
                              >
                                 <span className="action-icon">📖</span>
                                 <span>Family Management Dashboard</span>
                              </button>
                              <button
                                 className="action-button"
                                 onClick={() => router.push('/admin/family-management')}
                              >
                                 <span className="action-icon">➕</span>
                                 <span>Add Person to Family</span>
                              </button>
                           </div>
                           <div className="content-info">
                              <p>
                                 Manage the genealogy database with complete family trees. Add, edit, or remove persons and their relationships. Each person gets an auto-generated ID, and you can link spouses, parents, and children while preventing duplicate entries.
                              </p>
                           </div>
                        </section>
                     )}

                     {/* Contributors Tab (Admin Only) */}
                     {activeTab === 'contributors' && userRole === 'admin' && (
                        <section className="tab-content">
                           <h2>Manage Contributors</h2>
                           <div className="action-grid">
                              <button className="action-button" onClick={() => setShowContributorsModal(true)}>
                                 <span className="action-icon">👥</span>
                                 <span>Manage Contributors</span>
                              </button>
                           </div>
                           <div className="content-info">
                              <p>
                                 Manage all contributors to the genealogy database. You can add new contributors, modify their
                                 details, view all, or remove them from the system.
                              </p>
                           </div>
                        </section>
                     )}

                     {/* Admins Tab (Admin Only) */}
                     {activeTab === 'admins' && userRole === 'admin' && (
                        <section className="tab-content">
                           <h2>Manage Admins</h2>
                           <div className="action-grid">
                              <button className="action-button" onClick={() => setShowAdminsModal(true)}>
                                 <span className="action-icon">🔐</span>
                                 <span>Manage Admins</span>
                              </button>
                           </div>
                           <div className="content-info">
                              <p>
                                 Manage administrators with full system access. You can add new admins, modify their details,
                                 view all, or remove administrative privileges.
                              </p>
                           </div>
                        </section>
                     )}

                     {/* Global Data Tab */}
                     {activeTab === 'global-data' && <GlobalDataTab />}

                  </div>{/* end dashboard-content */}

                  {/* System Status */}
                  <aside className="system-status">
                     <h3>System Status</h3>
                     <div className="status-items">
                        <div className="status-item">
                           <span className="status-indicator online"></span>
                           <span>Firebase Connected</span>
                        </div>
                        <div className="status-item">
                           <span className="status-indicator online"></span>
                           <span>Supabase Connected</span>
                        </div>
                        <div className="status-item">
                           <span className="status-indicator online"></span>
                           <span>Authentication Active</span>
                        </div>
                        <div className="status-item">
                           <span className="status-indicator online"></span>
                           <span>Firestore Ready</span>
                        </div>
                     </div>
                  </aside>
               </div>

               {/* Error Message */}
               {error && (
                  <div className="error-alert">
                     <span>⚠️</span>
                     {error}
                  </div>
               )}
            </div>
         </main>

         {/* Delete Biography Modal */}
         <DeleteBiographyModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onDeleted={() => {
               setShowDeleteModal(false);
            }}
         />

         {/* Contributors Modal */}
         <ContributorsModal
            isOpen={showContributorsModal}
            onClose={() => setShowContributorsModal(false)}
            onContributorsUpdate={() => { }}
         />

         {/* Admins Modal */}
         <AdminsModal
            isOpen={showAdminsModal}
            onClose={() => setShowAdminsModal(false)}
            onAdminsUpdate={() => { }}
         />

         {/* Change Password Modal */}
         <ChangePasswordModal
            isOpen={showChangePasswordModal}
            onClose={() => setShowChangePasswordModal(false)}
            userEmail={user?.email}
         />

         {/* Khanqah Management Modal */}
         <KhanqahManagementModal
            isOpen={showKhanqahModal}
            onClose={() => setShowKhanqahModal(false)}
         />
      </div>
   );
}
