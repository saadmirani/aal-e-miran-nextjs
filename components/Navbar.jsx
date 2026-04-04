'use client';

import Link from 'next/link';
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
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link href="/" className="navbar-brand">
          <LogoSVG />
          <h1 className="navbar-title text-white">Bazm-e-Saadaat</h1>
        </Link>
      </div>
    </nav>
  );
}
