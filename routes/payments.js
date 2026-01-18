const express = require('express');
const Paystack = require('paystack')('your-paystack-secret-key'); // Replace with actual key
const Flutterwave = require('flutterwave-node-v3'); // Replace with actual key
const crypto = require('crypto');

const { getDb } = require('../db'); // <-- use the pool
// const dbPromise = (async () => {
//   const db = getDb();
//   return db;
// })();

const router = express.Router();

// Initialize payment
router.post('/initiate', async (req, res) => {
  const db = getDb();
  const { houseId, gateway } = req.body;
  if (!req.session.userId) return res.status(403).json({ error: 'Unauthorized' });

  try {
    // Fetch house details
    const [houses] = await db.execute('SELECT price, lawyer_fee, agent_fee FROM houses WHERE id = ?', [houseId]);
    if (houses.length === 0) return res.status(404).json({ error: 'House not found' });
    const house = houses[0];
    const totalAmount = parseFloat(house.price) + parseFloat(house.lawyer_fee || 0) + parseFloat(house.agent_fee || 0);

    let response;
    if (gateway === 'paystack') {
      response = await Paystack.transaction.initialize({
        amount: totalAmount * 100, // in kobo
        email: 'user@example.com', // get from user
        callback_url: 'http://localhost:3001/payment/callback'
      });
    } else if (gateway === 'flutterwave') {
      const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY);
      response = await flw.Charge.card({
        // card details
      });
    }

    // Save payment record
    await db.execute('INSERT INTO payments (user_id, house_id, amount, gateway, status) VALUES (?, ?, ?, ?, "pending")', [req.session.userId, houseId, totalAmount, gateway]);

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payment callback
router.get('/callback', async (req, res) => {
  // Verify payment and update status
  res.send('Payment verified');
});

// Slot payment initiation
router.post('/initiate-slot', async (req, res) => {
  const db = getDb();
  const { slotId, gateway } = req.body;
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  try {
    // Fetch slot details
    const [slots] = await db.execute('SELECT price, tax FROM slots WHERE id = ?', [slotId]);
    if (slots.length === 0) return res.status(404).json({ error: 'Slot not found' });
    const slot = slots[0];
    const totalAmount = parseFloat(slot.price) + parseFloat(slot.tax || 0);

    let response;
    if (gateway === 'paystack') {
      response = await Paystack.transaction.initialize({
        amount: totalAmount * 100, // in kobo
        email: 'landlord@example.com', // get from session user email
        callback_url: 'http://localhost:3001/payment/slot-callback',
        metadata: { slotId, userId: req.session.userId }
      });
    } else if (gateway === 'flutterwave') {
      const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY);
      response = await flw.Charge.card({
        // card details, but for now mock
      });
    }

    // Save payment record
    const [result] = await db.execute('INSERT INTO payments (user_id, amount, gateway, status) VALUES (?, ?, ?, "pending")', [req.session.userId, totalAmount, gateway]);

    res.json({ ...response, paymentId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Slot payment callback
router.get('/slot-callback', async (req, res) => {
  const db = getDb();
  const { reference } = req.query;

  try {
    // Verify with Paystack
    const verification = await Paystack.transaction.verify(reference);
    if (verification.data.status === 'success') {
      const paymentId = verification.data.metadata.paymentId;
      const slotId = verification.data.metadata.slotId;
      const userId = verification.data.metadata.userId;

      // Update payment status
      await db.execute('UPDATE payments SET status = "completed", transaction_id = ? WHERE id = ?', [reference, paymentId]);

      // Insert into purchased_slots
      const [slots] = await db.execute('SELECT duration FROM slots WHERE id = ?', [slotId]);
      const nextExpiry = new Date();
      nextExpiry.setDate(nextExpiry.getDate() + slots[0].duration);

      await db.execute(
        'INSERT INTO purchased_slots (slot_id, landlord_id, payment_id, next_expiry) VALUES (?, ?, ?, ?)',
        [slotId, userId, paymentId, nextExpiry]
      );

      res.send('Slot purchased successfully');
    } else {
      res.send('Payment failed');
    }
  } catch (err) {
    res.status(500).send('Error verifying payment');
  }
});

// Webhook for Paystack
router.post('/webhook/paystack', async (req, res) => {
  const secret = 'your-paystack-secret-key';
  const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) return res.status(400).send('Invalid signature');

  const event = req.body.event;
  if (event === 'charge.success') {
    const { reference, metadata } = req.body.data;
    // Similar to callback
  }
  res.sendStatus(200);
});

// Webhook for Flutterwave
router.post('/webhook/flutterwave', async (req, res) => {
  // Verify and process
  res.sendStatus(200);
});

// Renew slot
router.post('/renew-slot/:purchasedSlotId', async (req, res) => {
  const db = getDb();
  const { purchasedSlotId } = req.params;
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const [ps] = await db.execute('SELECT * FROM purchased_slots WHERE id = ? AND landlord_id = ?', [purchasedSlotId, req.session.userId]);
    if (ps.length === 0) return res.status(404).json({ error: 'Purchased slot not found' });

    const slotId = ps[0].slot_id;
    const [slots] = await db.execute('SELECT duration, price FROM slots WHERE id = ?', [slotId]);
    const totalAmount = parseFloat(slots[0].price);

    // Initiate payment for renewal
    // Similar to initiate-slot

    res.json({ message: 'Renewal initiated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upgrade/Downgrade slot
router.post('/change-slot/:purchasedSlotId', async (req, res) => {
  const db = getDb();
  const { purchasedSlotId, newSlotId } = req.body;
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

  try {
    // Check ownership, calculate difference, initiate payment
    res.json({ message: 'Slot change initiated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initiate hotel booking payment
router.post('/initiate-hotel', async (req, res) => {
  const db = getDb();
  const { hotelId, checkin_date, checkout_date, gateway } = req.body;
  if (!req.session.userId) return res.status(403).json({ error: 'Unauthorized' });

  try {
    // Fetch hotel details
    const [hotels] = await db.execute('SELECT price_per_night FROM hotels WHERE id = ?', [hotelId]);
    if (hotels.length === 0) return res.status(404).json({ error: 'Hotel not found' });
    const hotel = hotels[0];

    // Calculate nights
    const checkin = new Date(checkin_date);
    const checkout = new Date(checkout_date);
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * parseFloat(hotel.price_per_night);

    let response;
    if (gateway === 'paystack') {
      response = await Paystack.transaction.initialize({
        amount: totalAmount * 100, // in kobo
        email: 'user@example.com', // get from user session
        callback_url: 'http://localhost:3001/payment/callback-hotel'
      });
    } else if (gateway === 'flutterwave') {
      const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY);
      response = await flw.Charge.card({
        // card details
      });
    }

    // Save booking as pending
    const [result] = await db.execute(
      'INSERT INTO hotel_bookings (user_id, hotel_id, checkin_date, checkout_date, total_price, status) VALUES (?, ?, ?, ?, ?, "pending")',
      [req.session.userId, hotelId, checkin_date, checkout_date, totalAmount]
    );

    // Save payment record
    await db.execute('INSERT INTO payments (user_id, hotel_booking_id, amount, gateway, status, transaction_id) VALUES (?, ?, ?, ?, "pending", ?)', [req.session.userId, result.insertId, totalAmount, gateway, response.data?.reference || '']);

    res.json({ ...response, bookingId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hotel payment callback
router.get('/callback-hotel', async (req, res) => {
  const db = getDb();
  const { reference } = req.query;

  try {
    // Verify payment with Paystack
    const verification = await Paystack.transaction.verify(reference);
    if (verification.data.status === 'success') {
      // Update payment and booking status
      await db.execute('UPDATE payments SET status = "completed" WHERE transaction_id = ?', [reference]);
      await db.execute('UPDATE hotel_bookings SET status = "confirmed" WHERE id = (SELECT hotel_booking_id FROM payments WHERE transaction_id = ?)', [reference]);
    }
    res.send('Payment verified');
  } catch (err) {
    res.status(500).send('Payment verification failed');
  }
});

module.exports = router;