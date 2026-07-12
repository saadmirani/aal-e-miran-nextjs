'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMenu } from '@/context/MenuContext';
import { useAuth } from '@/context/AuthContext';
import './Navbar.css';

const LogoSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="36" height="36" aria-hidden="true">
    <defs>
      <linearGradient id="gold" x1="0" x2="1">
        <stop offset="0" stopColor="#F6D365" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="#ffffff" />
    <g transform="translate(0,0)">
      <path d="M44 28 A12 12 0 1 1 28 16 A9 9 0 1 0 44 28 Z" fill="none" stroke="#F59E0B" strokeWidth="1.6" opacity="0.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 18 C29 22 26 26 26 30 C26 34 29 36 32 40 C35 36 38 34 38 30 C38 26 35 22 32 18 Z" fill="url(#gold)" stroke="#B46A04" strokeWidth="0.8" strokeLinejoin="round" />
      <rect x="30.2" y="40" width="3.6" height="6" rx="1" fill="#F59E0B" />
    </g>
  </svg>
);

export default function Navbar() {
  const { isMenuOpen, toggleMenu } = useMenu();
  const { isAdmin, sessionExpiresAt } = useAuth();
  const [sessionCountdown, setSessionCountdown] = useState('');
  const [sessionWarning, setSessionWarning] = useState(false);

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
          <LogoSVG />
          <h1 className="navbar-title text-white">Bazm-e-Saadaat</h1>
        </Link>
      </div>
      <div className="navbar-right">
        {sessionCountdown && (
          <div className={`navbar-timer${sessionWarning ? ' warning' : ''}`}>Session expires in {sessionCountdown}</div>
        )}
      </div>
    </nav>
  );
}
