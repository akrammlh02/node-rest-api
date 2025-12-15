// Run this script to add resources column to lessons table
require('dotenv').config();
const mysql = require('mysql2');

const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

conn.connect((err) => {
    if (err) {
        console.error('❌ Connection error:', err);
        process.exit(1);
    }

    console.log('✅ Connected to database');

    const sql = 'ALTER TABLE lessons ADD COLUMN resources TEXT DEFAULT NULL';

    conn.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Column "resources" already exists');
            } else {
                console.error('❌ Error:', err.message);
            }
        } else {
            console.log('✅ Successfully added "resources" column to lessons table');
        }

        conn.end();
        process.exit(0);
    });
});
