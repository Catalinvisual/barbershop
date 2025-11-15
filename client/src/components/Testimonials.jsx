import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Testimonials.css';

gsap.registerPlugin(ScrollTrigger);

const Testimonials = () => {
  const testimonialsRef = useRef(null);

  const testimonials = [
    {
      id: 1,
      name: "Michael Johnson",
      rating: 5,
      comment: "Best barbershop in town! The attention to detail is incredible. I've been coming here for 3 years and never been disappointed.",
      service: "Haircut + Beard",
      image: "👨‍💼"
    },
    {
      id: 2,
      name: "David Chen",
      rating: 5,
      comment: "Professional, clean, and friendly atmosphere. The hot towel shave is absolutely amazing. Highly recommend!",
      service: "Hot Towel Shave",
      image: "👨‍💻"
    },
    {
      id: 3,
      name: "Robert Martinez",
      rating: 5,
      comment: "Great experience every time. The barbers are skilled and take their time to ensure you get exactly what you want.",
      service: "Classic Haircut",
      image: "👨‍🎓"
    },
    {
      id: 4,
      name: "James Wilson",
      rating: 5,
      comment: "My son loves coming here for his haircuts. The staff is great with kids and very patient. Excellent service!",
      service: "Kids Haircut",
      image: "👨‍👦"
    }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.testimonial-card',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: testimonialsRef.current,
            start: 'top 95%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, testimonialsRef);

    return () => ctx.revert();
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={`star ${index < rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  return (
    <section id="testimonials" className="testimonials section" ref={testimonialsRef}>
      <div className="container">
        <div className="testimonials-header">
          <h2 className="section-title">What Our Clients Say</h2>
          <p className="section-subtitle">
            Don't just take our word for it. Here's what our satisfied customers have to say about our services.
          </p>
        </div>
        
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-header">
                <div className="client-image">{testimonial.image}</div>
                <div className="client-info">
                  <h4 className="client-name">{testimonial.name}</h4>
                  <p className="service-name">{testimonial.service}</p>
                </div>
              </div>
              
              <div className="testimonial-rating">
                {renderStars(testimonial.rating)}
              </div>
              
              <p className="testimonial-comment">
                "{testimonial.comment}"
              </p>
              
              <div className="testimonial-footer">
                <span className="verified-badge">✓ Verified Customer</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="testimonials-cta">
          <p className="cta-text">Ready to experience our exceptional service?</p>
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

export default Testimonials;