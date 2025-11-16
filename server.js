const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

if ((process.env.NODE_ENV || 'development') !== 'development') {
  app.use(limiter);
}
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://www.google.com", "https://maps.gstatic.com"],
      frameSrc: ["'self'", "https://www.google.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
const workUploadsDir = path.join(uploadsDir, 'work');
if (!fs.existsSync(workUploadsDir)) {
  fs.mkdirSync(workUploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

const appointmentRoutes = require('./routes/appointments');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');

app.use('/api/appointments', appointmentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const requiredEnv = ['ADMIN_EMAIL','ADMIN_PASSWORD','JWT_SECRET'];
const optionalEnv = ['GOOGLE_SERVICE_ACCOUNT_EMAIL','GOOGLE_PRIVATE_KEY','GOOGLE_SHEET_ID','EMAIL_HOST','EMAIL_PORT','EMAIL_USER','EMAIL_PASS','CLIENT_URL'];
const present = (key) => Boolean(process.env[key] && process.env[key].trim());
console.log('[Config] Env presence:', Object.fromEntries([
  ...requiredEnv.map(k => [k, present(k)]),
  ...optionalEnv.map(k => [k, present(k)])
]));

const clientDist = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  const emailConfigured = present('EMAIL_HOST') && present('EMAIL_USER') && present('EMAIL_PASS');
  console.log(`📧 Email service: ${emailConfigured ? 'Configured' : 'Not configured'}`);
  console.log(`📊 Google Sheets: ${process.env.GOOGLE_SHEET_ID ? 'Configured' : 'Not configured'}`);
});