'use client';

import { createContext, useContext, useState } from 'react';

const MenuContext = createContext();

export function MenuProvider({ children }) {
   const [isMenuOpen, setIsMenuOpen] = useState(false);

   const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
   const closeMenu = () => setIsMenuOpen(false);

   return (
      <MenuContext.Provider value={{ isMenuOpen, toggleMenu, closeMenu }}>
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
