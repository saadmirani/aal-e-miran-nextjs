'use client';

import { useContext, useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LanguageContext } from '@/context/LanguageContext';
import ReactMarkdown from 'react-markdown';
import matter from 'gray-matter';
import Link from 'next/link';
import '../books.css';

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

   // Simulated data - in production, this would be loaded from files
   const booksContent = useMemo(() => {
      const contents = {
         'kitab-ul-ansab': {
            en: `---
title: "Kitab-ul-Ansab: Book of Genealogies"
slug: "kitab-ul-ansab"
author: "Various Islamic Scholars"
---

# Kitab-ul-Ansab: Book of Genealogies

## Introduction

Kitab-ul-Ansab, meaning "Book of Genealogies," is an important historical and genealogical text in Islamic literature. This work documents the family lineages of prominent Islamic figures, particularly focusing on the descendants of Prophet Muhammad (PBUH) and other notable Muslim families.

## Significance in Islamic History

### Historical Documentation
This book serves as:
- A comprehensive record of Islamic family histories
- Documentation of genealogical connections among noble families
- A source for understanding social and tribal structures in early Islamic society
- Essential reference for identifying authentic Islamic lineages

### Religious Importance
The study of genealogies holds special significance in Islam because:
- It helps verify authentic chains of narration (Isnad) in Hadith
- It documents the lineage of the Prophet Muhammad and his family (Ahl-e-Bait)
- It provides context for understanding Islamic leadership and succession
- It preserves the memory of important Islamic figures and their contributions

## Content Overview

### Major Sections
The book typically contains information about:

1. **Genealogy of the Prophet Muhammad (PBUH)**
   - Direct descendants and their lineages
   - Extended family connections
   - Historical narratives of important family members

2. **Notable Islamic Families**
   - Caliphs and their family trees
   - Sufi Saints and their spiritual descendants
   - Scholars and their academic lineages

3. **Regional Genealogies**
   - Arabian tribal connections
   - Persian and Central Asian families
   - South Asian Islamic lineages

## Contemporary Relevance

Modern scholars continue to reference these works for:
- Historical research and documentation
- Genealogical studies and family tree research
- Understanding Islamic administrative structures
- Preserving cultural and historical heritage`,
            ur: `---
title: "کتاب الانساب: نسب ناموں کی کتاب"
slug: "kitab-ul-ansab"
author: "مختلف اسلامی علماء"
---

# کتاب الانساب: نسب ناموں کی کتاب

## تعارف

کتاب الانساب، جس کا مطلب "نسب ناموں کی کتاب" ہے، اسلامی ادب میں ایک اہم تاریخی اور نسب نامہ کی متن ہے۔ یہ کام نمایاں اسلامی شخصیات کے خاندانی نسب کو دستاویز کرتا ہے۔

## اسلامی تاریخ میں اہمیت

### تاریخی دستاویزات
یہ کتاب درج ذیل کے طور پر کام کرتی ہے:
- اسلامی خاندانی تاریخوں کا جامع ریکارڈ
- نیک خاندانوں میں نسبی تعلقات کی دستاویز
- ابتدائی اسلامی معاشرہ میں سماجی ڈھانچے کو سمجھنے کے لیے ذریعہ

### مذہبی اہمیت
اسلام میں نسب ناموں کے مطالعہ میں خصوصی اہمیت ہے کیونکہ:
- یہ حدیث میں بیان کی زنجیر (اسناد) کی تصدیق میں مدد کرتا ہے
- یہ نبی محمد صلی اللہ علیہ وسلم کے نسب کو دستاویز کرتا ہے
- یہ اسلامی رہنمائی کو سمجھنے میں مدد کرتا ہے

## مواد کی تفصیلات

کتاب میں شامل ہے:
- پیغمبر محمد صلی اللہ علیہ وسلم کا نسب
- نمایاں اسلامی خاندانوں کی معلومات
- علاقائی نسب نامے
- تاریخی کہانیاں اور روایات`
         }
      };

      return contents[slug] || null;
   }, [slug]);

   const content = booksContent ? booksContent[language] : null;

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

         <style jsx>{`
        .books-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 0;
        }

        .controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 24px;
          padding: 0 20px;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(30, 60, 114, 0.15);
          flex-shrink: 0;
        }

        .back-button:hover {
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.25);
          transform: translateY(-1px);
        }

        .back-button:active {
          transform: translateY(0);
        }

        .back-button svg {
          width: 18px;
          height: 18px;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .books-container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
        }

        .book-header {
          margin-bottom: 32px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 24px;
        }

        .book-title {
          font-size: 42px;
          font-weight: 700;
          color: #1e3c72;
          margin: 0 0 16px 0;
          line-height: 1.2;
        }

        .book-author {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }

        .error-container {
          text-align: center;
          padding: 60px 40px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .error-container h1 {
          font-size: 32px;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
        }

        @media (max-width: 768px) {
          .books-container {
            padding: 24px;
          }

          .book-title {
            font-size: 28px;
          }
        }
      `}</style>
      </div>
   );
}
