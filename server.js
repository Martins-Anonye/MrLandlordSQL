const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// prevent direct static access to pages that have been moved into propertyOwner
// (we keep copies in the repo for reference but they should not be served)
const blockedStatic = new Set([
  '/upload-house.html',
  '/upload-hotel.html',
  '/manage-hotels.html',
  '/dashboard.html'
  ,'/hotels.html',
  '/house-rentals.html',
  '/purchase-slot.html',
  '/purchased-slots.html',
  '/manage-houses.html',
  '/used-slots.html'
]);
app.use((req, res, next) => {
  if (blockedStatic.has(req.path)) {
    // respond with 404 so the duplicate file is effectively removed
    return res.status(404).send('Not found');
  }
  next();
});

// convenience redirect: landlords often try to load /amenities.html directly
// which used to be the root copy; we now serve the file under
// /propertyOwner/amenities.html and block the root version.  Rather than
// letting users hit a 404, redirect them so the page actually loads.  This
// keeps the security intent of blocking the old copy while still being
// forgiving for manual navigation.

// Session
app.use(session({
  secret: 'house-agency-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

const { getDb } = require('./db'); // <-- use the pool
const dbPromise = (async () => {
  const db = getDb();
  return db;
})();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/houses', require('./routes/houses'));
app.use('/api/landlord/payment-info', require('./routes/landlordPayment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/slot-services', require('./routes/slotServices'));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/super-admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'super-admin-login.html'));
});

app.get('/asset-manager', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'asset-manager.html'));
});

app.get('/purchase-slot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'purchase-slot.html'));
});

app.get('/upload-house', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'upload-house.html'));
});


app.get('/manage-houses', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'manage-houses.html'));
});

app.get('/check-in', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'check-in.html'));
});

app.get('/used-slots', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'used-slots.html'));
});

app.get('/purchased-slots', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'purchased-slots.html'));
});

app.get('/house-rentals', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'house-rentals.html'));
});

app.get('/hotels', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'hotels.html'));
});

app.get('/upload-hotel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'upload-hotel.html'));
});

app.get('/manage-hotels', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'manage-hotels.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/property-owner-payment-info', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'propertyOwner', 'propertOwnerPaymentInfo.html'));
});

const PORT = process.env.PORT || 3001;
(async () => {
  await dbPromise; // Ensure DB is connected
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Open browser
    const { exec } = require('child_process');
    exec(`start http://localhost:${PORT}`);
  });
})();

