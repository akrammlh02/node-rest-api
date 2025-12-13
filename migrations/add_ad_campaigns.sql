-- Add ad_campaigns table for tracking Facebook Ads spending
CREATE TABLE IF NOT EXISTS `ad_campaigns` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `campaign_name` VARCHAR(255) NOT NULL,
  `spend_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_start_date` (`start_date`),
  INDEX `idx_end_date` (`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add indexes to purchases table for better performance on date queries
ALTER TABLE `purchases` 
ADD INDEX IF NOT EXISTS `idx_purchase_date` (`purchase_date`),
ADD INDEX IF NOT EXISTS `idx_client_id` (`client_id`),
ADD INDEX IF NOT EXISTS `idx_course_id` (`course_id`);
