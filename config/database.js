const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../cctv_database.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  console.log('⚡ Initializing SQLite database schema...');

  // 1. Admin Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Bookings
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      house_number TEXT NOT NULL,
      street TEXT NOT NULL,
      area TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      installation_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      cctv_requirement TEXT NOT NULL,
      camera_count INTEGER DEFAULT 0,
      customer_message TEXT,
      status TEXT DEFAULT 'NEW',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Time Slots
  db.exec(`
    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_name TEXT UNIQUE NOT NULL,
      start_time TEXT,
      end_time TEXT,
      max_capacity INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Products
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      resolution TEXT NOT NULL,
      night_vision TEXT NOT NULL,
      storage_option TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Services
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT DEFAULT 'bi-shield-check',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Reviews
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review_text TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Work Photos Gallery
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      installation_date TEXT,
      location TEXT,
      is_visible INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedData();
}

function seedData() {
  // Seed / Upsert Default Admin User
  const defaultUser = process.env.ADMIN_DEFAULT_USER || 'Lankaprabhu';
  const defaultPass = process.env.ADMIN_DEFAULT_PASS || 'Chiru@123';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(defaultPass, salt);
  
  const existingAdmin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(defaultUser);
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO admin_users (username, password_hash, full_name, email)
      VALUES (?, ?, ?, ?)
    `).run(defaultUser, hash, 'L. CHIRU', 'lankachiranjeevi1996@gmail.com');
    console.log(`✅ Admin created: Username "${defaultUser}"`);
  } else {
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?').run(hash, defaultUser);
    console.log(`✅ Admin password updated for "${defaultUser}"`);
  }

  // Seed Default Time Slots
  const slotCheck = db.prepare('SELECT COUNT(*) as count FROM time_slots').get();
  if (slotCheck.count === 0) {
    const slots = [
      { slot_name: '09:00 AM - 11:00 AM', start_time: '09:00', end_time: '11:00' },
      { slot_name: '11:00 AM - 01:00 PM', start_time: '11:00', end_time: '13:00' },
      { slot_name: '02:00 PM - 04:00 PM', start_time: '14:00', end_time: '16:00' },
      { slot_name: '04:00 PM - 06:00 PM', start_time: '16:00', end_time: '18:00' }
    ];
    const stmt = db.prepare('INSERT INTO time_slots (slot_name, start_time, end_time) VALUES (?, ?, ?)');
    slots.forEach(s => stmt.run(s.slot_name, s.start_time, s.end_time));
    console.log('✅ Default time slots seeded.');
  }

  // Seed Default Products
  const prodCheck = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (prodCheck.count === 0) {
    const products = [
      {
        name: 'ProShield 4K Ultra HD Dome Camera',
        type: 'Dome Camera',
        resolution: '4K (8MP / 3840x2160)',
        night_vision: 'Color Night Vision (30m Range)',
        storage_option: 'MicroSD (up to 256GB) / NVR',
        price: 3499.00,
        image_url: '/images/products/dome_4k.svg',
        description: 'Vandal-resistant 4K indoor/outdoor dome camera with AI motion detection and 2-way audio.'
      },
      {
        name: 'VisionGuard 5MP Outdoor Bullet Camera',
        type: 'Bullet Camera',
        resolution: '5MP HD (2560x1920)',
        night_vision: 'Infrared Night Vision (40m Range)',
        storage_option: 'Cloud Storage & Local DVR',
        price: 2799.00,
        image_url: '/images/products/bullet_5mp.svg',
        description: 'Heavy-duty weatherproof IP67 bullet camera for perimeter and driveway protection.'
      },
      {
        name: 'OmniEye 360° Wireless PTZ Camera',
        type: 'PTZ Camera',
        resolution: '2K QHD (2560x1440)',
        night_vision: 'Smart Dual Light Night Vision',
        storage_option: '128GB MicroSD Card Included',
        price: 4999.00,
        image_url: '/images/products/ptz_360.svg',
        description: 'Pan-Tilt-Zoom motor camera with 355° horizontal sweep, auto-tracking human motion detection.'
      },
      {
        name: 'SolarShield 100% Wire-Free Outdoor Camera',
        type: 'Solar Camera',
        resolution: '2K Super HD',
        night_vision: 'Full Color Spotlight Night Vision',
        storage_option: 'Cloud & SD Card Option',
        price: 5999.00,
        image_url: '/images/products/solar_camera.svg',
        description: 'Eco-friendly solar powered security camera requiring zero wiring. Perfect for farmhouses & remote gates.'
      },
      {
        name: 'Complete 4-Camera Home Security System with 1TB DVR',
        type: 'System Kit',
        resolution: '1080p Full HD',
        night_vision: 'IR Night Vision (25m)',
        storage_option: '1TB Surveillance Hard Drive',
        price: 11999.00,
        image_url: '/images/products/kit_4cam.svg',
        description: 'Complete home security package including 4 outdoor cameras, 8-channel DVR, cables, and mobile app setup.'
      }
    ];
    const stmt = db.prepare(`
      INSERT INTO products (name, type, resolution, night_vision, storage_option, price, image_url, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    products.forEach(p => stmt.run(p.name, p.type, p.resolution, p.night_vision, p.storage_option, p.price, p.image_url, p.description));
    console.log('✅ Default CCTV products seeded.');
  }

  // Seed Default Services
  const serviceCheck = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (serviceCheck.count === 0) {
    const services = [
      {
        title: 'New CCTV Installation',
        description: 'Complete end-to-end installation of new CCTV cameras, cabling, DVR/NVR configuration, and phone app pairing.',
        icon: 'bi-camera-video'
      },
      {
        title: 'Home CCTV Installation',
        description: 'Customized home security camera setup optimized for entrances, driveways, backyards, and indoor areas.',
        icon: 'bi-house-heart'
      },
      {
        title: 'Office & Business Installation',
        description: 'Enterprise CCTV setups for offices, shops, factories, and warehouses with multi-screen monitoring centers.',
        icon: 'bi-building-check'
      },
      {
        title: 'CCTV Maintenance & Repair',
        description: 'Routine maintenance, power supply repairs, cable replacement, lens cleaning, and hard drive diagnostic checks.',
        icon: 'bi-tools'
      },
      {
        title: 'Camera Replacement & Upgrade',
        description: 'Upgrade old low-resolution analog cameras to crystal clear 4K IP digital cameras using existing wiring.',
        icon: 'bi-arrow-repeat'
      },
      {
        title: 'CCTV Network & App Setup',
        description: 'Configure remote live viewing on mobile phones, tablets, and laptops with secure encrypted access.',
        icon: 'bi-phone'
      }
    ];
    const stmt = db.prepare('INSERT INTO services (title, description, icon) VALUES (?, ?, ?)');
    services.forEach(s => stmt.run(s.title, s.description, s.icon));
    console.log('✅ Default services seeded.');
  }

  // Seed Initial Reviews
  const reviewCheck = db.prepare('SELECT COUNT(*) as count FROM reviews').get();
  if (reviewCheck.count === 0) {
    const sampleReviews = [
      { customer_name: 'Rajesh Sharma', rating: 5, review_text: 'Excellent installation team! Installed 4 4K cameras at my residence within 3 hours. Wire management was super clean.', status: 'APPROVED' },
      { customer_name: 'Priya Reddy', rating: 5, review_text: 'Very professional service. The technician explained how to use the mobile application step-by-step. Highly recommended!', status: 'APPROVED' },
      { customer_name: 'Vikram Verma', rating: 4, review_text: 'Good quality CCTV cameras. Night vision clarity is impressive. Prompt response for booking.', status: 'APPROVED' },
      { customer_name: 'Anil Kumar', rating: 5, review_text: 'Upgraded my office CCTV system. Their pricing is transparent and service quality is top notch.', status: 'APPROVED' }
    ];
    const stmt = db.prepare('INSERT INTO reviews (customer_name, rating, review_text, status) VALUES (?, ?, ?, ?)');
    sampleReviews.forEach(r => stmt.run(r.customer_name, r.rating, r.review_text, r.status));
    console.log('✅ Default reviews seeded.');
  }

  // Seed Initial Work Photos
  const photoCheck = db.prepare('SELECT COUNT(*) as count FROM work_photos').get();
  if (photoCheck.count === 0) {
    const samplePhotos = [
      {
        image_url: '/images/gallery/installation_1.svg',
        title: 'Modern Villa 4K Camera Installation',
        description: 'Installed 6 bullet cameras covering perimeter gates and main doorway with concealed wiring.',
        category: 'Home Installation',
        installation_date: '2026-08-14',
        location: 'Jubilee Hills, Hyderabad',
        is_visible: 1
      },
      {
        image_url: '/images/gallery/installation_2.svg',
        title: 'Commercial Office DVR Rack Setup',
        description: '16-channel NVR server rack assembly with battery backup and mobile monitoring configuration.',
        category: 'Office Installation',
        installation_date: '2026-08-28',
        location: 'Gachibowli, Hyderabad',
        is_visible: 1
      },
      {
        image_url: '/images/gallery/installation_3.svg',
        title: 'Outdoor Waterproof Bullet Setup',
        description: 'High elevation outdoor camera installation with weather guard and night vision spotlight.',
        category: 'Outdoor Camera',
        installation_date: '2026-09-02',
        location: 'Banjara Hills, Hyderabad',
        is_visible: 1
      },
      {
        image_url: '/images/gallery/installation_4.svg',
        title: 'Indoor Dome Camera Setup',
        description: 'Vandal-proof flush ceiling dome camera for retail store reception.',
        category: 'Indoor Camera',
        installation_date: '2026-09-10',
        location: 'Madhapur, Hyderabad',
        is_visible: 1
      }
    ];
    const stmt = db.prepare(`
      INSERT INTO work_photos (image_url, title, description, category, installation_date, location, is_visible)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    samplePhotos.forEach(p => stmt.run(p.image_url, p.title, p.description, p.category, p.installation_date, p.location, p.is_visible));
    console.log('✅ Default work gallery photos seeded.');
  }
}

module.exports = {
  db,
  initDatabase
};
