import React from 'react';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', href: '#hero' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Book Appointment', href: '#appointment' },
    { name: 'Contact', href: '#contact' }
  ];

  const [footerServices, setFooterServices] = React.useState([]);
  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/appointments/services');
        const data = await res.json();
        if (data.success) {
          const names = (data.services || [])
            .filter(s => s.active === 'true')
            .slice(0, 6)
            .map(s => s.name);
          setFooterServices(names);
        }
      } catch {
        setFooterServices([]);
      }
    };
    fetchServices();
  }, []);

  const socialLinks = [
    { name: 'Facebook', icon: FaFacebook, url: '#' },
    { name: 'Instagram', icon: FaInstagram, url: '#' },
    { name: 'Twitter', icon: FaTwitter, url: '#' },
    { name: 'YouTube', icon: FaYoutube, url: '#' }
  ];

  const handleScrollTo = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section footer-about">
              <div className="footer-logo">
                <h3>BarberShop</h3>
                <p className="tagline">Where Style Meets Tradition</p>
              </div>
              <p className="footer-description">
                Experience the finest barbering services in town. Our skilled barbers combine traditional techniques with modern styles to give you the perfect look.
              </p>
              <div className="footer-social">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    className="social-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.name}
                  >
                    <span className="social-icon"><social.icon /></span>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="footer-section footer-links">
              <h4>Quick Links</h4>
              <ul className="footer-list">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <button 
                      onClick={() => handleScrollTo(link.href)}
                      className="footer-link"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="footer-section footer-services">
              <h4>Our Services</h4>
              <ul className="footer-list">
                {footerServices.map((service, index) => (
                  <li key={index}>
                    <span className="service-item">{service}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="footer-section footer-contact">
              <h4>Contact Info</h4>
              <div className="contact-info">
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <span className="contact-text">
                    123 Main Street<br />
                    New York, NY 10001
                  </span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <span className="contact-text">
                    (555) 123-4567
                  </span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">✉️</span>
                  <span className="contact-text">
                    info@barbershop.com
                  </span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🕐</span>
                  <span className="contact-text">
                    Mon-Sat: 9AM-8PM<br />
                    Sun: 10AM-4PM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <div className="footer-copyright">
              <p>&copy; {currentYear} BarberShop. All rights reserved.</p>
            </div>
            <div className="footer-created">
              <span>Created by </span>
              <a href="https://www.haplogic.com" target="_blank" rel="noopener noreferrer" className="footer-bottom-link">HapLogic</a>
            </div>
            <div className="footer-bottom-links">
              <a href="#" className="footer-bottom-link">Privacy Policy</a>
              <a href="#" className="footer-bottom-link">Terms of Service</a>
              <a href="#" className="footer-bottom-link">Cookie Policy</a>
              <a href="/admin" className="footer-bottom-link admin-link">Admin Login</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;