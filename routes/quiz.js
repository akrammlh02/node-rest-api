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

// ======== NEW SESSION-BASED APIs ========

// Start or resume a quiz session
router.post('/api/session/start', requireAuth, (req, res) => {
  const { language } = req.body;
  const client_id = req.session.user.id;

  if (!language) {
    return res.status(400).json({ success: false, message: 'Language is required' });
  }

  // Check for existing incomplete session
  const checkSql = `
    SELECT * FROM quiz_sessions 
    WHERE client_id = ? AND language = ? AND completed = FALSE 
    ORDER BY last_updated DESC LIMIT 1
  `;

  conn.query(checkSql, [client_id, language], (err, sessions) => {
    if (err) {
      console.error('Error checking session:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (sessions.length > 0) {
      // Resume existing session
      const session = sessions[0];
      return res.json({
        success: true,
        session: session,
        resumed: true,
        message: 'Resuming your previous session'
      });
    }

    // Get total questions for this language
    conn.query('SELECT COUNT(*) as count FROM quizzes WHERE language = ?', [language], (err, countResult) => {
      if (err) {
        console.error('Error counting questions:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      const totalQuestions = countResult[0].count;

      if (totalQuestions === 0) {
        return res.json({ success: false, message: 'No questions available for this language' });
      }

      // Create new session
      const createSql = `
        INSERT INTO quiz_sessions (client_id, language, total_questions) 
        VALUES (?, ?, ?)
      `;

      conn.query(createSql, [client_id, language, totalQuestions], (err, result) => {
        if (err) {
          console.error('Error creating session:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        res.json({
          success: true,
          session: {
            id: result.insertId,
            client_id,
            language,
            current_question_index: 0,
            total_questions: totalQuestions,
            correct_count: 0,
            incorrect_count: 0,
            completed: false
          },
          resumed: false,
          message: 'New quiz session started'
        });
      });
    });
  });
});

// Get current question for session
router.get('/api/session/:sessionId/question', requireAuth, (req, res) => {
  const sessionId = req.params.sessionId;
  const client_id = req.session.user.id;

  // Verify session belongs to user
  const sessionSql = 'SELECT * FROM quiz_sessions WHERE id = ? AND client_id = ?';

  conn.query(sessionSql, [sessionId, client_id], (err, sessions) => {
    if (err) {
      console.error('Error fetching session:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const session = sessions[0];

    if (session.completed) {
      return res.json({ success: false, message: 'Quiz already completed', completed: true });
    }

    // Get questions that haven't been attempted yet
    const questionSql = `
      SELECT q.* FROM quizzes q
      WHERE q.language = ?
      AND q.id NOT IN (
        SELECT question_id FROM quiz_attempts WHERE session_id = ?
      )
      ORDER BY q.id
      LIMIT 1
    `;

    conn.query(questionSql, [session.language, sessionId], (err, questions) => {
      if (err) {
        console.error('Error fetching question:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (questions.length === 0) {
        // No more questions, mark as complete
        conn.query('UPDATE quiz_sessions SET completed = TRUE, completed_at = NOW() WHERE id = ?', [sessionId]);
        return res.json({
          success: true,
          completed: true,
          message: 'Quiz completed!'
        });
      }

      // Remove correct_option from response
      const question = { ...questions[0] };
      delete question.correct_option;

      res.json({
        success: true,
        question,
        session: {
          current_index: session.current_question_index,
          total: session.total_questions,
          correct: session.correct_count,
          incorrect: session.incorrect_count
        }
      });
    });
  });
});

// Submit answer for current question
router.post('/api/session/:sessionId/answer', requireAuth, (req, res) => {
  const sessionId = req.params.sessionId;
  const { question_id, selected_answer } = req.body;
  const client_id = req.session.user.id;

  if (!question_id || !selected_answer) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Verify session
  const sessionSql = 'SELECT * FROM quiz_sessions WHERE id = ? AND client_id = ? AND completed = FALSE';

  conn.query(sessionSql, [sessionId, client_id], (err, sessions) => {
    if (err) {
      console.error('Error verifying session:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or completed session' });
    }

    // Get correct answer
    conn.query('SELECT correct_option FROM quizzes WHERE id = ?', [question_id], (err, questions) => {
      if (err) {
        console.error('Error fetching question:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (questions.length === 0) {
        return res.status(404).json({ success: false, message: 'Question not found' });
      }

      const correctAnswer = questions[0].correct_option;
      const isCorrect = selected_answer.toUpperCase() === correctAnswer.toUpperCase();

      // Save attempt
      const attemptSql = `
        INSERT INTO quiz_attempts (session_id, question_id, selected_answer, is_correct)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE selected_answer = ?, is_correct = ?
      `;

      conn.query(attemptSql, [sessionId, question_id, selected_answer, isCorrect, selected_answer, isCorrect], (err) => {
        if (err) {
          console.error('Error saving attempt:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        // Update session stats
        const updateField = isCorrect ? 'correct_count' : 'incorrect_count';
        const updateSql = `
          UPDATE quiz_sessions 
          SET ${updateField} = ${updateField} + 1,
              current_question_index = current_question_index + 1,
              score_percentage = (correct_count / total_questions) * 100
          WHERE id = ?
        `;

        conn.query(updateSql, [sessionId], (err) => {
          if (err) {
            console.error('Error updating session:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          res.json({
            success: true,
            is_correct: isCorrect,
            correct_answer: correctAnswer,
            message: isCorrect ? 'Correct!' : 'Incorrect'
          });
        });
      });
    });
  });
});

// Get session summary/results
router.get('/api/session/:sessionId/summary', requireAuth, (req, res) => {
  const sessionId = req.params.sessionId;
  const client_id = req.session.user.id;

  const sessionSql = 'SELECT * FROM quiz_sessions WHERE id = ? AND client_id = ?';

  conn.query(sessionSql, [sessionId, client_id], (err, sessions) => {
    if (err) {
      console.error('Error fetching session:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const session = sessions[0];

    // Get all attempts for this session
    const attemptsSql = `
      SELECT qa.*, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.question_id = q.id
      WHERE qa.session_id = ?
      ORDER BY qa.attempted_at
    `;

    conn.query(attemptsSql, [sessionId], (err, attempts) => {
      if (err) {
        console.error('Error fetching attempts:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      res.json({
        success: true,
        session,
        attempts,
        stats: {
          total: session.total_questions,
          answered: session.correct_count + session.incorrect_count,
          correct: session.correct_count,
          incorrect: session.incorrect_count,
          score: session.score_percentage
        }
      });
    });
  });
});

// Reset/Restart quiz - abandon current session and start fresh
router.post('/api/session/:sessionId/reset', requireAuth, (req, res) => {
  const sessionId = req.params.sessionId;
  const client_id = req.session.user.id;

  // Verify session belongs to user
  const sessionSql = 'SELECT * FROM quiz_sessions WHERE id = ? AND client_id = ?';

  conn.query(sessionSql, [sessionId, client_id], (err, sessions) => {
    if (err) {
      console.error('Error fetching session:', err);
      return res.status(500).json({ success: false, message: 'Server error' })
    }

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const session = sessions[0];
    const language = session.language;

    // Mark current session as completed/abandoned
    const abandonSql = `UPDATE quiz_sessions SET completed = TRUE WHERE id = ?`;

    conn.query(abandonSql, [sessionId], (err) => {
      if (err) {
        console.error('Error abandoning session:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      // Get total questions for new session
      conn.query('SELECT COUNT(*) as count FROM quizzes WHERE language = ?', [language], (err, countResult) => {
        if (err) {
          console.error('Error counting questions:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        const totalQuestions = countResult[0].count;

        // Create fresh session
        const createSql = `
          INSERT INTO quiz_sessions (client_id, language, total_questions) 
          VALUES (?, ?, ?)
        `;

        conn.query(createSql, [client_id, language, totalQuestions], (err, result) => {
          if (err) {
            console.error('Error creating new session:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          res.json({
            success: true,
            session: {
              id: result.insertId,
              client_id,
              language,
              current_question_index: 0,
              total_questions: totalQuestions,
              correct_count: 0,
              incorrect_count: 0,
              completed: false
            },
            message: 'Quiz reset successfully'
          });
        });
      });
    });
  });
});

// ======== LEGACY APIs (for compatibility) ========

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

// API endpoint to get user progress
router.get('/api/progress', requireAuth, (req, res) => {
  const client_id = req.session.user.id;
  const language = req.query.language;

  let sql, params;

  if (language) {
    // Progress for specific language from sessions
    sql = `
      SELECT 
        language,
        SUM(correct_count + incorrect_count) as total_answered,
        SUM(correct_count) as correct_answers,
        SUM(incorrect_count) as incorrect_answers,
        AVG(score_percentage) as avg_score
      FROM quiz_sessions 
      WHERE client_id = ? AND language = ?
      GROUP BY language
    `;
    params = [client_id, language];
  } else {
    // Overall progress
    sql = `
      SELECT 
        SUM(correct_count + incorrect_count) as total_answered,
        SUM(correct_count) as correct_answers,
        SUM(incorrect_count) as incorrect_answers,
        AVG(score_percentage) as avg_score
      FROM quiz_sessions 
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
      const overall = results[0] || { total_answered: 0, correct_answers: 0, incorrect_answers: 0, avg_score: 0 };
      res.json({ success: true, overall });
    }
  });
});

// Get progress for all languages
router.get('/api/progress/all', requireAuth, (req, res) => {
  const client_id = req.session.user.id;

  const sql = `
    SELECT 
      language,
      SUM(correct_count + incorrect_count) as total_answered,
      SUM(correct_count) as correct_answers,
      SUM(incorrect_count) as incorrect_answers,
      AVG(score_percentage) as avg_score,
      MAX(completed_at) as last_attempt
    FROM quiz_sessions 
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
