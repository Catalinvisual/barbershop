import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' },
  ];

  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
      return;
    }
    if (location.pathname !== '/') {
      navigate('/' + href);
      setTimeout(() => {
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
    setIsMenuOpen(false);
  };

  return (
    <motion.header
      className={`header ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-text">Barbershop</span>
            <span className="logo-subtitle">Premium Grooming</span>
          </Link>

          <nav className={`nav ${isMenuOpen ? 'active' : ''}`}>
            {isMobile && (
              <button
                className="nav-close"
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
              >
                ×
              </button>
            )}
            <ul className="nav-list">
              {navItems.map((item, index) => (
                <motion.li
                  key={item.name}
                  className="nav-item"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <button
                    onClick={() => scrollToSection(item.href)}
                    className="nav-link"
                  >
                    {item.name}
                  </button>
                </motion.li>
              ))}
              {isMobile && (
                <motion.li
                  className="nav-item"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: navItems.length * 0.1 }}
                >
                  <Link to="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Admin
                  </Link>
                </motion.li>
              )}
            </ul>
          </nav>

          <div className="header-actions">
            {!isMobile && (
              <>
                <button
                  onClick={() => scrollToSection('#appointment')}
                  className="btn btn-primary"
                >
                  Book Now
                </button>
                <Link to="/admin" className="admin-link">
                  Admin
                </Link>
              </>
            )}
          </div>

          <button
            className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;