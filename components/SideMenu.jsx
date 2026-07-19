'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMenu } from '@/context/MenuContext';
import './SideMenu.css';

export default function SideMenu() {
   const pathname = usePathname();
   const [showSilsilas, setShowSilsilas] = useState(false);
   const { isMenuOpen, closeMenu, shajraExpanded, clearShajraExpanded } = useMenu();
   const [silsilaItems, setSilsilaItems] = useState([]);

   // Fetch families from database.
   useEffect(() => {
      async function fetchFamilies() {
         try {
            const res = await fetch('/api/family-tree/families');
            const json = await res.json();
            if (json.success && json.data) {
               setSilsilaItems(json.data.map((f) => ({ id: f.qasba, label: f.name })));
            }
         } catch (err) {
            console.error('Failed to fetch families:', err);
         }
      }
      fetchFamilies();
   }, []);

   // Close menu when route changes.
   useEffect(() => {
      closeMenu();
   }, [pathname, closeMenu]);

   // Keep Shajra submenu expanded on Shajra routes.
   useEffect(() => {
      if (pathname.startsWith('/shajra/')) {
         setShowSilsilas(true);
      }
   }, [pathname]);

   // React to external trigger from home feature cards.
   useEffect(() => {
      if (shajraExpanded) {
         setShowSilsilas(true);
         clearShajraExpanded();
      }
   }, [shajraExpanded, clearShajraExpanded]);

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

   return (
      <>
         {isMenuOpen && <div className="menu-backdrop" onClick={closeMenu}></div>}

         <nav className={`sidemenu ${isMenuOpen ? 'open' : ''}`}>
            <Link href="/">
               <button
                  className={`menu-item ${activeSection === 'home' ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(false)}
               >
                  <span className="icon"><i className="fas fa-home"></i></span>
                  <span className="label">Home</span>
               </button>
            </Link>

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
                           <button className={`submenu-item ${activeSection === item.id ? 'active' : ''}`}>
                              <span className="icon"><i className="fas fa-sitemap"></i></span>
                              <span className="label">{item.label}</span>
                           </button>
                        </Link>
                     ))}
                  </div>
               )}
            </div>

            <Link href="/biographies/view-all">
               <button
                  className={`menu-item ${activeSection === 'biographies' ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(false)}
               >
                  <span className="icon"><i className="fas fa-scroll"></i></span>
                  <span className="label">Biographies</span>
               </button>
            </Link>

            <Link href="/khanqahs">
               <button
                  className={`menu-item ${activeSection === 'khanqahs' ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(false)}
               >
                  <span className="icon"><i className="fas fa-mosque"></i></span>
                  <span className="label">Khanqahs</span>
               </button>
            </Link>

            <button
               className={`menu-item ${activeSection === 'graveyards' ? 'active' : ''}`}
               onClick={() => { setShowSilsilas(false); }}
            >
               <span className="icon"><i className="fas fa-mosque"></i></span>
               <span className="label">Sacred Sites</span>
            </button>

            <Link href="/contact">
               <button
                  className={`menu-item ${activeSection === 'contact' ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(false)}
               >
                  <span className="icon"><i className="fas fa-phone"></i></span>
                  <span className="label">Contact Us</span>
               </button>
            </Link>

            <Link href="/about">
               <button
                  className={`menu-item ${activeSection === 'about' ? 'active' : ''}`}
                  onClick={() => setShowSilsilas(false)}
               >
                  <span className="icon"><i className="fas fa-info-circle"></i></span>
                  <span className="label">About Us</span>
               </button>
            </Link>
         </nav>
      </>
   );
}
