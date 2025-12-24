-- ============================================================
-- MIGRATION SCRIPT: Old Tables → New Interactive Tables
-- ============================================================
-- This script will:
-- 1. Create new interactive tables
-- 2. Migrate all existing data
-- 3. Verify the migration
-- ============================================================

-- Step 1: Create the new tables
-- ============================================================

-- Table: interactive_roadmaps
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
DROP TABLE IF EXISTS `interactive_lessons`;
CREATE TABLE `interactive_lessons` (
  `lesson_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `programming_language` varchar(50) NOT NULL DEFAULT 'javascript',
  `theory_content` text COMMENT 'HTML formatted theory/explanation',
  `code_challenge` text NOT NULL COMMENT 'The coding challenge description',
  `starter_code` text COMMENT 'Initial code provided to student',
  `solution_code` text COMMENT 'Expected solution code',
  `hints` json DEFAULT NULL COMMENT 'Array of hints to help students',
  `validation_type` enum('exact_match','output_match','test_cases','regex_match','ai_validation') DEFAULT 'output_match',
  `expected_output` text COMMENT 'Expected output for validation',
  `test_cases` json DEFAULT NULL COMMENT 'Test cases for validation',
  `display_output` text COMMENT 'User friendly output display',
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
-- Step 2: MIGRATE DATA from old tables to new tables
-- ============================================================

-- 2.1: Migrate learning_paths → interactive_roadmaps
INSERT INTO interactive_roadmaps (
  roadmap_id, title, description, programming_language, 
  difficulty_level, thumbnail_url, is_published, 
  required_tier, created_at
)
SELECT 
  id, 
  title, 
  description, 
  programming_language,
  difficulty_level, 
  thumbnail_url, 
  is_published,
  required_tier, 
  created_at
FROM learning_paths;

-- 2.2: Migrate interactive lessons from lessons table → interactive_lessons
INSERT INTO interactive_lessons (
  lesson_id, title, theory_content, programming_language,
  code_challenge, starter_code, solution_code, hints,
  validation_type, expected_output, test_cases, display_output,
  estimated_minutes, is_free, order_number, created_at
)
SELECT 
  lesson_id, 
  title, 
  text_content, 
  programming_language,
  code_challenge, 
  starter_code, 
  solution_code, 
  hints,
  validation_type, 
  expected_output, 
  test_cases, 
  display_output,
  CAST(duration_minutes AS UNSIGNED), 
  is_free, 
  order_number, 
  created_at
FROM lessons
WHERE lesson_type = 'interactive_code';

-- 2.3: Migrate path_lessons → interactive_roadmap_lessons
INSERT INTO interactive_roadmap_lessons (
  id, roadmap_id, lesson_id, order_number, is_locked
)
SELECT 
  pl.id, 
  pl.path_id, 
  pl.lesson_id, 
  pl.order_number, 
  pl.is_locked
FROM path_lessons pl
INNER JOIN lessons l ON pl.lesson_id = l.lesson_id
WHERE l.lesson_type = 'interactive_code';

-- 2.4: Migrate code_submissions → interactive_code_submissions
INSERT INTO interactive_code_submissions (
  id, client_id, lesson_id, submitted_code, is_correct,
  submission_date, execution_output, error_message, attempts_count
)
SELECT 
  cs.id, 
  cs.client_id, 
  cs.lesson_id, 
  cs.submitted_code, 
  cs.is_correct,
  cs.submission_date, 
  cs.execution_output, 
  cs.error_message, 
  cs.attempts_count
FROM code_submissions cs
INNER JOIN lessons l ON cs.lesson_id = l.lesson_id
WHERE l.lesson_type = 'interactive_code';

-- 2.5: Create user progress records from existing progress table
INSERT INTO interactive_user_progress (
  client_id, lesson_id, roadmap_id, is_completed, 
  completion_date, attempts_count, status, xp_earned
)
SELECT 
  p.client_id, 
  p.lesson_id,
  pl.path_id as roadmap_id,
  p.completed as is_completed,
  p.completation_date as completion_date,
  COALESCE(cs.max_attempts, 1) as attempts_count,
  CASE 
    WHEN p.completed = 1 THEN 'completed'
    WHEN cs.max_attempts > 0 THEN 'in_progress'
    ELSE 'not_started'
  END as status,
  CASE WHEN p.completed = 1 THEN 10 ELSE 0 END as xp_earned
FROM progress p
INNER JOIN lessons l ON p.lesson_id = l.lesson_id
LEFT JOIN path_lessons pl ON p.lesson_id = pl.lesson_id
LEFT JOIN (
  SELECT client_id, lesson_id, MAX(attempts_count) as max_attempts
  FROM code_submissions
  GROUP BY client_id, lesson_id
) cs ON p.client_id = cs.client_id AND p.lesson_id = cs.lesson_id
WHERE l.lesson_type = 'interactive_code';

-- ============================================================
-- Step 3: Update total_lessons count in roadmaps
-- ============================================================
UPDATE interactive_roadmaps ir
SET total_lessons = (
  SELECT COUNT(*) 
  FROM interactive_roadmap_lessons irl 
  WHERE irl.roadmap_id = ir.roadmap_id
);

-- ============================================================
-- Step 4: Create additional indexes for performance
-- ============================================================
CREATE INDEX idx_roadmap_tier ON interactive_roadmaps(required_tier, is_published);
CREATE INDEX idx_lesson_language_difficulty ON interactive_lessons(programming_language, difficulty_level);
CREATE INDEX idx_progress_completed ON interactive_user_progress(client_id, is_completed);
CREATE INDEX idx_submissions_date ON interactive_code_submissions(submission_date);

-- ============================================================
-- Step 5: VERIFICATION QUERIES
-- ============================================================

-- Check migration results
SELECT 'MIGRATION SUMMARY' as info;

SELECT 'Roadmaps migrated:' as metric, COUNT(*) as count FROM interactive_roadmaps
UNION ALL
SELECT 'Lessons migrated:', COUNT(*) FROM interactive_lessons
UNION ALL
SELECT 'Roadmap-Lesson links:', COUNT(*) FROM interactive_roadmap_lessons
UNION ALL
SELECT 'User progress records:', COUNT(*) FROM interactive_user_progress
UNION ALL
SELECT 'Code submissions:', COUNT(*) FROM interactive_code_submissions;

-- Compare old vs new counts
SELECT 'COMPARISON: Old vs New' as info;

SELECT 'learning_paths' as old_table, COUNT(*) as old_count, 
       'interactive_roadmaps' as new_table, 
       (SELECT COUNT(*) FROM interactive_roadmaps) as new_count
FROM learning_paths
UNION ALL
SELECT 'lessons (interactive only)', 
       (SELECT COUNT(*) FROM lessons WHERE lesson_type = 'interactive_code'),
       'interactive_lessons',
       (SELECT COUNT(*) FROM interactive_lessons)
FROM dual;

-- ============================================================
-- TABLES THAT CAN BE SAFELY DELETED AFTER MIGRATION
-- ============================================================
/*
After verifying the migration is successful, you can delete these UNUSED tables:

1. teachers - NOT USED (no references in code)
2. course_analytics - NOT USED (no references in code)
3. skills - NOT USED (no references in code)
4. user_results - NOT USED (replaced by quiz_attempts)
5. ad_spending - NOT USED (you use ad_campaigns instead)

To delete them, uncomment and run:

DROP TABLE IF EXISTS `teachers`;
DROP TABLE IF EXISTS `course_analytics`;
DROP TABLE IF EXISTS `skills`;
DROP TABLE IF EXISTS `user_results`;
DROP TABLE IF EXISTS `ad_spending`;

IMPORTANT: Keep these tables (they are still in use):
- learning_paths (keep for now, can delete after backend update)
- lessons (keep - contains video lessons too)
- path_lessons (keep for now, can delete after backend update)
- code_submissions (keep for now, can delete after backend update)
- progress (keep - used for video lessons too)
- certificates (IN USE - for course certificates)
- youtube_tokens (IN USE - for YouTube integration)
*/
