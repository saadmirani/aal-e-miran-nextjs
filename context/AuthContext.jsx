'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/lib/firebaseClient';
import { onIdTokenChanged } from 'firebase/auth';

const AuthContext = createContext();

async function updateSessionExpiration(firebaseUser, setSessionExpiresAt) {
   if (!firebaseUser) {
      setSessionExpiresAt(null);
      return;
   }

   try {
      const tokenResult = await firebaseUser.getIdTokenResult();
      setSessionExpiresAt(new Date(tokenResult.expirationTime));
   } catch {
      setSessionExpiresAt(null);
   }
}

export function AuthProvider({ children }) {
   const [isAdmin, setIsAdmin] = useState(false);
   const [loading, setLoading] = useState(true);
   const [sessionExpiresAt, setSessionExpiresAt] = useState(null);

   useEffect(() => {
      // Check if user is logged in from localStorage
      const adminData = localStorage.getItem('adminData');
      setIsAdmin(!!adminData);
      setLoading(false);

      // Listen for Firebase token changes — fires when token expires or user signs out.
      // Firebase ID tokens last 1 hour; if they can't be silently refreshed, user is null.
      const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
         if (firebaseUser) {
            await updateSessionExpiration(firebaseUser, setSessionExpiresAt);
         } else {
            // No active Firebase session — auto-logout if localStorage still shows admin
            const stored = localStorage.getItem('adminData');
            if (stored) {
               localStorage.removeItem('adminData');
               setIsAdmin(false);
               setSessionExpiresAt(null);
               // Notify rest of app so login modal can open
               window.dispatchEvent(new CustomEvent('auth:session-expired', {
                  detail: { message: 'Your session has expired. Please log in again.' }
               }));
            }
         }
      });

      return () => unsubscribe();
   }, []);

   const login = async (userData) => {
      localStorage.setItem('adminData', JSON.stringify(userData));
      setIsAdmin(true);

      if (auth.currentUser) {
         await updateSessionExpiration(auth.currentUser, setSessionExpiresAt);
      }
   };

   const logout = () => {
      localStorage.removeItem('adminData');
      setIsAdmin(false);
      setSessionExpiresAt(null);
   };

   return (
      <AuthContext.Provider value={{ isAdmin, loading, login, logout, sessionExpiresAt }}>
         {children}
      </AuthContext.Provider>
   );
}

export function useAuth() {
   const context = useContext(AuthContext);
   if (!context) {
      throw new Error('useAuth must be used within AuthProvider');
   }
   return context;
}
