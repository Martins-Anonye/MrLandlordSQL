
const bcrypt = require('bcryptjs');
const { getDb } = require('../db'); // <-- use the pool
//const dbPromise = (async () => {
 // const db = getDb();
 // return db;
//})();
async function createSeedForAccountTest(router) {

    const db = getDb();
    // Auto-create default landlord and public accounts
//router.post('/auto-create-users', async (req, res) => {

  try {
    const usersToCreate = [
      {
        email: 'landlord1@houseagency.com',
        password: 'landlord123',
        name: 'John Landlord',
        phone: '+2348012345678',
        role: 'landlord'
      },
      {
        email: 'landlord2@houseagency.com',
        password: 'landlord123',
        name: 'Mary Landlord',
        phone: '+2348098765432',
        role: 'landlord'
      },
      {
        email: 'public1@houseagency.com',
        password: 'public123',
        name: 'Alice Public',
        phone: '+2347012345678',
        role: 'public'
      },
      {
        email: 'public2@houseagency.com',
        password: 'public123',
        name: 'Bob Public',
        phone: '+2347098765432',
        role: 'public'
      }
    ];

   for (const user of usersToCreate) {
  const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [user.email]);
  if (rows.length === 0) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await db.execute(
      'INSERT INTO users (email, password, name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [user.email, hashedPassword, user.name, user.phone, user.role]
    );
  } else {
    console.log(`User with email ${user.email} already exists, skipping.`);
  }
}


    console.log('Default landlord and public accounts created successfully');
  //  res.status(201).json({ message: 'Default landlord and public accounts created successfully' });
  } catch (err) {

    console.log('Error creating default users:', err);
   // res.status(500).json({ error: err.message });
  }
//});

}


module.exports = {createSeedForAccountTest};