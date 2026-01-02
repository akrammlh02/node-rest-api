const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const conn = require('../config/db');
const youtubeService = require('../services/youtubeService');
const { isAdmin, isAdminAr, isAdminAPI } = require('../utils/authMiddleware');

// Multer setup to store file in memory (better for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Multer setup for video uploads (larger file size limit)
const videoStorage = multer.memoryStorage();
const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

router.get('/', isAdmin, (req, res) => {
  // Prevent caching of protected pages
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  const sql = "SELECT * FROM courses ORDER BY course_id DESC";
  conn.query(sql, (err, result) => {
    if (err) throw err;

    const courses = result;
    res.render('admin', {
      id: req.session.user.id,
      fullName: req.session.user.fullName,
      email: req.session.user.email,
      courses,
    });
  });
})


router.get('/ar', isAdminAr, (req, res) => {
  // Prevent caching of protected pages
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  const sql = "SELECT * FROM courses ORDER BY course_id DESC";
  conn.query(sql, (err, result) => {
    if (err) throw err;

    const courses = result;
    res.render('admin-ar', {
      id: req.session.user.id,
      fullName: req.session.user.fullName,
      email: req.session.user.email,
      courses,
    });
  });
})

router.post('/addCourse', isAdminAPI, upload.single('courseImage'), async (req, res) => {
  try {
    // Support both old and new field names for backward compatibility during transition
    const {
      title, courseTitle,
      description, courseDescription,
      price, coursePrice,
      level, courseCategory,
      skills,
      previewVideoUrl,
      isPublished,
      durationHours
    } = req.body;

    // Normalize values
    const finalTitle = title || courseTitle;
    const finalDescription = description || courseDescription;
    const finalPrice = price || coursePrice;
    const finalLevel = level || courseCategory;

    if (!finalTitle || !finalDescription || !finalPrice || !durationHours || !finalLevel) {
      return res.json({ success: false, message: 'All fields are required' });
    }

    let imageUrl = '';

    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        // Convert buffer to base64 data URI for Cloudinary
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64Image, {
          folder: 'devacademy/courses',
          resource_type: 'image'
        });
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.json({ success: false, message: 'Failed to upload image. Please try again.' });
      }
    } else {
      return res.json({ success: false, message: 'Course image is required' });
    }

    const created_at = new Date();
    let etat;
    if (isPublished === 'draft' || isPublished === 'false' || isPublished === false) {
      etat = false;
    } else {
      etat = true;
    }

    const sql = `
      INSERT INTO courses 
      (title, description, price, duration_hours,
       thumbnail_url, preview_video_url, is_published, created_at, level, skills)
      VALUES
      (?,?,?,?,?,?,?,?,?,?)
    `;

    conn.query(sql, [
      finalTitle, finalDescription,
      finalPrice, durationHours,
      imageUrl, previewVideoUrl || '', etat, created_at, finalLevel || '', skills || ''
    ], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.json({ success: false, message: 'Server Error' });
      }
      res.json({ success: true, message: 'Course added successfully!' });
    });
  } catch (error) {
    console.error('Error adding course:', error);
    res.json({ success: false, message: 'Server Error' });
  }
});

router.delete('/deleteCourse/:id', isAdminAPI, (req, res) => {
  const courseId = req.params.id;

  // First, get all chapters for this course
  const getChaptersSql = 'SELECT id FROM chapters WHERE course_id = ?';
  conn.query(getChaptersSql, [courseId], (err, chapters) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: 'Server error while deleting course.' });
    }

    // Delete all lessons for chapters of this course
    if (chapters.length > 0) {
      const chapterIds = chapters.map(ch => ch.id);
      const deleteLessonsSql = 'DELETE FROM lessons WHERE chapitre_id IN (?)';
      conn.query(deleteLessonsSql, [chapterIds], (err) => {
        if (err) {
          console.error(err);
          return res.json({ success: false, message: 'Server error while deleting lessons.' });
        }
      });
    }

    // Delete all chapters for this course
    const deleteChaptersSql = 'DELETE FROM chapters WHERE course_id = ?';
    conn.query(deleteChaptersSql, [courseId], (err) => {
      if (err) {
        console.error(err);
        return res.json({ success: false, message: 'Server error while deleting chapters.' });
      }

      // Finally, delete the course
      const deleteCourseSql = 'DELETE FROM courses WHERE course_id = ?';
      conn.query(deleteCourseSql, [courseId], (err, result) => {
        if (err) {
          console.error(err);
          return res.json({ success: false, message: 'Server error while deleting course.' });
        }

        if (result.affectedRows === 0) {
          return res.json({ success: false, message: 'Course not found.' });
        }

        res.json({ success: true, message: 'Course deleted successfully.' });
      });
    });
  });
});

// API: Get chapters for a course
router.get('/api/courses/:courseId/chapters', isAdminAPI, (req, res) => {
  const courseId = req.params.courseId;
  const sql = 'SELECT * FROM chapters WHERE course_id = ? ORDER BY `order` ASC';
  conn.query(sql, [courseId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, chapters: result });
  });
});

// API: Add chapter
router.post('/api/courses/:courseId/chapters', isAdminAPI, (req, res) => {
  const courseId = req.params.courseId;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.json({ success: false, message: 'Chapter title is required' });
  }

  // Get max order for this course
  const getMaxOrderSql = 'SELECT MAX(`order`) as maxOrder FROM chapters WHERE course_id = ?';
  conn.query(getMaxOrderSql, [courseId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    const newOrder = (result[0]?.maxOrder || 0) + 1;
    const insertSql = 'INSERT INTO chapters (course_id, title, `order`) VALUES (?, ?, ?)';
    conn.query(insertSql, [courseId, title.trim(), newOrder], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      res.json({ success: true, message: 'Chapter added successfully', chapterId: result.insertId });
    });
  });
});

// API: Delete chapter
router.delete('/api/chapters/:chapterId', isAdminAPI, (req, res) => {
  const chapterId = req.params.chapterId;

  // First delete all lessons in this chapter
  const deleteLessonsSql = 'DELETE FROM lessons WHERE chapitre_id = ?';
  conn.query(deleteLessonsSql, [chapterId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error while deleting lessons' });
    }

    // Then delete the chapter
    const deleteChapterSql = 'DELETE FROM chapters WHERE id = ?';
    conn.query(deleteChapterSql, [chapterId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (result.affectedRows === 0) {
        return res.json({ success: false, message: 'Chapter not found' });
      }

      res.json({ success: true, message: 'Chapter deleted successfully' });
    });
  });
});

// API: Update chapter order (move up/down)
router.put('/api/chapters/:chapterId/order', isAdminAPI, (req, res) => {
  const chapterId = req.params.chapterId;
  const { direction } = req.body; // 'up' or 'down'

  // Get current chapter
  const getChapterSql = 'SELECT * FROM chapters WHERE id = ?';
  conn.query(getChapterSql, [chapterId], (err, chapters) => {
    if (err || chapters.length === 0) {
      return res.status(500).json({ success: false, message: 'Chapter not found' });
    }

    const chapter = chapters[0];
    const currentOrder = chapter.order;
    const courseId = chapter.course_id;

    // Get adjacent chapter
    const orderOperator = direction === 'up' ? '<' : '>';
    const orderDirection = direction === 'up' ? 'DESC' : 'ASC';
    const getAdjacentSql = `SELECT * FROM chapters WHERE course_id = ? AND \`order\` ${orderOperator} ? ORDER BY \`order\` ${orderDirection} LIMIT 1`;

    conn.query(getAdjacentSql, [courseId, currentOrder], (err, adjacentChapters) => {
      if (err || adjacentChapters.length === 0) {
        return res.json({ success: false, message: 'Cannot move chapter' });
      }

      const adjacentChapter = adjacentChapters[0];
      const adjacentOrder = adjacentChapter.order;

      // Swap orders
      conn.query('UPDATE chapters SET `order` = ? WHERE id = ?', [adjacentOrder, chapterId], (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        conn.query('UPDATE chapters SET `order` = ? WHERE id = ?', [currentOrder, adjacentChapter.id], (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
          }
          res.json({ success: true, message: 'Chapter order updated' });
        });
      });
    });
  });
});

