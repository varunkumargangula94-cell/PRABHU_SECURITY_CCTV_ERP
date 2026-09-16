const { db } = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.getPublicComboOffers = (req, res) => {
  try {
    const offers = db.prepare('SELECT * FROM combo_offers WHERE is_active = 1 ORDER BY id ASC').all();
    const formatted = offers.map(o => ({
      ...o,
      features: o.features_json ? JSON.parse(o.features_json) : []
    }));
    return res.json({ success: true, combo_offers: formatted });
  } catch (error) {
    console.error('Error fetching public combo offers:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve combo offers.' });
  }
};

exports.getAllComboOffersAdmin = (req, res) => {
  try {
    const offers = db.prepare('SELECT * FROM combo_offers ORDER BY id DESC').all();
    const formatted = offers.map(o => ({
      ...o,
      features: o.features_json ? JSON.parse(o.features_json) : []
    }));
    return res.json({ success: true, combo_offers: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin combo offers list.' });
  }
};

exports.createComboOffer = (req, res) => {
  try {
    const { title, subtitle, camera_count, original_price, offer_price, badge, features, description, is_active } = req.body;

    if (!title || !offer_price) {
      return res.status(400).json({ success: false, message: 'Combo title and offer price are required.' });
    }

    let image_url = '/images/products/kit_4cam.svg';
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    let featuresJson = '[]';
    if (features) {
      if (Array.isArray(features)) {
        featuresJson = JSON.stringify(features);
      } else if (typeof features === 'string') {
        // Split by lines or commas
        const items = features.split('\n').map(s => s.trim()).filter(Boolean);
        featuresJson = JSON.stringify(items);
      }
    }

    const activeVal = (is_active === '0' || is_active === 0 || is_active === false) ? 0 : 1;
    const origPriceVal = original_price ? parseFloat(original_price) : parseFloat(offer_price) * 1.25;

    const stmt = db.prepare(`
      INSERT INTO combo_offers (title, subtitle, camera_count, original_price, offer_price, badge, features_json, image_url, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      subtitle ? subtitle.trim() : 'Cameras + Cabling + Installation Work',
      camera_count ? parseInt(camera_count, 10) : 4,
      origPriceVal,
      parseFloat(offer_price),
      badge ? badge.trim() : 'COMBO OFFER',
      featuresJson,
      image_url,
      description ? description.trim() : '',
      activeVal
    );

    const newOffer = db.prepare('SELECT * FROM combo_offers WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      success: true,
      message: '✅ Combo offer (Cameras + Work) created successfully.',
      combo_offer: {
        ...newOffer,
        features: JSON.parse(newOffer.features_json || '[]')
      }
    });

  } catch (error) {
    console.error('Error creating combo offer:', error);
    return res.status(500).json({ success: false, message: 'Failed to create combo offer.' });
  }
};

exports.updateComboOffer = (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, camera_count, original_price, offer_price, badge, features, description, is_active } = req.body;

    const offer = db.prepare('SELECT * FROM combo_offers WHERE id = ?').get(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Combo offer not found.' });
    }

    let image_url = offer.image_url;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    let featuresJson = offer.features_json;
    if (features !== undefined) {
      if (Array.isArray(features)) {
        featuresJson = JSON.stringify(features);
      } else if (typeof features === 'string') {
        const items = features.split('\n').map(s => s.trim()).filter(Boolean);
        featuresJson = JSON.stringify(items);
      }
    }

    const activeVal = (is_active !== undefined) ? ((is_active === '1' || is_active === 1 || is_active === true || is_active === 'true') ? 1 : 0) : offer.is_active;

    db.prepare(`
      UPDATE combo_offers SET
        title = ?, subtitle = ?, camera_count = ?, original_price = ?, offer_price = ?, badge = ?, features_json = ?, image_url = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title ? title.trim() : offer.title,
      subtitle !== undefined ? subtitle.trim() : offer.subtitle,
      camera_count ? parseInt(camera_count, 10) : offer.camera_count,
      original_price ? parseFloat(original_price) : offer.original_price,
      offer_price ? parseFloat(offer_price) : offer.offer_price,
      badge ? badge.trim() : offer.badge,
      featuresJson,
      image_url,
      description !== undefined ? description.trim() : offer.description,
      activeVal,
      id
    );

    const updated = db.prepare('SELECT * FROM combo_offers WHERE id = ?').get(id);
    return res.json({
      success: true,
      message: '✅ Combo offer updated successfully.',
      combo_offer: {
        ...updated,
        features: JSON.parse(updated.features_json || '[]')
      }
    });

  } catch (error) {
    console.error('Error updating combo offer:', error);
    return res.status(500).json({ success: false, message: 'Failed to update combo offer.' });
  }
};

exports.deleteComboOffer = (req, res) => {
  try {
    const { id } = req.params;
    const offer = db.prepare('SELECT * FROM combo_offers WHERE id = ?').get(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Combo offer not found.' });
    }

    if (offer.image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', offer.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.prepare('DELETE FROM combo_offers WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Combo offer deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete combo offer.' });
  }
};
