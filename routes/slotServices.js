const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// Middleware to check admin via session or JWT bearer token
const jwt = require('jsonwebtoken');
const isAdmin = (req, res, next) => {
  // session-based check
  if (req.session && (req.session.role === 'admin' || req.session.role === 'super_admin')) {
    return next();
  }

  // token-based check
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, 'jwt-secret-key');
      if (payload.role === 'admin' || payload.role === 'super_admin') {
        req.user = payload;
        return next();
      }
    } catch (err) {
      // invalid token, fall through to forbidden
    }
  }

  return res.status(403).json({ error: 'Admin access required' });
};

// Middleware to check landlord (accepts session or JWT bearer token)
const isLandlord = (req, res, next) => {
  // session-based check
  if (req.session && req.session.role === 'landlord') {
    return next();
  }

  // token-based check (Bearer)
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, 'jwt-secret-key');
      if (payload.role === 'landlord') {
        req.user = payload;
        return next();
      }
    } catch (err) {
      // invalid token - fall through to forbidden
    }
  }

  return res.status(403).json({ error: 'Landlord access required' });
};

// ===== ADMIN ENDPOINTS =====

// Create a new slot service
router.post('/', isAdmin, async (req, res) => {
  const db = getDb();
  const { slot_id, service_name, tax, number_of_rooms, area_type, area_description } = req.body;

  if (!slot_id || !service_name) {
    return res.status(400).json({ error: 'slot_id and service_name are required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO slot_service (slot_id, service_name, tax, number_of_rooms, area_type, area_description) VALUES (?, ?, ?, ?, ?, ?)',
      [slot_id, service_name, tax || null, number_of_rooms || null, area_type || null, area_description || null]
    );
    res.status(201).json({ id: result.insertId, slot_id, service_name, tax, number_of_rooms, area_type, area_description, message: 'Slot service created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all slot services (admin)
router.get('/admin/all', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT * FROM slot_service');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific slot service by ID
router.get('/:id', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT * FROM slot_service WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Slot service not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a slot service
router.put('/:id', isAdmin, async (req, res) => {
  const db = getDb();
  const { slot_id, service_name, tax, number_of_rooms, area_type, area_description } = req.body;

  try {
    const [result] = await db.execute(
      'UPDATE slot_service SET slot_id = ?, service_name = ?, tax = ?, number_of_rooms = ?, area_type = ?, area_description = ? WHERE id = ?',
      [slot_id, service_name, tax || null, number_of_rooms || null, area_type || null, area_description || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Slot service not found' });
    }

    res.json({ message: 'Slot service updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a slot service
router.delete('/:id', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [result] = await db.execute('DELETE FROM slot_service WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Slot service not found' });
    }

    res.json({ message: 'Slot service deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== LANDLORD ENDPOINTS =====

// Get slot services by slot_id (landlord can select after choosing a slot)
// includes bedroom count and area type for house-specific queries
router.get('/landlord/slot/:slot_id', isLandlord, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute(
      'SELECT id, slot_id, service_id, service_name, tax, number_of_rooms, area_type, area_description FROM slot_service WHERE slot_id = ?',
      [req.params.slot_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
