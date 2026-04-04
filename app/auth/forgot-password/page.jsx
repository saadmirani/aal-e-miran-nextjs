'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import './forgot-password.css';

export default function ForgotPasswordPage() {
   const [email, setEmail] = useState('');
   const [submitted, setSubmitted] = useState(false);
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);

   const handleSubmit = async (e) => {
      e.preventDefault();
      try {
         setLoading(true);
         setError('');

         await sendPasswordResetEmail(auth, email);
         setSubmitted(true);
         setEmail('');
      } catch (err) {
         if (err.code === 'auth/user-not-found') {
            setError('No account found with this email address.');
         } else if (err.code === 'auth/invalid-email') {
            setError('Please enter a valid email address.');
         } else {
            setError(err.message || 'Failed to send password reset email.');
         }
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="forgot-password-container">
         <div className="forgot-password-card">
            <h1>Reset Your Password</h1>

            {submitted ? (
               <div className="success-message">
                  <h2>Email Sent!</h2>
                  <p>
                     We've sent a password reset link to <strong>{email}</strong>. Check your email inbox and
                     click the link to create a new password.
                  </p>
                  <p className="info-text">If you don't see the email, check your spam or junk folder.</p>
                  <button
                     className="link-button"
                     onClick={() => {
                        setSubmitted(false);
                        setEmail('');
                     }}
                  >
                     Try another email
                  </button>
               </div>
            ) : (
               <form onSubmit={handleSubmit}>
                  <div className="form-group">
                     <label htmlFor="email">Email Address</label>
                     <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                     />
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <button type="submit" className="submit-button" disabled={loading}>
                     {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <p className="back-link">
                     Remember your password?{' '}
                     <a href="/admin/login" className="link">
                        Back to login
                     </a>
                  </p>
               </form>
            )}
         </div>
      </div>
   );
}
