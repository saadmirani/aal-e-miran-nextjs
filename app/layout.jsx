import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from '@/components/Navbar';
import SideMenu from '@/components/SideMenu';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { MenuProvider } from '@/context/MenuContext';
import './layout.css';

export const metadata = {
   title: 'Bazm-e-Saadaat',
   description: 'Biographies of Islamic Saints and Scholars',
};

export default function RootLayout({ children }) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta charSet="utf-8" />
            <link
               href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap"
               rel="stylesheet"
            />
            <link
               rel="stylesheet"
               href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            />
         </head>
         <body>
            <AuthProvider>
               <MenuProvider>
                  <LanguageProvider>
                     <div className="layout">
                        <Navbar />
                        <div className="main-wrapper">
                           <SideMenu />
                           <main className="content">
                              {children}
                           </main>
                        </div>
                     </div>
                  </LanguageProvider>
               </MenuProvider>
            </AuthProvider>
         </body>
      </html>
   );
}