// API: Update chapter title
router.put('/api/chapters/:chapterId', isAdminAPI, (req, res) => {
  const chapterId = req.params.chapterId;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.json({ success: false, message: 'Chapter title is required' });
  }

  const sql = 'UPDATE chapters SET title = ? WHERE id = ?';
  conn.query(sql, [title.trim(), chapterId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Chapter not found' });
    }

    res.json({ success: true, message: 'Chapter updated successfully' });
  });
});

// API: Get lessons for a chapter
router.get('/api/chapters/:chapterId/lessons', isAdminAPI, (req, res) => {
  const chapterId = req.params.chapterId;
  const sql = 'SELECT * FROM lessons WHERE chapitre_id = ? ORDER BY order_number ASC';
  conn.query(sql, [chapterId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, lessons: result });
  });
});

// API: Add lesson
router.post('/api/chapters/:chapterId/lessons', isAdminAPI, (req, res) => {
  const chapterId = req.params.chapterId;
  const { title, videoUrl } = req.body;

  if (!title || !title.trim()) {
    return res.json({ success: false, message: 'Lesson title is required' });
  }

  if (!videoUrl || !videoUrl.trim()) {
    return res.json({ success: false, message: 'Video URL is required' });
  }

  // Get max order for this chapter
  const getMaxOrderSql = 'SELECT MAX(order_number) as maxOrder FROM lessons WHERE chapitre_id = ?';
  conn.query(getMaxOrderSql, [chapterId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    const newOrder = (result[0]?.maxOrder || 0) + 1;
    const created_at = new Date();
    const isFreeValue = req.body.isFree === true || req.body.isFree === 'true' || req.body.isFree === 1 || req.body.isFree === '1' ? 1 : 0;

    const insertSql = 'INSERT INTO lessons (chapitre_id, title, content_type, content_url, text_content, duration_minutes, order_number, created_at, is_free) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    conn.query(insertSql, [chapterId, title.trim(), 'video', videoUrl.trim(), '', '0', newOrder, created_at, isFreeValue], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      res.json({ success: true, message: 'Lesson added successfully', lessonId: result.insertId });
    });
  });
});

// API: Delete lesson
router.delete('/api/lessons/:lessonId', isAdminAPI, (req, res) => {
  const lessonId = req.params.lessonId;
  const sql = 'DELETE FROM lessons WHERE lesson_id = ?';
  conn.query(sql, [lessonId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Lesson not found' });
    }

    res.json({ success: true, message: 'Lesson deleted successfully' });
  });
});

// API: Update lesson order (move up/down)
router.put('/api/lessons/:lessonId/order', isAdminAPI, (req, res) => {
  const lessonId = req.params.lessonId;
  const { direction } = req.body; // 'up' or 'down'

  // Get current lesson
  const getLessonSql = 'SELECT * FROM lessons WHERE lesson_id = ?';
  conn.query(getLessonSql, [lessonId], (err, lessons) => {
    if (err || lessons.length === 0) {
      return res.status(500).json({ success: false, message: 'Lesson not found' });
    }

    const lesson = lessons[0];
    const currentOrder = lesson.order_number;
    const chapterId = lesson.chapitre_id;

    // Get adjacent lesson
    const orderOperator = direction === 'up' ? '<' : '>';
    const orderDirection = direction === 'up' ? 'DESC' : 'ASC';
    const getAdjacentSql = `SELECT * FROM lessons WHERE chapitre_id = ? AND order_number ${orderOperator} ? ORDER BY order_number ${orderDirection} LIMIT 1`;

    conn.query(getAdjacentSql, [chapterId, currentOrder], (err, adjacentLessons) => {
      if (err || adjacentLessons.length === 0) {
        return res.json({ success: false, message: 'Cannot move lesson' });
      }

      const adjacentLesson = adjacentLessons[0];
      const adjacentOrder = adjacentLesson.order_number;

      // Swap orders
      conn.query('UPDATE lessons SET order_number = ? WHERE lesson_id = ?', [adjacentOrder, lessonId], (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        conn.query('UPDATE lessons SET order_number = ? WHERE lesson_id = ?', [currentOrder, adjacentLesson.lesson_id], (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
          }
          res.json({ success: true, message: 'Lesson order updated' });
        });
      });
    });
  });
});

// API: Update lesson title and video URL
router.put('/api/lessons/:lessonId', isAdminAPI, (req, res) => {
  const lessonId = req.params.lessonId;
  const { title, videoUrl, isFree } = req.body;

  if (!title || !title.trim()) {
    return res.json({ success: false, message: 'Lesson title is required' });
  }

  if (!videoUrl || !videoUrl.trim()) {
    return res.json({ success: false, message: 'Video URL is required' });
  }

  const isFreeValue = isFree === true || isFree === 'true' || isFree === 1 || isFree === '1' ? 1 : 0;

  const sql = 'UPDATE lessons SET title = ?, content_url = ?, is_free = ? WHERE lesson_id = ?';
  conn.query(sql, [title.trim(), videoUrl.trim(), isFreeValue, lessonId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Lesson not found' });
    }

    res.json({ success: true, message: 'Lesson updated successfully' });
  });
});

// API: Get all clients
router.get('/api/clients', isAdminAPI, (req, res) => {
  const sql = 'SELECT id, fullname, email, membership_tier, membership_expiry, membership_status FROM client ORDER BY id DESC';
  conn.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, clients: result });
  });
});

// API: Get client's purchased courses with progress
router.get('/api/clients/:clientId/purchases', isAdminAPI, (req, res) => {
  const clientId = req.params.clientId;
  const sql = `
    SELECT p.*, c.title as course_title, c.price, c.course_id
    FROM purchases p
    INNER JOIN courses c ON p.course_id = c.course_id
    WHERE p.client_id = ? AND p.paid = 1
    ORDER BY p.purchase_date DESC
  `;
  conn.query(sql, [clientId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    // Get progress for each course
    if (result.length === 0) {
      return res.json({ success: true, courses: [] });
    }

    const courseIds = result.map(c => c.course_id);

    // Get total lessons count for each course
    const totalLessonsSql = `
      SELECT ch.course_id, COUNT(l.lesson_id) as total_lessons
      FROM chapters ch
      LEFT JOIN lessons l ON ch.id = l.chapitre_id
      WHERE ch.course_id IN (?)
      GROUP BY ch.course_id
    `;

    conn.query(totalLessonsSql, [courseIds], (err, totalLessons) => {
      if (err) {
        return res.json({ success: true, courses: result });
      }

      // Get completed lessons count for each course
      const completedSql = `
        SELECT ch.course_id, COUNT(DISTINCT pr.lesson_id) as completed_lessons
        FROM progress pr
        INNER JOIN lessons l ON pr.lesson_id = l.lesson_id
        INNER JOIN chapters ch ON l.chapitre_id = ch.id
        WHERE pr.client_id = ? AND pr.completed = 1 AND ch.course_id IN (?)
        GROUP BY ch.course_id
      `;

      conn.query(completedSql, [clientId, courseIds], (err, completedLessons) => {
        if (err) {
          return res.json({ success: true, courses: result });
        }

        // Calculate progress for each course
        const coursesWithProgress = result.map(course => {
          const total = totalLessons.find(t => t.course_id === course.course_id)?.total_lessons || 0;
          const completed = completedLessons.find(c => c.course_id === course.course_id)?.completed_lessons || 0;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
          const isCompleted = total > 0 && completed >= total;

          return {
            ...course,
            progress: {
              total,
              completed,
              percentage,
              isCompleted
            }
          };
        });

        res.json({ success: true, courses: coursesWithProgress });
      });
    });
  });
});

