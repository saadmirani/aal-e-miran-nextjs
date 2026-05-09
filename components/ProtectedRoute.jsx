'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ children }) {
   const router = useRouter();
   const { isAdmin, loading } = useAuth();

   useEffect(() => {
      if (!loading && !isAdmin) {
         router.push('/admin/login');
      }
   }, [isAdmin, loading, router]);

   if (loading) {
      return (
         <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f9fafb'
         }}>
            <div style={{
               textAlign: 'center'
            }}>
               <div style={{
                  fontSize: '32px',
                  marginBottom: '16px'
               }}>⏳</div>
               <p>Loading...</p>
            </div>
         </div>
      );
   }

   if (!isAdmin) {
      return null; // Will redirect via useEffect
   }

   return children;
}
