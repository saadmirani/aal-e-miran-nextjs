'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by checking localStorage
    const adminData = localStorage.getItem('adminData');
    setIsAdmin(!!adminData);
    setLoading(false);
  }, []);

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Biographies & Books</h1>
        <p>Explore the life and teachings of Islamic saints and scholars</p>
      </div>

      <div className="footer-actions">
        <a href="https://www.bazmesaadaat.org" className="btn btn-home-nav">
          <i className="fas fa-arrow-left"></i> Home
        </a>
        {!loading && (
          <a href={isAdmin ? '/admin/dashboard' : '/admin/login'} className="btn btn-admin-nav">
            <i className={`fas ${isAdmin ? 'fa-tachometer-alt' : 'fa-sign-in-alt'}`}></i>
            {isAdmin ? 'Dashboard' : 'Admin Login'}
          </a>
        )}
      </div>

      <div className="content-grid">
        <div className="section-card">
          <h2>📖 Biographies</h2>
          <p>Discover detailed biographies of renowned Sufi saints and Islamic scholars. Learn about their life, teachings, and spiritual contributions.</p>
          <a href="/biographies/view-all" className="btn btn-primary">
            Read Biographies
          </a>
        </div>

        <div className="section-card">
          <h2>📚 Books</h2>
          <p>Read important books and texts about Islamic spirituality, genealogy, and scholarly works.</p>
          <button className="btn btn-primary" disabled title="Coming soon">
            Read Books
          </button>
        </div>
      </div>

      <style jsx>{`
        .home-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-section {
          text-align: center;
          padding: 60px 20px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          border-radius: 12px;
          margin-bottom: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .hero-section h1 {
          font-size: 48px;
          margin-bottom: 16px;
          font-weight: 700;
        }

        .hero-section p {
          font-size: 18px;
          opacity: 0.9;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .footer-actions {
          text-align: left;
          padding: 8px 0;
          margin: 10px 0 15px 0;
        }

        .footer-actions a {
          font-size: 14px;
          display: inline-block;
          margin-right: 10px;
        }

        .footer-actions i {
          margin-right: 8px;
        }

        .btn-home-nav {
          background: #1e3c72;
          color: white;
          border: 1px solid #1e3c72;
          padding: 8px 16px !important;
          font-size: 13px !important;
        }

        .btn-home-nav:hover {
          background: #162a52;
          border-color: #162a52;
          color: white;
          text-decoration: none;
        }

        .btn-admin-nav {
          background: #28a745;
          color: white;
          border: 1px solid #28a745;
          padding: 8px 16px !important;
          font-size: 13px !important;
        }

        .btn-admin-nav:hover {
          background: #218838;
          border-color: #218838;
          color: white;
          text-decoration: none;
        }

        .section-card {
          background: white;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
        }

        .section-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .section-card h2 {
          font-size: 24px;
          margin-bottom: 12px;
          color: #1f2937;
        }

        .section-card p {
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .btn {
          display: inline-block;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
          font-size: 14px;
        }

        .btn-primary {
          background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(30, 60, 114, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary:disabled:hover {
          transform: none;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          text-decoration: none;
          transform: scale(1.02);
        }

        @media (max-width: 768px) {
          .hero-section h1 {
            font-size: 32px;
          }

          .hero-section p {
            font-size: 16px;
          }

          .content-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
