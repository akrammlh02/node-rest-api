const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const conn = require('../config/db');

// Multer setup to store file in memory (better for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
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

router.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

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


router.get('/ar', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login/ar');
  }

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

router.post('/addCourse', upload.single('courseImage'), async (req, res) => {
  try {
    const { courseTitle, courseDescription, isPublished, durationHours, coursePrice, courseCategory } = req.body;
    
    if (!courseTitle || !courseDescription || !coursePrice || !durationHours || !courseCategory) {
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
    if (isPublished === 'draft') {
      etat = false;
    } else {
      etat = true;
    }
    
    const sql = `
      INSERT INTO courses 
      (title, description, price, duration_hours,
       thumbnail_url, is_published, created_at, level)
      VALUES
      (?,?,?,?,?,?,?,?)
    `;
    
    conn.query(sql, [
      courseTitle, courseDescription,
      coursePrice, durationHours,
      imageUrl, etat, created_at, courseCategory || '',
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

router.delete('/deleteCourse/:id', (req, res) => {
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
router.get('/api/courses/:courseId/chapters', (req, res) => {
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
router.post('/api/courses/:courseId/chapters', (req, res) => {
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
router.delete('/api/chapters/:chapterId', (req, res) => {
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
router.put('/api/chapters/:chapterId/order', (req, res) => {
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

// API: Get lessons for a chapter
router.get('/api/chapters/:chapterId/lessons', (req, res) => {
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
router.post('/api/chapters/:chapterId/lessons', (req, res) => {
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
    const insertSql = 'INSERT INTO lessons (chapitre_id, title, content_type, content_url, text_content, duration_minutes, order_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    conn.query(insertSql, [chapterId, title.trim(), 'video', videoUrl.trim(), '', '0', newOrder, created_at], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      res.json({ success: true, message: 'Lesson added successfully', lessonId: result.insertId });
    });
  });
});

// API: Delete lesson
router.delete('/api/lessons/:lessonId', (req, res) => {
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
router.put('/api/lessons/:lessonId/order', (req, res) => {
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

// API: Get all clients
router.get('/api/clients', (req, res) => {
  const sql = 'SELECT id, fullname, email FROM client ORDER BY id DESC';
  conn.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, clients: result });
  });
});

// API: Get client's purchased courses with progress
router.get('/api/clients/:clientId/purchases', (req, res) => {
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
router.post('/api/clients/add-course', (req, res) => {
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

// API: Get course by ID (for editing)
router.get('/api/courses/:courseId', (req, res) => {
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
router.get('/api/courses', (req, res) => {
  const sql = 'SELECT course_id, title, price FROM courses ORDER BY course_id DESC';
  conn.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, courses: result });
  });
});

// API: Update course
router.put('/updateCourse/:id', upload.single('courseImage'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { courseTitle, courseDescription, isPublished, durationHours, coursePrice, courseCategory, existingImageUrl } = req.body;
    
    if (!courseTitle || !courseDescription || !coursePrice || !durationHours || !courseCategory) {
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
    if (isPublished === 'draft') {
      etat = false;
    } else {
      etat = true;
    }
    
    const sql = `
      UPDATE courses 
      SET title = ?, description = ?, price = ?, duration_hours = ?,
          thumbnail_url = ?, is_published = ?, level = ?
      WHERE course_id = ?
    `;
    
    conn.query(sql, [
      courseTitle, courseDescription,
      coursePrice, durationHours,
      imageUrl, etat, courseCategory || '', courseId
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

module.exports = router;