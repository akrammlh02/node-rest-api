const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const { isClient, isClientAr, isClientAPI } = require('../utils/authMiddleware');

router.get('/', isClient, (req, res) => {

  // Prevent caching of protected pages
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  const clientId = req.session.user.id;

  // Get purchased courses for this client
  const sql = `
    SELECT p.*, c.title, c.description, c.thumbnail_url, c.price, c.duration_hours
    FROM purchases p
    INNER JOIN courses c ON p.course_id = c.course_id
    WHERE p.client_id = ? AND p.paid = 1
    ORDER BY p.purchase_date DESC
  `;

  conn.query(sql, [clientId], (err, purchasedCourses) => {
    if (err) {
      console.error(err);
      purchasedCourses = [];
    }

    // Get statistics
    const enrolledCount = purchasedCourses.length;

    // Get recent orders/payments status
    const ordersSql = `
      SELECT p.*, c.title as course_title, pr.file_url as proof_url
      FROM payments p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN payment_proofs pr ON p.id = pr.payment_id
      WHERE p.client_id = ?
      ORDER BY p.created_at DESC
      LIMIT 10
    `;

    conn.query(ordersSql, [clientId], (err, recentOrders) => {
      res.render('dashboard.hbs', {
        fullName: req.session.user.fullName,
        email: req.session.user.email,
        id: req.session.user.id,
        membershipTier: req.session.user.membershipTier || 'Free',
        membershipStatus: req.session.user.membershipStatus || 'none',
        membershipExpiry: req.session.user.membershipExpiry,
        purchasedCourses: purchasedCourses || [],
        enrolledCount: enrolledCount,
        recentOrders: recentOrders || []
      });
    });
  });
})

router.get('/ar', isClientAr, (req, res) => {

  // Prevent caching of protected pages
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  const clientId = req.session.user.id;

  // Get purchased courses for this client
  const sql = `
    SELECT p.*, c.title, c.description, c.thumbnail_url, c.price, c.duration_hours
    FROM purchases p
    INNER JOIN courses c ON p.course_id = c.course_id
    WHERE p.client_id = ? AND p.paid = 1
    ORDER BY p.purchase_date DESC
  `;

  // SQL for orders (reusable)
  const ordersSql = `
    SELECT p.*, c.title as course_title, pr.file_url as proof_url
    FROM payments p
    LEFT JOIN courses c ON p.course_id = c.course_id
    LEFT JOIN payment_proofs pr ON p.id = pr.payment_id
    WHERE p.client_id = ?
    ORDER BY p.created_at DESC
    LIMIT 10
  `;

  conn.query(sql, [clientId], (err, purchasedCourses) => {
    if (err) {
      console.error(err);
      purchasedCourses = [];
    }

    const enrolledCount = purchasedCourses.length;

    conn.query(ordersSql, [clientId], (err, recentOrders) => {
      res.render('dashboard-ar.hbs', {
        fullName: req.session.user.fullName,
        email: req.session.user.email,
        id: req.session.user.id,
        purchasedCourses: purchasedCourses || [],
        enrolledCount: enrolledCount,
        recentOrders: recentOrders || []
      });
    });
  });
})

// API: Get client's purchased courses
router.get('/api/my-courses', isClientAPI, (req, res) => {

  const clientId = req.session.user.id;
  const sql = `
    SELECT p.*, c.title, c.description, c.thumbnail_url, c.price, c.duration_hours, c.course_id
    FROM purchases p
    INNER JOIN courses c ON p.course_id = c.course_id
    WHERE p.client_id = ? AND p.paid = 1
    ORDER BY p.purchase_date DESC
  `;

  conn.query(sql, [clientId], (err, courses) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, courses });
  });
});

// API: Update profile
router.put('/api/update-profile', isClientAPI, (req, res) => {

  const { fullName } = req.body;
  const clientId = req.session.user.id;

  if (!fullName || fullName.trim().length === 0) {
    return res.json({ success: false, message: 'Full name is required' });
  }

  const sql = 'UPDATE client SET fullname = ? WHERE id = ?';
  conn.query(sql, [fullName.trim(), clientId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    // Update session
    req.session.user.fullName = fullName.trim();

    res.json({ success: true, message: 'Profile updated successfully' });
  });
});

// API: Change password
router.put('/api/change-password', isClientAPI, (req, res) => {

  const { currentPassword, newPassword } = req.body;
  const clientId = req.session.user.id;

  if (!currentPassword || !newPassword) {
    return res.json({ success: false, message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.json({ success: false, message: 'New password must be at least 6 characters long' });
  }

  // Get current password from database
  const sql = 'SELECT password FROM client WHERE id = ?';
  conn.query(sql, [clientId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    const bcrypt = require('bcrypt');

    // Verify current password
    bcrypt.compare(currentPassword, result[0].password, (err, match) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (!match) {
        return res.json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash new password
      bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        // Update password
        const updateSql = 'UPDATE client SET password = ? WHERE id = ?';
        conn.query(updateSql, [hash, clientId], (err, result) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          res.json({ success: true, message: 'Password changed successfully' });
        });
      });
    });
  });
});

