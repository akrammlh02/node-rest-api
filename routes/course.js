const express = require('express');
const router = express.Router();
const conn = require('../config/db');

router.get('/', (req, res) => {
    // Get only published courses
    const sql = `
    SELECT c.*, 
           COALESCE(COUNT(DISTINCT ch.id), 0) as chapters_count,
           COALESCE(COUNT(DISTINCT l.lesson_id), 0) as lessons_count
    FROM courses c
    LEFT JOIN chapters ch ON c.course_id = ch.course_id
    LEFT JOIN lessons l ON ch.id = l.chapitre_id
    WHERE c.is_published = 1
    GROUP BY c.course_id, c.title, c.description, c.price, c.duration_hours, c.level, c.thumbnail_url, c.is_published, c.created_at, c.skills
    ORDER BY c.course_id DESC
  `;

    conn.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching courses:', err);
            return res.render('course.hbs', {
                isLoggedIn: !!req.session.user,
                courses: []
            });
        }

        res.render('course.hbs', {
            isLoggedIn: !!req.session.user,
            courses: result || []
        });
    });
});

router.get('/ar', (req, res) => {
    // Get only published courses
    const sql = `
    SELECT c.*, 
           COALESCE(COUNT(DISTINCT ch.id), 0) as chapters_count,
           COALESCE(COUNT(DISTINCT l.lesson_id), 0) as lessons_count
    FROM courses c
    LEFT JOIN chapters ch ON c.course_id = ch.course_id
    LEFT JOIN lessons l ON ch.id = l.chapitre_id
    WHERE c.is_published = 1
    GROUP BY c.course_id, c.title, c.description, c.price, c.duration_hours, c.level, c.thumbnail_url, c.is_published, c.created_at, c.skills
    ORDER BY c.course_id DESC
  `;

    conn.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching courses:', err);
            return res.render('course-ar.hbs', {
                isLoggedIn: !!req.session.user,
                courses: []
            });
        }

        res.render('course-ar.hbs', {
            isLoggedIn: !!req.session.user,
            courses: result || []
        });
    });
});

router.get('/course-view', (req, res) => {
    res.render('course-view.hbs', {
        isLoggedIn: !!req.session.user
    });
});

router.get('/course-view/ar', (req, res) => {
    res.render('course-view-ar.hbs', {
        isLoggedIn: !!req.session.user
    });
});

router.get('/tv', (req, res) => {
    const lessonId = req.query.lessonId;
    if (!lessonId) {
        return res.redirect('/course');
    }
    res.render('tv.hbs', { lessonId, isLoggedIn: !!req.session.user });
})

