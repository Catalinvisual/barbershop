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
        subject: 'Appointment Confirmation – Barbershop',
        html: `
          <div style="background:#f3f4f6; padding:24px; font-family: Arial, Helvetica, sans-serif;">
            <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.08);">
              <div style="background:#1f2937; color:#fff; padding:24px; text-align:center;">
                <div style="font-size:24px; font-weight:700; letter-spacing:0.5px;">Barbershop</div>
                <div style="margin-top:6px; font-size:14px; opacity:0.9;">Appointment Confirmation</div>
              </div>
              <div style="padding:28px;">
                <div style="font-size:18px; color:#111827;">Hi ${appointmentData.name},</div>
                <p style="margin:12px 0 0; color:#374151; font-size:14px; line-height:1.6;">Thank you for booking with us! Your appointment is confirmed. Here are the details:</p>
                <div style="margin:20px 0; border:1px solid #e5e7eb; border-radius:10px; padding:16px;">
                  <div style="display:flex; gap:12px; align-items:center; margin-bottom:10px;">
                    <div style="width:8px; height:8px; background:#10b981; border-radius:50%;"></div>
                    <div style="font-weight:600; color:#111827;">Appointment Details</div>
                  </div>
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:14px; color:#374151;">
                    <div><span style="color:#6b7280;">Service:</span> <span style="font-weight:600; color:#111827;">${appointmentData.service}</span></div>
                    <div><span style="color:#6b7280;">Date:</span> <span style="font-weight:600; color:#111827;">${appointmentData.date}</span></div>
                    <div><span style="color:#6b7280;">Time:</span> <span style="font-weight:600; color:#111827;">${appointmentData.time}</span></div>
                    <div><span style="color:#6b7280;">Status:</span> <span style="font-weight:600; color:#10b981;">Confirmed</span></div>
                    ${appointmentData.notes ? `<div style="grid-column:1 / -1;"><span style="color:#6b7280;">Notes:</span> <span style="color:#111827;">${appointmentData.notes}</span></div>` : ''}
                  </div>
                </div>
                <p style="margin:0; color:#374151; font-size:14px; line-height:1.6;">If you need to reschedule or cancel, please contact us.</p>
                <div style="margin-top:22px; text-align:center;">
                  <a href="#" style="display:inline-block; background:#111827; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px; font-size:14px;">Thank you</a>
                </div>
                <div style="margin-top:28px; text-align:center; color:#6b7280; font-size:12px;">
                  <div>Barbershop Team</div>
                  ${process.env.ADMIN_EMAIL ? `<div style="margin-top:4px;">${process.env.ADMIN_EMAIL}</div>` : ''}
                </div>
              </div>
            </div>
          </div>
        `,
      };

      try {
        await this.transporter.sendMail(mailOptions);
      } catch (primaryError) {
        const transient = ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION'];
        if (transient.includes(primaryError.code || '')) {
          const fallbackTransporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            }
          });
          await fallbackTransporter.sendMail(mailOptions);
        } else {
          throw primaryError;
        }
      }
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

      try {
        await this.transporter.sendMail(mailOptions);
      } catch (primaryError) {
        const transient = ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION'];
        if (transient.includes(primaryError.code || '')) {
          const fallbackTransporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            }
          });
          await fallbackTransporter.sendMail(mailOptions);
        } else {
          throw primaryError;
        }
      }
      console.log('Contact email sent successfully');
    } catch (error) {
      console.error('Error sending contact email:', error);
      // Don't throw error - continue with form submission even if email fails
    }
  }
}

module.exports = new EmailService();