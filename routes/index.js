const express = require('express');
const router = express.Router();
const conn = require('../config/db');

router.get('', (req, res) => {
  // Get published courses for the homepage
  const sql = `
    SELECT c.*, 
           COALESCE(COUNT(DISTINCT ch.id), 0) as chapters_count,
           COALESCE(COUNT(DISTINCT l.lesson_id), 0) as lessons_count
    FROM courses c
    LEFT JOIN chapters ch ON c.course_id = ch.course_id
    LEFT JOIN lessons l ON ch.id = l.chapitre_id
    WHERE c.is_published = 1
    GROUP BY c.course_id, c.title, c.description, c.price, c.duration_hours, c.level, c.thumbnail_url, c.is_published, c.created_at
    ORDER BY c.course_id DESC
    LIMIT 3
  `;

  conn.query(sql, (err, courses) => {
    if (err) {
      console.error('Error fetching courses:', err);
      courses = [];
    }

    res.render('index.hbs', {
      isLoggedIn: !!req.session.user,
      courses: courses || []
    });
  });
});

router.get('/ar', (req, res) => {
  // Get published courses for the homepage
  const sql = `
    SELECT c.*, 
           COALESCE(COUNT(DISTINCT ch.id), 0) as chapters_count,
           COALESCE(COUNT(DISTINCT l.lesson_id), 0) as lessons_count
    FROM courses c
    LEFT JOIN chapters ch ON c.course_id = ch.course_id
    LEFT JOIN lessons l ON ch.id = l.chapitre_id
    WHERE c.is_published = 1
    GROUP BY c.course_id, c.title, c.description, c.price, c.duration_hours, c.level, c.thumbnail_url, c.is_published, c.created_at
    ORDER BY c.course_id DESC
    LIMIT 3
  `;

  conn.query(sql, (err, courses) => {
    if (err) {
      console.error('Error fetching courses:', err);
      courses = [];
    }

    res.render('index_ar.hbs', {
      isLoggedIn: !!req.session.user,
      courses: courses || []
    });
  });
})

module.exports = router;
