const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Only create transporter if email credentials are configured
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      this.isConfigured = true;
    } else {
      console.log('Email service not configured - will log emails instead');
      this.isConfigured = false;
    }
  }

  async sendConfirmationEmail(to, appointmentData) {
    try {
      if (!this.isConfigured) {
        console.log(`Email not configured - would send confirmation to ${to}:`, appointmentData);
        return;
      }

      const mailOptions = {
        from: `"Barbershop" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Appointment Confirmation - Barbershop',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Barbershop</h1>
              <p style="margin: 10px 0 0 0;">Appointment Confirmation</p>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #2c3e50;">Hello ${appointmentData.name},</h2>
              <p>Your appointment has been confirmed! Here are the details:</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2c3e50; margin-top: 0;">Appointment Details</h3>
                <p><strong>Service:</strong> ${appointmentData.service}</p>
                <p><strong>Date:</strong> ${appointmentData.date}</p>
                <p><strong>Time:</strong> ${appointmentData.time}</p>
                <p><strong>Status:</strong> <span style="color: #27ae60;">Confirmed</span></p>
                ${appointmentData.notes ? `<p><strong>Notes:</strong> ${appointmentData.notes}</p>` : ''}
              </div>
              
              <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
              <p>We look forward to seeing you!</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #7f8c8d; font-size: 14px;">
                  Barbershop Team<br>
                  Phone: (555) 123-4567<br>
                  Email: info@barbershop.com
                </p>
              </div>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Confirmation email sent successfully');
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Don't throw error - continue with booking even if email fails
    }
  }

  async sendContactEmail(contactData) {
    try {
      if (!this.isConfigured) {
        console.log(`Email not configured - would send contact form from ${contactData.email}:`, contactData);
        return;
      }

      const mailOptions = {
        from: `"${contactData.name}" <${contactData.email}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `Contact Form: ${contactData.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Barbershop</h1>
              <p style="margin: 10px 0 0 0;">New Contact Form Submission</p>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h3 style="color: #2c3e50;">From: ${contactData.name}</h3>
              <p><strong>Email:</strong> ${contactData.email}</p>
              ${contactData.phone ? `<p><strong>Phone:</strong> ${contactData.phone}</p>` : ''}
              <p><strong>Subject:</strong> ${contactData.subject}</p>
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0;">Message:</h4>
                <p style="white-space: pre-wrap;">${contactData.message}</p>
              </div>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Contact email sent successfully');
    } catch (error) {
      console.error('Error sending contact email:', error);
      // Don't throw error - continue with form submission even if email fails
    }
  }
}

module.exports = new EmailService();