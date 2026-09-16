const { db } = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.getPublicPhotos = (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM work_photos WHERE is_visible = 1';
    const params = [];

    if (category && category !== 'ALL') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';
    const photos = db.prepare(query).all(...params);
    return res.json({ success: true, work_photos: photos });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve work gallery photos.' });
  }
};

exports.getAllPhotosAdmin = (req, res) => {
  try {
    const photos = db.prepare('SELECT * FROM work_photos ORDER BY created_at DESC').all();
    return res.json({ success: true, work_photos: photos });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin work photos.' });
  }
};

exports.uploadWorkPhoto = (req, res) => {
  try {
    const { title, description, category, installation_date, location } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Project title and category are required.' });
    }

    const image_url = `/uploads/${req.file.filename}`;

    const stmt = db.prepare(`
      INSERT INTO work_photos (image_url, title, description, category, installation_date, location, is_visible)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      image_url,
      title.trim(),
      description ? description.trim() : '',
      category.trim(),
      installation_date || new Date().toISOString().split('T')[0],
      location ? location.trim() : ''
    );

    const newPhoto = db.prepare('SELECT * FROM work_photos WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: '✅ Work photo added successfully.',
      work_photo: newPhoto
    });
  } catch (error) {
    console.error('Error uploading work photo:', error);
    return res.status(500).json({ success: false, message: 'Server error while uploading photo.' });
  }
};

exports.updateWorkPhoto = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, installation_date, location, is_visible } = req.body;

    const photo = db.prepare('SELECT * FROM work_photos WHERE id = ?').get(id);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Work photo not found.' });
    }

    db.prepare(`
      UPDATE work_photos SET
        title = ?, description = ?, category = ?, installation_date = ?, location = ?, is_visible = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title !== undefined ? title.trim() : photo.title,
      description !== undefined ? description.trim() : photo.description,
      category !== undefined ? category.trim() : photo.category,
      installation_date !== undefined ? installation_date : photo.installation_date,
      location !== undefined ? location.trim() : photo.location,
      is_visible !== undefined ? (is_active_or_visible(is_visible)) : photo.is_visible,
      id
    );

    function is_active_or_visible(val) {
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (val === '1' || val === 1 || val === 'true') return 1;
      return 0;
    }

    const updated = db.prepare('SELECT * FROM work_photos WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Work photo information updated successfully.', work_photo: updated });
  } catch (error) {
    console.error('Error updating work photo:', error);
    return res.status(500).json({ success: false, message: 'Failed to update work photo.' });
  }
};

exports.deleteWorkPhoto = (req, res) => {
  try {
    const { id } = req.params;
    const photo = db.prepare('SELECT * FROM work_photos WHERE id = ?').get(id);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Work photo not found.' });
    }

    // Try deleting local file if uploaded
    if (photo.image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', photo.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.prepare('DELETE FROM work_photos WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Work photo permanently deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete work photo.' });
  }
};
