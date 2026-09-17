const { db } = require('../config/database');

exports.createSupportTicket = (req, res) => {
  try {
    const { customer_name, mobile, subject, message } = req.body;

    if (!customer_name || !mobile || !message) {
      return res.status(400).json({ success: false, message: 'Name, mobile number, and query message are required.' });
    }

    const year = new Date().getFullYear();
    const countRow = db.prepare('SELECT COUNT(*) as count FROM support_tickets').get();
    const sequence = String(countRow.count + 1).padStart(4, '0');
    const ticket_id = `SUP-${year}-${sequence}`;

    const stmt = db.prepare(`
      INSERT INTO support_tickets (ticket_id, customer_name, mobile, subject, message, status)
      VALUES (?, ?, ?, ?, ?, 'OPEN')
    `);

    stmt.run(
      ticket_id,
      customer_name.trim(),
      mobile.trim(),
      subject ? subject.trim() : 'General Customer Query',
      message.trim()
    );

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE ticket_id = ?').get(ticket_id);

    // Emit Socket.io Real-Time Notification to Admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_support_ticket', {
        message: `💬 NEW SUPPORT QUERY: ${ticket.customer_name} (${ticket.mobile})`,
        ticket: ticket
      });
      io.emit('new_support_ticket', {
        message: `💬 NEW SUPPORT QUERY: ${ticket.customer_name} (${ticket.mobile})`,
        ticket: ticket
      });
    }

    return res.status(201).json({
      success: true,
      message: '✅ Support query submitted! Our Admin L. CHIRU will contact you shortly.',
      ticket_id: ticket.ticket_id,
      ticket: ticket
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting support query.' });
  }
};

exports.getAllSupportTicketsAdmin = (req, res) => {
  try {
    const tickets = db.prepare('SELECT * FROM support_tickets ORDER BY id DESC').all();
    return res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve support tickets.' });
  }
};

exports.updateTicketStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    db.prepare('UPDATE support_tickets SET status = ? WHERE id = ?').run(status || 'RESOLVED', id);
    const updated = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id);

    return res.json({ success: true, message: 'Support ticket status updated.', ticket: updated });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return res.status(500).json({ success: false, message: 'Failed to update ticket status.' });
  }
};

exports.deleteTicket = (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM support_tickets WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Support ticket deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete support ticket.' });
  }
};
