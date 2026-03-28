'use client';

import Link from 'next/link';
import { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '@/context/LanguageContext';
import './Navbar.css';

export default function Navbar() {
   const languageContext = useContext(LanguageContext);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   const language = mounted ? (languageContext?.language || 'en') : 'en';
   const setLanguage = languageContext?.setLanguage || (() => { });

   const toggleLanguage = () => {
      setLanguage(language === 'en' ? 'ur' : 'en');
   };

   return (
      <nav className="navbar">
         <div className="navbar-left">
            <Link href="/" className="navbar-brand">
               <span className="navbar-logo">📚</span>
               <h1 className="navbar-title">Aal-e-Miran</h1>
            </Link>
         </div>

         <div className="navbar-right">
            <div className="language-toggle">
               <button className="lang-toggle" onClick={toggleLanguage} title="Toggle Language">
                  <span className={language === 'en' ? 'active' : ''}>EN</span>
                  <span className={language === 'ur' ? 'active' : ''}>اردو</span>
               </button>
            </div>
         </div>

         <style jsx>{`
        .navbar {
          height: 60px;
          background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
        }

        .navbar-logo {
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
        }

        .navbar-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 1px;
          margin: 0;
          white-space: nowrap;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .language-toggle {
          display: flex;
          align-items: center;
        }

        .lang-toggle {
          position: relative;
          width: 120px;
          height: 38px;
          padding: 3px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(6px);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          overflow: hidden;
          transition: all 0.3s ease;
          padding: 0 12px;
          gap: 12px;
        }

        .lang-toggle:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .lang-toggle span {
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }

        .lang-toggle span.active {
          opacity: 1;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 0 16px;
          }

          .navbar-title {
            font-size: 18px;
          }

          .lang-toggle {
            width: 100px;
            font-size: 12px;
          }
        }
      `}</style>
      </nav>
   );
}
