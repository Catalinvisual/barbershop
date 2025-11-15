import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Services.css';

gsap.registerPlugin(ScrollTrigger);

const Services = () => {
  const servicesRef = useRef(null);
  const titleRef = useRef(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = document.querySelectorAll('.service-card');
      if (cards.length > 0) {
        gsap.fromTo(cards, 
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: servicesRef.current,
              start: 'top 95%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    }, servicesRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/appointments/services');
        const data = await res.json();
        if (data.success) {
          const active = (data.services || []).filter(s => s.active === 'true');
          setServices(active);
        }
      } catch {
        setServices([]);
      }
    };
    fetchServices();
  }, []);

  const scrollToAppointment = () => {
    const element = document.querySelector('#appointment');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="services section" ref={servicesRef}>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title" ref={titleRef}>Our Services</h2>
          <p className="section-subtitle">
            Discover our range of professional grooming services designed to make you look and feel your best.
          </p>
        </div>
        
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={service.id} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <div className="service-content">
                <h3 className="service-name">{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-footer">
                  <div className="service-details">
                    <span className="service-price">€{service.price}</span>
                    <span className="service-duration">{service.duration} min</span>
                  </div>
                  <button 
                    onClick={scrollToAppointment}
                    className="btn btn-outline service-btn"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="services-cta">
          <p className="cta-text">Not sure what you need?</p>
          <button 
            onClick={() => document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' })}
            className="btn btn-primary"
          >
            Contact Us for Advice
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;