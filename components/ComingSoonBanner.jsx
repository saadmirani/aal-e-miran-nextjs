'use client';

import { useState } from 'react';

export default function ComingSoonBanner({ section = 'this section' }) {
   const [dismissed, setDismissed] = useState(false);

   if (dismissed) return null;

   return (
      <div style={styles.banner} role="status">
         <div style={styles.inner}>
            <span style={styles.icon}>🕐</span>
            <div style={styles.textGroup}>
               <strong style={styles.heading}>Content Being Uploaded</strong>
               <span style={styles.message}>
                  Records for {section} are currently being reviewed and will be published progressively. We appreciate your patience.
               </span>
            </div>
         </div>
         <button
            onClick={() => setDismissed(true)}
            style={styles.closeBtn}
            aria-label="Dismiss notification"
            title="Dismiss"
         >
            ✕
         </button>
      </div>
   );
}

const styles = {
   banner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '1px solid #f59e0b',
      borderLeft: '4px solid #d97706',
      borderRadius: '8px',
      padding: '14px 16px',
      margin: '0 0 20px',
   },
   inner: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      flex: 1,
      minWidth: 0,
   },
   icon: {
      fontSize: '18px',
      flexShrink: 0,
      marginTop: '1px',
   },
   textGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
   },
   heading: {
      fontSize: '14px',
      fontWeight: 700,
      color: '#92400e',
   },
   message: {
      fontSize: '13px',
      color: '#78350f',
      lineHeight: 1.55,
   },
   closeBtn: {
      background: 'none',
      border: 'none',
      color: '#b45309',
      fontSize: '16px',
      cursor: 'pointer',
      padding: '2px 6px',
      flexShrink: 0,
      lineHeight: 1,
      borderRadius: '4px',
   },
};
