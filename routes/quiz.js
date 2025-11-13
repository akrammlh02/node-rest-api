const express = require('express');
const router = express.Router();
const conn = require('../config/db');

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
}

// Main quiz page
router.get('/', (req, res) => {
  // Get all available languages
  const sql = "SELECT DISTINCT language FROM quizzes ORDER BY language";
  conn.query(sql, (err, languages) => {
    if (err) {
      console.error('Error fetching languages:', err);
      return res.render('quiz', { 
        languages: [], 
        user: req.session.user 
      });
    }

    res.render('quiz', { 
      languages: languages,
      user: req.session.user 
    });
  });
});

// API endpoint to get questions for a specific language
router.get('/api/questions/:language', (req, res) => {
  const language = req.params.language;
  
  const sql = "SELECT * FROM quizzes WHERE language = ? ORDER BY id";
  conn.query(sql, [language], (err, questions) => {
    if (err) {
      console.error('Error fetching questions:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    res.json({ success: true, questions });
  });
});

// API endpoint to submit an answer (requires authentication)
router.post('/api/submit-answer', requireAuth, (req, res) => {
  const { question_id, selected_option, language } = req.body;
  const client_id = req.session.user.id;

  if (!question_id || !selected_option || !language) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // First, get the correct answer for this question
  const getQuestionSql = "SELECT correct_option FROM quizzes WHERE id = ?";
  conn.query(getQuestionSql, [question_id], (err, results) => {
    if (err) {
      console.error('Error fetching question:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const correct_option = results[0].correct_option;
    const is_correct = selected_option === correct_option;

    // Check if user has already answered this question
    const checkSql = "SELECT id FROM user_results WHERE client_id = ? AND question_id = ?";
    conn.query(checkSql, [client_id, question_id], (err, existing) => {
      if (err) {
        console.error('Error checking existing answer:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (existing.length > 0) {
        // Update existing answer
        const updateSql = `
          UPDATE user_results 
          SET selected_option = ?, is_correct = ?, answered_at = CURRENT_TIMESTAMP 
          WHERE client_id = ? AND question_id = ?
        `;
        conn.query(updateSql, [selected_option, is_correct, client_id, question_id], (err) => {
          if (err) {
            console.error('Error updating answer:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          res.json({ 
            success: true, 
            is_correct, 
            correct_option,
            message: 'Answer updated successfully' 
          });
        });
      } else {
        // Insert new answer
        const insertSql = `
          INSERT INTO user_results (client_id, question_id, selected_option, is_correct, language) 
          VALUES (?, ?, ?, ?, ?)
        `;
        conn.query(insertSql, [client_id, question_id, selected_option, is_correct, language], (err) => {
          if (err) {
            console.error('Error saving answer:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          res.json({ 
            success: true, 
            is_correct, 
            correct_option,
            message: 'Answer saved successfully' 
          });
        });
      }
    });
  });
});

// API endpoint to get user progress
router.get('/api/progress', requireAuth, (req, res) => {
  const client_id = req.session.user.id;
  const language = req.query.language;

  let sql, params;
  
  if (language) {
    // Progress for specific language
    sql = `
      SELECT 
        language,
        COUNT(*) as total_answered,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_answers
      FROM user_results 
      WHERE client_id = ? AND language = ?
      GROUP BY language
    `;
    params = [client_id, language];
  } else {
    // Overall progress
    sql = `
      SELECT 
        COUNT(*) as total_answered,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_answers
      FROM user_results 
      WHERE client_id = ?
    `;
    params = [client_id];
  }

  conn.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching progress:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (language) {
      res.json({ success: true, progress: results });
    } else {
      const overall = results[0] || { total_answered: 0, correct_answers: 0, incorrect_answers: 0 };
      res.json({ success: true, overall });
    }
  });
});

// API endpoint to get progress for all languages
router.get('/api/progress/all', requireAuth, (req, res) => {
  const client_id = req.session.user.id;

  const sql = `
    SELECT 
      language,
      COUNT(*) as total_answered,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
      SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_answers
    FROM user_results 
    WHERE client_id = ?
    GROUP BY language
    ORDER BY language
  `;

  conn.query(sql, [client_id], (err, results) => {
    if (err) {
      console.error('Error fetching all progress:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    res.json({ success: true, progress: results });
  });
});

module.exports = router;