// API: Get lesson data with course info
router.get('/api/lesson/:lessonId', (req, res) => {
    const lessonId = req.params.lessonId;
    const clientId = req.session.user ? req.session.user.id : null;

    // Get lesson details
    const lessonSql = `
    SELECT l.*, ch.title as chapter_title, ch.order as chapter_order, ch.course_id, c.title as course_title, c.thumbnail_url
    FROM lessons l
    INNER JOIN chapters ch ON l.chapitre_id = ch.id
    INNER JOIN courses c ON ch.course_id = c.course_id
    WHERE l.lesson_id = ?
  `;

    conn.query(lessonSql, [lessonId], (err, lessons) => {
        if (err || lessons.length === 0) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const lesson = lessons[0];
        const courseId = lesson.course_id;

        // Check if client has access
        let hasAccess = false;
        if (clientId) {
            conn.query('SELECT * FROM purchases WHERE client_id = ? AND course_id = ? AND paid = 1',
                [clientId, courseId], (err, purchases) => {
                    hasAccess = !err && purchases.length > 0;
                    loadLessonData(hasAccess);
                });
        } else {
            loadLessonData(false);
        }

        function loadLessonData(hasAccess) {
            if (!hasAccess) {
                return res.json({ success: false, message: 'Access denied. Please purchase the course first.' });
            }

            // Get all lessons in the course for navigation
            const allLessonsSql = `
        SELECT l.lesson_id, l.title, l.order_number, l.content_url, ch.id as chapter_id, ch.title as chapter_title, ch.order as chapter_order
        FROM lessons l
        INNER JOIN chapters ch ON l.chapitre_id = ch.id
        WHERE ch.course_id = ?
        ORDER BY ch.order ASC, l.order_number ASC
      `;

            conn.query(allLessonsSql, [courseId], (err, allLessons) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Server error' });
                }

                // Get current lesson index
                const currentIndex = allLessons.findIndex(l => l.lesson_id == lessonId);
                const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
                const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

                // Get all chapters with lessons for sidebar
                const chaptersSql = `
          SELECT ch.*, COUNT(l.lesson_id) as lessons_count
          FROM chapters ch
          LEFT JOIN lessons l ON ch.id = l.chapitre_id
          WHERE ch.course_id = ?
          GROUP BY ch.id
          ORDER BY ch.order ASC
        `;

                conn.query(chaptersSql, [courseId], (err, chapters) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'Server error' });
                    }

                    // Get lessons for each chapter
                    const chapterIds = chapters.map(ch => ch.id);
                    if (chapterIds.length === 0) {
                        return res.json({
                            success: true,
                            lesson: {
                                ...lesson,
                                prevLesson,
                                nextLesson,
                                chapters: [],
                                isCompleted: false
                            }
                        });
                    }

                    const lessonsSql = `
            SELECT l.*, ch.id as chapter_id
            FROM lessons l
            INNER JOIN chapters ch ON l.chapitre_id = ch.id
            WHERE ch.id IN (?)
            ORDER BY ch.order ASC, l.order_number ASC
          `;

                    conn.query(lessonsSql, [chapterIds], (err, allLessonsForChapters) => {
                        if (err) {
                            return res.status(500).json({ success: false, message: 'Server error' });
                        }

                        // Group lessons by chapter
                        const chaptersWithLessons = chapters.map(chapter => ({
                            ...chapter,
                            lessons: allLessonsForChapters.filter(l => l.chapter_id === chapter.id)
                        }));

                        // Check if lesson is completed
                        let isCompleted = false;
                        if (clientId) {
                            conn.query('SELECT * FROM progress WHERE client_id = ? AND lesson_id = ? AND completed = 1',
                                [clientId, lessonId], (err, progress) => {
                                    isCompleted = !err && progress.length > 0;

                                    // Get course progress
                                    const progressSql = `
                    SELECT COUNT(DISTINCT pr.lesson_id) as completed_count,
                           (SELECT COUNT(*) FROM lessons l2 INNER JOIN chapters ch2 ON l2.chapitre_id = ch2.id WHERE ch2.course_id = ?) as total_lessons
                    FROM progress pr
                    INNER JOIN lessons l ON pr.lesson_id = l.lesson_id
                    INNER JOIN chapters ch ON l.chapitre_id = ch.id
                    WHERE pr.client_id = ? AND pr.completed = 1 AND ch.course_id = ?
                  `;

                                    conn.query(progressSql, [courseId, clientId, courseId], (err, progressResult) => {
                                        const courseProgress = progressResult && progressResult.length > 0 ? progressResult[0] : { completed_count: 0, total_lessons: 0 };

                                        res.json({
                                            success: true,
                                            lesson: {
                                                ...lesson,
                                                prevLesson,
                                                nextLesson,
                                                chapters: chaptersWithLessons,
                                                isCompleted,
                                                courseProgress: {
                                                    completed: parseInt(courseProgress.completed_count) || 0,
                                                    total: parseInt(courseProgress.total_lessons) || 0
                                                }
                                            }
                                        });
                                    });
                                });
                        } else {
                            res.json({
                                success: true,
                                lesson: {
                                    ...lesson,
                                    prevLesson,
                                    nextLesson,
                                    chapters: chaptersWithLessons,
                                    isCompleted: false,
                                    courseProgress: { completed: 0, total: 0 }
                                }
                            });
                        }
                    });
                });
            });
        }
    });
});

