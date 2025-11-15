import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import './Hero.css';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonsRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(titleRef.current, 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      "-=0.5"
    )
    .fromTo(buttonsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      "-=0.3"
    );

    return () => tl.kill();
  }, []);

  const scrollToAppointment = () => {
    const element = document.querySelector('#appointment');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero" ref={heroRef}>
      <div className="hero-background">
        <div className="hero-overlay"></div>
        <div className="hero-video">
          <div className="video-placeholder"></div>
        </div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title" ref={titleRef}>
              Experience the Art of
              <span className="hero-accent"> Premium Grooming</span>
            </h1>
            <p className="hero-subtitle" ref={subtitleRef}>
              Where tradition meets modern style. Our master barbers craft the perfect look 
              tailored to your unique personality and lifestyle.
            </p>
            <div className="hero-buttons" ref={buttonsRef}>
              <button onClick={scrollToAppointment} className="btn btn-primary">
                Book Appointment
              </button>
              <button onClick={() => document.querySelector('#services').scrollIntoView({ behavior: 'smooth' })} className="btn btn-outline">
                View Services
              </button>
            </div>
          </div>
          
          <div className="hero-features">
            <div className="feature">
              <div className="feature-icon">✂️</div>
              <div className="feature-text">
                <h3>Master Barbers</h3>
                <p>Years of experience</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">⭐</div>
              <div className="feature-text">
                <h3>Premium Service</h3>
                <p>Top-quality products</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">🕐</div>
              <div className="feature-text">
                <h3>Flexible Hours</h3>
                <p>Book online 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="scroll-indicator">
        <div className="scroll-arrow"></div>
      </div>
    </section>
  );
};

export default Hero;