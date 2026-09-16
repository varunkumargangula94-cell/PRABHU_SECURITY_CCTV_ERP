const { db } = require('../config/database');

exports.getServices = (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY id ASC').all();
    return res.json({ success: true, services });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve services.' });
  }
};

exports.getAllServicesAdmin = (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY id ASC').all();
    return res.json({ success: true, services });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin services list.' });
  }
};

exports.createService = (req, res) => {
  try {
    const { title, description, icon } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const stmt = db.prepare('INSERT INTO services (title, description, icon, is_active) VALUES (?, ?, ?, 1)');
    const result = stmt.run(title, description, icon || 'bi-shield-check');
    const newService = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({ success: true, message: 'Service created successfully.', service: newService });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create service.' });
  }
};
