const { db } = require('../config/database');

exports.submitReview = (req, res) => {
  try {
    const { customer_name, rating, review_text } = req.body;

    if (!customer_name || !rating || !review_text) {
      return res.status(400).json({ success: false, message: 'Customer name, star rating, and review comment are required.' });
    }

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    const stmt = db.prepare(`
      INSERT INTO reviews (customer_name, rating, review_text, status)
      VALUES (?, ?, ?, 'PENDING')
    `);
    const result = stmt.run(customer_name.trim(), ratingVal, review_text.trim());
    const newReview = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);

    const io = req.app.get('io');
    if (io) {
      io.emit('new_review_submitted', { review: newReview });
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been submitted and is pending admin approval.',
      review: newReview
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};

exports.getPublicReviews = (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT id, customer_name, rating, review_text, created_at 
      FROM reviews 
      WHERE status = 'APPROVED' 
      ORDER BY created_at DESC
    `).all();
    return res.json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve reviews.' });
  }
};

exports.getAllReviewsAdmin = (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM reviews WHERE 1=1';
    const params = [];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const reviews = db.prepare(query).all(...params);
    return res.json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin reviews.' });
  }
};

exports.updateReviewStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'HIDDEN'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status.' });
    }

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    db.prepare('UPDATE reviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);

    return res.json({ success: true, message: `Review status updated to ${status}`, review: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update review status.' });
  }
};

exports.deleteReview = (req, res) => {
  try {
    const { id } = req.params;
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Review permanently deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
};
