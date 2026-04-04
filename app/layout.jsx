import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from '@/components/Navbar';
import { LanguageProvider } from '@/context/LanguageContext';
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
