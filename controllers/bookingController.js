const { db } = require('../config/database');

// Generate unique booking ID: CCTV-2026-XXXX
function generateBookingId() {
  const year = new Date().getFullYear();
  const row = db.prepare('SELECT COUNT(*) as count FROM bookings').get();
  const nextNum = (row.count + 1).toString().padStart(4, '0');
  return `CCTV-${year}-${nextNum}`;
}

exports.createBooking = (req, res) => {
  try {
    const {
      customer_name,
      mobile,
      house_number,
      street,
      area,
      city,
      state,
      pincode,
      installation_date,
      time_slot,
      cctv_requirement,
      camera_count,
      customer_message
    } = req.body;

    // Backend Validation
    if (!customer_name || !mobile || !house_number || !street || !area || !city || !state || !pincode || !installation_date || !time_slot || !cctv_requirement) {
      return res.status(400).json({ success: false, message: 'All required booking fields must be filled.' });
    }

    // Clean mobile and pincode
    const cleanMobile = mobile.trim();
    if (!/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit Pincode.' });
    }

    // Check if time slot is enabled
    const slotObj = db.prepare('SELECT * FROM time_slots WHERE slot_name = ?').get(time_slot);
    if (slotObj && slotObj.is_active === 0) {
      return res.status(400).json({ success: false, message: 'Selected time slot is currently unavailable. Please choose another slot.' });
    }

    // Capacity Check: Check if slot is already booked for this installation_date
    const bookedCount = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE installation_date = ? AND time_slot = ? AND status NOT IN ('CANCELLED')
    `).get(installation_date, time_slot);

    const maxCap = slotObj ? slotObj.max_capacity : 1;
    if (bookedCount.count >= maxCap) {
      return res.status(400).json({ 
        success: false, 
        message: `The time slot "${time_slot}" is already fully booked for ${installation_date}. Please select a different time slot or date.` 
      });
    }

    const booking_id = generateBookingId();
    const cameraCountVal = camera_count ? parseInt(camera_count, 10) : 0;

    const stmt = db.prepare(`
      INSERT INTO bookings (
        booking_id, customer_name, mobile, house_number, street, area, city, state, pincode,
        installation_date, time_slot, cctv_requirement, camera_count, customer_message, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
    `);

    const result = stmt.run(
      booking_id,
      customer_name.trim(),
      cleanMobile,
      house_number.trim(),
      street.trim(),
      area.trim(),
      city.trim(),
      state.trim(),
      pincode.trim(),
      installation_date,
      time_slot,
      cctv_requirement,
      cameraCountVal,
      customer_message ? customer_message.trim() : ''
    );

    const newBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);

    // Socket.io Real-Time Notification to Admin Dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('new_booking', {
        message: '🔔 NEW WORK RECEIVED',
        booking: newBooking
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Booking Request Submitted Successfully',
      booking_id: booking_id,
      booking: newBooking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ success: false, message: 'Server error while processing booking.' });
  }
};

exports.getAllBookings = (req, res) => {
  try {
    const { status, date, time_slot, search } = req.query;

    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND installation_date = ?';
      params.push(date);
    }

    if (time_slot) {
      query += ' AND time_slot = ?';
      params.push(time_slot);
    }

    if (search) {
      query += ' AND (customer_name LIKE ? OR mobile LIKE ? OR booking_id LIKE ? OR city LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY created_at DESC';

    const bookings = db.prepare(query).all(...params);
    return res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
};

exports.getBookingById = (req, res) => {
  try {
    const { id } = req.params;
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? OR booking_id = ?').get(id, id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    return res.json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve booking details.' });
  }
};

exports.updateBookingStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['NEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status.' });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
    const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

    const io = req.app.get('io');
    if (io) {
      io.emit('booking_status_updated', { booking: updatedBooking });
    }

    return res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: updatedBooking
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};
