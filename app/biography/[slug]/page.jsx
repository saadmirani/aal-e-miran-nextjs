'use client';

import { useContext, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LanguageContext } from '@/context/LanguageContext';
import ReactMarkdown from 'react-markdown';
import matter from 'gray-matter';
import Link from 'next/link';
import '../biography.css';

// Import markdown files
import biographyEnContent from '@/content/biographies/rahman-bakhsh-qadri/index-en.md';
import biographyUrContent from '@/content/biographies/rahman-bakhsh-qadri/index-ur.md';

// Map of available biographies
const BIOGRAPHIES = {
   'rahman-bakhsh-qadri': {
      en: biographyEnContent,
      ur: biographyUrContent,
   },
};

export default function BiographyPage() {
   const params = useParams();
   const { slug } = params;
   const languageContext = useContext(LanguageContext);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   const language = mounted ? (languageContext?.language || 'en') : 'en';
   const setLanguage = languageContext?.setLanguage || (() => { });

   const toggleLanguage = () => {
      setLanguage(language === 'en' ? 'ur' : 'en');
   };

   // Load biography content from markdown
   const content = BIOGRAPHIES[slug]?.[language];

   if (!content) {
      return (
         <div className="biography-page">
            <div className="error-container">
               <h1>Biography Not Found</h1>
               <p>Sorry, we couldn't find the biography you're looking for.</p>
               <Link href="/" className="btn btn-primary">
                  Back to Home
               </Link>
            </div>
         </div>
      );
   }

   const { data, content: mdContent } = matter(content);

   return (
      <div className="biography-page">
         <div className="controls-bar">
            <button className="back-button" onClick={() => window.history.back()} title="Go back">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
               </svg>
               <span>Back</span>
            </button>
            <button
               className={`lang-toggle ${language}`}
               onClick={toggleLanguage}
               title="Toggle Language"
            >
               <span className="toggle-label en">EN</span>
               <span className="toggle-label ur">اردو</span>
               <span className="toggle-slider"></span>
            </button>
         </div>

         <article className="biography-container" dir={language === 'ur' ? 'rtl' : 'ltr'}>
            <div className="markdown-content">
               <ReactMarkdown
                  components={{
                     h1: ({ node, ...props }) => <h1 className="biography-title" {...props} />,
                     h2: ({ node, ...props }) => <h2 className="biography-subtitle" {...props} />,
                     h3: ({ node, ...props }) => <h3 className="biography-heading" {...props} />,
                     p: ({ node, ...props }) => <p className="biography-text" {...props} />,
                     ul: ({ node, ...props }) => <ul className="biography-list" {...props} />,
                     li: ({ node, ...props }) => <li className="biography-list-item" {...props} />,
                     strong: ({ node, ...props }) => <strong className="biography-strong" {...props} />,
                  }}
               >
                  {mdContent}
               </ReactMarkdown>
            </div>

            <div className="biography-footer">
               <p>
                  <strong>Language:</strong> {language === 'en' ? 'English' : 'اردو'}
               </p>
               <p>
                  <small>© 2024 Aal-e-Miran Archives. All rights reserved.</small>
               </p>
            </div>
         </article>
      </div>
   );
}
