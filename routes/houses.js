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
    // parse room_sizes JSON field before sending
    rows.forEach(r => {
      if (r.room_sizes && typeof r.room_sizes === 'string') {
        try {
          r.room_sizes = JSON.parse(r.room_sizes);
        } catch (err) {
          // leave as string if parsing fails
        }
      }
      if (r.dedicated_payment_info && typeof r.dedicated_payment_info === 'string') {
        try {
          r.dedicated_payment_info = JSON.parse(r.dedicated_payment_info);
        } catch (err) {
          // leave as string
        }
      }
    });
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

// Get tenant categories
router.get('/tenant-categories', async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute('SELECT id, name FROM tenant_category ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload house
router.post('/upload', upload.any(), async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

        // interior_quality and exterior_quality are optional fields; default to null when absent
        let { title, description, state, area, location, price, rent_period, rooms, agent_fee,
              interior_quality = null, exterior_quality = null, resources, slot_id,
          num_bedrooms, area_type, tax_fee, electricity, alternative_electricity, tenant_restrictions, tenant_categories, additional_tenant_description,
          use_dedicated_payment_account, dedicated_payment_info, lawyer_in_charge, lawyer_name, lawyer_phone, lawyer_email,
          agent_in_charge, agent_name, agent_phone, agent_email, pay_agent_by_cash, agent_additional_info } = req.body;

    // rooms may be JSON string; ensure parsed then stringified cleanly
    let roomsObj;
    if (rooms) {
      try {
        roomsObj = typeof rooms === 'string' ? JSON.parse(rooms) : rooms;
      } catch (e) {
        roomsObj = {}; // fallback
      }
      // if bedrooms array present, update num_bedrooms accordingly
      if (roomsObj.bedrooms && Array.isArray(roomsObj.bedrooms)) {
        // bedrooms elements may now be objects containing size and sitting fields
        num_bedrooms = roomsObj.bedrooms.length;
      }
      rooms = JSON.stringify(roomsObj);
    }

  // Check if slot is purchased by landlord and not used
  const [pSlots] = await db.execute('SELECT ps.* FROM purchased_slots ps JOIN slots s ON ps.slot_id = s.id WHERE ps.slot_id = ? AND ps.landlord_id = ? AND ps.status = "active" AND s.type = "house"', [slot_id, req.session.userId]);
  if (pSlots.length === 0) return res.status(403).json({ error: 'Invalid or inactive slot' });

  // Check capacity: count used_slots < capacity
  const [usedCount] = await db.execute('SELECT COUNT(*) as count FROM used_slots WHERE slot_id = ?', [slot_id]);
  const [slotInfo] = await db.execute('SELECT capacity FROM slots WHERE id = ?', [slot_id]);
  if (!slotInfo.length) return res.status(404).json({ error: 'Slot not found' });
  const remaining = slotInfo[0].capacity - usedCount[0].count;
  // ensure there is at least one unit remaining to match frontend filter
  if (remaining <= 0) return res.status(403).json({ error: 'Slot capacity insufficient' });

  const room_sizes = rooms; // Already JSON string
  const images = req.files.filter(f => f.fieldname === 'images').map(file => file.path);
  const videos = req.files.filter(f => f.fieldname === 'videos').map(file => file.path);
  const video = videos.length > 0 ? videos[0] : null; // Assuming one video, or handle multiple

  try {
    // compute tax fee on server side using slot_service if possible
    let computedTax = tax_fee;
    if (num_bedrooms && area_type) {
      const [feeRows] = await db.execute(
        'SELECT tax FROM slot_service WHERE slot_id = 1 AND number_of_rooms = ? AND area_type = ? LIMIT 1',
        [num_bedrooms, area_type]
      );
      if (feeRows.length) {
        computedTax = feeRows[0].tax;
      }
    }
    const map_latitude = req.body.map_latitude || null;
    const map_longitude = req.body.map_longitude || null;

    // prepare dedicated payment info value
    let dedInfoVal = null;
    if (use_dedicated_payment_account === '1') {
      if (dedicated_payment_info) {
        try {
          const parsed = typeof dedicated_payment_info === 'string' ? JSON.parse(dedicated_payment_info) : dedicated_payment_info;
          dedInfoVal = JSON.stringify(parsed);
        } catch (e) {
          dedInfoVal = JSON.stringify(dedicated_payment_info);
        }
      }
    }
    const [result] = await db.execute(
      'INSERT INTO houses (landlord_id, slot_id, title, description, state, area, location, price, rent_period, room_sizes, number_of_bedrooms, area_type, tax_fee, electricity, alternative_electricity, tenant_restrictions, tenant_categories, additional_tenant_description, use_dedicated_payment_account, dedicated_payment_info, lawyer_in_charge, lawyer_name, lawyer_phone, lawyer_email, agent_in_charge, agent_name, agent_phone, agent_email, agent_fee, pay_agent_by_cash, agent_additional_info, interior_quality, exterior_quality, images, video, map_latitude, map_longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.session.userId, slot_id, title, description, state || null, area || null, location, price, rent_period || null, rooms, num_bedrooms || null, area_type || null, computedTax || null, electricity || null, alternative_electricity || null, tenant_restrictions || null, tenant_categories ? JSON.stringify(tenant_categories.split(',').map(c => c.trim())) : null, additional_tenant_description || null, use_dedicated_payment_account === '1' ? 1 : 0, dedInfoVal, lawyer_in_charge ? 1 : 0, lawyer_name || null, lawyer_phone || null, lawyer_email || null, agent_in_charge ? 1 : 0, agent_name || null, agent_phone || null, agent_email || null, agent_fee || null, pay_agent_by_cash ? 1 : 0, agent_additional_info || null, interior_quality || null, exterior_quality || null, JSON.stringify(images), video, map_latitude, map_longitude]
    );

    // Mark slot as used
    await db.execute('INSERT INTO used_slots (slot_id, landlord_id) VALUES (?, ?)', [slot_id, req.session.userId]);
    // note: capacity is derived dynamically from slot.capacity - used_count
    // we no longer update the slots table here to avoid double-counting
    // (previous implementation subtracted both via used_slots and by
    // decrementing the capacity column which led to negative values)

    // After upload, respond with success and houseId (frontend now handles
    // navigating to the amenities section internally)
    res.status(201).json({ message: 'House uploaded successfully', houseId: result.insertId });
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

// Get landlord's uploaded houses (for editing amenities, docs, map in Sections B/C/D)
router.get('/my-houses', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const { slot_id } = req.query;
  let query = 'SELECT id, title, state, area FROM houses WHERE landlord_id = ?';
  const params = [req.session.userId];

  // Filter by slot_id if provided
  if (slot_id) {
    query += ' AND slot_id = ?';
    params.push(slot_id);
  }

  query += ' ORDER BY id DESC';

  try {
    const [rows] = await db.execute(query, params);
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
    // compute remaining_capacity for each purchased slot (could be several
    // purchases of the same slot type); only return those with at least one
    // unit remaining and which have not yet expired.  This aligns behavior
    // with /landlord/purchased-house-slots and prevents showing expired
    // slots in dropdowns.
    const [rows] = await db.execute(
      `SELECT ps.*, s.type, s.slot_title, s.slot_description, s.capacity, s.duration, s.price, s.tax,
              s.capacity - COALESCE(COUNT(us.id), 0) AS remaining_capacity
       FROM purchased_slots ps
       JOIN slots s ON ps.slot_id = s.id
       LEFT JOIN used_slots us ON ps.slot_id = us.slot_id AND ps.landlord_id = us.landlord_id
       WHERE ps.landlord_id = ? AND ps.status = "active"
         AND DATE_ADD(ps.date_purchased, INTERVAL s.duration DAY) >= NOW()
      GROUP BY ps.id, ps.slot_id, ps.landlord_id, s.type, s.slot_title, s.slot_description, s.capacity, s.duration, s.price, s.tax
      HAVING remaining_capacity > 0;`,
      [req.session.userId]
    );
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

//slot calculator
//slot calc route for frontend to check remaining capacity before upload - this is separate from the /my-slots route to keep that one focused on purchased slot details, while this one focuses on real-time capacity for a given slot
// Get purchased house slots for landlord (used by upload-house.html)
// this logic used to live in a separate helper file but was never mounted;
// move it here so the frontend can simply call /api/houses/landlord/purchased-house-slots
router.get('/landlord/purchased-house-slots', async (req, res) => {
  // support both session and bearer JWT authentication similar to other
  // middleware in the codebase.  This allows the front-end to send a token
  // while tests or server-rendered requests may rely on session state.
  let landlordId;
  if (req.session && req.session.role === 'landlord') {
    landlordId = req.session.userId;
  } else {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = require('jsonwebtoken').verify(token, 'jwt-secret-key');
        if (payload.role === 'landlord') {
          // some tokens may include userId or id property
          landlordId = payload.userId || payload.id;
        }
      } catch (err) {
        // invalid token -> landlordId remains undefined
      }
    }
  }
  if (!landlordId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const db = getDb();
  try {
    const [rows] = await db.execute(
      `SELECT 
        ps.id AS purchased_slot_id,
        ps.status,
        ps.date_purchased,
        DATE_ADD(ps.date_purchased, INTERVAL s.duration DAY) AS expires_at,
        s.slot_title,
        s.type,
        s.capacity - COALESCE(COUNT(us.id), 0) AS remaining_capacity
      FROM purchased_slots ps
      JOIN slots s ON ps.slot_id = s.id
      LEFT JOIN used_slots us 
        ON ps.slot_id = us.slot_id AND ps.landlord_id = us.landlord_id
      WHERE ps.landlord_id = ? AND s.type = 'house'
      -- only include slots whose purchase has not yet expired
      AND DATE_ADD(ps.date_purchased, INTERVAL s.duration DAY) >= NOW()
      GROUP BY ps.id, ps.status, ps.date_purchased, s.slot_title, s.type, s.capacity, s.duration
      // only present slots with at least one unit of capacity remaining
          HAVING remaining_capacity > 0;`,
      [landlordId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching purchased house slots:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get categories with items (landlord/public)
// This duplicates the admin implementation but lives under the houses
// router so that landlords can fetch available special resources without
// depending on an "admin" path.  The response structure matches the one
// returned by the admin route so the frontend can reuse the same rendering
// logic.
router.get('/categories', async (req, res) => {
  const db = getDb();
  try {
    const [categories] = await db.execute('SELECT * FROM categories');
    for (const cat of categories) {
      const [items] = await db.execute(
        'SELECT * FROM category_items WHERE category_id = ?',
        [cat.id]
      );
      cat.items = items;
    }
    res.json(categories);
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
    // (no side data needed here)

    // Insert new resources
    for (const itemId of resources) {
      await db.execute('INSERT INTO house_resources (house_id, item_id) VALUES (?, ?)', [houseId, itemId]);
    }

    res.json({ message: 'Resources saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save map coordinates for a house
router.post('/map-location', async (req, res) => {
  const db = getDb();
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  const { houseId, map_latitude, map_longitude } = req.body;

  // Verify house belongs to landlord
  const [house] = await db.execute('SELECT id FROM houses WHERE id = ? AND landlord_id = ?', [houseId, req.session.userId]);
  if (house.length === 0) return res.status(403).json({ error: 'House not found or not owned by you' });

  try {
    await db.execute('UPDATE houses SET map_latitude = ?, map_longitude = ? WHERE id = ?', [map_latitude, map_longitude, houseId]);
    res.json({ message: 'Map location saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save documents (terms, lawyer paper, tenancy) for a house
router.post('/documents', upload.fields([
  { name: 'terms_file', maxCount: 1 },
  { name: 'lawyer_file', maxCount: 1 },
  { name: 'tenancy_file', maxCount: 1 }
]), async (req, res) => {
  const db = getDb();
  // allow either session or bearer token
  let landlordId;
  if (req.session && req.session.role === 'landlord') landlordId = req.session.userId;
  else {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const payload = require('jsonwebtoken').verify(authHeader.split(' ')[1], 'jwt-secret-key');
        if (payload.role === 'landlord') landlordId = payload.userId || payload.id;
      } catch (e) { /* ignore */ }
    }
  }
  if (!landlordId) return res.status(403).json({ error: 'Unauthorized' });

  const { houseId } = req.body;
  if (!houseId) return res.status(400).json({ error: 'houseId required' });

  try {
    const [house] = await db.execute('SELECT id FROM houses WHERE id = ? AND landlord_id = ?', [houseId, landlordId]);
    if (house.length === 0) return res.status(403).json({ error: 'House not found or not owned by you' });

    // For each document type, insert or update a row in house_documents
    const upsertDoc = async (docType, textField, fileField) => {
      const summary = req.body[textField] || '';
      const file = req.files && req.files[fileField] && req.files[fileField][0] ? req.files[fileField][0] : null;
      const filePath = file ? file.path : null;
      const fileName = file ? file.originalname : null;
      const fileSize = file ? file.size : null;

      // check if existing document of this type exists
      const [rows] = await db.execute('SELECT id FROM house_documents WHERE house_id = ? AND doc_type = ? LIMIT 1', [houseId, docType]);
      if (rows.length > 0) {
        const id = rows[0].id;
        await db.execute(
          'UPDATE house_documents SET summary = ?, file_path = ?, file_name = ?, file_size = ?, landlord_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [summary, filePath, fileName, fileSize, landlordId, id]
        );
      } else {
        // only insert if there is content (summary or file)
        if (summary || filePath) {
          await db.execute(
            'INSERT INTO house_documents (house_id, landlord_id, doc_type, summary, file_path, file_name, file_size) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [houseId, landlordId, docType, summary, filePath, fileName, fileSize]
          );
        }
      }
    };

    // Documents upsert
    await upsertDoc('terms', 'terms_text', 'terms_file');
    await upsertDoc('lawyer', 'lawyer_text', 'lawyer_file');
    await upsertDoc('tenancy', 'tenancy_text', 'tenancy_file');

    res.json({ message: 'Documents saved' });
  } catch (err) {
    console.error('Error saving documents:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get documents for a house
router.get('/documents/:houseId', async (req, res) => {
  const db = getDb();
  const houseId = req.params.houseId;
  try {
    const [rows] = await db.execute('SELECT id, doc_type, summary, file_path, file_name, file_size, uploaded_at, updated_at FROM house_documents WHERE house_id = ?', [houseId]);
    if (rows.length === 0) return res.json({ documents: [] });
    // Normalize output
    const docs = rows.map(r => ({ id: r.id, key: r.doc_type, summary: r.summary, path: r.file_path, file_name: r.file_name, file_size: r.file_size, uploaded_at: r.uploaded_at, updated_at: r.updated_at }));
    res.json({ documents: docs });
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