'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import './login.css';

export default function AdminLogin() {
   const router = useRouter();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [showPassword, setShowPassword] = useState(false);

   // Check if user is already logged in
   useEffect(() => {
      try {
         // Check localStorage for existing session
         const adminData = localStorage.getItem('adminData');
         if (adminData) {
            // User has session, redirect to dashboard
            router.push('/admin/dashboard');
            return;
         }
      } catch (err) {
         console.warn('Session check error:', err);
      }
   }, [router]);

   const handleLogin = async (e) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);

      try {
         // Sign in with Firebase
         const userCredential = await signInWithEmailAndPassword(auth, email, password);
         const user = userCredential.user;

         // Get ID token
         const token = await user.getIdToken();

         // Store token in HTTP-only cookie via API
         const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create session');
         }

         // Get admin data from response
         const data = await response.json();

         // Store admin data in localStorage
         localStorage.setItem('adminData', JSON.stringify({
            name: data.name,
            email: data.email,
            role: data.role,
            uid: data.uid
         }));

         // Redirect to dashboard
         router.push('/admin/dashboard');
      } catch (err) {
         setError(err.message || 'Invalid email or password');
         setIsSubmitting(false);
      }
   };

   return (
      <div className="admin-login-container">
         <div className="login-wrapper">
            <div className="login-card">
               {/* Header */}
               <div className="login-header">
                  <h1>Admin Login</h1>
                  <p>Bazm-e-Ansaab Genealogy</p>
               </div>

               {/* Form */}
               <form onSubmit={handleLogin} className="login-form">
                  {/* Email Field */}
                  <div className="form-group">
                     <label htmlFor="email">Email Address</label>
                     <div className="input-wrapper">
                        <span className="input-icon">✉️</span>
                        <input
                           id="email"
                           type="email"
                           placeholder="admin@example.com"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           required
                           disabled={isSubmitting}
                        />
                     </div>
                  </div>

                  {/* Password Field */}
                  <div className="form-group">
                     <label htmlFor="password">Password</label>
                     <div className="input-wrapper">
                        <span className="input-icon">🔒</span>
                        <input
                           id="password"
                           type={showPassword ? 'text' : 'password'}
                           placeholder="Enter your password"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           required
                           disabled={isSubmitting}
                        />
                        <button
                           type="button"
                           className="toggle-password"
                           onClick={() => setShowPassword(!showPassword)}
                           disabled={isSubmitting}
                        >
                           {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                     </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                     <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                     </div>
                  )}

                  {/* Forgot Password Link */}
                  <div className="forgot-password-link">
                     <a href="/auth/forgot-password">Forgot your password?</a>
                  </div>

                  {/* Submit Button */}
                  <button
                     type="submit"
                     className="login-button"
                     disabled={isSubmitting}
                  >
                     {isSubmitting ? (
                        <>
                           <span className="spinner"></span>
                           Logging in...
                        </>
                     ) : (
                        'Login to Dashboard'
                     )}
                  </button>
               </form>

               {/* Footer Note */}
               <div className="login-footer">
                  <p>🔐 Secure authentication powered by Firebase</p>
               </div>
            </div>

         </div>
      </div>
   );
}
