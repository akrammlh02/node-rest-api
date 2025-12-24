-- Migration to add membership system
-- Run this in your MySQL database

-- Update client table
ALTER TABLE `client` 
ADD COLUMN `membership_tier` ENUM('Free', 'Pro', 'VIP') DEFAULT 'Free',
ADD COLUMN `membership_expiry` DATETIME DEFAULT NULL,
ADD COLUMN `membership_status` ENUM('active', 'expired', 'none') DEFAULT 'none';

-- Update payments table
ALTER TABLE `payments` 
ADD COLUMN `payment_type` ENUM('course', 'membership') DEFAULT 'course',
ADD COLUMN `membership_plan` VARCHAR(50) DEFAULT NULL;

-- Optional: Add a column to learning_paths to specify required membership tier
ALTER TABLE `learning_paths`
ADD COLUMN `required_tier` ENUM('Free', 'Pro', 'VIP') DEFAULT 'Free';