// API: Get course progress
router.get('/api/progress', isClientAPI, (req, res) => {

  const clientId = req.session.user.id;

  // Get all purchased courses
  const sql = `
    SELECT DISTINCT p.course_id, c.title
    FROM purchases p
    INNER JOIN courses c ON p.course_id = c.course_id
    WHERE p.client_id = ? AND p.paid = 1
  `;

  conn.query(sql, [clientId], (err, courses) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (courses.length === 0) {
      return res.json({ success: true, progress: [] });
    }

    const courseIds = courses.map(c => c.course_id);

    // Get total lessons count for each course
    const lessonsSql = `
      SELECT c.course_id, COUNT(l.lesson_id) as total_lessons
      FROM courses c
      LEFT JOIN chapters ch ON c.course_id = ch.course_id
      LEFT JOIN lessons l ON ch.id = l.chapitre_id
      WHERE c.course_id IN (?)
      GROUP BY c.course_id
    `;

    conn.query(lessonsSql, [courseIds], (err, lessonsCount) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      // Get completed lessons count for each course
      const progressSql = `
        SELECT l.chapitre_id, l.lesson_id, ch.course_id
        FROM progress p
        INNER JOIN lessons l ON p.lesson_id = l.lesson_id
        INNER JOIN chapters ch ON l.chapitre_id = ch.id
        WHERE p.client_id = ? AND p.completed = 1
      `;

      conn.query(progressSql, [clientId], (err, completedLessons) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        // Calculate progress for each course
        const progress = courses.map(course => {
          const totalLessons = lessonsCount.find(l => l.course_id === course.course_id)?.total_lessons || 0;
          const completed = completedLessons.filter(cl => cl.course_id === course.course_id).length;
          const percentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

          return {
            course_id: course.course_id,
            total_lessons: totalLessons,
            completed_lessons: completed,
            percentage: percentage
          };
        });

        res.json({ success: true, progress });
      });
    });
  });
});

// API: Get client statistics
router.get('/api/stats', isClientAPI, (req, res) => {

  const clientId = req.session.user.id;

  // Get enrolled courses count
  conn.query('SELECT COUNT(*) as count FROM purchases WHERE client_id = ? AND paid = 1', [clientId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    const enrolledCount = result[0].count;

    // Get completed courses count (courses with 100% progress)
    conn.query(`
      SELECT COUNT(DISTINCT p.course_id) as count
      FROM purchases p
      INNER JOIN courses c ON p.course_id = c.course_id
      WHERE p.client_id = ? AND p.paid = 1
      AND (
        SELECT COUNT(DISTINCT l.lesson_id)
        FROM chapters ch
        INNER JOIN lessons l ON ch.id = l.chapitre_id
        WHERE ch.course_id = p.course_id
      ) = (
        SELECT COUNT(DISTINCT pr.lesson_id)
        FROM progress pr
        INNER JOIN lessons l ON pr.lesson_id = l.lesson_id
        INNER JOIN chapters ch ON l.chapitre_id = ch.id
        WHERE pr.client_id = ? AND pr.completed = 1 AND ch.course_id = p.course_id
      )
      AND (
        SELECT COUNT(DISTINCT l.lesson_id)
        FROM chapters ch
        INNER JOIN lessons l ON ch.id = l.chapitre_id
        WHERE ch.course_id = p.course_id
      ) > 0
    `, [clientId, clientId], (err, completedResult) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      const completedCount = completedResult[0].count || 0;

      // Get certificates count
      conn.query('SELECT COUNT(*) as count FROM certificates WHERE client_id = ?', [clientId], (err, certResult) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        const certificateCount = certResult[0].count;

        // Get total learning hours
        conn.query(`
        SELECT SUM(CAST(c.duration_hours AS UNSIGNED)) as total_hours
        FROM purchases p
        INNER JOIN courses c ON p.course_id = c.course_id
        WHERE p.client_id = ? AND p.paid = 1
      `, [clientId], (err, hoursResult) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          const learningHours = hoursResult[0].total_hours || 0;

          res.json({
            success: true,
            stats: {
              enrolledCourses: enrolledCount,
              completedCourses: completedCount,
              certificates: certificateCount,
              learningHours: learningHours
            }
          });
        });
      });
    });
  });
})

// API: Get client's certificates
router.get('/api/certificates', isClientAPI, (req, res) => {

  const clientId = req.session.user.id;

  const sql = `
    SELECT c.*, co.title as course_title, co.level as course_category, co.thumbnail_url
    FROM certificates c
    INNER JOIN courses co ON c.course_id = co.course_id
    WHERE c.client_id = ?
    ORDER BY c.date_issued DESC
  `;

  conn.query(sql, [clientId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, certificates: result });
  });
});

// API: Get first lesson of a course
router.get('/api/first-lesson/:courseId', isClientAPI, (req, res) => {

  const courseId = req.params.courseId;
  const clientId = req.session.user.id;

  // Check if user has access to this course
  const checkAccessSql = 'SELECT * FROM purchases WHERE client_id = ? AND course_id = ? AND paid = 1';
  conn.query(checkAccessSql, [clientId, courseId], (err, purchases) => {
    if (err || purchases.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get the first lesson of the course
    const sql = `
      SELECT l.lesson_id
      FROM lessons l
      INNER JOIN chapters ch ON l.chapitre_id = ch.id
      WHERE ch.course_id = ?
      ORDER BY ch.order ASC, l.order_number ASC
      LIMIT 1
    `;

    conn.query(sql, [courseId], (err, result) => {
      if (err || result.length === 0) {
        return res.status(404).json({ success: false, message: 'No lessons found for this course' });
      }

      res.json({ success: true, lessonId: result[0].lesson_id });
    });
  });
});

module.exports = router;