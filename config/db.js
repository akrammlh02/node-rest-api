const express = require('express');
const mysql = require('mysql2');

require('dotenv').config();

// Create a connection pool instead of a single connection
// This automatically handles reconnections and manages multiple connections
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10, // Maximum number of connections in pool
  queueLimit: 0, // Unlimited queueing
  enableKeepAlive: true, // Keep connection alive
  keepAliveInitialDelay: 0, // Start keep-alive immediately
  connectTimeout: 60000, // 60 seconds timeout for initial connection
  // ssl: {
  //   ca: process.env.DB_SSL_CA
  // }
});

// Test the pool connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ DB connection pool failed:', err);
  } else {
    console.log('✅ Connected to Railway DB (Pool Ready)');
    connection.release(); // Release connection back to pool
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Database connection lost. Pool will automatically reconnect.');
  }
});

module.exports = pool;