// API: Manually add course to client (for manual payment)
router.post('/api/clients/add-course', isAdminAPI, (req, res) => {
  const { clientId, courseId } = req.body;

  if (!clientId || !courseId) {
    return res.json({ success: false, message: 'Client ID and Course ID are required' });
  }

  // Check if purchase already exists
  const checkSql = 'SELECT * FROM purchases WHERE client_id = ? AND course_id = ?';
  conn.query(checkSql, [clientId, courseId], (err, existing) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (existing.length > 0) {
      // Update existing purchase to paid
      const updateSql = 'UPDATE purchases SET paid = 1 WHERE client_id = ? AND course_id = ?';
      conn.query(updateSql, [clientId, courseId], (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        res.json({ success: true, message: 'Course access activated successfully' });
      });
    } else {
      // Create new purchase
      const purchaseDate = new Date();
      const insertSql = 'INSERT INTO purchases (client_id, course_id, purchase_date, paid) VALUES (?, ?, ?, 1)';
      conn.query(insertSql, [clientId, courseId, purchaseDate], (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        res.json({ success: true, message: 'Course added to client successfully' });
      });
    }
  });
});

// API: Manually give membership to client
router.post('/api/clients/give-membership', isAdminAPI, (req, res) => {
  const { clientId, tier, duration } = req.body;

  if (!clientId || !tier) {
    return res.json({ success: false, message: 'Client ID and Tier are required' });
  }

  // Calculate expiry date
  let expiryDate = null;
  if (duration === 'infinite') {
    expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 100);
  } else if (duration) {
    expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(duration));
  }

  // 1. Update client table
  const updateClientSql = `
    UPDATE client 
    SET membership_tier = ?, 
        membership_expiry = ?, 
        membership_status = 'active' 
    WHERE id = ?
  `;

  conn.query(updateClientSql, [tier, expiryDate, clientId], (err) => {
    if (err) {
      console.error('Error updating client membership:', err);
      return res.status(500).json({ success: false, message: 'Server error updating client' });
    }

    // 2. Log in payments table for tracking
    const amount = tier === 'Pro' ? 2900 : tier === 'VIP' ? 5900 : 0;
    const insertPaymentSql = `
      INSERT INTO payments 
      (client_id, amount, payment_method, status, created_at, completed_at, payment_type, membership_plan) 
      VALUES (?, ?, 'manual_admin', 'completed', NOW(), NOW(), 'membership', ?)
    `;

    conn.query(insertPaymentSql, [clientId, amount, tier], (err) => {
      if (err) {
        console.error('Error logging membership payment:', err);
      }
      res.json({
        success: true,
        message: `Membership ${tier} assigned successfully until ${expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}`
      });
    });
  });
});

// API: Manually remove/revoke membership from client
router.post('/api/clients/remove-membership', isAdminAPI, (req, res) => {
  const { clientId } = req.body;

  if (!clientId) {
    return res.json({ success: false, message: 'Client ID is required' });
  }

  const updateSql = `
    UPDATE client 
    SET membership_tier = 'Free', 
        membership_expiry = NULL, 
        membership_status = 'none' 
    WHERE id = ?
  `;

  conn.query(updateSql, [clientId], (err) => {
    if (err) {
      console.error('Error removing membership:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, message: 'Membership revoked successfully. User is now back to Free tier.' });
  });
});

// API: Get course by ID (for editing)
router.get('/api/courses/:courseId', isAdminAPI, (req, res) => {
  const courseId = req.params.courseId;
  const sql = 'SELECT * FROM courses WHERE course_id = ?';
  conn.query(sql, [courseId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json({ success: true, course: result[0] });
  });
});

// API: Get all courses (for client course selection)
router.get('/api/courses', isAdminAPI, (req, res) => {
  const sql = 'SELECT course_id, title, price FROM courses ORDER BY course_id DESC';
  conn.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, courses: result });
  });
});

// API: Update course
router.put('/updateCourse/:id', isAdminAPI, upload.single('courseImage'), async (req, res) => {
  try {
    const courseId = req.params.id;
    // Support both old and new field names
    const {
      title, courseTitle,
      description, courseDescription,
      price, coursePrice,
      level, courseCategory,
      skills,
      previewVideoUrl,
      isPublished,
      durationHours,
      existingImageUrl
    } = req.body;

    // Normalize values
    const finalTitle = title || courseTitle;
    const finalDescription = description || courseDescription;
    const finalPrice = price || coursePrice;
    const finalLevel = level || courseCategory;

    if (!finalTitle || !finalDescription || !finalPrice || !durationHours || !finalLevel) {
      return res.json({ success: false, message: 'All fields are required' });
    }

    let imageUrl = existingImageUrl || '';

    // Upload new image to Cloudinary if provided
    if (req.file) {
      try {
        // Convert buffer to base64 data URI for Cloudinary
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64Image, {
          folder: 'devacademy/courses',
          resource_type: 'image'
        });
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.json({ success: false, message: 'Failed to upload image. Please try again.' });
      }
    }

    if (!imageUrl) {
      return res.json({ success: false, message: 'Course image is required' });
    }

    let etat;
    if (isPublished === 'draft' || isPublished === 'false' || isPublished === false) {
      etat = false;
    } else {
      etat = true;
    }

    const sql = `
      UPDATE courses 
      SET title = ?, description = ?, price = ?, duration_hours = ?,
          thumbnail_url = ?, preview_video_url = ?, is_published = ?, level = ?, skills = ?
      WHERE course_id = ?
    `;

    conn.query(sql, [
      finalTitle, finalDescription,
      finalPrice, durationHours,
      imageUrl, previewVideoUrl || '', etat, finalLevel || '', skills || '', courseId
    ], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.json({ success: false, message: 'Server Error' });
      }
      res.json({ success: true, message: 'Course updated successfully!' });
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.json({ success: false, message: 'Server Error' });
  }
});

// API: Remove course from client
router.post('/api/clients/remove-course', (req, res) => {
  const { clientId, courseId } = req.body;

  if (!clientId || !courseId) {
    return res.json({ success: false, message: 'Client ID and Course ID are required' });
  }

  // Delete purchase record
  const deleteSql = 'DELETE FROM purchases WHERE client_id = ? AND course_id = ?';
  conn.query(deleteSql, [clientId, courseId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    // Also delete progress for this course
    const deleteProgressSql = `
      DELETE pr FROM progress pr
      INNER JOIN lessons l ON pr.lesson_id = l.lesson_id
      INNER JOIN chapters ch ON l.chapitre_id = ch.id
      WHERE pr.client_id = ? AND ch.course_id = ?
    `;
    conn.query(deleteProgressSql, [clientId, courseId], (err) => {
      if (err) {
        console.error('Error deleting progress:', err);
      }
      res.json({ success: true, message: 'Course removed from client successfully' });
    });
  });
});

// API: Delete client
router.delete('/api/clients/:clientId', (req, res) => {
  const clientId = req.params.clientId;
  const sql = 'DELETE FROM client WHERE id = ?';
  conn.query(sql, [clientId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Client not found' });
    }

    res.json({ success: true, message: 'Client deleted successfully' });
  });
});

// API: Get all purchases
router.get('/api/purchases', (req, res) => {
  const sql = `
    SELECT p.id, p.client_id, p.course_id, p.purchase_date, p.paid,
           c.fullname as client_name, co.title as course_title, co.price
    FROM purchases p
    LEFT JOIN client c ON p.client_id = c.id
    LEFT JOIN courses co ON p.course_id = co.course_id
    ORDER BY p.purchase_date DESC
  `;
  conn.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, purchases: result });
  });
});

// API: Toggle purchase payment status
router.put('/api/purchases/:id/toggle-status', (req, res) => {
  const purchaseId = req.params.id;
  const { paid } = req.body;

  const sql = 'UPDATE purchases SET paid = ? WHERE id = ?';
  conn.query(sql, [paid, purchaseId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, message: 'Status updated successfully' });
  });
});

// API: Delete purchase
router.delete('/api/purchases/:id', (req, res) => {
  const purchaseId = req.params.id;

  const sql = 'DELETE FROM purchases WHERE id = ?';
  conn.query(sql, [purchaseId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, message: 'Purchase deleted successfully' });
  });
});


