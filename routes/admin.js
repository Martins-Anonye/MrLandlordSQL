const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { getDb } = require('../db'); // <-- use the pool
// const dbPromise = (async () => {
//   const db = getDb();
//   return db;
// })();

const router = express.Router();

// Middleware to check admin via session or JWT bearer token
const isAdmin = (req, res, next) => {
  // session-based check (existing behavior)
  if (req.session && (req.session.role === 'admin' || req.session.role === 'super_admin')) {
    return next();
  }

  // token-based check: look for Authorization header
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, 'jwt-secret-key');
      if (payload.role === 'admin' || payload.role === 'super_admin') {
        // attach user info to request for downstream use if needed
        req.user = payload;
        return next();
      }
    } catch (err) {
      // invalid token falls through
    }
  }

  return res.status(403).json({ error: 'Admin access required' });
};

// Get all checkins
router.get('/checkins', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT c.*, h.title, u.name FROM checkins c JOIN houses h ON c.house_id = h.id JOIN users u ON c.user_id = u.id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payouts
router.get('/payouts', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT * FROM payouts WHERE status = "pending"');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process payout
router.post('/payout/:id', isAdmin, async (req, res) => {
  const db = getDb();
  const payoutId = req.params.id;
  try {
    await db.execute('UPDATE payouts SET status = "completed" WHERE id = ?', [payoutId]);
    res.json({ message: 'Payout processed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add category item
router.post('/categories/:id/items', isAdmin, async (req, res) => {
  const db = getDb();
  const categoryId = req.params.id;
  const { name } = req.body;
  try {
    await db.execute('INSERT INTO category_items (category_id, name) VALUES (?, ?)', [categoryId, name]);
    res.status(201).json({ message: 'Item added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete category item
router.delete('/categories/:categoryId/items/:itemId', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    await db.execute('DELETE FROM category_items WHERE id = ?', [req.params.itemId]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get categories with items
router.get('/categories', async (req, res) => {
  const db = getDb();
  try {
    const [categories] = await db.execute('SELECT * FROM categories');
    for (const cat of categories) {
      const [items] = await db.execute('SELECT * FROM category_items WHERE category_id = ?', [cat.id]);
      cat.items = items;
    }
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new admin
router.post('/create-admin', isAdmin, async (req, res) => {
  const db = getDb();
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, 'admin', name]
    );
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT id, email, name, role FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all slots
router.get('/slots', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute(`
      SELECT s.*, u.name as landlord_name, ps.status as purchase_status, ps.date_purchased
      FROM slots s 
      LEFT JOIN purchased_slots ps ON s.id = ps.slot_id AND ps.status = 'active'
      LEFT JOIN users u ON ps.landlord_id = u.id
      ORDER BY s.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single slot by ID (used when editing)
router.get('/slots/:id', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT * FROM slots WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create slot
router.post('/slots', isAdmin, async (req, res) => {
  const db = getDb();
  const { type, slot_title, slot_description, capacity, duration, price, tax } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO slots (type, slot_title, slot_description, capacity, duration, price, tax) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [type, slot_title, slot_description, capacity, duration, price, tax]
    );
    res.status(201).json({ message: 'Slot created successfully', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update slot
router.put('/slots/:id', isAdmin, async (req, res) => {
  const db = getDb();
  const slotId = req.params.id;
  const { type, slot_title, slot_description, capacity, duration, price, tax } = req.body;
  try {
    await db.execute(
      'UPDATE slots SET type = ?, slot_title = ?, slot_description = ?, capacity = ?, duration = ?, price = ?, tax = ? WHERE id = ?',
      [type, slot_title, slot_description, capacity, duration, price, tax, slotId]
    );
    res.json({ message: 'Slot updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete slot
router.delete('/slots/:id', isAdmin, async (req, res) => {
  const db = getDb();
  const slotId = req.params.id;
  try {
    await db.execute('DELETE FROM slots WHERE id = ?', [slotId]);
    res.json({ message: 'Slot deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get room sizes
router.get('/room-sizes', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT * FROM room_sizes');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single room size by ID (used when editing)
router.get('/room-sizes/:id', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT * FROM room_sizes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Room size not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add room size
router.post('/room-sizes', isAdmin, async (req, res) => {
  const db = getDb();
  const { name, size_text } = req.body;
  try {
    await db.execute('INSERT INTO room_sizes (name, size_text) VALUES (?, ?)', [name, size_text]);
    res.json({ message: 'Room size added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update room size
router.put('/room-sizes/:id', isAdmin, async (req, res) => {
  const db = getDb();
  const { name, size_text } = req.body;
  try {
    await db.execute('UPDATE room_sizes SET name = ?, size_text = ? WHERE id = ?', [name, size_text, req.params.id]);
    res.json({ message: 'Room size updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete room size
router.delete('/room-sizes/:id', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    await db.execute('DELETE FROM room_sizes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Room size deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel purchased slot
router.post('/purchased-slots/:slotId/cancel', isAdmin, async (req, res) => {
  const db = getDb();
  const slotId = req.params.slotId;
  try {
    await db.execute('UPDATE purchased_slots SET status = "cancelled" WHERE slot_id = ? AND status = "active"', [slotId]);
    res.json({ message: 'Slot purchase cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tenant Category Management (CRUD)
// Get all tenant categories
router.get('/tenant-categories', isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT id, name, created_at, updated_at FROM tenant_category ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create tenant category
router.post('/tenant-categories', isAdmin, async (req, res) => {
  const db = getDb();
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Tenant category name is required' });
  }
  try {
    const [result] = await db.execute('INSERT INTO tenant_category (name) VALUES (?)', [name.trim()]);
    res.status(201).json({ message: 'Tenant category created', id: result.insertId, name: name.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Tenant category already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update tenant category
router.put('/tenant-categories/:id', isAdmin, async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Tenant category name is required' });
  }
  try {
    await db.execute('UPDATE tenant_category SET name = ? WHERE id = ?', [name.trim(), id]);
    res.json({ message: 'Tenant category updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Tenant category already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Delete tenant category
router.delete('/tenant-categories/:id', isAdmin, async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM tenant_category WHERE id = ?', [id]);
    res.json({ message: 'Tenant category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;