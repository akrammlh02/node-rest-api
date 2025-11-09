const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
  res.render('signup.hbs');
});

router.get('/ar', (req, res) => {
  res.render('signup-ar.hbs');
})

router.post('/', (req, res) => {
  const { fullName, email, password } = req.body;

  const sqlCheck = "SELECT * FROM client WHERE email = ?";
  conn.query(sqlCheck, [email], (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: 'Server error' });
    }

    if (result.length > 0) {
      return res.json({ success: false, message: 'This email is used in another account' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error(err);
        return res.json({ success: false, message: 'Server error' });
      }

      const sqlInsert = "INSERT INTO client (fullname, email, password) VALUES (?, ?, ?)";
      conn.query(sqlInsert, [fullName, email, hashedPassword], (err, result) => {
        if (err) {
          console.error(err);
          return res.json({ success: false, message: 'Server error' });
        }

        return res.json({ success: true, message: 'Account created successfully' });
      });
    });
  });
});

module.exports = router;