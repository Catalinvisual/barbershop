import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post('/api/contact/send', formData);
      
      if (response.data.success) {
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err.msg));
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: FaMapMarkerAlt,
      title: 'Address',
      content: '123 Main Street\nNew York, NY 10001',
      type: 'address'
    },
    {
      icon: FaPhone,
      title: 'Phone',
      content: '(555) 123-4567',
      type: 'phone'
    },
    {
      icon: FaEnvelope,
      title: 'Email',
      content: 'info@barbershop.com',
      type: 'email'
    },
    {
      icon: FaClock,
      title: 'Hours',
      content: 'Mon - Fri: 9AM - 8PM\nSat: 9AM - 6PM\nSun: 10AM - 4PM',
      type: 'hours'
    }
  ];

  const socialLinks = [
    { name: 'Facebook', icon: FaFacebook, url: '#' },
    { name: 'Instagram', icon: FaInstagram, url: '#' },
    { name: 'Twitter', icon: FaTwitter, url: '#' },
    { name: 'YouTube', icon: FaYoutube, url: '#' }
  ];

  return (
    <section id="contact" className="contact section">
      <div className="container">
        <div className="contact-header">
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-subtitle">
            Have questions or want to book an appointment? We'd love to hear from you!
          </p>
        </div>
        
        <div className="contact-content">
          <div className="contact-form-wrapper">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="contact-name">Your Name *</label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contact-email">Email Address *</label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contact-phone">Phone Number *</label>
                <input
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contact-subject">Subject *</label>
                <input
                  type="text"
                  id="contact-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="How can we help you?"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contact-message">Message *</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows="6"
                  placeholder="Tell us more about what you're looking for..."
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading"></span>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
          
          <div className="contact-info">
            <div className="info-cards">
              {contactInfo.map((info, index) => (
                <div key={index} className="info-card">
                  <div className="info-icon"><info.icon /></div>
                  <div className="info-content">
                    <h4>{info.title}</h4>
                    <p>{info.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="social-section">
              <h3>Follow Us</h3>
              <div className="social-links">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    className={`social-link ${social.name.toLowerCase()}`}
                    title={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="social-icon"><social.icon /></span>
                    <span className="social-name">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="map-placeholder">
              <div className="map-content">
                <div className="map-icon">🗺️</div>
                <p>Interactive Map</p>
                <small>Click to view on Google Maps</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;