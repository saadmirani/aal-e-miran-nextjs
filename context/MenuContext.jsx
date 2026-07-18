'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const MenuContext = createContext();

export function MenuProvider({ children }) {
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [shajraExpanded, setShajraExpanded] = useState(false);

   const toggleMenu = () => setIsMenuOpen(prev => !prev);
   const openMenu = useCallback(() => setIsMenuOpen(true), []);
   const closeMenu = useCallback(() => setIsMenuOpen(false), []);
   const openShajraMenu = useCallback(() => {
      setIsMenuOpen(true);
      setShajraExpanded(true);
   }, []);
   const clearShajraExpanded = useCallback(() => setShajraExpanded(false), []);

   return (
      <MenuContext.Provider value={{ isMenuOpen, toggleMenu, openMenu, closeMenu, shajraExpanded, openShajraMenu, clearShajraExpanded }}>
         {children}
      </MenuContext.Provider>
   );
}

export function useMenu() {
   const context = useContext(MenuContext);
   if (!context) {
      throw new Error('useMenu must be used within MenuProvider');
   }
   return context;
}