// API: Get completed lessons for a course
router.get('/api/progress/:courseId', (req, res) => {
    if (!req.session.user) {
        return res.json({ success: true, completedLessons: [] });
    }

    const courseId = req.params.courseId;
    const clientId = req.session.user.id;

    const sql = `
    SELECT pr.lesson_id
    FROM progress pr
    INNER JOIN lessons l ON pr.lesson_id = l.lesson_id
    INNER JOIN chapters ch ON l.chapitre_id = ch.id
    WHERE pr.client_id = ? AND pr.completed = 1 AND ch.course_id = ?
  `;

    conn.query(sql, [clientId, courseId], (err, result) => {
        if (err) {
            return res.json({ success: true, completedLessons: [] });
        }
        const completedLessons = result.map(r => r.lesson_id);
        res.json({ success: true, completedLessons });
    });
});

// Helper function to check and generate certificate
function checkAndGenerateCertificate(clientId, lessonId, conn) {
    // Get course_id from lesson
    const getCourseSql = `
    SELECT ch.course_id 
    FROM lessons l
    INNER JOIN chapters ch ON l.chapitre_id = ch.id
    WHERE l.lesson_id = ?
  `;

    conn.query(getCourseSql, [lessonId], (err, courseResult) => {
        if (err || courseResult.length === 0) return;

        const courseId = courseResult[0].course_id;

        // Check if certificate already exists
        const checkCertSql = 'SELECT * FROM certificates WHERE client_id = ? AND course_id = ?';
        conn.query(checkCertSql, [clientId, courseId], (err, existingCert) => {
            if (err || existingCert.length > 0) return; // Certificate already exists

            // Get total lessons count for this course
            const totalLessonsSql = `
        SELECT COUNT(*) as total FROM lessons l
        INNER JOIN chapters ch ON l.chapitre_id = ch.id
        WHERE ch.course_id = ?
      `;

            conn.query(totalLessonsSql, [courseId], (err, totalResult) => {
                if (err || totalResult.length === 0) return;
                const totalLessons = totalResult[0].total;

                // Get completed lessons count
                const completedSql = `
          SELECT COUNT(DISTINCT pr.lesson_id) as completed
          FROM progress pr
          INNER JOIN lessons l ON pr.lesson_id = l.lesson_id
          INNER JOIN chapters ch ON l.chapitre_id = ch.id
          WHERE pr.client_id = ? AND pr.completed = 1 AND ch.course_id = ?
        `;

                conn.query(completedSql, [clientId, courseId], (err, completedResult) => {
                    if (err || completedResult.length === 0) return;
                    const completedLessons = completedResult[0].completed;

                    // If 100% complete, generate certificate
                    if (totalLessons > 0 && completedLessons >= totalLessons) {
                        const certificateUrl = `/course/certificate/${clientId}/${courseId}`;
                        const insertCertSql = 'INSERT INTO certificates (client_id, course_id, date_issued, certificate_url) VALUES (?, ?, ?, ?)';
                        conn.query(insertCertSql, [clientId, courseId, new Date(), certificateUrl], (err) => {
                            if (err) console.error('Error generating certificate:', err);
                        });
                    }
                });
            });
        });
    });
}

// API: Mark lesson as complete
router.post('/api/mark-complete', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { lessonId } = req.body;
    const clientId = req.session.user.id;

    if (!lessonId) {
        return res.json({ success: false, message: 'Lesson ID is required' });
    }

    // Check if already completed
    const checkSql = 'SELECT * FROM progress WHERE client_id = ? AND lesson_id = ?';
    conn.query(checkSql, [clientId, lessonId], (err, existing) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (existing.length > 0) {
            // Update to completed
            const updateSql = 'UPDATE progress SET completed = 1, completation_date = ? WHERE client_id = ? AND lesson_id = ?';
            conn.query(updateSql, [new Date(), clientId, lessonId], (err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Server error' });
                }
                // Check if course is complete and generate certificate
                checkAndGenerateCertificate(clientId, lessonId, conn);
                res.json({ success: true, message: 'Lesson marked as complete' });
            });
        } else {
            // Insert new progress
            const insertSql = 'INSERT INTO progress (client_id, lesson_id, completed, completation_date) VALUES (?, ?, 1, ?)';
            conn.query(insertSql, [clientId, lessonId, new Date()], (err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Server error' });
                }
                // Check if course is complete and generate certificate
                checkAndGenerateCertificate(clientId, lessonId, conn);
                res.json({ success: true, message: 'Lesson marked as complete' });
            });
        }
    });
});

