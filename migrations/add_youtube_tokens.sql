-- Add table to store YouTube OAuth tokens for admin
CREATE TABLE IF NOT EXISTS `youtube_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `access_token` text NOT NULL,
  `refresh_token` text NOT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