// API: Get dashboard statistics
router.get('/api/stats', (req, res) => {
  const stats = {};

  // Get total users
  conn.query('SELECT COUNT(*) as count FROM client', (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    stats.totalUsers = result[0].count;

    // Get total courses
    conn.query('SELECT COUNT(*) as count FROM courses', (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      stats.totalCourses = result[0].count;

      // Get total purchases
      conn.query('SELECT COUNT(*) as count FROM purchases', (err, result) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        stats.totalPurchases = result[0].count;

        // Get total revenue
        conn.query(`
          SELECT SUM(CAST(co.price AS DECIMAL(10,2))) as total
          FROM purchases p
          LEFT JOIN courses co ON p.course_id = co.course_id
          WHERE p.paid = 1
        `, (err, result) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
          }
          stats.totalRevenue = result[0].total || 0;

          // Get today's purchases
          conn.query(`
            SELECT COUNT(*) as count FROM purchases 
            WHERE DATE(purchase_date) = CURDATE()
          `, (err, result) => {
            if (err) {
              return res.status(500).json({ success: false, message: 'Server error' });
            }
            stats.todayPurchases = result[0].count;

            res.json({ success: true, stats });
          });
        });
      });
    });
  });
});

// API: Get course with chapters and lessons count
router.get('/api/courses/:courseId/stats', (req, res) => {
  const courseId = req.params.courseId;

  // Get chapters count
  conn.query('SELECT COUNT(*) as count FROM chapters WHERE course_id = ?', [courseId], (err, chapterResult) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    const chaptersCount = chapterResult[0].count;

    // Get lessons count
    conn.query(`
      SELECT COUNT(*) as count 
      FROM lessons l
      INNER JOIN chapters ch ON l.chapitre_id = ch.id
      WHERE ch.course_id = ?
    `, [courseId], (err, lessonResult) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      const lessonsCount = lessonResult[0].count;

      res.json({
        success: true,
        stats: {
          chaptersCount,
          lessonsCount
        }
      });
    });
  });
});

// API: Get all certificates
router.get('/api/certificates', (req, res) => {
  const sql = `
    SELECT c.*, cl.fullname as client_name, cl.email as client_email, 
           co.title as course_title, co.level as course_category
    FROM certificates c
    INNER JOIN client cl ON c.client_id = cl.id
    INNER JOIN courses co ON c.course_id = co.course_id
    ORDER BY c.date_issued DESC
  `;

  conn.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, certificates: result });
  });
});

// API: Manually issue certificate to a client
router.post('/api/certificates/issue', (req, res) => {
  const { clientId, courseId } = req.body;

  if (!clientId || !courseId) {
    return res.json({ success: false, message: 'Client ID and Course ID are required' });
  }

  // Check if certificate already exists
  const checkSql = 'SELECT * FROM certificates WHERE client_id = ? AND course_id = ?';
  conn.query(checkSql, [clientId, courseId], (err, existing) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (existing.length > 0) {
      return res.json({ success: false, message: 'Certificate already exists for this client and course' });
    }

    // Insert new certificate
    const certificateUrl = `/course/certificate/${clientId}/${courseId}`;
    const insertSql = 'INSERT INTO certificates (client_id, course_id, date_issued, certificate_url) VALUES (?, ?, ?, ?)';
    conn.query(insertSql, [clientId, courseId, new Date(), certificateUrl], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      res.json({ success: true, message: 'Certificate issued successfully' });
    });
  });
});

// API: Delete certificate
router.delete('/api/certificates/:id', (req, res) => {
  const certId = req.params.id;

  const deleteSql = 'DELETE FROM certificates WHERE id = ?';
  conn.query(deleteSql, [certId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Certificate not found' });
    }

    res.json({ success: true, message: 'Certificate deleted successfully' });
  });
});

// ======== Quizzes Management APIs ========
// Get distinct languages
router.get('/api/quizzes/languages', (req, res) => {
  const sql = 'SELECT DISTINCT language FROM quizzes ORDER BY language ASC';
  conn.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' });
    res.json({ success: true, languages: rows.map(r => r.language) });
  });
});

// List questions, optionally filtered by language
router.get('/api/quizzes', (req, res) => {
  const { language } = req.query;
  let sql = 'SELECT id, language, question, option_a, option_b, option_c, option_d, correct_option, created_at FROM quizzes';
  const params = [];
  if (language) {
    sql += ' WHERE language = ?';
    params.push(language);
  }
  sql += ' ORDER BY id DESC';
  conn.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' });
    res.json({ success: true, quizzes: rows });
  });
});

// Create a quiz question
router.post('/api/quizzes', (req, res) => {
  const { language, question, option_a, option_b, option_c, option_d, correct_option } = req.body;
  if (!language || !question || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return res.json({ success: false, message: 'All fields are required' });
  }
  if (!['A', 'B', 'C', 'D'].includes(correct_option)) {
    return res.json({ success: false, message: 'correct_option must be one of A,B,C,D' });
  }
  const sql = `INSERT INTO quizzes (language, question, option_a, option_b, option_c, option_d, correct_option) VALUES (?,?,?,?,?,?,?)`;
  conn.query(sql, [language.trim(), question.trim(), option_a.trim(), option_b.trim(), option_c.trim(), option_d.trim(), correct_option], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' });
    res.json({ success: true, message: 'Question created' });
  });
});

// Delete a quiz question
router.delete('/api/quizzes/:id', (req, res) => {
  const id = req.params.id;
  conn.query('DELETE FROM quizzes WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' });
    if (result.affectedRows === 0) return res.json({ success: false, message: 'Question not found' });
    res.json({ success: true, message: 'Question deleted' });
  });
});

// Bulk import quiz questions
router.post('/api/quizzes/bulk', (req, res) => {
  const { quizzes } = req.body;

  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    return res.json({ success: false, message: 'Quizzes array is required' });
  }

  // Validate all quizzes
  const validQuizzes = [];
  for (let i = 0; i < quizzes.length; i++) {
    const quiz = quizzes[i];
    if (!quiz.language || !quiz.question || !quiz.option_a || !quiz.option_b ||
      !quiz.option_c || !quiz.option_d || !quiz.correct_option) {
      return res.json({ success: false, message: `Quiz ${i + 1} is missing required fields` });
    }
    validQuizzes.push([
      quiz.language,
      quiz.question,
      quiz.option_a,
      quiz.option_b,
      quiz.option_c,
      quiz.option_d,
      quiz.correct_option.toUpperCase()
    ]);
  }

  const sql = `INSERT INTO quizzes (language, question, option_a, option_b, option_c, option_d, correct_option) VALUES ?`;

  conn.query(sql, [validQuizzes], (err, result) => {
    if (err) {
      console.error('Bulk insert error:', err);
      return res.status(500).json({ success: false, message: 'Server error while importing' });
    }
    res.json({ success: true, message: `Successfully imported ${result.affectedRows} question(s)` });
  });
});


// ======== Free/Paid Status Management ========
// Toggle course free status
router.put('/api/courses/:courseId/toggle-free', (req, res) => {
  const courseId = req.params.courseId;
  const { isFree } = req.body;

  if (typeof isFree !== 'boolean' && isFree !== 0 && isFree !== 1) {
    return res.json({ success: false, message: 'isFree must be a boolean or 0/1' });
  }

  const freeValue = isFree ? 1 : 0;

  // Update course
  const updateCourseSql = 'UPDATE courses SET is_free = ? WHERE course_id = ?';
  conn.query(updateCourseSql, [freeValue, courseId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Course not found' });
    }

    // If course is set to free, cascade to all chapters and lessons
    if (freeValue === 1) {
      // Update all chapters of this course
      const updateChaptersSql = 'UPDATE chapters SET is_free = 1 WHERE course_id = ?';
      conn.query(updateChaptersSql, [courseId], (err) => {
        if (err) console.error('Error updating chapters:', err);

        // Update all lessons of chapters in this course
        const updateLessonsSql = `
          UPDATE lessons l
          INNER JOIN chapters ch ON l.chapitre_id = ch.id
          SET l.is_free = 1
          WHERE ch.course_id = ?
        `;
        conn.query(updateLessonsSql, [courseId], (err) => {
          if (err) console.error('Error updating lessons:', err);
          res.json({ success: true, message: 'Course and all its content set to free' });
        });
      });
    } else {
      res.json({ success: true, message: 'Course free status updated' });
    }
  });
});

