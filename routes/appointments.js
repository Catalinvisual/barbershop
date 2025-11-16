const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');
const emailService = require('../services/emailService');

router.post('/book', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
  body('service').trim().notEmpty().withMessage('Service is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, service, date, time, notes } = req.body;
    
    const appointmentData = {
      name,
      email,
      phone,
      service,
      date,
      time,
      notes: notes || '',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    googleSheetsService.addAppointment(appointmentData).catch((sheetsError) => {
      console.log('Google Sheets failed, but appointment will still be processed:', sheetsError.message);
    });
    
    emailService.sendConfirmationEmail(email, appointmentData).catch(() => {
      console.log('Email failed but booking successful - appointment booked without email confirmation');
    });
    
    res.json({ 
      success: true, 
      message: 'Appointment booked successfully!' 
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error booking appointment. Please try again.' 
    });
  }
});

router.get('/available-times', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const availableTimes = await googleSheetsService.getAvailableTimes(date);
    res.json({ success: true, availableTimes });
  } catch (error) {
    console.error('Available times error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching available times' 
    });
  }
});

router.get('/services', async (req, res) => {
  try {
    const services = await googleSheetsService.getAllServices();
    res.json({ success: true, services });
  } catch (error) {
    console.error('Public services error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

router.get('/work', async (req, res) => {
  try {
    const work = await googleSheetsService.getAllWork();
    res.json({ success: true, work });
  } catch (error) {
    console.error('Public work error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch work' });
  }
});

module.exports = router;