const { db } = require('../config/database');

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
    const { name, type, resolution, night_vision, storage_option, price, image_url, description } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Product name and price are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, type, resolution, night_vision, storage_option, price, image_url, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(name, type || 'CCTV Camera', resolution || '1080p', night_vision || 'Standard', storage_option || 'SD Card', parseFloat(price), image_url || '/images/products/default.jpg', description || '');
    
    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Product created successfully.', product: newProduct });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

exports.updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, resolution, night_vision, storage_option, price, image_url, description, is_active } = req.body;

    const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    db.prepare(`
      UPDATE products SET
        name = ?, type = ?, resolution = ?, night_vision = ?, storage_option = ?, price = ?, image_url = ?, description = ?, is_active = ?
      WHERE id = ?
    `).run(
      name || prod.name,
      type || prod.type,
      resolution || prod.resolution,
      night_vision || prod.night_vision,
      storage_option || prod.storage_option,
      price ? parseFloat(price) : prod.price,
      image_url || prod.image_url,
      description !== undefined ? description : prod.description,
      is_active !== undefined ? (is_active ? 1 : 0) : prod.is_active,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Product updated successfully.', product: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

exports.deleteProduct = (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};
