const nodemailer = require('nodemailer');
const { google } = require('googleapis');

class EmailService {
  constructor() {
    const hasGmail = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;
    const hasSendGrid = process.env.SENDGRID_KEY;
    if (hasSendGrid) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 465,
        secure: true,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_KEY,
        },
        pool: true,
        maxConnections: 1,
        maxMessages: Infinity,
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });
      if (hasGmail) {
        const isGmail = String(process.env.EMAIL_HOST).includes('gmail');
        const defaultPort = process.env.EMAIL_PORT
          ? Number(process.env.EMAIL_PORT)
          : (isGmail ? 465 : 587);
        this.fallbackTransporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: defaultPort,
          secure: defaultPort === 465,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          pool: true,
          maxConnections: 1,
          maxMessages: Infinity,
          connectionTimeout: 10000,
          socketTimeout: 10000,
        });
      }
      this.isConfigured = true;
    } else if (hasGmail) {
      const isGmail = String(process.env.EMAIL_HOST).includes('gmail');
      const defaultPort = process.env.EMAIL_PORT
        ? Number(process.env.EMAIL_PORT)
        : (isGmail ? 465 : 587);
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: defaultPort,
        secure: defaultPort === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        pool: true,
        maxConnections: 1,
        maxMessages: Infinity,
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });
      this.isConfigured = true;
    } else {
      console.log('Email service not configured - will log emails instead');
      this.isConfigured = false;
    }
    this.gmailApiConfigured = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN && process.env.EMAIL_USER);
  }

  async sendViaGmailApi(mailOptions) {
    const oauth2Client = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const to = Array.isArray(mailOptions.to) ? mailOptions.to.join(', ') : mailOptions.to;
    const from = mailOptions.from;
    const subject = mailOptions.subject;
    const replyTo = mailOptions.replyTo || '';
    const text = mailOptions.text || '';
    const html = mailOptions.html || '';
    const headers = mailOptions.headers || {};
    const headerLines = Object.entries(headers).map(([k, v]) => `${k}: ${v}`);
    const parts = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      replyTo ? `Reply-To: ${replyTo}` : '',
      ...headerLines,
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="bnd"',
      '',
      '--bnd',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      text,
      '--bnd',
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html,
      '--bnd--'
    ].filter(Boolean).join('\r\n');
    const raw = Buffer.from(parts).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  }

  async sendConfirmationEmail(to, appointmentData) {
    try {
      if (!this.isConfigured) {
        console.log(`Email not configured - would send confirmation to ${to}:`, appointmentData);
        return;
      }

      const headers = {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      };
      if (process.env.ADMIN_EMAIL) {
        headers['List-Unsubscribe'] = `mailto:${process.env.ADMIN_EMAIL}`;
      }

      const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER;
      const mailOptions = {
        from: `"Barbershop" <${fromEmail}>`,
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
        text: `Hi ${appointmentData.name},\nYour appointment is confirmed.\nService: ${appointmentData.service}\nDate: ${appointmentData.date}\nTime: ${appointmentData.time}\nIf you need to reschedule or cancel, please contact us.\nBarbershop Team${process.env.ADMIN_EMAIL ? `\n${process.env.ADMIN_EMAIL}` : ''}`,
        replyTo: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        headers,
      };

      try {
        await this.transporter.sendMail(mailOptions);
      } catch (primaryError) {
        const transient = ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION'];
        if (transient.includes(primaryError.code || '')) {
          if (this.fallbackTransporter) {
            await this.fallbackTransporter.sendMail(mailOptions);
          } else {
            const altPort = (this.transporter.options.port === 465) ? 587 : 465;
            const altSecure = altPort === 465;
            const altTransporter = nodemailer.createTransport({
              host: process.env.EMAIL_HOST,
              port: altPort,
              secure: altSecure,
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
              },
              connectionTimeout: 20000,
              socketTimeout: 20000,
            });
            try {
              await altTransporter.sendMail(mailOptions);
            } catch (altError) {
              if (this.gmailApiConfigured) {
                await this.sendViaGmailApi(mailOptions);
              } else {
                throw primaryError;
              }
            }
          }
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

      const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER;
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
        text: `New contact form submission from ${contactData.name}\nEmail: ${contactData.email}\n${contactData.phone ? `Phone: ${contactData.phone}\n` : ''}Subject: ${contactData.subject}\n\nMessage:\n${contactData.message}`,
        replyTo: contactData.email,
      };

      try {
        await this.transporter.sendMail(mailOptions);
      } catch (primaryError) {
        const transient = ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION'];
        if (transient.includes(primaryError.code || '')) {
          if (this.fallbackTransporter) {
            await this.fallbackTransporter.sendMail(mailOptions);
          } else {
            const altPort = (this.transporter.options.port === 465) ? 587 : 465;
            const altSecure = altPort === 465;
            const altTransporter = nodemailer.createTransport({
              host: process.env.EMAIL_HOST,
              port: altPort,
              secure: altSecure,
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
              },
              connectionTimeout: 20000,
              socketTimeout: 20000,
            });
            try {
              await altTransporter.sendMail(mailOptions);
            } catch (altError) {
              if (this.gmailApiConfigured) {
                await this.sendViaGmailApi(mailOptions);
              } else {
                throw primaryError;
              }
            }
          }
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