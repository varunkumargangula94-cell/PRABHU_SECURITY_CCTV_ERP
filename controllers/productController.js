const { db } = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.getProducts = (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY id DESC').all();
    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
};

exports.getAllProductsAdmin = (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin product list.' });
  }
};

exports.createProduct = (req, res) => {
  try {
    const { name, type, resolution, night_vision, storage_option, price, description, is_active } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Product name and price are required.' });
    }

    let image_url = '/images/products/dome_4k.svg';
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, type, resolution, night_vision, storage_option, price, image_url, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const activeVal = (is_active === '0' || is_active === 0 || is_active === false) ? 0 : 1;

    const result = stmt.run(
      name.trim(),
      type ? type.trim() : 'Dome Camera',
      resolution ? resolution.trim() : '1080p',
      night_vision ? night_vision.trim() : 'IR Night Vision',
      storage_option ? storage_option.trim() : 'SD Card / DVR',
      parseFloat(price),
      image_url,
      description ? description.trim() : '',
      activeVal
    );
    
    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, message: '✅ Camera product added successfully.', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

exports.updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, resolution, night_vision, storage_option, price, description, is_active } = req.body;

    const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let image_url = prod.image_url;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    const activeVal = (is_active !== undefined) ? ((is_active === '1' || is_active === 1 || is_active === true || is_active === 'true') ? 1 : 0) : prod.is_active;

    db.prepare(`
      UPDATE products SET
        name = ?, type = ?, resolution = ?, night_vision = ?, storage_option = ?, price = ?, image_url = ?, description = ?, is_active = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : prod.name,
      type ? type.trim() : prod.type,
      resolution ? resolution.trim() : prod.resolution,
      night_vision ? night_vision.trim() : prod.night_vision,
      storage_option ? storage_option.trim() : prod.storage_option,
      price ? parseFloat(price) : prod.price,
      image_url,
      description !== undefined ? description.trim() : prod.description,
      activeVal,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return res.json({ success: true, message: '✅ Camera product details updated successfully.', product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

exports.deleteProduct = (req, res) => {
  try {
    const { id } = req.params;
    const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Remove uploaded image if local file
    if (prod.image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', prod.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Camera product permanently deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};
