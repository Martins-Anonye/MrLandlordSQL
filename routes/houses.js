const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDb } = require('../db'); // <-- use the pool
// const dbPromise = (async () => {
//   const db = getDb();
//   return db;
// })();
const {slotCalc2BeUse4Capacty} = require('./slotCalc2BeUse4Capacty');
const router = express.Router();

slotCalc2BeUse4Capacty(router);
// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for any file
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video' && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Only video files allowed for video'));
    }
    if (file.fieldname === 'images' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed for images'));
    }
    if (file.fieldname === 'images' && file.size > 1 * 1024 * 1024) {
      return cb(new Error('Image file too large (max 1MB)'));
    }
    if (file.fieldname === 'video' && file.size > 5 * 1024 * 1024) {
      return cb(new Error('Video file too large (max 5MB)'));
    }
    cb(null, true);
  }
});

// Get all houses
router.get('/', async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT * FROM houses WHERE status = "available"');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get room sizes
router.get('/room-sizes', async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT * FROM room_sizes');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload house
router.post('/upload', upload.any(), async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const { title, description, location, price, rooms, lawyer_fee, agent_fee, interior_quality, exterior_quality, resources, slot_id } = req.body;

  // Check if slot is purchased by landlord and not used
  const [pSlots] = await db.execute('SELECT ps.* FROM purchased_slots ps JOIN slots s ON ps.slot_id = s.id WHERE ps.slot_id = ? AND ps.landlord_id = ? AND ps.status = "active" AND s.type = "house"', [slot_id, req.session.userId]);
  if (pSlots.length === 0) return res.status(403).json({ error: 'Invalid or inactive slot' });

  // Check capacity: count used_slots < capacity
  const [usedCount] = await db.execute('SELECT COUNT(*) as count FROM used_slots WHERE slot_id = ?', [slot_id]);
  const [slotInfo] = await db.execute('SELECT capacity FROM slots WHERE id = ?', [slot_id]);
  if (usedCount[0].count >= slotInfo[0].capacity) return res.status(403).json({ error: 'Slot capacity exceeded' });

  const room_sizes = rooms; // Already JSON string
  const images = req.files.filter(f => f.fieldname === 'images').map(file => file.path);
  const videos = req.files.filter(f => f.fieldname === 'videos').map(file => file.path);
  const video = videos.length > 0 ? videos[0] : null; // Assuming one video, or handle multiple

  try {
    const [result] = await db.execute(
      'INSERT INTO houses (landlord_id, slot_id, title, description, location, price, room_sizes, lawyer_fee, agent_fee, interior_quality, exterior_quality, images, video) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.session.userId, slot_id, title, description, location, price, room_sizes, lawyer_fee, agent_fee, interior_quality, exterior_quality, JSON.stringify(images), video]
    );

    // Mark slot as used
    await db.execute('INSERT INTO used_slots (slot_id, landlord_id) VALUES (?, ?)', [slot_id, req.session.userId]);

    // After upload, redirect to amenities page
    res.status(201).json({ message: 'House uploaded successfully', houseId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Add amenities to house
router.post('/amenities', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const { houseId, amenities } = req.body;

  // Verify house belongs to landlord
  const [house] = await db.execute('SELECT * FROM houses WHERE id = ? AND landlord_id = ?', [houseId, req.session.userId]);
  if (house.length === 0) return res.status(403).json({ error: 'House not found or not owned by you' });

  try {
    for (const itemId of amenities) {
      await db.execute('INSERT INTO house_resources (house_id, item_id) VALUES (?, ?)', [houseId, itemId]);
    }
    res.json({ message: 'Amenities added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Check-in
router.post('/:id/checkin', upload.single('image'), async (req, res) => {
  const db = getDb();
  if (!req.session.userId) return res.status(403).json({ error: 'Unauthorized' });

  const houseId = req.params.id;
  const image = req.file ? req.file.path : null;

  try {
    await db.execute('INSERT INTO checkins (user_id, house_id, image) VALUES (?, ?, ?)', [req.session.userId, houseId, image]);
    res.json({ message: 'Checked in successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pay
router.post('/:id/pay', async (req, res) => {
  const db = getDb();
  // Integrate payment gateway here
  // For now, mock
  res.json({ message: 'Payment initiated' });
});

// Purchase slot
router.post('/purchase-slot', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const { slot_id } = req.body;
  try {
    // Check if slot is available
    const [slots] = await db.execute('SELECT * FROM slots WHERE id = ? AND landlord_id IS NULL', [slot_id]);
    if (slots.length === 0) return res.status(400).json({ error: 'Slot not available' });

    const slot = slots[0];
    const nextExpiry = new Date();
    nextExpiry.setDate(nextExpiry.getDate() + slot.duration);

    // Insert into purchased_slots
    await db.execute(
      'INSERT INTO purchased_slots (slot_id, landlord_id, payment_id, next_expiry) VALUES (?, ?, NULL, ?)',
      [slot_id, req.session.userId, nextExpiry]
    );

    // Optionally update slots.landlord_id
    await db.execute('UPDATE slots SET landlord_id = ? WHERE id = ?', [req.session.userId, slot_id]);

    res.json({ message: 'Slot purchased successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete house
router.delete('/:id', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const houseId = req.params.id;
  try {
    const [house] = await db.execute('SELECT * FROM houses WHERE id = ? AND landlord_id = ?', [houseId, req.session.userId]);
    if (house.length === 0) return res.status(403).json({ error: 'House not found' });

    await db.execute('DELETE FROM houses WHERE id = ?', [houseId]);
    res.json({ message: 'House deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});






// Get available slots
router.get('/available-slots', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const [rows] = await db.execute('SELECT * FROM slots WHERE id NOT IN (SELECT slot_id FROM purchased_slots WHERE status = "active")');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get landlord purchased slots (all, including used and expired)
router.get('/my-purchased-slots', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const [rows] = await db.execute('SELECT ps.*, s.type, s.slot_title, s.slot_description, s.capacity, s.duration, s.price, s.tax FROM purchased_slots ps JOIN slots s ON ps.slot_id = s.id WHERE ps.landlord_id = ?', [req.session.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get landlord available slots for upload (active and not used)
router.get('/my-slots', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const [rows] = await db.execute('SELECT ps.*, s.type, s.slot_title, s.slot_description, s.capacity, s.duration, s.price, s.tax FROM purchased_slots ps JOIN slots s ON ps.slot_id = s.id WHERE ps.landlord_id = ? AND ps.status = "active" AND ps.slot_id NOT IN (SELECT slot_id FROM used_slots WHERE landlord_id = ?)', [req.session.userId, req.session.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get landlord used slots
router.get('/my-used-slots', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const [rows] = await db.execute('SELECT us.*, s.type, s.slot_title, s.slot_description, s.capacity, s.duration, s.price, s.tax, h.title as house_title, ps.next_expiry, ps.status as purchase_status FROM used_slots us JOIN slots s ON us.slot_id = s.id LEFT JOIN houses h ON h.slot_id = us.slot_id AND h.landlord_id = us.landlord_id LEFT JOIN purchased_slots ps ON ps.slot_id = us.slot_id AND ps.landlord_id = us.landlord_id WHERE us.landlord_id = ?', [req.session.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save resources for house
router.post('/resources', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const { houseId, resources } = req.body;

  // Verify house belongs to landlord
  const [house] = await db.execute('SELECT id FROM houses WHERE id = ? AND landlord_id = ?', [houseId, req.session.userId]);
  if (house.length === 0) return res.status(403).json({ error: 'House not found or not owned by you' });

  try {
    // Delete existing resources
    await db.execute('DELETE FROM house_resources WHERE house_id = ?', [houseId]);

    // Insert new resources
    for (const itemId of resources) {
      await db.execute('INSERT INTO house_resources (house_id, item_id) VALUES (?, ?)', [houseId, itemId]);
    }

    res.json({ message: 'Resources saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all hotels
router.get('/hotels', async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT h.*, u.name as landlord_name FROM hotels h JOIN users u ON h.landlord_id = u.id WHERE h.status = "available"');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload hotel
router.post('/upload-hotel', upload.any(), async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const { name, description, location, latitude, longitude, price_per_night, amenities, slot_id } = req.body;

  // Check if slot is purchased by landlord and not used
  const [pSlots] = await db.execute('SELECT ps.* FROM purchased_slots ps JOIN slots s ON ps.slot_id = s.id WHERE ps.slot_id = ? AND ps.landlord_id = ? AND ps.status = "active" AND s.type = "hotel"', [slot_id, req.session.userId]);
  if (pSlots.length === 0) return res.status(403).json({ error: 'Invalid or inactive slot' });

  // Check capacity: count used_slots < capacity
  const [usedCount] = await db.execute('SELECT COUNT(*) as count FROM used_slots WHERE slot_id = ?', [slot_id]);
  const [slotInfo] = await db.execute('SELECT capacity FROM slots WHERE id = ?', [slot_id]);
  if (usedCount[0].count >= slotInfo[0].capacity) return res.status(403).json({ error: 'Slot capacity exceeded' });

  const images = req.files.filter(f => f.fieldname === 'images').map(file => file.path);
  const video = req.files.find(f => f.fieldname === 'video')?.path || null;

  try {
    const [result] = await db.execute(
      'INSERT INTO hotels (landlord_id, slot_id, name, description, location, latitude, longitude, price_per_night, amenities, images, video) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.session.userId, slot_id, name, description, location, latitude, longitude, price_per_night, amenities, JSON.stringify(images), video]
    );

    // Mark slot as used
    await db.execute('INSERT INTO used_slots (slot_id, landlord_id) VALUES (?, ?)', [slot_id, req.session.userId]);

    res.status(201).json({ message: 'Hotel uploaded successfully', hotelId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book hotel
router.post('/hotels/:id/book', async (req, res) => {
  const db = getDb();
  if (!req.session.userId) return res.status(403).json({ error: 'Unauthorized' });

  const hotelId = req.params.id;
  const { checkin_date, checkout_date } = req.body;

  // Calculate total price
  const [hotel] = await db.execute('SELECT price_per_night FROM hotels WHERE id = ?', [hotelId]);
  if (hotel.length === 0) return res.status(404).json({ error: 'Hotel not found' });

  const checkin = new Date(checkin_date);
  const checkout = new Date(checkout_date);
  const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
  const total = nights * hotel[0].price_per_night;

  try {
    const [result] = await db.execute(
      'INSERT INTO hotel_bookings (user_id, hotel_id, checkin_date, checkout_date, total_price) VALUES (?, ?, ?, ?, ?)',
      [req.session.userId, hotelId, checkin_date, checkout_date, total]
    );
    res.json({ message: 'Booking request sent', bookingId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get chat messages
router.get('/chat/:userId', async (req, res) => {
  const db = getDb();
  if (!req.session.userId) return res.status(403).json({ error: 'Unauthorized' });

  const otherUserId = req.params.userId;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM chat_messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY sent_at',
      [req.session.userId, otherUserId, otherUserId, req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send chat message
router.post('/chat', async (req, res) => {
  const db = getDb();
  if (!req.session.userId) return res.status(403).json({ error: 'Unauthorized' });

  const { receiver_id, message } = req.body;
  try {
    await db.execute('INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)', [req.session.userId, receiver_id, message]);
    res.json({ message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get landlord's hotels
router.get('/my-hotels', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const [rows] = await db.execute('SELECT * FROM hotels WHERE landlord_id = ?', [req.session.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update hotel status
router.put('/hotels/:id/status', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const hotelId = req.params.id;
  const { status } = req.body;

  // Verify ownership
  const [hotel] = await db.execute('SELECT id FROM hotels WHERE id = ? AND landlord_id = ?', [hotelId, req.session.userId]);
  if (hotel.length === 0) return res.status(403).json({ error: 'Hotel not owned by you' });

  try {
    await db.execute('UPDATE hotels SET status = ? WHERE id = ?', [status, hotelId]);
    res.json({ message: 'Hotel status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete hotel
router.delete('/hotels/:id', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const hotelId = req.params.id;

  // Verify ownership
  const [hotel] = await db.execute('SELECT id FROM hotels WHERE id = ? AND landlord_id = ?', [hotelId, req.session.userId]);
  if (hotel.length === 0) return res.status(403).json({ error: 'Hotel not owned by you' });

  try {
    await db.execute('DELETE FROM hotels WHERE id = ?', [hotelId]);
    res.json({ message: 'Hotel deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;