'use client';

import { useState, useEffect } from 'react';

const SESSION_KEY = 'bazm_launch_notice_seen';

export default function LaunchAnnouncementModal() {
   const [visible, setVisible] = useState(false);

   useEffect(() => {
      if (!sessionStorage.getItem(SESSION_KEY)) {
         setVisible(true);
      }
   }, []);

   const handleClose = () => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setVisible(false);
   };

   if (!visible) return null;

   return (
      <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="launch-notice-title">
         <div style={styles.modal}>
            {/* Header */}
            <div style={styles.header}>
               <span style={styles.badge}>Notice</span>
               <h2 id="launch-notice-title" style={styles.title}>
                  Welcome to Bazm-e-Saadaat
               </h2>
               <p style={styles.subtitle}>Genealogy &amp; Heritage Archive</p>
            </div>

            {/* Divider */}
            <div style={styles.divider} />

            {/* Body */}
            <div style={styles.body}>
               <p style={styles.para}>
                  This platform is currently under active development. Our team is working
                  diligently to compile, verify, and upload genealogical records of all family
                  branches with the care and accuracy they deserve. Data is being added
                  progressively following thorough review and authentication.
               </p>
               <p style={styles.para}>
                  You may notice that some records are incomplete, pending, or not yet
                  available. We appreciate your patience as we continue this work.
               </p>
               <div style={styles.contactBox}>
                  <span style={styles.contactIcon}>✉</span>
                  <span style={styles.contactText}>
                     If you notice any missing, incorrect, or incomplete information, please
                     reach out to us at{' '}
                     <a href="mailto:ahmadmirani2026@gmail.com" style={styles.email}>
                        ahmadmirani2026@gmail.com
                     </a>
                     . Your contribution helps us preserve this heritage accurately.
                  </span>
               </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
               <button onClick={handleClose} style={styles.btn}>
                  I Understand &mdash; Continue to Site
               </button>
            </div>
         </div>
      </div>
   );
}

const styles = {
   overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
   },
   modal: {
      background: '#ffffff',
      borderRadius: '14px',
      maxWidth: '520px',
      width: '100%',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
      overflow: 'hidden',
   },
   header: {
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2a5298 100%)',
      padding: '28px 30px 22px',
      textAlign: 'center',
   },
   badge: {
      display: 'inline-block',
      background: 'rgba(255,255,255,0.18)',
      border: '1px solid rgba(255,255,255,0.35)',
      borderRadius: '20px',
      padding: '3px 14px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      color: '#e2e8f0',
      marginBottom: '10px',
   },
   title: {
      margin: '0 0 6px',
      fontSize: '22px',
      fontWeight: 700,
      color: '#ffffff',
      lineHeight: 1.3,
   },
   subtitle: {
      margin: 0,
      fontSize: '13px',
      color: '#94b8e0',
      fontStyle: 'italic',
   },
   divider: {
      height: '3px',
      background: 'linear-gradient(90deg, #d4a832 0%, #f0c040 50%, #d4a832 100%)',
   },
   body: {
      padding: '24px 30px',
   },
   para: {
      fontSize: '14px',
      lineHeight: 1.75,
      color: '#374151',
      margin: '0 0 14px',
   },
   contactBox: {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      background: '#f0f7ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      padding: '14px 16px',
      marginTop: '4px',
   },
   contactIcon: {
      fontSize: '18px',
      color: '#2563eb',
      flexShrink: 0,
      marginTop: '1px',
   },
   contactText: {
      fontSize: '13px',
      lineHeight: 1.65,
      color: '#374151',
   },
   email: {
      color: '#1d4ed8',
      fontWeight: 600,
      textDecoration: 'none',
   },
   footer: {
      padding: '18px 30px 24px',
      textAlign: 'center',
      borderTop: '1px solid #f1f5f9',
   },
   btn: {
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2a5298 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '11px 28px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      letterSpacing: '0.3px',
   },
};
