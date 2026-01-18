
const express = require('express');
const { getDb } = require('../db');

function slotCalc2BeUse4Capacty(router){

 
// Get purchased house slots for a landlord
//router.get('/landlord/purchased-house-slots', async (req, res) => {
 
  
//   const db = getDb();
//   const landlordId = req.session.userId;

//   try {
//     const [rows] = await db.execute(
//       `SELECT ps.id AS purchased_slot_id,
//               ps.date_purchased,
//               ps.status,
//               s.slot_title,
//               s.slot_description,
//               s.capacity,
//               s.duration,
//               s.price,
//               s.tax
//        FROM purchased_slots ps
//        JOIN slots s ON ps.slot_id = s.id
//        WHERE ps.landlord_id = ? AND s.type = 'house'`,
//       [landlordId]
//     );

//     res.json(rows);
//   } catch (err) {
//     console.error('Error fetching purchased house slots:', err);
//     res.status(500).json({ error: err.message });
//   }
// });



//to do the following for other property 
//remove this line  to that property route file

//AND s.type = 'house'



// Get purchased slots for landlord (only house slots with remaining capacity >= 1)
router.get('/landlord/purchased-house-slots', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'landlord') return res.status(403).json({ error: 'Unauthorized' });

    const db = getDb();
  const landlordId = req.session.userId;
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
GROUP BY ps.id, ps.status, ps.date_purchased, s.slot_title, s.type, s.capacity, s.duration
HAVING remaining_capacity > 0;
`,
      [landlordId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching purchased house slots:', err);
    res.status(500).json({ error: err.message });
  }
});


}

module.exports = {slotCalc2BeUse4Capacty};