import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from '@/components/Navbar';
import SideMenu from '@/components/SideMenu';
import LaunchAnnouncementModal from '@/components/LaunchAnnouncementModal';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { MenuProvider } from '@/context/MenuContext';
import './layout.css';

export const metadata = {
   metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bazmesaadaat.org'),
   title: {
      default: 'Bazm-e-Saadaat — Genealogy & Heritage Archive',
      template: '%s | Bazm-e-Saadaat',
   },
   description:
      'Bazm-e-Saadaat is a comprehensive genealogical archive of Saadaat families of Bihar, India — preserving family trees (Shajra Nasab), biographies of Sufi saints, and the history of Khanqahs.',
   keywords: [
      'Saadaat', 'shajra nasab', 'genealogy', 'Bihar', 'family tree',
      'Sufi saints', 'Islamic heritage', 'Khanqah', 'biographies', 'Syed family',
   ],
   openGraph: {
      siteName: 'Bazm-e-Saadaat',
      type: 'website',
      locale: 'en_IN',
   },
   robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
   },
   verification: {
      google: 'jTe1U6tnvzS38uuJyX1UwY0H2s_Tz5vIpNSENI2FcPY',
   },
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
                     <LaunchAnnouncementModal />
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