// Toggle chapter free status
router.put('/api/chapters/:chapterId/toggle-free', (req, res) => {
  const chapterId = req.params.chapterId;
  const { isFree } = req.body;

  if (typeof isFree !== 'boolean' && isFree !== 0 && isFree !== 1) {
    return res.json({ success: false, message: 'isFree must be a boolean or 0/1' });
  }

  const freeValue = isFree ? 1 : 0;

  // Get chapter to check course free status
  const getChapterSql = 'SELECT ch.*, c.is_free as course_is_free FROM chapters ch INNER JOIN courses c ON ch.course_id = c.course_id WHERE ch.id = ?';
  conn.query(getChapterSql, [chapterId], (err, chapters) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }

    if (chapters.length === 0) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }

    const chapter = chapters[0];

    // If course is free, chapter must be free
    if (chapter.course_is_free === 1 && freeValue === 0) {
      return res.json({ success: false, message: 'Cannot make chapter paid when course is free' });
    }

    // Update chapter
    const updateChapterSql = 'UPDATE chapters SET is_free = ? WHERE id = ?';
    conn.query(updateChapterSql, [freeValue, chapterId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      // If chapter is set to free, cascade to all its lessons
      if (freeValue === 1) {
        const updateLessonsSql = 'UPDATE lessons SET is_free = 1 WHERE chapitre_id = ?';
        conn.query(updateLessonsSql, [chapterId], (err) => {
          if (err) console.error('Error updating lessons:', err);
          res.json({ success: true, message: 'Chapter and all its lessons set to free' });
        });
      } else {
        res.json({ success: true, message: 'Chapter free status updated' });
      }
    });
  });
});

// Toggle lesson free status
router.put('/api/lessons/:lessonId/toggle-free', (req, res) => {
  const lessonId = req.params.lessonId;
  const { isFree } = req.body;

  if (typeof isFree !== 'boolean' && isFree !== 0 && isFree !== 1) {
    return res.json({ success: false, message: 'isFree must be a boolean or 0/1' });
  }

  const freeValue = isFree ? 1 : 0;

  // Get lesson to check chapter and course free status
  const getLessonSql = `
    SELECT l.*, ch.is_free as chapter_is_free, c.is_free as course_is_free 
    FROM lessons l
    INNER JOIN chapters ch ON l.chapitre_id = ch.id
    INNER JOIN courses c ON ch.course_id = c.course_id
    WHERE l.lesson_id = ?
  `;
  conn.query(getLessonSql, [lessonId], (err, lessons) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }

    if (lessons.length === 0) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const lesson = lessons[0];

    // If chapter or course is free, lesson must be free
    if ((lesson.chapter_is_free === 1 || lesson.course_is_free === 1) && freeValue === 0) {
      return res.json({ success: false, message: 'Cannot make lesson paid when chapter or course is free' });
    }

    // Update lesson
    const updateLessonSql = 'UPDATE lessons SET is_free = ? WHERE lesson_id = ?';
    conn.query(updateLessonSql, [freeValue, lessonId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      res.json({ success: true, message: 'Lesson free status updated' });
    });
  });
});

// ============================================
// AD CAMPAIGNS API ENDPOINTS
// ============================================

// API: Get all ad campaigns
router.get('/api/ad-campaigns', (req, res) => {
  const sql = `
    SELECT * FROM ad_campaigns 
    ORDER BY start_date DESC
  `;
  conn.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, campaigns: result });
  });
});

// API: Add new ad campaign
router.post('/api/ad-campaigns', (req, res) => {
  const { name, spend, startDate, endDate, notes } = req.body;

  if (!name || !spend || !startDate) {
    return res.json({ success: false, message: 'Campaign name, spend, and start date are required' });
  }

  if (parseFloat(spend) < 0) {
    return res.json({ success: false, message: 'Spend amount cannot be negative' });
  }

  const sql = `
    INSERT INTO ad_campaigns (campaign_name, spend_amount, start_date, end_date, notes)
    VALUES (?, ?, ?, ?, ?)
  `;

  conn.query(sql, [name, spend, startDate, endDate || null, notes || ''], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, message: 'Ad campaign added successfully', campaignId: result.insertId });
  });
});

// API: Update ad campaign
router.put('/api/ad-campaigns/:id', (req, res) => {
  const campaignId = req.params.id;
  const { name, spend, startDate, endDate, notes } = req.body;

  if (!name || !spend || !startDate) {
    return res.json({ success: false, message: 'Campaign name, spend, and start date are required' });
  }

  if (parseFloat(spend) < 0) {
    return res.json({ success: false, message: 'Spend amount cannot be negative' });
  }

  const sql = `
    UPDATE ad_campaigns 
    SET campaign_name = ?, spend_amount = ?, start_date = ?, end_date = ?, notes = ?
    WHERE id = ?
  `;

  conn.query(sql, [name, spend, startDate, endDate || null, notes || '', campaignId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Ad campaign updated successfully' });
  });
});

// API: Delete ad campaign
router.delete('/api/ad-campaigns/:id', (req, res) => {
  const campaignId = req.params.id;
  const sql = 'DELETE FROM ad_campaigns WHERE id = ?';

  conn.query(sql, [campaignId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Ad campaign deleted successfully' });
  });
});

// API: Get total ad spend
router.get('/api/ad-campaigns/total-spend', (req, res) => {
  const sql = 'SELECT SUM(spend_amount) as total_spend FROM ad_campaigns';

  conn.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, totalSpend: result[0].total_spend || 0 });
  });
});

// API: Get monthly ad spend breakdown
router.get('/api/ad-campaigns/monthly-breakdown', (req, res) => {
  const sql = `
    SELECT 
      DATE_FORMAT(start_date, '%Y-%m') as month,
      SUM(spend_amount) as total_spend,
      COUNT(*) as campaign_count
    FROM ad_campaigns
    GROUP BY DATE_FORMAT(start_date, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
  `;

  conn.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, monthlyBreakdown: result });
  });
});

// ==========================================
// Interactive Learning ADMIN Routes
// ==========================================

// Get all interactive paths
router.get('/api/interactive/paths', (req, res) => {
  const sql = 'SELECT * FROM learning_paths ORDER BY created_at DESC';
  conn.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, paths: result });
  });
});

// Get single Learning Path
router.get('/api/interactive/paths/:pathId', (req, res) => {
  const pathId = req.params.pathId;
  const sql = 'SELECT * FROM learning_paths WHERE id = ?';
  conn.query(sql, [pathId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (result.length === 0) {
      return res.json({ success: false, message: 'Path not found' });
    }
    res.json({ success: true, path: result[0] });
  });
});

// Create new Learning Path
router.post('/api/interactive/paths', (req, res) => {
  const { title, description, language } = req.body;

  if (!title || !language) {
    return res.json({ success: false, message: 'Title and Language are required' });
  }

  const sql = 'INSERT INTO learning_paths (title, description, programming_language) VALUES (?, ?, ?)';
  conn.query(sql, [title, description || '', language], (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: 'Database error: ' + err.message });
    }
    res.json({ success: true, message: 'Roadmap created successfully', pathId: result.insertId });
  });
});

// Update Learning Path
router.put('/api/interactive/paths/:pathId', (req, res) => {
  const pathId = req.params.pathId;
  const { title, description, language } = req.body;

  if (!title || !language) {
    return res.json({ success: false, message: 'Title and Language are required' });
  }

  const sql = 'UPDATE learning_paths SET title = ?, description = ?, programming_language = ? WHERE id = ?';
  conn.query(sql, [title, description || '', language, pathId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }
    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Path not found' });
    }
    res.json({ success: true, message: 'Roadmap updated successfully' });
  });
});

