import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import About from '../components/About';
import Gallery from '../components/Gallery';
import Testimonials from '../components/Testimonials';
import Appointment from '../components/Appointment';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="home">
      <Hero />
      <Services />
      <About />
      <Gallery />
      <Testimonials />
      <Appointment />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;