const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// ensure user is landlord
const isLandlord = (req, res, next) => {
  if (req.session && req.session.userId && req.session.role === 'landlord') return next();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    // token-based check - decode payload
    try {
      const payload = JSON.parse(Buffer.from(authHeader.split('.')[1], 'base64').toString());
      if (payload.role === 'landlord' && payload.userId) {
        req.session = { userId: payload.userId, role: payload.role };
        return next();
      }
    } catch (err) {
      // ignore
    }
  }
  return res.status(403).json({ error: 'Landlord access required' });
};

// READ: Get current landlord payment info
router.get('/', isLandlord, async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT * FROM landlord_payment_info WHERE landlord_id = ? LIMIT 1', [req.session.userId]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE or UPDATE: Create or update payment info (upsert)
router.post('/', isLandlord, async (req, res) => {
  const db = getDb();
  const { first_name, second_name, other_names, phone, alt_phone, bank_name, account_number, account_name } = req.body;
  
  // Validate required fields
  if (!first_name || !bank_name || !account_number || !account_name) {
    return res.status(400).json({ error: 'First name, bank name, account number, and account name are required' });
  }

  try {
    const [existing] = await db.execute('SELECT id FROM landlord_payment_info WHERE landlord_id = ? LIMIT 1', [req.session.userId]);
    if (existing.length) {
      await db.execute(
        `UPDATE landlord_payment_info SET first_name = ?, second_name = ?, other_names = ?, phone = ?, alt_phone = ?, bank_name = ?, account_number = ?, account_name = ? WHERE landlord_id = ?`,
        [first_name, second_name, other_names, phone, alt_phone, bank_name, account_number, account_name, req.session.userId]
      );
      res.json({ message: 'Payment info updated successfully' });
    } else {
      await db.execute(
        `INSERT INTO landlord_payment_info (landlord_id, first_name, second_name, other_names, phone, alt_phone, bank_name, account_number, account_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.session.userId, first_name, second_name, other_names, phone, alt_phone, bank_name, account_number, account_name]
      );
      res.status(201).json({ message: 'Payment info saved successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE: Update specific payment info fields
router.put('/', isLandlord, async (req, res) => {
  const db = getDb();
  const { first_name, second_name, other_names, phone, alt_phone, bank_name, account_number, account_name } = req.body;
  
  try {
    const [existing] = await db.execute('SELECT id FROM landlord_payment_info WHERE landlord_id = ? LIMIT 1', [req.session.userId]);
    
    if (!existing.length) {
      return res.status(404).json({ error: 'Payment info not found. Please save your information first.' });
    }

    const updates = [];
    const values = [];

    if (first_name !== undefined) { updates.push('first_name = ?'); values.push(first_name); }
    if (second_name !== undefined) { updates.push('second_name = ?'); values.push(second_name); }
    if (other_names !== undefined) { updates.push('other_names = ?'); values.push(other_names); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (alt_phone !== undefined) { updates.push('alt_phone = ?'); values.push(alt_phone); }
    if (bank_name !== undefined) { updates.push('bank_name = ?'); values.push(bank_name); }
    if (account_number !== undefined) { updates.push('account_number = ?'); values.push(account_number); }
    if (account_name !== undefined) { updates.push('account_name = ?'); values.push(account_name); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.session.userId);

    await db.execute(
      `UPDATE landlord_payment_info SET ${updates.join(', ')} WHERE landlord_id = ?`,
      values
    );
    res.json({ message: 'Payment info updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Delete landlord payment info
router.delete('/', isLandlord, async (req, res) => {
  const db = getDb();
  try {
    const [existing] = await db.execute('SELECT id FROM landlord_payment_info WHERE landlord_id = ? LIMIT 1', [req.session.userId]);
    
    if (!existing.length) {
      return res.status(404).json({ error: 'Payment info not found' });
    }

    await db.execute('DELETE FROM landlord_payment_info WHERE landlord_id = ?', [req.session.userId]);
    res.json({ message: 'Payment info deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
