'use client';

import React, { memo } from 'react';

function hasBurialDetails(burial) {
   if (!burial) return false;
   return Boolean(String(burial.place || '').trim() || String(burial.map || '').trim());
}

export const DetailPopup = memo(function DetailPopup({ data, onClose, rootRef, setSection, biographyMap }) {
   const showMotherForSelectedPerson = Boolean(data.motherName);

   // Look up biography slug by Supabase DB id (dbId)
   const biographySlug = biographyMap && data.dbId ? biographyMap[data.dbId] : null;

   return (
      <div className="detail-popup" onClick={(e) => e.stopPropagation()} style={{ top: '16px', right: '16px', left: 'auto' }}>
         <button className="popup-close" onClick={onClose}>&times;</button>
         <div className="popup-content">
            {/* Main person */}
            <div className="popup-section">
               <div className="person-header">
                  <span className="person-name">{data.name}</span>
                  <span className={`status-bubble ${data.alive ? 'alive' : 'deceased'}`}></span>
               </div>

               {data.dob && <p><strong>Born:</strong> {data.dob}</p>}
               {data.place && <p><strong>Birth place:</strong> {data.place}</p>}
               {showMotherForSelectedPerson && (
                  <p><strong>Mother:</strong> {data.motherName}</p>
               )}
               {!data.alive && data.dod && <p><strong>Died:</strong> {data.dod}</p>}
               {hasBurialDetails(data.burial) && (
                  <p>
                     <strong>Burial:</strong> {data.burial.place}
                     {data.burial.map && (
                        <> | <a href={data.burial.map} target="_blank" rel="noopener noreferrer">View on Map</a></>
                     )}
                  </p>
               )}
               {data.about && !/^father:\s*.+$/i.test(data.about.trim()) && (
                  <p><strong>About:</strong> <span className="text-wrap">{data.about}</span></p>
               )}
               {biographySlug && (
                  <p style={{ marginTop: '8px' }}>
                     <a href={`/biographies/${biographySlug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', fontWeight: 600, fontSize: '13px' }}>
                        📖 Read full biography →
                     </a>
                  </p>
               )}
            </div>

            {/* Spouse(s) */}
            {data.spouse && (
               <>
                  <div className="popup-divider"></div>
                  {Array.isArray(data.spouse) ? (
                     data.spouse.map((spouse, idx) => (
                        <SpouseSection key={idx} spouse={spouse} setSection={setSection} />
                     ))
                  ) : (
                     <SpouseSection spouse={data.spouse} setSection={setSection} />
                  )}
               </>
            )}
         </div>
      </div>
   );
});

const SpouseSection = memo(function SpouseSection({ spouse, setSection }) {
   const relation = spouse.gender === 'female' ? 'D/O' : 'S/O';

   const handleSpouseNavigate = () => {
      if (spouse.familyQasba && spouse.id) {
         setSection?.(spouse.familyQasba, spouse.id);
      }
   };

   return (
      <div className="popup-section">
         <div className="person-header">
            {spouse.familyQasba ? (
               <button className="spouse-nav-btn" onClick={handleSpouseNavigate} title="Open spouse family tree">
                  Married to {spouse.name}
               </button>
            ) : (
               <span className="person-name">Married to {spouse.name}</span>
            )}
            <span className={`status-badge ${spouse.alive ? 'alive' : 'deceased'}`}></span>
         </div>

         {(spouse.displayBadge || spouse.familyName) && (
            <div className="family-pill spouse-family-pill">
               {spouse.displayBadge || spouse.familyName}
            </div>
         )}

         {spouse.fname && <p><strong>{relation}</strong> {spouse.fname}</p>}
         {spouse.motherName && <p><strong>Mother:</strong> {spouse.motherName}</p>}
         {spouse.dob && <p><strong>Born:</strong> {spouse.dob}</p>}
         {spouse.place && <p><strong>Birth place:</strong> {spouse.place}</p>}
         {!spouse.alive && spouse.dod && <p><strong>Died:</strong> {spouse.dod}</p>}
         {hasBurialDetails(spouse.burial) && (
            <p>
               <strong>Burial:</strong> {spouse.burial.place}
               {spouse.burial.map && (
                  <> | <a href={spouse.burial.map} target="_blank" rel="noopener noreferrer">View on Map</a></>
               )}
            </p>
         )}
         {spouse.about && !/^father:\s*.+$/i.test(spouse.about.trim()) && (
            <p><strong>About:</strong> <span className="text-wrap">{spouse.about}</span></p>
         )}
      </div>
   );
});
