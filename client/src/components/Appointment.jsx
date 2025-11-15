import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Appointment.css';

const Appointment = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    notes: ''
  });
  
  const [services, setServices] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (formData.date) {
      fetchAvailableTimes(formData.date);
    }
  }, [formData.date]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/appointments/services');
      setServices(response.data.services);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableTimes = async (date) => {
    try {
      const response = await axios.get(`/api/appointments/available-times?date=${date}`);
      let times = response.data.availableTimes || [];
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      const todayISO = local.toISOString().slice(0, 10);
      if (date === todayISO) {
        const currentHHMM = local.toTimeString().slice(0, 5);
        times = times.filter(t => t >= currentHHMM);
      }
      setAvailableTimes(times);
    } catch (error) {
      toast.error('Failed to load available times');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.service || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post('/api/appointments/book', formData);
      
      if (response.data.success) {
        toast.success('Appointment booked successfully! Check your email for confirmation.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          service: '',
          date: '',
          time: '',
          notes: ''
        });
        setAvailableTimes([]);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err.msg));
      } else {
        toast.error('Failed to book appointment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <section id="appointment" className="appointment section">
      <div className="container">
        <div className="appointment-header">
          <h2 className="section-title">Book Your Appointment</h2>
          <p className="section-subtitle">
            Ready to look your best? Book your appointment online and secure your preferred time slot.
          </p>
        </div>
        
        <div className="appointment-content">
          <div className="appointment-form-wrapper">
            <form className="appointment-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="service">Service *</label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.name}>
                        {service.name} - €{service.price}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    min={getMinDate()}
                    max={getMaxDate()}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="time">Time *</label>
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.date || availableTimes.length === 0}
                  >
                    <option value="">Select a time</option>
                    {availableTimes.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Additional Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Any special requests or preferences..."
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
                  'Book Appointment'
                )}
              </button>
            </form>
          </div>
          
          <div className="appointment-info">
            <div className="info-card">
              <h3>📍 Visit Us</h3>
              <p>123 Main Street<br />New York, NY 10001</p>
            </div>
            
            <div className="info-card">
              <h3>📞 Call Us</h3>
              <p>(555) 123-4567<br />Mon-Sat: 9AM-8PM</p>
            </div>
            
            <div className="info-card">
              <h3>✉️ Email Us</h3>
              <p>info@barbershop.com<br />We'll respond within 24 hours</p>
            </div>
            
            <div className="covid-notice">
              <h4>🦠 COVID-19 Safety</h4>
              <p>We follow all safety protocols including regular sanitization, mask requirements, and social distancing.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Appointment;