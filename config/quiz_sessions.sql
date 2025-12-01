-- Quiz Session Management Tables
-- Run this SQL to enable session tracking and progress saving

-- Drop tables if they exist (for clean install)
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz_sessions;

-- Create quiz sessions table
CREATE TABLE quiz_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  language VARCHAR(50) NOT NULL,
  current_question_index INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  skipped_count INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  completed BOOLEAN DEFAULT FALSE,
  score_percentage DECIMAL(5,2) DEFAULT 0,
  FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE CASCADE,
  INDEX idx_client_language (client_id, language),
  INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create quiz attempts table (tracks each question answer)
CREATE TABLE quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_answer VARCHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INT DEFAULT 0,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attempt (session_id, question_id),
  INDEX idx_session (session_id),
  INDEX idx_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert some initial data if needed
-- You can add more as needed
