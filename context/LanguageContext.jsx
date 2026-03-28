'use client';

import { createContext, useState, useEffect } from 'react';

// Default context value
const defaultContextValue = { language: 'en', setLanguage: () => { } };

export const LanguageContext = createContext(defaultContextValue);

export function LanguageProvider({ children }) {
   const [language, setLanguage] = useState('en');
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      // Get language from localStorage or browser preference
      const savedLang = localStorage.getItem('language');
      const browserLang = navigator.language.startsWith('ur') ? 'ur' : 'en';
      setLanguage(savedLang || browserLang);
      setMounted(true);
   }, []);

   useEffect(() => {
      if (mounted) {
         localStorage.setItem('language', language);
      }
   }, [language, mounted]);

   return (
      <LanguageContext.Provider value={{ language, setLanguage }}>
         {children}
      </LanguageContext.Provider>
   );
}
