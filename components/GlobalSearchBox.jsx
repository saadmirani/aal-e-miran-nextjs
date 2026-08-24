'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './GlobalSearchBox.css';

const DEBOUNCE_MS = 320;
const MIN_CHARS = 2;

export default function GlobalSearchBox() {
   const router = useRouter();
   const [query, setQuery] = useState('');
   const [results, setResults] = useState([]);
   const [showResults, setShowResults] = useState(false);
   const [isSearching, setIsSearching] = useState(false);
   const [noResults, setNoResults] = useState(false);
   const searchRef = useRef(null);
   const debounceTimer = useRef(null);
   const abortRef = useRef(null);

   // Close on outside click
   useEffect(() => {
      const handler = (e) => {
         if (searchRef.current && !searchRef.current.contains(e.target)) {
            setShowResults(false);
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, []);

   const fetchResults = useCallback(async (q) => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsSearching(true);
      setNoResults(false);
      try {
         const res = await fetch(
            `/api/global-search?q=${encodeURIComponent(q)}&limit=15`,
            { signal: controller.signal }
         );
         if (!res.ok) throw new Error('Search failed');
         const json = await res.json();
         const data = json.data || [];
         setResults(data);
         setNoResults(data.length === 0);
         setShowResults(true);
      } catch (err) {
         if (err.name !== 'AbortError') {
            setResults([]);
            setNoResults(true);
         }
      } finally {
         setIsSearching(false);
      }
   }, []);

   const handleChange = (e) => {
      const value = e.target.value;
      setQuery(value);

      clearTimeout(debounceTimer.current);

      if (value.trim().length < MIN_CHARS) {
         setShowResults(false);
         setResults([]);
         setNoResults(false);
         setIsSearching(false);
         return;
      }

      setIsSearching(true); // show spinner immediately
      debounceTimer.current = setTimeout(() => fetchResults(value.trim()), DEBOUNCE_MS);
   };

   const handleClear = () => {
      clearTimeout(debounceTimer.current);
      if (abortRef.current) abortRef.current.abort();
      setQuery('');
      setResults([]);
      setShowResults(false);
      setIsSearching(false);
      setNoResults(false);
   };

   const handleSelect = (person, family) => {
      setShowResults(false);
      setQuery('');
      setResults([]);
      router.push(`/shajra/${family.qasba}?focus=${person.id}`);
   };

   // Each person may belong to multiple families; render one row per family.
   // Exception: if display_badge is set, render exactly one row (no family navigation).
   const flatRows = results.flatMap(p => {
      if (p.displayBadge) return [{ person: p, family: null, badgeOverride: p.displayBadge }];
      if (p.families.length > 0) return p.families.map(f => ({ person: p, family: f, badgeOverride: null }));
      return [{ person: p, family: null, badgeOverride: null }];
   });

   // Resolve which parent name to show for a given family row
   const getParentLabel = (person, family) => {
      const isFemale = person.gender === 'female';
      const prefix = isFemale ? 'd/o' : 's/o';
      const parentName = family?.parentType === 'mother' ? person.motherName : person.fatherName;
      return parentName ? `${prefix} ${parentName}` : null;
   };

   const showDropdown = showResults && query.trim().length >= MIN_CHARS;

   return (
      <div className="global-search-box-wrapper" ref={searchRef}>
         <div className="global-search-container">
            <div className="search-input-wrapper">
               <span className="search-icon">🔍</span>
               <input
                  type="text"
                  className="global-search-input"
                  placeholder="Search by name across all families…"
                  value={query}
                  onChange={handleChange}
                  onFocus={() => query.trim().length >= MIN_CHARS && results.length > 0 && setShowResults(true)}
                  autoComplete="off"
                  spellCheck={false}
               />
               {isSearching && <span className="search-spinner" aria-label="Searching" />}
               {!isSearching && query && (
                  <button className="search-clear-btn" onClick={handleClear} aria-label="Clear search">
                     ✕
                  </button>
               )}
            </div>

            {showDropdown && (
               <div className="search-results-dropdown">
                  {flatRows.length > 0 ? (
                     <>
                        <div className="search-results-header">
                           {results.length} person{results.length !== 1 ? 's' : ''} found
                        </div>
                        <ul className="search-results-list">
                           {flatRows.map(({ person, family, badgeOverride }, idx) => {
                              const isNavigable = !!family && !badgeOverride;
                              return (
                                 <li
                                    key={`${person.id}-${family?.id ?? 'nofamily'}-${idx}`}
                                    className="search-result-item"
                                    onClick={() => isNavigable && handleSelect(person, family)}
                                    style={!isNavigable ? { cursor: 'default' } : {}}
                                 >
                                    <div className="result-main-row">
                                       <span className="result-name">{person.name}</span>
                                       {person.alive === false && (
                                          <span className="result-deceased-dot" title="Deceased" />
                                       )}
                                    </div>
                                    {(() => { const lbl = getParentLabel(person, family); return lbl ? <div className="result-father">{lbl}</div> : null; })()}
                                    <div className="result-badges-row">
                                       {badgeOverride ? (
                                          <span className="result-shared-badge">{badgeOverride}</span>
                                       ) : family ? (
                                          <span className="result-family-badge">{family.name}</span>
                                       ) : (
                                          <span className="result-no-family">No family linked</span>
                                       )}
                                    </div>
                                 </li>
                              );
                           })}
                        </ul>
                     </>
                  ) : noResults ? (
                     <div className="search-no-results">No results for &quot;{query}&quot;</div>
                  ) : null}
               </div>
            )}
         </div>
      </div>
   );
}
