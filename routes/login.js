const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const conn = require('../config/db');

router.get('/', (req, res) => {
  res.render('login.hbs');
});

router.get('/ar', (req, res) => {
  res.render('login-ar.hbs');
})


router.post('/', (req, res) => {
  const { email, password } = req.body;

  const sqlAdmin = "SELECT * FROM admin WHERE email = ?";

  conn.query(sqlAdmin, [email], async (err, result) => {
    if (err) return res.json({ success: false, message: 'Server Error' });
    if (result.length > 0) {
      const hashed = bcrypt.compare(password, result[0].password, (err, match) => {

        if (match) {
          req.session.user = {
            id: result[0].id,
            email: result[0].email,
            fullName: result[0].fullname,
          }
          return res.json({ success: true, type: 'admin' });
        } else {
          return res.json({ success: false, message: 'Password incorrect' });
        }
      })
    }
    if (result.length === 0) {
      const sql = "SELECT * FROM client WHERE email = ?";
      conn.query(sql, [email], (err, result) => {
        if (err) return res.json({ success: false, message: 'Server error' });
        if (result.length === 0) return res.json({ success: false, message: 'There is no user with this email.' });

        const user = result[0];

        bcrypt.compare(password, user.password, (err, match) => {
          if (err) return res.json({ success: false, message: 'Server error' });

          if (match) {
            req.session.user = {
              id: user.id,
              email: user.email,
              fullName: user.fullname
            };
            return res.json({ success: true, type: 'client' });
          } else {
            return res.json({ success: false, message: 'Password incorrect.' });
          }
        });
      });
    }


  })

});



module.exports = router;