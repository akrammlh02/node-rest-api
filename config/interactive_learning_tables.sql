-- ============================================================
-- INTERACTIVE LEARNING SYSTEM - DEDICATED TABLES
-- ============================================================
-- This file creates separate tables specifically for the 
-- interactive roadmaps, lessons, and paths system
-- ============================================================

-- Table: interactive_roadmaps
-- Purpose: Store learning paths/roadmaps for interactive coding challenges
DROP TABLE IF EXISTS `interactive_roadmaps`;
CREATE TABLE `interactive_roadmaps` (
  `roadmap_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `programming_language` varchar(50) NOT NULL,
  `difficulty_level` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '1',
  `required_tier` enum('Free','Pro','VIP') DEFAULT 'Free',
  `estimated_duration_hours` int DEFAULT NULL,
  `total_lessons` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`roadmap_id`),
  KEY `idx_language` (`programming_language`),
  KEY `idx_difficulty` (`difficulty_level`),
  KEY `idx_published` (`is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: interactive_lessons
-- Purpose: Store individual interactive coding lessons/challenges
DROP TABLE IF EXISTS `interactive_lessons`;
CREATE TABLE `interactive_lessons` (
  `lesson_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `programming_language` varchar(50) NOT NULL DEFAULT 'javascript',
  
  -- Content fields
  `theory_content` text COMMENT 'HTML formatted theory/explanation',
  `code_challenge` text NOT NULL COMMENT 'The coding challenge description',
  `starter_code` text COMMENT 'Initial code provided to student',
  `solution_code` text COMMENT 'Expected solution code',
  `hints` json DEFAULT NULL COMMENT 'Array of hints to help students',
  
  -- Validation fields
  `validation_type` enum('exact_match','output_match','test_cases','regex_match','ai_validation') DEFAULT 'output_match',
  `expected_output` text COMMENT 'Expected output for validation',
  `test_cases` json DEFAULT NULL COMMENT 'Test cases for validation',
  `display_output` text COMMENT 'User friendly output display',
  
  -- Metadata
  `difficulty_level` enum('easy','medium','hard') DEFAULT 'easy',
  `estimated_minutes` int DEFAULT '10',
  `xp_reward` int DEFAULT '10',
  `is_free` tinyint(1) DEFAULT '0',
  `order_number` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`lesson_id`),
  KEY `idx_language` (`programming_language`),
  KEY `idx_difficulty` (`difficulty_level`),
  KEY `idx_order` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: interactive_roadmap_lessons
-- Purpose: Junction table linking roadmaps to lessons with ordering
DROP TABLE IF EXISTS `interactive_roadmap_lessons`;
CREATE TABLE `interactive_roadmap_lessons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roadmap_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `order_number` int NOT NULL,
  `is_locked` tinyint(1) DEFAULT '0',
  `prerequisite_lesson_id` int DEFAULT NULL COMMENT 'Lesson that must be completed first',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_roadmap_lesson` (`roadmap_id`,`lesson_id`),
  KEY `lesson_id` (`lesson_id`),
  KEY `idx_roadmap_order` (`roadmap_id`,`order_number`),
  KEY `idx_prerequisite` (`prerequisite_lesson_id`),
  CONSTRAINT `irl_roadmap_fk` FOREIGN KEY (`roadmap_id`) REFERENCES `interactive_roadmaps` (`roadmap_id`) ON DELETE CASCADE,
  CONSTRAINT `irl_lesson_fk` FOREIGN KEY (`lesson_id`) REFERENCES `interactive_lessons` (`lesson_id`) ON DELETE CASCADE,
  CONSTRAINT `irl_prerequisite_fk` FOREIGN KEY (`prerequisite_lesson_id`) REFERENCES `interactive_lessons` (`lesson_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: interactive_user_progress
-- Purpose: Track user progress through interactive lessons
DROP TABLE IF EXISTS `interactive_user_progress`;
CREATE TABLE `interactive_user_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `roadmap_id` int DEFAULT NULL,
  `status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
  `attempts_count` int DEFAULT '0',
  `is_completed` tinyint(1) DEFAULT '0',
  `completion_date` timestamp NULL DEFAULT NULL,
  `time_spent_seconds` int DEFAULT '0',
  `xp_earned` int DEFAULT '0',
  `last_code_submitted` text COMMENT 'Last code the user submitted',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_lesson` (`client_id`,`lesson_id`),
  KEY `idx_client_roadmap` (`client_id`,`roadmap_id`),
  KEY `idx_status` (`status`),
  KEY `lesson_id` (`lesson_id`),
  KEY `roadmap_id` (`roadmap_id`),
  CONSTRAINT `iup_client_fk` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`) ON DELETE CASCADE,
  CONSTRAINT `iup_lesson_fk` FOREIGN KEY (`lesson_id`) REFERENCES `interactive_lessons` (`lesson_id`) ON DELETE CASCADE,
  CONSTRAINT `iup_roadmap_fk` FOREIGN KEY (`roadmap_id`) REFERENCES `interactive_roadmaps` (`roadmap_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: interactive_code_submissions
-- Purpose: Store all code submissions for interactive lessons
DROP TABLE IF EXISTS `interactive_code_submissions`;
CREATE TABLE `interactive_code_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `submitted_code` text NOT NULL,
  `is_correct` tinyint(1) DEFAULT '0',
  `submission_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_output` text,
  `error_message` text,
  `validation_feedback` text COMMENT 'AI or system feedback on the code',
  `attempts_count` int DEFAULT '1',
  `time_taken_seconds` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lesson_id` (`lesson_id`),
  KEY `idx_client_lesson` (`client_id`,`lesson_id`),
  KEY `idx_correct` (`is_correct`),
  CONSTRAINT `ics_client_fk` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ics_lesson_fk` FOREIGN KEY (`lesson_id`) REFERENCES `interactive_lessons` (`lesson_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- MIGRATION SCRIPT (Optional)
-- ============================================================
-- Use this to migrate existing data from the old tables to new ones
-- Uncomment and run if you want to migrate existing data

/*
-- Migrate learning_paths to interactive_roadmaps
INSERT INTO interactive_roadmaps (
  roadmap_id, title, description, programming_language, 
  difficulty_level, thumbnail_url, is_published, 
  required_tier, created_at
)
SELECT 
  id, title, description, programming_language,
  difficulty_level, thumbnail_url, is_published,
  required_tier, created_at
FROM learning_paths;

-- Migrate interactive lessons from lessons table to interactive_lessons
INSERT INTO interactive_lessons (
  lesson_id, title, theory_content, programming_language,
  code_challenge, starter_code, solution_code, hints,
  validation_type, expected_output, test_cases, display_output,
  estimated_minutes, is_free, order_number, created_at
)
SELECT 
  lesson_id, title, text_content, programming_language,
  code_challenge, starter_code, solution_code, hints,
  validation_type, expected_output, test_cases, display_output,
  CAST(duration_minutes AS UNSIGNED), is_free, order_number, created_at
FROM lessons
WHERE lesson_type = 'interactive_code';

-- Migrate path_lessons to interactive_roadmap_lessons
INSERT INTO interactive_roadmap_lessons (
  id, roadmap_id, lesson_id, order_number, is_locked
)
SELECT 
  id, path_id, lesson_id, order_number, is_locked
FROM path_lessons
WHERE lesson_id IN (SELECT lesson_id FROM lessons WHERE lesson_type = 'interactive_code');

-- Migrate code_submissions to interactive_code_submissions
INSERT INTO interactive_code_submissions (
  id, client_id, lesson_id, submitted_code, is_correct,
  submission_date, execution_output, error_message, attempts_count
)
SELECT 
  id, client_id, lesson_id, submitted_code, is_correct,
  submission_date, execution_output, error_message, attempts_count
FROM code_submissions;

-- Create user progress records from existing progress table
INSERT INTO interactive_user_progress (
  client_id, lesson_id, is_completed, completion_date, attempts_count
)
SELECT 
  p.client_id, p.lesson_id, p.completed, p.completation_date, 
  COALESCE(cs.max_attempts, 1)
FROM progress p
LEFT JOIN (
  SELECT client_id, lesson_id, MAX(attempts_count) as max_attempts
  FROM code_submissions
  GROUP BY client_id, lesson_id
) cs ON p.client_id = cs.client_id AND p.lesson_id = cs.lesson_id
WHERE p.lesson_id IN (SELECT lesson_id FROM lessons WHERE lesson_type = 'interactive_code');
*/

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Additional indexes for common queries
CREATE INDEX idx_roadmap_tier ON interactive_roadmaps(required_tier, is_published);
CREATE INDEX idx_lesson_language_difficulty ON interactive_lessons(programming_language, difficulty_level);
CREATE INDEX idx_progress_completed ON interactive_user_progress(client_id, is_completed);
CREATE INDEX idx_submissions_date ON interactive_code_submissions(submission_date);

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

/*
-- Sample roadmap
INSERT INTO interactive_roadmaps (title, description, programming_language, difficulty_level, required_tier, total_lessons) 
VALUES 
('JavaScript Fundamentals', 'Master JavaScript basics through interactive coding', 'javascript', 'beginner', 'Free', 10),
('Python Essentials', 'Learn Python programming step by step', 'python', 'beginner', 'Free', 12),
('CSS Mastery', 'Become a CSS expert with hands-on challenges', 'css', 'beginner', 'Pro', 15);

-- Sample lessons
INSERT INTO interactive_lessons (
  title, theory_content, programming_language, code_challenge,
  starter_code, solution_code, validation_type, expected_output,
  difficulty_level, estimated_minutes, xp_reward, is_free
) VALUES 
(
  'Variables in JavaScript',
  '<h3>Variables</h3><p>Variables store data values. Use <code>let</code> or <code>const</code>.</p>',
  'javascript',
  'Create a variable called "name" and assign it your name.',
  '// Write your code here\n\n',
  'let name = "John";\nconsole.log(name);',
  'output_match',
  'John',
  'easy',
  10,
  10,
  1
);
*/
