import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Gallery.css';

gsap.registerPlugin(ScrollTrigger);

const Gallery = () => {
  const galleryRef = useRef(null);

  const [galleryItems, setGalleryItems] = useState([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.gallery-item',
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: galleryRef.current,
            start: 'top 95%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, galleryRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const fetchWork = async () => {
      try {
        const res = await fetch('/api/appointments/work');
        const data = await res.json();
        if (data.success) {
          const active = (data.work || []).filter(w => w.active === 'true');
          setGalleryItems(active);
        }
      } catch {
        setGalleryItems([]);
      }
    };
    fetchWork();
  }, []);

  return (
    <section id="gallery" className="gallery section" ref={galleryRef}>
      <div className="container">
        <div className="gallery-header">
          <h2 className="section-title">Our Work</h2>
          <p className="section-subtitle">
            Check out some of our recent work and see the quality of our craftsmanship
          </p>
        </div>
        
        <div className="gallery-grid">
          {galleryItems.map((item) => {
            const raw = item.image_url || '';
            let imgSrc = '';
            if (!raw) {
              imgSrc = '';
            } else if (raw.startsWith('http://localhost:5000')) {
              imgSrc = raw.replace('http://localhost:5000', '');
            } else if (raw.startsWith('https://localhost:5000')) {
              imgSrc = raw.replace('https://localhost:5000', '');
            } else if (raw.startsWith('/uploads')) {
              imgSrc = raw;
            } else if (raw.startsWith('uploads')) {
              imgSrc = `/${raw}`;
            } else {
              imgSrc = raw;
            }
            return (
            <div key={item.id} className="gallery-item">
              <div className="gallery-image">
                {imgSrc ? (
                  <img src={imgSrc} alt={item.title} className="gallery-photo" />
                ) : (
                  <div className="image-placeholder">🖼️</div>
                )}
                <div className="gallery-overlay">
                  <div className="overlay-content">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <span className="category-tag">{item.category}</span>
                  </div>
                </div>
              </div>
            </div>
          );})}
        </div>
        
        <div className="gallery-cta">
          <p className="cta-text">Ready to transform your look?</p>
          <button 
            onClick={() => document.querySelector('#appointment').scrollIntoView({ behavior: 'smooth' })}
            className="btn btn-primary"
          >
            Book Your Appointment
          </button>
        </div>
      </div>
    </section>
  );
};

export default Gallery;