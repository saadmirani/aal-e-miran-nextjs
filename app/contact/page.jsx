'use client';

import './contact.css';

export default function ContactPage() {
   return (
      <div className="contact-container">
         <section className="contact-hero">
            <h1>Contact Us</h1>
            <p>Get in Touch with Us</p>
         </section>

         <div className="contact-wrapper">
            <section className="contact-info-section">
               <h2>Contact Information</h2>

               <div className="contact-details">
                  <div className="contact-row">
                     <span className="contact-label"><i className="fas fa-user"></i> Developer & Project Lead</span>
                     <span className="contact-value">Saad Ahmad Mirani</span>
                  </div>
                  <div className="contact-row">
                     <span className="contact-label"><i className="fas fa-envelope"></i> Email</span>
                     <a href="mailto:saadahmadmirani2026@gmail.com" className="contact-value contact-link">
                        ahmadmirani2026@gmail.com
                     </a>
                  </div>
                  <div className="contact-row">
                     <span className="contact-label"><i className="fas fa-phone"></i> Phone</span>
                     <a href="tel:+917091409115" className="contact-value contact-link">
                        +91-7091409115
                     </a>
                  </div>
               </div>
            </section>

            <section className="contact-info-section">
               <h2>Visit Us In Person</h2>

               <div className="locations-grid">
                  <div className="location-item">
                     <h3><i className="fas fa-mosque"></i> Khanqah Miran Bheek</h3>
                     <p className="location-address">
                        Miran Bigha, Tekari, Gaya, Bihar, India
                     </p>
                     <p className="location-description">
                        The spiritual center and seat of our heritage
                     </p>
                  </div>

                  <div className="location-item">
                     <h3><i className="fas fa-home"></i> Residence of Saad Ahmad Mirani</h3>
                     <p className="location-address">
                        Bait-ul-Miran, Quazi Mohalla, Sherghati, Gaya, Bihar, India
                     </p>
                     <p className="location-description">
                        Personal residence for meetings and discussions
                     </p>
                  </div>
               </div>
            </section>
         </div>

         <section className="contact-message">
            <h2>We Look Forward to Hearing From You</h2>
            <p>
               Whether you have questions about our genealogies, want to contribute information,
               or simply wish to learn more about the heritage and teachings of our Sufi saints,
               we welcome your contact.
            </p>
            <p>
               Feel free to reach out via email or phone, or visit us in person at either of our locations.
            </p>
         </section>
      </div>
   );
}
