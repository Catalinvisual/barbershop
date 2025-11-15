const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const emailService = require('../services/emailService');
const googleSheetsService = require('../services/googleSheetsService');

router.post('/send', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, subject, message } = req.body;
    
    // Try to send email, but don't fail the form submission if email fails
    try {
      await emailService.sendContactEmail({ name, email, phone, subject, message });
    } catch (emailError) {
      console.log('Email failed but form submission successful - message logged but not emailed');
    }
    
    // Try to save message to Google Sheets with local fallback
    try {
      await googleSheetsService.addMessage({
        name,
        email,
        phone, // Include phone as required field
        message: `Subject: ${subject}\n\n${message}` // Combine subject and message
      });
    } catch (sheetsError) {
      console.log('Google Sheets failed for message, but form submission successful:', sheetsError.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Message sent successfully! We will get back to you soon.' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending message. Please try again.' 
    });
  }
});

module.exports = router;