import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const aboutRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(imageRef.current,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: aboutRef.current,
            start: 'top 95%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo(contentRef.current,
        { opacity: 0, x: 50 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: aboutRef.current,
            start: 'top 95%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, aboutRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { number: '15+', label: 'Years Experience' },
    { number: '5000+', label: 'Happy Clients' },
    { number: '50+', label: 'Awards Won' },
    { number: '4.9', label: 'Average Rating' }
  ];

  return (
    <section id="about" className="about section" ref={aboutRef}>
      <div className="container">
        <div className="about-content">
          <div className="about-image" ref={imageRef}>
            <div className="image-wrapper">
              <div className="about-img-placeholder">
                <div className="barber-pole"></div>
              </div>
              <div className="experience-badge">
                <span className="years">15+</span>
                <span className="text">Years of Excellence</span>
              </div>
            </div>
          </div>
          
          <div className="about-text" ref={contentRef}>
            <h2 className="section-title">About Our Barbershop</h2>
            <p className="about-description">
              Welcome to our premium barbershop, where traditional craftsmanship meets modern style. 
              Since 2009, we've been providing exceptional grooming services to discerning gentlemen 
              who appreciate quality and attention to detail.
            </p>
            
            <p className="about-description">
              Our team of master barbers combines years of experience with the latest techniques 
              to deliver the perfect cut, shave, or style tailored to your individual needs. 
              We use only the finest products and maintain the highest standards of hygiene and service.
            </p>
            
            <div className="about-features">
              <div className="feature-item">
                <div className="feature-icon">✅</div>
                <div className="feature-text">
                  <h4>Certified Professionals</h4>
                  <p>All our barbers are licensed and continuously trained</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🌟</div>
                <div className="feature-text">
                  <h4>Premium Products</h4>
                  <p>We use only the best grooming products available</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🏆</div>
                <div className="feature-text">
                  <h4>Award Winning</h4>
                  <p>Multiple awards for excellence in barbering</p>
                </div>
              </div>
            </div>
            
            <div className="about-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => document.querySelector('#appointment').scrollIntoView({ behavior: 'smooth' })}
              className="btn btn-primary"
            >
              Book Your Appointment
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;