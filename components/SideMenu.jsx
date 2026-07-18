'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMenu } from '@/context/MenuContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import './SideMenu.css';

export default function SideMenu() {
   const pathname = usePathname();
   const [showSilsilas, setShowSilsilas] = useState(false);
   const { isMenuOpen, closeMenu, shajraExpanded, clearShajraExpanded } = useMenu();
   const { isAdmin, login, logout } = useAuth();
   const [mounted, setMounted] = useState(false);
   const [silsilaItems, setSilsilaItems] = useState([]);
   const [showLoginModal, setShowLoginModal] = useState(false);
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loginError, setLoginError] = useState('');
   const [isLoggingIn, setIsLoggingIn] = useState(false);

   // Ensure component is mounted before rendering to avoid hydration mismatch
   useEffect(() => {
      setMounted(true);
   }, []);

   // Fetch families from database
   useEffect(() => {
      async function fetchFamilies() {
         try {
            const res = await fetch('/api/family-tree/families');
            const json = await res.json();
            if (json.success && json.data) {
               setSilsilaItems(json.data.map(f => ({ id: f.qasba, label: f.name })));
            }
         } catch (err) {
            console.error('Failed to fetch families:', err);
         }
      }
      fetchFamilies();
   }, []);

   // Close menu when pathname changes - don't include closeMenu in deps
   useEffect(() => {
      closeMenu();
   }, [pathname]);

   // Keep Shajra submenu expanded on Shajra routes so current family stays visible.
   useEffect(() => {
      if (pathname.startsWith('/shajra/')) {
         setShowSilsilas(true);
      }
   }, [pathname]);

   // React to external trigger (e.g. from the home page feature cards).
   useEffect(() => {
      if (shajraExpanded) {
         setShowSilsilas(true);
         clearShajraExpanded();
      }
   }, [shajraExpanded, clearShajraExpanded]);

   // Install a global fetch interceptor to auto-trigger login modal on 401 auth errors.
   useEffect(() => {
      if (typeof window === 'undefined') return;
      if (window.__authFetchInterceptorInstalled) return;

      const originalFetch = window.fetch.bind(window);

      window.fetch = async (...args) => {
         const response = await originalFetch(...args);

         try {
            const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
            if (response.status === 401 && requestUrl.includes('/api/')) {
               let message = 'Session expired. Please login again.';

               try {
                  const data = await response.clone().json();
                  message = data?.error || message;
               } catch {
                  // Ignore JSON parsing issues for non-JSON error bodies.
               }

               if (/(session\s*expired|unauthorized|login\s*again)/i.test(message)) {
                  window.dispatchEvent(new CustomEvent('auth:session-expired', {
                     detail: { message }
                  }));
               }
            }
         } catch {
            // Avoid breaking requests because of interceptor processing.
         }

         return response;
      };

      window.__authFetchInterceptorInstalled = true;
   }, []);

   // Auto-open login modal when client APIs report session expiration.
   useEffect(() => {
      const handleSessionExpired = (event) => {
         const message = event?.detail?.message || 'Session expired. Please login again.';
         logout();
         setLoginError(message);
         setShowLoginModal(true);
      };

      window.addEventListener('auth:session-expired', handleSessionExpired);
      return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
   }, [logout]);

   // Determine active section based on current pathname
   const getActiveSection = () => {
      if (pathname === '/') return 'home';
      if (pathname.startsWith('/biographies')) return 'biographies';
      if (pathname.startsWith('/khanqahs')) return 'khanqahs';
      if (pathname === '/contact') return 'contact';
      if (pathname === '/about') return 'about';
      if (pathname.startsWith('/shajra/')) {
         const qasba = pathname.split('/shajra/')[1];
         return qasba || 'home';
      }
      return 'home';
   };

   const activeSection = getActiveSection();
   const isShajraRoute = pathname.startsWith('/shajra/');

   const handleLogout = () => {
      logout();
   };

   const handleOpenLoginModal = () => {
      setEmail('');
      setPassword('');
      setLoginError('');
      setShowLoginModal(true);
   };

   const handleCloseLoginModal = () => {
      if (isLoggingIn) return;
      setShowLoginModal(false);
   };

   const handleLogin = async (e) => {
      e.preventDefault();
      setLoginError('');
      setIsLoggingIn(true);

      try {
         const userCredential = await signInWithEmailAndPassword(auth, email, password);
         const token = await userCredential.user.getIdToken();

         const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
         });

         const data = await response.json();
         if (!response.ok) {
            throw new Error(data.error || 'Failed to create session');
         }

         const adminData = {
            name: data.name,
            email: data.email,
            role: data.role,
            uid: data.uid
         };

         login(adminData);
         setShowLoginModal(false);
      } catch (err) {
         setLoginError(err.message || 'Invalid email or password');
      } finally {
         setIsLoggingIn(false);
      }
   };

   return (
      <>
         {/* Backdrop - Only visible on small screens when menu is open */}
         {isMenuOpen && <div className="menu-backdrop" onClick={closeMenu}></div>}

         <nav className={`sidemenu ${isMenuOpen ? 'open' : ''}`}>
            {/* Home Button */}
            <Link href="/">
               <button
                  className={`menu-item ${activeSection === 'home' ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(false)}
               >
                  <span className="icon"><i className="fas fa-home"></i></span>
                  <span className="label">Home</span>
               </button>
            </Link>

            {/* Shajra-e-Saadaat Section */}
            <div className="menu-section">
               <button
                  className={`menu-item ${(showSilsilas || isShajraRoute) ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(!showSilsilas)}
               >
                  <span className="icon"><i className="fas fa-sitemap"></i></span>
                  <span className="label">Shajra-e-Saadaat</span>
                  <span className={`submenu-arrow ${showSilsilas ? 'open' : ''}`}>▼</span>
               </button>

               {showSilsilas && (
                  <div className="submenu">
                     {silsilaItems.map((item) => (
                        <Link key={item.id} href={`/shajra/${item.id}`}>
                           <button
                              className={`submenu-item ${activeSection === item.id ? 'active' : ''}`}
                           >
                              <span className="icon"><i className="fas fa-sitemap"></i></span>
                              <span className="label">{item.label}</span>
                           </button>
                        </Link>
                     ))}
                  </div>
               )}
            </div>

            {/* Biographies */}
            <Link href="/biographies/view-all">
               <button
                  className={`menu-item ${activeSection === 'biographies' ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(false)}
               >
                  <span className="icon"><i className="fas fa-scroll"></i></span>
                  <span className="label">Biographies</span>
               </button>
            </Link>

            {/* Khanqahs */}
            <Link href="/khanqahs">
               <button
                  className={`menu-item ${activeSection === 'khanqahs' ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(false)}
               >
                  <span className="icon"><i className="fas fa-mosque"></i></span>
                  <span className="label">Khanqahs</span>
               </button>
            </Link>

            {/* Graveyards */}
            <button
               className={`menu-item ${activeSection === 'graveyards' ? 'active' : ''}`}
               onClick={() => { setShowSilsilas(false); }}
            >
               <span className="icon"><i className="fas fa-mosque"></i></span>
               <span className="label">Sacred Sites</span>
            </button>

            {/* Contact */}
            <Link href="/contact">
               <button
                  className={`menu-item ${activeSection === 'contact' ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(false)}
               >
                  <span className="icon"><i className="fas fa-phone"></i></span>
                  <span className="label">Contact Us</span>
               </button>
            </Link>

            {/* About */}
            <Link href="/about">
               <button
                  className={`menu-item ${activeSection === 'about' ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(false)}
               >
                  <span className="icon"><i className="fas fa-info-circle"></i></span>
                  <span className="label">About Us</span>
               </button>
            </Link>

            {/* Divider */}
            <div className="menu-divider"></div>

            {/* Admin Section - Only render after mount to prevent hydration mismatch */}
            {mounted && (
               <>
                  {!isAdmin ? (
                     <button className="menu-item admin-btn login-btn" onClick={handleOpenLoginModal}>
                        <span className="icon"><i className="fas fa-sign-in-alt"></i></span>
                        <span className="label">Login</span>
                     </button>
                  ) : (
                     <>
                        <Link href="/admin/dashboard">
                           <button className="menu-item admin-btn active">
                              <span className="icon"><i className="fas fa-tachometer-alt"></i></span>
                              <span className="label">Dashboard</span>
                           </button>
                        </Link>
                        <button
                           className="menu-item admin-btn logout-btn"
                           onClick={handleLogout}
                        >
                           <span className="icon"><i className="fas fa-sign-out-alt"></i></span>
                           <span className="label">Logout</span>
                        </button>
                     </>
                  )}
               </>
            )}
         </nav>

         {showLoginModal && (
            <div className="auth-modal-overlay" onClick={handleCloseLoginModal}>
               <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="auth-modal-header">
                     <h3>Admin Login</h3>
                     <button type="button" className="auth-modal-close" onClick={handleCloseLoginModal} disabled={isLoggingIn}>&times;</button>
                  </div>

                  <form onSubmit={handleLogin} className="auth-modal-form">
                     <label>Email</label>
                     <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                        disabled={isLoggingIn}
                     />

                     <label>Password</label>
                     <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        disabled={isLoggingIn}
                     />

                     {loginError && <div className="auth-modal-error">{loginError}</div>}

                     <button type="submit" className="auth-modal-submit" disabled={isLoggingIn}>
                        {isLoggingIn ? (
                           <>
                              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                              Logging in...
                           </>
                        ) : 'Login'}
                     </button>
                  </form>
               </div>
            </div>
         )}
      </>
   );
}
