'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './view-all.css';

export const dynamic = 'force-dynamic';

export default function ViewAllBiographies() {
   const router = useRouter();
   const [biographies, setBiographies] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [error, setError] = useState('');

   useEffect(() => {
      fetchBiographies();
   }, []);

   const fetchBiographies = async () => {
      try {
         setLoading(true);
         const response = await fetch('/api/biographies/list');

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch biographies');
         }

         const data = await response.json();
         setBiographies(data.biographies || []);
      } catch (err) {
         setError(err.message || 'Error loading biographies');
      } finally {
         setLoading(false);
      }
   };

   const filteredBiographies = biographies.filter(bio => {
      const englishName = bio.english?.name?.toLowerCase() || '';
      const urduName = bio.urdu?.name?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return englishName.includes(search) || urduName.includes(search);
   });

   const handleGoHome = () => {
      window.location.href = '/';
   };

   const handleGoReactHome = () => {
      window.location.href = 'https://www.bazmesaadaat.org';
   };

   const handleGoBack = () => {
      window.history.back();
   };

   const handleGoToDashboard = () => {
      window.location.href = '/admin/dashboard';
   };

   const handleViewBiography = (bio) => {
      const slug = (bio.english?.name || bio.urdu?.name || '')
         .toLowerCase()
         .replace(/\s+/g, '-')
         .replace(/[^\w-]/g, '');
      router.push(`/biographies/${slug}/view?id=${bio.id}`);
   };

   return (
      <div className="view-all-container">
         {/* Header */}
         <header className="view-all-header">
            <div className="header-content">
               <h1>Biographies</h1>
               <p>Explore the genealogy and biographies of the famous sufi Saints.</p>
            </div>
         </header>

         {/* Main Content */}
         <main className="view-all-main">
            <div className="view-all-wrapper">
               {/* Navigation Buttons */}
               <div className="navigation-buttons">
                  <button onClick={handleGoBack} className="btn btn-outline-secondary">
                     <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button onClick={handleGoReactHome} className="btn btn-primary">
                     <i className="fas fa-home"></i> Home
                  </button>
                  <button onClick={handleGoToDashboard} className="btn btn-success">
                     <i className="fas fa-tachometer-alt"></i> Dashboard
                  </button>
               </div>

               {/* Search Bar */}
               <div className="search-section">
                  <input
                     type="text"
                     placeholder="Search biographies by name..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="search-input"
                  />
                  <p className="search-info">
                     Found {filteredBiographies.length} biography{filteredBiographies.length !== 1 ? 'ies' : ''}
                  </p>
               </div>

               {/* Biographies Table */}
               {loading ? (
                  <div className="loading-state">
                     <div className="spinner"></div>
                     <p>Loading biographies...</p>
                  </div>
               ) : error ? (
                  <div className="error-state">
                     <p>⚠️ {error}</p>
                     <button className="btn-retry" onClick={fetchBiographies}>
                        Retry
                     </button>
                  </div>
               ) : filteredBiographies.length === 0 ? (
                  <div className="empty-state">
                     <p>
                        {biographies.length === 0
                           ? 'No biographies available'
                           : 'No biographies match your search'}
                     </p>
                  </div>
               ) : (
                  <div className="table-wrapper">
                     <table className="biographies-table">
                        <thead>
                           <tr>
                              <th>Name</th>
                              <th>Father's Name</th>
                              <th>Birth - Death</th>
                              <th>Action</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filteredBiographies.map((bio) => (
                              <tr key={bio.id} className="biography-row">
                                 <td className="col-name">
                                    <span className="bio-name">
                                       {bio.english?.name || bio.urdu?.name || 'Unnamed'}
                                    </span>
                                 </td>
                                 <td className="col-father">
                                    {bio.english?.father || bio.urdu?.father || '—'}
                                 </td>
                                 <td className="col-dates">
                                    <span className="dates">
                                       {bio.english?.born || bio.urdu?.born || '?'} —{' '}
                                       {bio.english?.died || bio.urdu?.died || '?'}
                                    </span>
                                 </td>
                                 <td className="col-action">
                                    <button
                                       className="btn-view"
                                       onClick={() => handleViewBiography(bio)}
                                    >
                                       View
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>
         </main>
      </div>
   );
}
