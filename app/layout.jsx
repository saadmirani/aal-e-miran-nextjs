import React from 'react';
import './layout.css';
import Navbar from '@/components/Navbar';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata = {
   title: 'Aal-e-Miran',
   description: 'Genealogy of Islamic Saints and Scholars',
};

export default function RootLayout({ children }) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta charSet="utf-8" />
         </head>
         <body>
            <LanguageProvider>
               <div className="layout">
                  <Navbar />
                  <main className="content">
                     {children}
                  </main>
               </div>
            </LanguageProvider>
         </body>
      </html>
   );
}
