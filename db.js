// db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'house_agency',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function getDb() {
  return pool;
}

module.exports = { getDb };
