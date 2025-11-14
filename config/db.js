const mysql = require('mysql2');
require('dotenv').config();

// Create a **pool** instead of a single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // ssl: {
  //   ca: process.env.DB_SSL_CA
  // }
});

// Fake "conn" object to keep your app unchanged
const conn = {
  query(sql, params) {
    return new Promise((resolve, reject) => {
      pool.query(sql, params, (err, results, fields) => {
        if (err) {
          console.error("❌ Query Error:", err);
          return reject(err);
        }
        resolve([results, fields]);
      });
    });
  },
  // Compatibility: allow conn.connect() without breaking your code
  connect(callback) {
    console.log("ℹ️ Using connection pool (auto-reconnect). No manual connect needed.");
    if (callback) callback(null);
  }
};

// Fake connect call (will not break your old code)
conn.connect(() => {
  console.log("✅ Connected to Railway DB (via pool)");
});

module.exports = conn;
