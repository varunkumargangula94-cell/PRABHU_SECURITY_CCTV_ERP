const { db } = require('../config/database');

exports.getAvailableSlots = (req, res) => {
  try {
    const { date } = req.query;

    const slots = db.prepare('SELECT * FROM time_slots WHERE is_active = 1 ORDER BY id ASC').all();

    if (!date) {
      return res.json({ success: true, time_slots: slots });
    }

    // Calculate booked counts for given date
    const bookedRows = db.prepare(`
      SELECT time_slot, COUNT(*) as count 
      FROM bookings 
      WHERE installation_date = ? AND status NOT IN ('CANCELLED')
      GROUP BY time_slot
    `).all(date);

    const bookedMap = {};
    bookedRows.forEach(row => {
      bookedMap[row.time_slot] = row.count;
    });

    const result = slots.map(slot => {
      const currentBooked = bookedMap[slot.slot_name] || 0;
      const is_full = currentBooked >= slot.max_capacity;
      return {
        ...slot,
        booked_count: currentBooked,
        is_available: !is_full
      };
    });

    return res.json({ success: true, date, time_slots: result });
  } catch (error) {
    console.error('Error getting time slots:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve time slots.' });
  }
};

exports.getAllSlotsAdmin = (req, res) => {
  try {
    const slots = db.prepare('SELECT * FROM time_slots ORDER BY id ASC').all();
    return res.json({ success: true, time_slots: slots });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin time slots.' });
  }
};

exports.createSlot = (req, res) => {
  try {
    const { slot_name, start_time, end_time, max_capacity } = req.body;
    if (!slot_name) {
      return res.status(400).json({ success: false, message: 'Time slot name is required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO time_slots (slot_name, start_time, end_time, max_capacity, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const result = stmt.run(slot_name, start_time || '', end_time || '', max_capacity || 1);
    const newSlot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({ success: true, message: 'Time slot created successfully.', time_slot: newSlot });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, message: 'A time slot with this name already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create time slot.' });
  }
};

exports.toggleSlotStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, max_capacity } = req.body;

    const slot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Time slot not found.' });
    }

    const newActive = (is_active !== undefined) ? (is_active ? 1 : 0) : slot.is_active;
    const newCap = (max_capacity !== undefined) ? parseInt(max_capacity, 10) : slot.max_capacity;

    db.prepare('UPDATE time_slots SET is_active = ?, max_capacity = ? WHERE id = ?').run(newActive, newCap, id);
    const updated = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(id);

    return res.json({ success: true, message: 'Time slot updated successfully.', time_slot: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update time slot.' });
  }
};
