const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.loginAdmin = (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username.trim());
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin username or password.' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin username or password.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'ADMIN' },
      process.env.JWT_SECRET || 'cctv_secure_admin_jwt_secret_key_2026_antigravity',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Admin authentication successful.',
      token: token,
      user: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

exports.getDashboardStats = (req, res) => {
  try {
    const total_bookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const new_requests = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'NEW'").get().count;
    const accepted = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'ACCEPTED'").get().count;
    const assigned = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'ASSIGNED'").get().count;
    const in_progress = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'IN_PROGRESS'").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'COMPLETED'").get().count;
    const cancelled = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'CANCELLED'").get().count;

    const total_reviews = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
    const pending_reviews = db.prepare("SELECT COUNT(*) as count FROM reviews WHERE status = 'PENDING'").get().count;
    const approved_reviews = db.prepare("SELECT COUNT(*) as count FROM reviews WHERE status = 'APPROVED'").get().count;

    const total_work_photos = db.prepare('SELECT COUNT(*) as count FROM work_photos').get().count;

    const recent_new_work = db.prepare("SELECT * FROM bookings WHERE status = 'NEW' ORDER BY created_at DESC LIMIT 10").all();
    const recent_bookings = db.prepare("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10").all();

    return res.json({
      success: true,
      stats: {
        total_bookings,
        new_requests,
        accepted,
        in_progress: in_progress + assigned,
        completed,
        cancelled,
        total_reviews,
        pending_reviews,
        approved_reviews,
        total_work_photos
      },
      recent_new_work,
      recent_bookings
    });
  } catch (error) {
    console.error('Error compiling dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to compile dashboard metrics.' });
  }
};
