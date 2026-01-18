const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db'); // <-- use the pool
// let db;Promise = (async () => {
//   db = getDb();
// })();

const router = express.Router();

const {createSeedForAccountTest} = require('./createSeedForAccountTest');


(async()=>{ 
await createSeedForAccountTest(router);
})()

// Register

router.post('/register', async (req, res) => {
  const db = getDb();
  const { email, password, name, phone, role = 'public' } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (email, password, name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, phone, role]
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const db = getDb();
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    let isValid;
    if (user.role === 'super_admin') {
      isValid = password === user.password;
    } else {
      isValid = await bcrypt.compare(password, user.password);
    }
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = user.id;
    req.session.role = user.role;

    const token = jwt.sign({ id: user.id, role: user.role }, 'jwt-secret-key');
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super Admin Login
router.post('/super-admin-login', async (req, res) => {
  const db = getDb();
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'super_admin']);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    if (password !== user.password) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = user.id;
    req.session.role = user.role;

    const token = jwt.sign({ id: user.id, role: user.role }, 'jwt-secret-key');
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update asset manager
router.post('/select-asset-manager', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const { asset_manager_id } = req.body;
  try {
    await db.execute('UPDATE users SET asset_manager_id = ? WHERE id = ?', [asset_manager_id, req.session.userId]);
    res.json({ message: 'Asset manager selected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;