'use client';

import './about.css';

export default function AboutPage() {
   return (
      <div className="aboutus-container">
         {/* Hero Section */}
         <section className="aboutus-hero">
            <div className="aboutus-hero-content">
               <h1>
                  About Bazm-e-Saadaat
               </h1>
               <p className="aboutus-hero-subtitle">Preserving Genealogy, Heritage, and Sacred History</p>
               <p className="aboutus-hero-tagline">A platform dedicated to documenting family lineages and connecting generations through authentic historical records</p>
            </div>
         </section>

         {/* Vision Section */}
         <section className="aboutus-section aboutus-vision-section">
            <div className="aboutus-section-wrapper">
               <h2>The Vision Behind Bazm-e-Saadaat</h2>

               <div className="aboutus-article-wrapper">
                  <figure className="aboutus-figure">
                     <img
                        className="aboutus-image"
                        src="/images/admin.jpeg"
                        alt="Founder of Bazm-e-Saadaat"
                     />
                     <figcaption className="aboutus-caption"><strong>Saad Ahmad Mirani</strong><br />Founder, Bazm-e-Saadaat</figcaption>
                  </figure>

                  <div className="aboutus-content">
                     <p>
                        <strong>Bazm-e-Saadaat</strong> was established with a simple yet enduring purpose: to preserve our legacy and ensure that future generations remain connected to their genealogical roots. In many families, knowledge of lineage and heritage gradually fades with time, leaving younger generations unaware of the remarkable history and spiritual inheritance carried by their ancestors.
                     </p>

                     <p>
                        <strong>Saad Ahmad Mirani</strong>, a Senior Software Engineer at Infosys Limited and full stack developer, envisioned a platform that would combine his professional expertise with his passion for genealogical documentation (Ansaab). Recognizing the critical need to preserve family lineages and cultural heritage in the digital age, he developed Bazm-e-Saadaat as a comprehensive solution to bridge technology with historical preservation. This project reflects his commitment to using technical skills for meaningful cultural and historical impact.
                     </p>

                     <p>
                        Through this platform, the aim is to bridge the distance between the past and the present. By documenting family lineages and preserving historical records, Bazm-e-Saadaat provides individuals and families with a dependable place to explore their ancestry and understand the heritage that shapes their identity.
                     </p>

                     <p>
                        A central focus of the platform is the documentation of Saadaat families. This includes both well-known lineages and families whose heritage may be less widely recognized, yet whose authenticated genealogical records deserve careful preservation. To ensure accuracy, each entry is informed by historical manuscripts, genealogical books, and scholarly works before lineage data is recorded.
                     </p>

                     <p>
                        The archive continues to grow by documenting new generations and incorporating details such as birth dates, death dates, spouse information, and burial locations. Another objective is to map the shrines of renowned Sufi saints so that visitors can locate them and better understand their historical and spiritual significance.
                     </p>

                     <p>
                        Future plans for the platform include building a digital archive of rare manuscripts, genealogical texts, and historical books in both original and translated forms. The project also documents and maps graveyards associated with scholars and Sufi saints so that these sacred places remain remembered and respected by future generations.
                     </p>
                  </div>
               </div>
            </div>
         </section>

         {/* Community Contribution Section */}
         <section className="aboutus-section aboutus-contribution-section">
            <div className="aboutus-section-wrapper">
               <h2>Community Contribution</h2>

               <p className="aboutus-intro-text">
                  Preserving heritage requires collective effort. Bazm-e-Saadaat welcomes contributions from families, researchers, and community members who can share authentic genealogical records, manuscripts, shrine information, and documented family history.
               </p>

               <div className="aboutus-contribution-grid">
                  <div className="aboutus-contribution-card">
                     <h3>Authentic Genealogical Records</h3>
                     <p>Verified family trees, lineage documents, and archival references help strengthen the accuracy and continuity of our historical record.</p>
                  </div>

                  <div className="aboutus-contribution-card">
                     <h3>Manuscripts and Historical Texts</h3>
                     <p>Rare manuscripts, printed works, and scholarly compilations provide the documentary foundation needed for long-term preservation.</p>
                  </div>

                  <div className="aboutus-contribution-card">
                     <h3>Shrine and Graveyard Information</h3>
                     <p>Reliable location details, inscriptions, and historical notes ensure that places of spiritual and historical value remain properly documented.</p>
                  </div>

                  <div className="aboutus-contribution-card">
                     <h3>Family History and Local Memory</h3>
                     <p>Biographical notes, oral histories, and locally preserved records add valuable context when supported by dependable family or archival evidence.</p>
                  </div>
               </div>

               <p className="aboutus-closing-text">
                  Every submission is most valuable when accompanied by reliable references, family documentation, or archival sources. With careful collective participation, this record can continue to grow as a dependable resource for future generations.
               </p>
            </div>
         </section>
      </div>
   );
}
