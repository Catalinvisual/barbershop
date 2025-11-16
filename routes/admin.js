const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if username matches admin email
    if (username !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await googleSheetsService.getAllAppointments();
    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

router.put('/appointments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const ok = await googleSheetsService.updateAppointmentStatus(id, status);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, message: 'Appointment status updated' });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
});

router.delete('/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await googleSheetsService.deleteAppointment(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ message: 'Failed to delete appointment' });
  }
});

router.post('/appointments/migrate-ids', authenticateToken, async (req, res) => {
  try {
    const result = await googleSheetsService.ensureAppointmentIds();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Migrate appointment IDs error:', error);
    res.status(500).json({ message: 'Failed to migrate appointment IDs' });
  }
});

router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await googleSheetsService.getAllMessages();
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

router.get('/services', authenticateToken, async (req, res) => {
  try {
    const services = await googleSheetsService.getAllServices();
    res.json({ success: true, services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

router.get('/work', authenticateToken, async (req, res) => {
  try {
    const items = await googleSheetsService.getAllWork();
    res.json({ success: true, work: items });
  } catch (error) {
    console.error('Get work error:', error);
    res.status(500).json({ message: 'Failed to fetch work items' });
  }
});

router.post('/work', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, image_url, active, order } = req.body;
    const created = await googleSheetsService.addWork({ title, description, category, image_url, active, order });
    res.json({ success: true, item: created });
  } catch (error) {
    console.error('Add work error:', error);
    res.status(500).json({ message: 'Failed to add work item' });
  }
});

router.put('/work/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, image_url, active, order } = req.body;
    const ok = await googleSheetsService.updateWork(id, { title, description, category, image_url, active, order });
    res.json({ success: ok });
  } catch (error) {
    console.error('Update work error:', error);
    res.status(500).json({ message: 'Failed to update work item' });
  }
});

router.delete('/work/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await googleSheetsService.deleteWork(id);
    res.json({ success: ok });
  } catch (error) {
    console.error('Delete work error:', error);
    res.status(500).json({ message: 'Failed to delete work item' });
  }
});

router.post('/work/upload', authenticateToken, async (req, res) => {
  try {
    const { fileBase64, filename } = req.body;
    if (!fileBase64 || !filename) {
      return res.status(400).json({ success: false, message: 'Missing file data' });
    }

    const match = fileBase64.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid base64 data' });
    }
    const mime = match[1];
    const data = match[2];
    const buffer = Buffer.from(data, 'base64');

    const ext = (mime.split('/')[1] || 'png').toLowerCase();
    const safeName = filename.replace(/[^a-zA-Z0-9-_\.]/g, '');
    const baseName = safeName.replace(/\.[^\.]+$/, '');
    const uniqueName = `${Date.now()}-${baseName}.${ext}`;

    const path = require('path');
    const fs = require('fs');
    const uploadDir = path.join(__dirname, '..', 'uploads', 'work');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const relative = `/uploads/work/${uniqueName}`;
    const absolute = `${req.protocol}://${req.get('host')}${relative}`;
    return res.json({ success: true, url: absolute, relative });
  } catch (error) {
    console.error('Work image upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});
router.post('/services', authenticateToken, async (req, res) => {
  try {
    const { name, description, duration_min, price, category, active } = req.body;
    const created = await googleSheetsService.addService({
      name,
      description,
      duration_min,
      price,
      category,
      active
    });
    res.json({ success: true, service: created });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ message: 'Failed to add service' });
  }
});

router.put('/services/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration_min, price, category, active } = req.body;
    const ok = await googleSheetsService.updateService(id, {
      name,
      description,
      duration_min,
      price,
      category,
      active
    });
    res.json({ success: ok });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Failed to update service' });
  }
});

router.delete('/services/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await googleSheetsService.deleteService(id);
    res.json({ success: ok });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Failed to delete service' });
  }
});

module.exports = router;