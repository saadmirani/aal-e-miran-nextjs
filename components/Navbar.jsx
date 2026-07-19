'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useMenu } from '@/context/MenuContext';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebaseClient';
import './Navbar.css';

export default function Navbar() {
  const router = useRouter();
  const { isMenuOpen, toggleMenu } = useMenu();
  const { isAdmin, sessionExpiresAt, logout } = useAuth();
  const [sessionCountdown, setSessionCountdown] = useState('');
  const [sessionWarning, setSessionWarning] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      logout();
      router.push('/');
    }
  };

  useEffect(() => {
    if (!isAdmin || !sessionExpiresAt) {
      setSessionCountdown('');
      setSessionWarning(false);
      return;
    }

    const updateCountdown = () => {
      const secondsLeft = Math.max(0, Math.floor((sessionExpiresAt.getTime() - Date.now()) / 1000));
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = secondsLeft % 60;
      setSessionCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      setSessionWarning(secondsLeft > 0 && secondsLeft <= 300);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isAdmin, sessionExpiresAt]);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          className="menu-toggle-btn"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <Link href="/" className="navbar-brand">
          <Image
            src="/Logo.jpeg"
            alt="Bazm-e-Saadaat Logo"
            width={42}
            height={42}
            className="navbar-logo"
            priority
          />
          <h1 className="navbar-title text-white">Bazm-e-Saadaat</h1>
        </Link>
      </div>
      <div className="navbar-right">
        {sessionCountdown && (
          <div className={`navbar-timer${sessionWarning ? ' warning' : ''}`}>Session expires in {sessionCountdown}</div>
        )}
        <div className="navbar-actions">
          {isAdmin && (
            <Link href="/admin/dashboard" className="navbar-dashboard-btn" aria-label="Dashboard" title="Dashboard">
              <i className="fas fa-grip"></i>
              <span>Dashboard</span>
            </Link>
          )}

          {isAdmin ? (
            <button
              type="button"
              onClick={handleLogout}
              className="navbar-auth-btn"
              aria-label="Logout"
              title="Logout"
            >
              Logout
            </button>
          ) : (
            <Link href="/admin/login" className="navbar-auth-btn" aria-label="Login" title="Login">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
