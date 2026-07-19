'use client';

import { useState, useEffect } from 'react';
import ComingSoonBanner from '@/components/ComingSoonBanner';
import './khanqah.css';

export default function KhanqahListPage() {
   const [khanqahs, setKhanqahs] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [searchTerm, setSearchTerm] = useState('');

   useEffect(() => {
      fetchKhanqahs();
   }, []);

   const fetchKhanqahs = async () => {
      try {
         setLoading(true);
         const response = await fetch('/api/khanqahs');
         if (!response.ok) {
            throw new Error('Failed to fetch khanqahs');
         }
         const data = await response.json();
         setKhanqahs(data.khanqahs);
         setError('');
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   const filteredKhanqahs = khanqahs.filter((khanqah) =>
      khanqah.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      khanqah.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      khanqah.sajjadaNashin.toLowerCase().includes(searchTerm.toLowerCase())
   );

   return (
      <div className="khanqah-list-container">
         <div className="khanqah-list-header">
            <h1>Fehrist-e-Khanqah</h1>
            <p>Directory of Khanqahs</p>
         </div>

         <ComingSoonBanner section="Khanqahs" />

         <div className="khanqah-list-search">
            <input
               type="text"
               placeholder="Search by name, location, or Sajjada..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="khanqah-search-input"
            />
         </div>

         {loading ? (
            <div className="khanqah-loading">
               <p>Loading Khanqahs...</p>
            </div>
         ) : error ? (
            <div className="khanqah-error">
               <p>Error: {error}</p>
            </div>
         ) : filteredKhanqahs.length === 0 ? (
            <div className="khanqah-no-results">
               <p>No Khanqahs found</p>
            </div>
         ) : (
            <div className="khanqah-table-wrapper">
               <table className="khanqah-table">
                  <thead>
                     <tr>
                        <th>#</th>
                        <th>Khanqah</th>
                        <th>Sajjada Nashin</th>
                        <th>Location</th>
                        <th>Contact</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filteredKhanqahs.map((khanqah, idx) => (
                        <tr key={khanqah.id}>
                           <td>{idx + 1}</td>
                           <td className="khanqah-name-cell">{khanqah.name}</td>
                           <td>{khanqah.sajjadaNashin}</td>
                           <td>{khanqah.location}</td>
                           <td>
                              <a href={`tel:${khanqah.contactNumber}`} className="contact-link">
                                 {khanqah.contactNumber}
                              </a>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   );
}
