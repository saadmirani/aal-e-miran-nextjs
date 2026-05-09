'use client';

import './home.css';
import GlobalSearchBox from '@/components/GlobalSearchBox';

export default function Home() {
   return (
      <div className="home-container">
         {/* Hero Section */}
         <section className="hero">
            <div className="hero-content">
               <h1>
                  Aal-e-Soofiya Akraam |
                  <span className="urdu-title"> آلِ صوفیاء کرام</span>
               </h1>
               <p className="subtitle">Preserving the Legacy of Sufi Saints and Their Genealogy</p>
               <p className="tagline">Connecting generations through history, spirituality, and heritage</p>
            </div>
         </section>

         {/* Global Search Box */}
         <GlobalSearchBox />

         {/* Purpose Section */}
         <section className="section purpose-section">
            <h2>Our Mission</h2>
            <div className="cards-grid">
               <div className="card">
                  <div className="card-icon">📚</div>
                  <h3>Preserve History</h3>
                  <p>
                     Retain the rich history, teachings, and spiritual legacy of Sufi saints
                     for generations to come.
                  </p>
               </div>
               <div className="card">
                  <div className="card-icon">🌳</div>
                  <h3>Genealogy Exploration</h3>
                  <p>
                     Explore detailed family lineages and understand the connections within
                     the Saadat community.
                  </p>
               </div>
               <div className="card">
                  <div className="card-icon">💭</div>
                  <h3>Spiritual Connection</h3>
                  <p>
                     Keep the feelings, wisdom, and spiritual influence of our ancestors alive
                     in our hearts and minds.
                  </p>
               </div>
            </div>
         </section>

         {/* Current Focus Section */}
         <section className="section focus-section">
            <h2>Current Focus</h2>
            <div className="focus-content">
               <div className="focus-text">
                  <h3>Saadat Genealogies</h3>
                  <p>
                     We are dedicated to documenting and preserving the genealogies of
                     multiple Saadat communities, including <strong>Saadat-e-Miran Bigha Tekari</strong>,
                     <strong>Saadat-e-Simla</strong>, and <strong>Saadat-e-Deora</strong> — significant centers
                     of spiritual and scholarly heritage across Bihar.
                  </p>
                  <p>
                     Starting with <strong>Saadat-e-Miran Bigha Tekari</strong>, the birthplace of the developer
                     <strong> Saad Ahmad Mirani</strong>, we are committed to expanding this legacy and bringing
                     the genealogies of other Saadat communities to a global audience through this
                     interactive digital platform.
                  </p>
               </div>
            </div>
         </section>

         {/* Future Plans Section */}
         <section className="section future-section">
            <h2>What's Coming Next</h2>
            <div className="timeline">
               <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                     <h3>Expanding Genealogies</h3>
                     <p>
                        We will soon be adding more genealogies from other Saadat communities across
                        Bihar and beyond, creating a comprehensive digital archive.
                     </p>
                  </div>
               </div>
               <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                     <h3>Digital Library</h3>
                     <p>
                        A collection of books related to <strong>Saadat-e-Bihar</strong> and other
                        historical texts—many not yet transcribed or easily accessible—will be available here.
                     </p>
                  </div>
               </div>
               <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                     <h3>Qabristan (Graveyard) Mapping</h3>
                     <p>
                        Explore and view the sacred graveyards where Sufi saints are buried.
                        A visual guide to honor their resting places and their contributions to spirituality.
                     </p>
                  </div>
               </div>
            </div>
         </section>

         {/* Features Section */}
         <section className="section features-section">
            <h2>Available Features</h2>
            <div className="features-grid">
               <div className="feature-item">
                  <span className="feature-icon">🔍</span>
                  <h4>Interactive Family Trees</h4>
                  <p>Explore detailed genealogies with zoom, pan, and node information.</p>
               </div>
               <div className="feature-item">
                  <span className="feature-icon">🗺️</span>
                  <h4>Graveyard Locations</h4>
                  <p>View and locate sacred burial sites of our Sufi saints.</p>
               </div>
               <div className="feature-item">
                  <span className="feature-icon">📖</span>
                  <h4>Historical Records</h4>
                  <p>Access detailed biographical information and historical context.</p>
               </div>
               <div className="feature-item">
                  <span className="feature-icon">👥</span>
                  <h4>Community Heritage</h4>
                  <p>Discover your connection to the greater Saadat community.</p>
               </div>
            </div>
         </section>

         {/* Call to Action Section */}
         <section className="section cta-section">
            <h2>Explore the Content</h2>
            <p>
               Select an option from the left menu to begin your journey through the genealogies,
               biographies, and historical heritage of our ancestors.
            </p>
            <p className="cta-hint">
               💡 <em>Use the side menu to navigate to different sections and discover the rich legacy of Saadat communities.</em>
            </p>
         </section>

         {/* Footer Section */}
         <section className="section footer-section">
            <p className="footer-text">
               Built with devotion to preserve the legacy of Sufi saints and their genealogies.
            </p>
            <p className="footer-credit">
               Developed by <strong>Saad Ahmad Mirani</strong>
            </p>
         </section>
      </div>
   );
}