// API: Get course details with chapters and lessons
router.get('/api/course/:courseId', (req, res) => {
    const courseId = req.params.courseId;
    const clientId = req.session.user ? req.session.user.id : null;

    // Get course details
    const courseSql = 'SELECT * FROM courses WHERE course_id = ?';
    conn.query(courseSql, [courseId], (err, courses) => {
        if (err || courses.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const course = courses[0];

        // Check if client has access to this course
        if (clientId) {
            conn.query('SELECT * FROM purchases WHERE client_id = ? AND course_id = ? AND paid = 1', [clientId, courseId], (err, purchases) => {
                const hasAccess = !err && purchases.length > 0;
                loadCourseData(hasAccess);
            });
        } else {
            loadCourseData(false);
        }

        function loadCourseData(hasAccess) {
            // Get chapters with lessons
            const chaptersSql = `
        SELECT ch.*, 
               COUNT(l.lesson_id) as lessons_count
        FROM chapters ch
        LEFT JOIN lessons l ON ch.id = l.chapitre_id
        WHERE ch.course_id = ?
        GROUP BY ch.id
        ORDER BY ch.\`order\` ASC
      `;

            conn.query(chaptersSql, [courseId], (err, chapters) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Server error' });
                }

                // Get lessons for each chapter
                const chapterIds = chapters.map(ch => ch.id);
                if (chapterIds.length === 0) {
                    return res.json({
                        success: true,
                        course: {
                            ...course,
                            chapters: [],
                            hasAccess
                        }
                    });
                }

                const lessonsSql = `
          SELECT * FROM lessons 
          WHERE chapitre_id IN (?)
          ORDER BY order_number ASC
        `;

                conn.query(lessonsSql, [chapterIds], (err, lessons) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'Server error' });
                    }

                    // Group lessons by chapter
                    const chaptersWithLessons = chapters.map(chapter => ({
                        ...chapter,
                        lessons: lessons.filter(lesson => lesson.chapitre_id === chapter.id)
                    }));

                    res.json({
                        success: true,
                        course: {
                            ...course,
                            chapters: chaptersWithLessons,
                            hasAccess
                        }
                    });
                });
            });
        }
    });
});

// Certificate view/download route
router.get('/certificate/:clientId/:courseId', (req, res) => {
    const { clientId, courseId } = req.params;

    // Verify certificate exists
    const checkSql = 'SELECT * FROM certificates WHERE client_id = ? AND course_id = ?';
    conn.query(checkSql, [clientId, courseId], (err, certResult) => {
        if (err || certResult.length === 0) {
            return res.status(404).send('Certificate not found');
        }

        // Get client and course info
        const clientSql = 'SELECT fullname, email FROM client WHERE id = ?';
        const courseSql = 'SELECT title, level FROM courses WHERE course_id = ?';

        conn.query(clientSql, [clientId], (err, clientResult) => {
            if (err || clientResult.length === 0) {
                return res.status(404).send('Client not found');
            }

            conn.query(courseSql, [courseId], (err, courseResult) => {
                if (err || courseResult.length === 0) {
                    return res.status(404).send('Course not found');
                }

                const client = clientResult[0];
                const course = courseResult[0];
                const certificate = certResult[0];

                // Render certificate HTML
                res.render('certificate.hbs', {
                    clientName: client.fullname,
                    courseTitle: course.title,
                    courseCategory: course.level || 'Course',
                    issueDate: new Date(certificate.date_issued).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    certificateId: certificate.id
                });
            });
        });
    });
});

module.exports = router;