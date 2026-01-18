const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDb() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL');

    const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE (\w+)/)[1];
          await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
        }
        await connection.query(statement);
        console.log('Executed:', statement.substring(0, 50) + '...');
      }
    }

    console.log('Database initialized successfully');
    await connection.end();
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initDb();