// Delete Learning Path
router.delete('/api/interactive/paths/:pathId', (req, res) => {
  const pathId = req.params.pathId;

  // First, delete all lessons linked to this path
  const deletePathLessonsSql = 'DELETE FROM path_lessons WHERE path_id = ?';
  conn.query(deletePathLessonsSql, [pathId], (err) => {
    if (err) {
      console.error('Error deleting path lessons:', err);
      return res.status(500).json({ success: false, message: 'Error deleting path lessons' });
    }

    // Then delete the path itself
    const deletePathSql = 'DELETE FROM learning_paths WHERE id = ?';
    conn.query(deletePathSql, [pathId], (err, result) => {
      if (err) {
        console.error('Error deleting path:', err);
        return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
      }
      if (result.affectedRows === 0) {
        return res.json({ success: false, message: 'Path not found' });
      }
      res.json({ success: true, message: 'Roadmap deleted successfully' });
    });
  });
});

// Get lessons for a path
router.get('/api/interactive/paths/:pathId/lessons', (req, res) => {
  const pathId = req.params.pathId;
  const sql = `
        SELECT l.*, pl.order_number 
        FROM path_lessons pl
        JOIN lessons l ON pl.lesson_id = l.lesson_id
        WHERE pl.path_id = ?
        ORDER BY pl.order_number ASC
    `;
  conn.query(sql, [pathId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, lessons: result });
  });
});

// Create Interactive Lesson
router.post('/api/interactive/lesson', (req, res) => {
  const {
    pathId,
    title,
    description, // code_challenge
    starterCode,
    solutionCode,
    expectedOutput,
    validationType, // regex_match, output_match, etc.
    hints, // Array of strings or JSON string
    language,
    orderNumber,
    isFree,
    theoryContent,
    displayOutput,
    testCases
  } = req.body;

  if (!title || !pathId) {
    return res.json({ success: false, message: 'Title and Path are required' });
  }

  // Default chapter ID (assuming 1 exists as catch-all)
  const chapitreId = 1;

  const serializeHints = (value) => {
    let hintsJson = '[]';
    try {
      if (Array.isArray(value)) {
        hintsJson = JSON.stringify(value.filter(h => typeof h === 'string' && h.trim()).map(h => h.trim()));
      } else if (typeof value === 'string') {
        if (value.trim().startsWith('[')) {
          hintsJson = value;
        } else {
          hintsJson = JSON.stringify(value.split('\n').map(h => h.trim()).filter(Boolean));
        }
      }
    } catch (e) {
      hintsJson = '[]';
    }
    return hintsJson;
  };

  const serializeTestCases = (value) => {
    let testCasesJson = '[]';
    try {
      if (Array.isArray(value)) {
        const cleaned = value
          .map(tc => ({
            input: (tc?.input || '').toString(),
            output: (tc?.output || '').toString()
          }))
          .filter(tc => tc.input.trim() || tc.output.trim());
        testCasesJson = JSON.stringify(cleaned);
      } else if (typeof value === 'string' && value.trim()) {
        testCasesJson = value.trim().startsWith('[') ? value : '[]';
      }
    } catch (e) {
      testCasesJson = '[]';
    }
    return testCasesJson;
  };

  const hintsJson = serializeHints(hints);
  const testCasesJson = serializeTestCases(testCases);

  const isFreeValue = (isFree === true || isFree === 'true' || isFree === 1) ? 1 : 0;

  const insertLessonSql = `
        INSERT INTO lessons (
            chapitre_id, title, lesson_type, content_type, 
            code_challenge, starter_code, solution_code, 
            expected_output, validation_type, hints, 
            programming_language, created_at, text_content, duration_minutes, order_number, is_free, content_url,
            display_output, test_cases
        ) VALUES (?, ?, 'interactive_code', 'text', ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 15, ?, ?, '', ?, ?)
    `;

  conn.query(insertLessonSql, [
    chapitreId, title, description, starterCode, solutionCode,
    expectedOutput, validationType || 'output_match', hintsJson,
    language || 'javascript', theoryContent || '', orderNumber || 0, isFreeValue,
    displayOutput || '', testCasesJson
  ], (err, result) => {
    if (err) {
      console.error('Error inserting lesson:', err);
      return res.status(500).json({ success: false, message: 'Error creating lesson: ' + err.message });
    }

    const lessonId = result.insertId;

    // Link to Path
    const linkSql = 'INSERT INTO path_lessons (path_id, lesson_id, order_number) VALUES (?, ?, ?)';
    conn.query(linkSql, [pathId, lessonId, orderNumber || 0], (err) => {
      if (err) {
        console.error('Error linking path:', err);
        return res.status(500).json({ success: false, message: 'Lesson created but failed to link into path' });
      }
      res.json({ success: true, message: 'Lesson created successfully', lessonId });
    });
  });
});

// Get single Interactive Lesson
router.get('/api/interactive/lesson/:lessonId', (req, res) => {
  const lessonId = req.params.lessonId;
  const sql = 'SELECT * FROM lessons WHERE lesson_id = ? AND lesson_type = "interactive_code"';
  conn.query(sql, [lessonId], (err, result) => {
    if (err) {
      console.error('Error fetching lesson:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (result.length === 0) {
      return res.json({ success: false, message: 'Lesson not found' });
    }

    // Parse hints if it's a JSON string
    const lesson = result[0];
    if (lesson.hints && typeof lesson.hints === 'string') {
      try {
        lesson.hints = JSON.parse(lesson.hints);
      } catch (e) {
        lesson.hints = [];
      }
    }

    if (lesson.test_cases && typeof lesson.test_cases === 'string') {
      try {
        lesson.test_cases = JSON.parse(lesson.test_cases);
      } catch (e) {
        lesson.test_cases = [];
      }
    }

    res.json({ success: true, lesson });
  });
});

// Update Interactive Lesson
router.put('/api/interactive/lesson/:lessonId', (req, res) => {
  const lessonId = req.params.lessonId;
  const {
    title,
    description,
    starterCode,
    solutionCode,
    expectedOutput,
    validationType,
    hints,
    orderNumber,
    isFree,
    theoryContent,
    displayOutput,
    testCases
  } = req.body;

  if (!title) {
    return res.json({ success: false, message: 'Title is required' });
  }

  const serializeHints = (value) => {
    let hintsJson = '[]';
    try {
      if (Array.isArray(value)) {
        hintsJson = JSON.stringify(value.filter(h => typeof h === 'string' && h.trim()).map(h => h.trim()));
      } else if (typeof value === 'string') {
        if (value.trim().startsWith('[')) {
          hintsJson = value;
        } else {
          hintsJson = JSON.stringify(value.split('\n').map(h => h.trim()).filter(Boolean));
        }
      }
    } catch (e) {
      hintsJson = '[]';
    }
    return hintsJson;
  };

  const serializeTestCases = (value) => {
    let testCasesJson = '[]';
    try {
      if (Array.isArray(value)) {
        const cleaned = value
          .map(tc => ({
            input: (tc?.input || '').toString(),
            output: (tc?.output || '').toString()
          }))
          .filter(tc => tc.input.trim() || tc.output.trim());
        testCasesJson = JSON.stringify(cleaned);
      } else if (typeof value === 'string' && value.trim()) {
        testCasesJson = value.trim().startsWith('[') ? value : '[]';
      }
    } catch (e) {
      testCasesJson = '[]';
    }
    return testCasesJson;
  };

  const hintsJson = serializeHints(hints);
  const testCasesJson = serializeTestCases(testCases);

  const isFreeValue = (isFree === true || isFree === 'true' || isFree === 1) ? 1 : 0;

  const updateSql = `
    UPDATE lessons SET 
      title = ?,
      code_challenge = ?,
      starter_code = ?,
      solution_code = ?,
      expected_output = ?,
      validation_type = ?,
      hints = ?,
      order_number = ?,
      is_free = ?,
      text_content = ?,
      display_output = ?,
      test_cases = ?
    WHERE lesson_id = ? AND lesson_type = 'interactive_code'
  `;

  conn.query(updateSql, [
    title,
    description || '',
    starterCode || '',
    solutionCode || '',
    expectedOutput || '',
    validationType || 'output_match',
    hintsJson,
    orderNumber || 0,
    isFreeValue,
    theoryContent || '',
    displayOutput || '',
    testCasesJson,
    lessonId
  ], (err, result) => {
    if (err) {
      console.error('Error updating lesson:', err);
      return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }
    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Lesson not found' });
    }

    // Also update order_number in path_lessons if orderNumber changed
    if (orderNumber !== undefined) {
      const updatePathLessonSql = 'UPDATE path_lessons SET order_number = ? WHERE lesson_id = ?';
      conn.query(updatePathLessonSql, [orderNumber, lessonId], (err2) => {
        if (err2) console.error('Error updating path_lessons order:', err2);
      });
    }

    res.json({ success: true, message: 'Lesson updated successfully' });
  });
});

