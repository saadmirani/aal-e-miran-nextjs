'use client';

import { useContext, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LanguageContext } from '@/context/LanguageContext';
import ReactMarkdown from 'react-markdown';
import matter from 'gray-matter';
import Link from 'next/link';
import '../books.css';

// Import markdown files
import booksEnContent from '@/content/books/kitab-ul-ansab/index-en.md';
import booksUrContent from '@/content/books/kitab-ul-ansab/index-ur.md';

// Map of available books
const BOOKS = {
   'kitab-ul-ansab': {
      en: booksEnContent,
      ur: booksUrContent,
   },
};

export default function BooksPage() {
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

   // Load book content from markdown
   const content = BOOKS[slug]?.[language];

   if (!content) {
      return (
         <div className="books-page">
            <div className="error-container">
               <h1>Book Not Found</h1>
               <p>Sorry, we couldn't find the book you're looking for.</p>
               <Link href="/" className="btn btn-primary">
                  Back to Home
               </Link>
            </div>
         </div>
      );
   }

   const { data, content: mdContent } = matter(content);

   return (
      <div className="books-page">
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

         <article className="books-container" dir={language === 'ur' ? 'rtl' : 'ltr'}>
            <div className="book-header">
               <h1 className="book-title">{data.title}</h1>
               {data.author && (
                  <p className="book-author">
                     <strong>Author:</strong> {data.author}
                  </p>
               )}
            </div>

            <div className="markdown-content">
               <ReactMarkdown
                  components={{
                     h1: ({ node, ...props }) => <h1 className="book-heading-1" {...props} />,
                     h2: ({ node, ...props }) => <h2 className="book-heading-2" {...props} />,
                     h3: ({ node, ...props }) => <h3 className="book-heading-3" {...props} />,
                     p: ({ node, ...props }) => <p className="book-text" {...props} />,
                     ul: ({ node, ...props }) => <ul className="book-list" {...props} />,
                     li: ({ node, ...props }) => <li className="book-list-item" {...props} />,
                     strong: ({ node, ...props }) => <strong className="book-strong" {...props} />,
                  }}
               >
                  {mdContent}
               </ReactMarkdown>
            </div>

            <div className="book-footer">
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
