'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './view.css';

export default function ViewBiographyClient() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const bioId = searchParams.get('id');

   const [biography, setBiography] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [language, setLanguage] = useState('english');

   useEffect(() => {
      if (bioId) {
         fetchBiography();
      }
   }, [bioId]);

   const fetchBiography = async () => {
      try {
         setLoading(true);
         const response = await fetch(`/api/biographies/${bioId}`);

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch biography');
         }

         const data = await response.json();
         // API returns biography data directly (with id field)
         setBiography(data);
      } catch (err) {
         setError(err.message || 'Error loading biography');
      } finally {
         setLoading(false);
      }
   };

   const handleGoHome = () => {
      window.location.href = '/';
   };

   const handleGoBack = () => {
      router.push('/biographies/view-all');
   };

   if (loading) {
      return (
         <div className="view-biography-container">
            <div className="loading-hero">
               <div className="spinner"></div>
               <p>Loading biography...</p>
            </div>
         </div>
      );
   }

   if (error || !biography) {
      return (
         <div className="view-biography-container">
            <div className="error-hero">
               <h1>Biography Not Found</h1>
               <p>{error || 'The biography you are looking for does not exist.'}</p>
               <div className="button-group">
                  <button className="btn-back" onClick={handleGoBack}>
                     ← Back to List
                  </button>
                  <button className="btn-home" onClick={handleGoHome}>
                     ← Home
                  </button>
               </div>
            </div>
         </div>
      );
   }

   const bio = biography[language];
   const altBio = biography[language === 'english' ? 'urdu' : 'english'];

   return (
      <div className="view-biography-container">
         {/* Header */}
         <header className="biography-header">
            <div className="header-top">
               <div>
                  <h1>{bio?.name || 'Unnamed'}</h1>
                  <p className="subtitle">
                     {bio?.born || bio?.died || bio?.birthPlace ? (
                        <>
                           <span>{bio?.born || '?'}</span>
                           <span className="separator"> — </span>
                           <span>{bio?.died || '?'}</span>
                           {(bio?.birthPlace || bio?.buriedPlace) && (
                              <>
                                 <span className="separator"> | </span>
                                 <span>{bio?.birthPlace || bio?.buriedPlace}</span>
                              </>
                           )}
                        </>
                     ) : (
                        'Family Member'
                     )}
                  </p>
               </div>
               <div className="header-actions">
                  <button className="btn-back" onClick={handleGoBack}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                     </svg>
                     <span>Back to List</span>
                  </button>
                  <button className="btn-home" onClick={handleGoHome}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                     </svg>
                     <span>Home</span>
                  </button>
               </div>
            </div>

            {/* Language Toggle (if both languages available) */}
            {altBio?.name && (
               <div className="language-toggle">
                  <button
                     className={`lang-toggle ${language === 'urdu' ? 'ur' : 'en'}`}
                     onClick={() => setLanguage(language === 'english' ? 'urdu' : 'english')}
                     title="Toggle Language"
                  >
                     <span className="toggle-label en">EN</span>
                     <span className="toggle-label ur">اردو</span>
                     <span className="toggle-slider"></span>
                  </button>
               </div>
            )}
         </header>

         {/* Main Content */}
         <main className="biography-main">
            <div className="biography-wrapper">
               {/* Key Information */}
               <section className="info-section">
                  <div className="info-grid">
                     {bio?.father && (
                        <div className="info-item">
                           <label>Father</label>
                           <p>{bio.father}</p>
                        </div>
                     )}
                     {bio?.mother && (
                        <div className="info-item">
                           <label>Mother</label>
                           <p>{bio.mother}</p>
                        </div>
                     )}
                     {bio?.born && (
                        <div className="info-item">
                           <label>Date of Birth</label>
                           <p>{bio.born}</p>
                        </div>
                     )}
                     {bio?.died && (
                        <div className="info-item">
                           <label>Date of Death</label>
                           <p>{bio.died}</p>
                        </div>
                     )}
                     {bio?.birthPlace && (
                        <div className="info-item">
                           <label>Birth Place</label>
                           <p>{bio.birthPlace}</p>
                        </div>
                     )}
                     {bio?.buriedPlace && (
                        <div className="info-item">
                           <label>Buried Place</label>
                           <p>{bio.buriedPlace}</p>
                        </div>
                     )}
                  </div>
               </section>

               {/* Nasab Nama Section */}
               {bio?.nasbaNama && (
                  <section className="nasab-section">
                     <h2>Nasab Nama (Family Lineage)</h2>
                     <div
                        className="nasab-content"
                        dir={language === 'urdu' ? 'rtl' : 'ltr'}
                     >
                        {bio.nasbaNama}
                     </div>
                  </section>
               )}

               {/* About Section */}
               {bio?.about && (
                  <section className="about-section">
                     <h2>About</h2>
                     <div
                        className="about-content"
                        dangerouslySetInnerHTML={{ __html: bio.about }}
                        dir={language === 'urdu' ? 'rtl' : 'ltr'}
                     />
                  </section>
               )}

               {/* Custom Fields */}
               {Object.entries(bio || {}).map(([key, value]) => {
                  if (
                     ['name', 'father', 'mother', 'born', 'died', 'birthPlace', 'buriedPlace', 'nasbaNama', 'about'].includes(key) ||
                     !value ||
                     value === ''
                  ) {
                     return null;
                  }
                  return (
                     <section key={key} className="custom-section">
                        <h2>{key.charAt(0).toUpperCase() + key.slice(1)}</h2>
                        <p dir={language === 'urdu' ? 'rtl' : 'ltr'}>{value}</p>
                     </section>
                  );
               })}
            </div>
         </main>

         {/* Footer removed - buttons kept only at the top */}
      </div>
   );
}