// Duplicate Interactive Lesson
router.post('/api/interactive/lesson/:lessonId/duplicate', (req, res) => {
  const lessonId = req.params.lessonId;

  // Get the original lesson
  const getLessonSql = 'SELECT * FROM lessons WHERE lesson_id = ? AND lesson_type = "interactive_code"';
  conn.query(getLessonSql, [lessonId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ success: false, message: 'Lesson not found' });
    }

    const originalLesson = result[0];

    // Get path_id from path_lessons
    const getPathSql = 'SELECT path_id, order_number FROM path_lessons WHERE lesson_id = ?';
    conn.query(getPathSql, [lessonId], (err2, pathResult) => {
      if (err2 || pathResult.length === 0) {
        return res.status(500).json({ success: false, message: 'Path not found for this lesson' });
      }

      const { path_id, order_number } = pathResult[0];
      const chapitreId = originalLesson.chapitre_id || 1;

      // Insert duplicated lesson
      const insertLessonSql = `
        INSERT INTO lessons (
          chapitre_id, title, lesson_type, content_type, 
          code_challenge, starter_code, solution_code, 
          expected_output, validation_type, hints, 
          programming_language, created_at, text_content, duration_minutes, order_number, is_free, content_url
        ) VALUES (?, ?, 'interactive_code', 'text', ?, ?, ?, ?, ?, ?, ?, NOW(), '', 15, ?, ?, ?)
      `;

      const newTitle = originalLesson.title + ' (Copy)';
      const newOrderNumber = (order_number || 0) + 1;

      conn.query(insertLessonSql, [
        chapitreId,
        newTitle,
        originalLesson.code_challenge || '',
        originalLesson.starter_code || '',
        originalLesson.solution_code || '',
        originalLesson.expected_output || '',
        originalLesson.validation_type || 'output_match',
        originalLesson.hints || '[]',
        originalLesson.programming_language || 'javascript',
        newOrderNumber,
        originalLesson.is_free || 0,
        originalLesson.content_url || ''
      ], (err3, insertResult) => {
        if (err3) {
          console.error('Error duplicating lesson:', err3);
          return res.status(500).json({ success: false, message: 'Error duplicating lesson' });
        }

        const newLessonId = insertResult.insertId;

        // Link to path
        const linkSql = 'INSERT INTO path_lessons (path_id, lesson_id, order_number) VALUES (?, ?, ?)';
        conn.query(linkSql, [path_id, newLessonId, newOrderNumber], (err4) => {
          if (err4) {
            console.error('Error linking duplicated lesson:', err4);
            return res.status(500).json({ success: false, message: 'Lesson duplicated but failed to link to path' });
          }
          res.json({ success: true, message: 'Lesson duplicated successfully', lessonId: newLessonId });
        });
      });
    });
  });
});

// Delete Interactive Lesson
router.delete('/api/interactive/lesson/:lessonId', (req, res) => {
  const lessonId = req.params.lessonId;

  // First delete from path_lessons junction table
  const deletePathLessonSql = 'DELETE FROM path_lessons WHERE lesson_id = ?';
  conn.query(deletePathLessonSql, [lessonId], (err) => {
    if (err) {
      console.error('Error deleting from path_lessons:', err);
      return res.status(500).json({ success: false, message: 'Error deleting lesson link' });
    }

    // Then delete the lesson itself
    const deleteLessonSql = 'DELETE FROM lessons WHERE lesson_id = ?';
    conn.query(deleteLessonSql, [lessonId], (err2, result) => {
      if (err2) {
        console.error('Error deleting lesson:', err2);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      if (result.affectedRows === 0) {
        return res.json({ success: false, message: 'Lesson not found' });
      }
      res.json({ success: true, message: 'Lesson deleted successfully' });
    });
  });
});

// Bulk Delete Interactive Lessons
router.delete('/api/interactive/lessons/bulk', (req, res) => {
  const { lessonIds } = req.body;

  if (!lessonIds || !Array.isArray(lessonIds) || lessonIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No lessons selected' });
  }

  // Create placeholders for SQL IN clause
  const placeholders = lessonIds.map(() => '?').join(',');

  // First delete from path_lessons junction table
  const deletePathLessonsSql = `DELETE FROM path_lessons WHERE lesson_id IN (${placeholders})`;
  conn.query(deletePathLessonsSql, lessonIds, (err1) => {
    if (err1) {
      console.error('Error deleting path_lessons:', err1);
      return res.status(500).json({ success: false, message: 'Error deleting lesson links' });
    }

    // Then delete the lessons themselves
    const sql = `DELETE FROM lessons WHERE lesson_id IN (${placeholders})`;
    conn.query(sql, lessonIds, (err, result) => {
      if (err) {
        console.error('Error bulk deleting lessons:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      res.json({
        success: true,
        message: `${result.affectedRows} lesson(s) deleted successfully`,
        deletedCount: result.affectedRows
      });
    });
  });
});

// Toggle Learning Path Required Tier
router.put('/api/interactive/paths/:pathId/toggle-tier', (req, res) => {
  const pathId = req.params.pathId;
  const { requiredTier } = req.body;

  // Validate tier
  const validTiers = ['Free', 'Pro', 'VIP'];
  if (!validTiers.includes(requiredTier)) {
    return res.json({ success: false, message: 'Invalid tier. Must be Free, Pro, or VIP' });
  }

  const sql = 'UPDATE learning_paths SET required_tier = ? WHERE id = ?';
  conn.query(sql, [requiredTier, pathId], (err, result) => {
    if (err) {
      console.error('Error updating path tier:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Path not found' });
    }

    res.json({
      success: true,
      message: `Roadmap tier updated to ${requiredTier}`,
      requiredTier
    });
  });
});

// Toggle Individual Lesson Free Status (Quick Toggle)
router.put('/api/interactive/lesson/:lessonId/toggle-free', (req, res) => {
  const lessonId = req.params.lessonId;
  const { isFree } = req.body;

  const isFreeValue = (isFree === true || isFree === 'true' || isFree === 1) ? 1 : 0;

  const sql = 'UPDATE lessons SET is_free = ? WHERE lesson_id = ?';
  conn.query(sql, [isFreeValue, lessonId], (err, result) => {
    if (err) {
      console.error('Error updating lesson free status:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Lesson not found' });
    }

    res.json({
      success: true,
      message: `Lesson ${isFreeValue ? 'set to free' : 'set to paid'}`,
      isFree: isFreeValue
    });
  });
});

// YouTube OAuth and Upload Endpoints

