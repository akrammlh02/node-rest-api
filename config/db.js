const express = require('express');
const mysql = require('mysql2');

require('dotenv').config();

const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
  // ssl: {
  //   ca: process.env.DB_SSL_CA
  // }
})





conn.connect((err) => {
  if (err) {
    console.error('❌ DB connection failed:', err);
    //process.exit(1); // Stop app if DB fails
  } else {
    console.log('✅ Connected to Railway DB');
  }
})

module.exports = conn;