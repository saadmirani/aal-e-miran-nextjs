'use client';

import { useContext, useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LanguageContext } from '@/context/LanguageContext';
import ReactMarkdown from 'react-markdown';
import matter from 'gray-matter';
import Link from 'next/link';
import '../biography.css';

export default function BiographyPage() {
   const params = useParams();
   const { slug } = params;
   const languageContext = useContext(LanguageContext);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   const language = mounted ? (languageContext?.language || 'en') : 'en';

   // Simulated data - in production, this would be loaded from files
   const biographyContent = useMemo(() => {
      const contents = {
         'rahman-bakhsh-qadri': {
            en: `---
title: "Hazrat Rahman Bakhsh Qadri"
slug: "rahman-bakhsh-qadri"
---

# Hazrat Rahman Bakhsh Qadri

## Early Life

Hazrat Rahman Bakhsh Qadri was born in the early 18th century in South Asia. He came from a noble spiritual lineage and was known for his devotion to Islamic learning and spirituality.

## Spiritual Journey

### Education and Training
Rahman Bakhsh Qadri received his early education in Islamic sciences and jurisprudence. He traveled extensively to seek knowledge from great scholars and spiritual masters of his time.

### Spiritual Teacher
He spent many years under the guidance of renowned Sufi masters, studying the mystical dimensions of Islam and practicing various spiritual disciplines.

## Contributions

### Spiritual Leadership
As a renowned Sufi saint, Hazrat Rahman Bakhsh Qadri:
- Established a khanqah (spiritual monastery) that became a center of learning and spirituality
- Mentored numerous disciples who went on to become respected scholars and saints
- Wrote treaties on Islamic spirituality and jurisprudence
- Worked for social welfare and justice in his community

### Literary Works
He authored several important works including:
- Treatises on Sufism and Islamic mysticism
- Commentary on Quranic verses
- Books on Islamic law and practice

## Legacy

Hazrat Rahman Bakhsh Qadri's spiritual influence extended far and wide. His teachings emphasized:
- **Spiritual purification**: Inner development and closeness to God
- **Social responsibility**: Serving humanity with integrity and compassion
- **Scholarly pursuit**: Continuous learning and knowledge-seeking
- **Community service**: Active participation in social welfare activities

## Descendants and Followers

His spiritual lineage continues through his followers and descendants. Many institutions and khanqahs established by his disciples still operate today, continuing his legacy of spiritual and social service.

## Conclusion

Hazrat Rahman Bakhsh Qadri remains a respected figure in Islamic history, remembered for his scholarship, spiritual wisdom, and significant contributions to the development of Islamic thought and practice in South Asia.`,
            ur: `---
title: "حضرت رحمان بخش قادری"
slug: "rahman-bakhsh-qadri"
---

# حضرت رحمان بخش قادری

## ابتدائی زندگی

حضرت رحمان بخش قادری اٹھارویں صدی کے اوائل میں جنوبی ایشیا میں پیدا ہوئے۔ وہ ایک نیک روح روحانی نسب سے تعلق رکھتے تھے اور اسلامی علم اور روحانیت کی طرف ان کی عقیدت اچھی طرح سے معلوم ہے۔

## روحانی سفر

### تعلیم و تربیت
رحمان بخش قادری نے اسلامی علوم اور فقہ میں ابتدائی تعلیم حاصل کی۔ انہوں نے اپنے زمانے کے بڑے علماء اور روحانی معلمین سے علم حاصل کرنے کے لیے وسیع سفر کیے۔

### روحانی استاد
وہ مشہور صوفی درویشوں کی رہنمائی میں کئی سال گزارے، اسلام کے صوفیانہ پہلوؤں کا مطالعہ اور مختلف روحانی نظم و ضبط کی عملی تربیت کی۔

## شراکتیں

### روحانی قیادت
ایک نامور صوفی ولی کے طور پر، حضرت رحمان بخش قادری نے:
- ایک خانقاہ قائم کی جو علم و روحانیت کا مرکز بن گیا
- بے شمار شاگردوں کی تربیت کی جو احترام شدہ علماء اور ولی بن گئے

## نتیجہ

حضرت رحمان بخش قادری اسلامی تاریخ میں ایک معزز شخصیت کے طور پر یادگار ہیں۔`
         }
      };

      return contents[slug] || null;
   }, [slug]);

   const content = biographyContent ? biographyContent[language] : null;

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
         <button className="back-button" onClick={() => window.history.back()}>
            ← Back
         </button>

         <article className="biography-container">
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

         <style jsx>{`
        .biography-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 0;
        }

        .back-button {
          background: white;
          border: 1px solid #e5e7eb;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: all 0.2s ease;
          margin-bottom: 24px;
          display: inline-block;
        }

        .back-button:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .biography-container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
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

        .error-container p {
          color: #6b7280;
          margin-bottom: 24px;
          font-size: 16px;
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

        .btn:hover {
          transform: scale(1.02);
        }

        @media (max-width: 768px) {
          .biography-container {
            padding: 24px;
          }

          .biography-page {
            padding: 16px;
          }
        }
      `}</style>
      </div>
   );
}