// Get YouTube OAuth URL
router.get('/youtube/auth-url', (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Debug logging
    console.log('YouTube Service:', typeof youtubeService);
    if (youtubeService) {
      console.log('Available functions:', Object.keys(youtubeService));
    }

    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
      return res.json({
        success: false,
        message: 'YouTube API credentials not configured. Please set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in your .env file.'
      });
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/admin/youtube/callback`;

    if (typeof youtubeService.getAuthUrl !== 'function') {
      console.error('youtubeService.getAuthUrl is not a function. Current keys:', Object.keys(youtubeService));
      throw new Error('youtubeService.getAuthUrl is not a function. Please restart the server.');
    }

    const authUrl = youtubeService.getAuthUrl(redirectUri);
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.json({ success: false, message: 'Failed to generate auth URL: ' + error.message });
  }
});

// YouTube OAuth callback (Admin only - stores tokens in database)
router.get('/youtube/callback', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { code } = req.query;
  if (!code) {
    return res.redirect('/admin?error=youtube_auth_failed');
  }

  try {
    const redirectUri = `${req.protocol}://${req.get('host')}/admin/youtube/callback`;
    const tokens = await youtubeService.getTokensFromCode(code, redirectUri);

    // Calculate expiry date (tokens typically expire in 1 hour)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    // Store tokens in database (replace any existing tokens)
    const deleteSql = 'DELETE FROM youtube_tokens';
    conn.query(deleteSql, async (err) => {
      if (err) {
        console.error('Error deleting old tokens:', err);
      }

      const insertSql = `
        INSERT INTO youtube_tokens (access_token, refresh_token, expiry_date) 
        VALUES (?, ?, ?)
      `;
      conn.query(insertSql, [tokens.access_token, tokens.refresh_token, expiryDate], (err) => {
        if (err) {
          console.error('Error storing tokens:', err);
          return res.redirect('/admin?error=youtube_auth_failed');
        }

        // Also store in session for immediate use
        req.session.youtubeTokens = tokens;
        res.redirect('/admin?youtube_auth=success');
      });
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.redirect('/admin?error=youtube_auth_failed');
  }
});

// Upload video to YouTube (Uses admin's stored credentials - works for any authenticated user)
router.post('/youtube/upload', uploadVideo.single('video'), async (req, res) => {
  // Allow any authenticated user to upload (video goes to admin's YouTube channel)
  if (!req.session.user) {
    return res.json({ success: false, message: 'Unauthorized' });
  }

  if (!req.file) {
    return res.json({ success: false, message: 'No video file provided' });
  }

  const { title, description } = req.body;

  try {
    // Get tokens from database (admin's credentials)
    const getTokensSql = 'SELECT * FROM youtube_tokens ORDER BY id DESC LIMIT 1';
    conn.query(getTokensSql, async (err, results) => {
      if (err) {
        console.error('Error fetching tokens:', err);
        return res.json({
          success: false,
          message: 'Database error',
          needsAuth: true
        });
      }

      if (!results || results.length === 0) {
        return res.json({
          success: false,
          message: 'Video upload service is not configured. Please contact administrator.',
          needsAuth: true
        });
      }

      const tokenData = results[0];
      let accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;
      const expiryDate = new Date(tokenData.expiry_date);

      // Check if token is expired or about to expire (within 5 minutes)
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiryDate < fiveMinutesFromNow && refreshToken) {
        try {
          // Refresh the token
          accessToken = await youtubeService.refreshAccessToken(refreshToken);

          // Update token in database
          const newExpiryDate = new Date();
          newExpiryDate.setHours(newExpiryDate.getHours() + 1);
          const updateSql = 'UPDATE youtube_tokens SET access_token = ?, expiry_date = ? WHERE id = ?';
          conn.query(updateSql, [accessToken, newExpiryDate, tokenData.id], (err) => {
            if (err) {
              console.error('Error updating token:', err);
            }
          });
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          return res.json({
            success: false,
            message: 'Video upload service unavailable. Please contact administrator.',
            needsAuth: true
          });
        }
      }

      // Upload video to YouTube using admin's credentials
      try {
        const result = await youtubeService.uploadVideoToYouTube(
          req.file.buffer,
          title || 'Untitled Video',
          description || '',
          accessToken
        );

        res.json({
          success: true,
          videoUrl: result.embedUrl,
          videoId: result.videoId,
          watchUrl: result.watchUrl,
          message: 'Video uploaded successfully to YouTube as unlisted'
        });
      } catch (uploadError) {
        console.error('YouTube upload error:', uploadError);

        // Check if it's an auth error
        if (uploadError.message && (uploadError.message.includes('Invalid Credentials') || uploadError.message.includes('401'))) {
          return res.json({
            success: false,
            message: 'Video upload service unavailable. Please contact administrator.',
            needsAuth: true
          });
        }

        res.json({
          success: false,
          message: uploadError.message || 'Failed to upload video to YouTube'
        });
      }
    });
  } catch (error) {
    console.error('YouTube upload error:', error);
    res.json({
      success: false,
      message: error.message || 'Failed to upload video to YouTube'
    });
  }
});

// Check YouTube auth status (checks database for admin's credentials)
router.get('/youtube/auth-status', (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, authenticated: false, message: 'Not logged in' });
  }

  // Check database for stored tokens
  const getTokensSql = 'SELECT * FROM youtube_tokens ORDER BY id DESC LIMIT 1';
  conn.query(getTokensSql, (err, results) => {
    if (err) {
      console.error('Error fetching tokens:', err);
      return res.json({
        success: false,
        authenticated: false,
        message: 'Database error: ' + err.message
      });
    }

    const isAuthenticated = results && results.length > 0;
    res.json({
      success: true,
      authenticated: isAuthenticated,
      message: isAuthenticated ? 'YouTube connected' : 'YouTube not connected'
    });
  });
});

// GET all payments with proofs
router.get('/api/payments', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const status = req.query.status || 'all';
  let sql = `
      SELECT 
          p.*, 
          c.fullname as client_name, 
          c.email as client_email,
          co.title as course_title, 
          pr.file_url as proof_url
      FROM payments p
      LEFT JOIN client c ON p.client_id = c.id
      LEFT JOIN courses co ON p.course_id = co.course_id
      LEFT JOIN payment_proofs pr ON p.id = pr.payment_id
  `;

  if (status !== 'all') {
    sql += ` WHERE p.status = ${conn.escape(status)}`;
  }

  sql += ` ORDER BY p.created_at DESC`;

  conn.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching payments:', err);
      return res.json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, payments: results });
  });
});

// Approve a payment
router.post('/api/payments/approve/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const paymentId = req.params.id;

  // 1. Get payment details
  conn.query('SELECT * FROM payments WHERE id = ?', [paymentId], (err, payments) => {
    if (err || payments.length === 0) {
      return res.json({ success: false, message: 'Payment not found' });
    }

    const payment = payments[0];

    // 2. Update payment status
    conn.query('UPDATE payments SET status = "completed", completed_at = NOW() WHERE id = ?', [paymentId], (err) => {
      if (err) return res.json({ success: false, message: 'Failed to update payment' });

      // 3. Create/Update purchase record
      conn.query('SELECT * FROM purchases WHERE client_id = ? AND course_id = ?',
        [payment.client_id, payment.course_id], (err, purchases) => {

          if (purchases && purchases.length > 0) {
            // Update existing
            conn.query('UPDATE purchases SET paid = 1 WHERE id = ?', [purchases[0].id], (err) => {
              if (err) return res.json({ success: false, message: 'Failed to update purchase' });
              res.json({ success: true, message: 'Payment approved successfully' });
            });
          } else {
            // Create new
            conn.query('INSERT INTO purchases (client_id, course_id, purchase_date, paid) VALUES (?, ?, NOW(), 1)',
              [payment.client_id, payment.course_id], (err) => {
                if (err) return res.json({ success: false, message: 'Failed to create purchase' });
                res.json({ success: true, message: 'Payment approved successfully' });
              });
          }
        });
    });
  });
});

// Reject a payment
router.post('/api/payments/reject/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const paymentId = req.params.id;
  conn.query('UPDATE payments SET status = "failed" WHERE id = ?', [paymentId], (err) => {
    if (err) return res.json({ success: false, message: 'Failed to reject payment' });
    res.json({ success: true, message: 'Payment rejected' });
  });
});

// Delete a payment record
router.delete('/api/payments/delete/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const paymentId = req.params.id;

  // Also delete associated proof from DB (Cloudinary stays for now as archival)
  conn.query('DELETE FROM payment_proofs WHERE payment_id = ?', [paymentId], (err) => {
    conn.query('DELETE FROM payments WHERE id = ?', [paymentId], (err) => {
      if (err) return res.json({ success: false, message: 'Failed to delete payment record' });
      res.json({ success: true, message: 'Payment record deleted' });
    });
  });
});

module.exports = router;