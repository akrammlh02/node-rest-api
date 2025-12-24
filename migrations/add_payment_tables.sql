-- Payment tables for multi-method payment system

-- Payments table (must be created first)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL COMMENT 'slickpay_edahabia, slickpay_cib, ccp, baridimob, whatsapp',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, completed, failed, cancelled',
  `transaction_id` varchar(255) DEFAULT NULL COMMENT 'Slick Pay transaction ID or reference',
  `payment_reference` varchar(255) DEFAULT NULL COMMENT 'CCP/Baridimob reference number',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_client_id` (`client_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Payment information table (no dependencies)
CREATE TABLE IF NOT EXISTS `payment_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `method` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `info_text` text NOT NULL,
  `contact_info` text DEFAULT NULL COMMENT 'JSON format for contact details',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_method` (`method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Payment proofs table (depends on payments)
CREATE TABLE IF NOT EXISTS `payment_proofs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` int(11) NOT NULL,
  `proof_type` varchar(50) NOT NULL COMMENT 'screenshot, receipt, transaction',
  `file_url` text NOT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `verified` tinyint(1) DEFAULT 0,
  `verified_at` datetime DEFAULT NULL,
  `verified_by` int(11) DEFAULT NULL COMMENT 'Admin ID who verified',
  PRIMARY KEY (`id`),
  KEY `idx_payment_id` (`payment_id`),
  CONSTRAINT `fk_payment_proofs_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default payment information
INSERT INTO `payment_info` (`method`, `title`, `info_text`, `contact_info`, `is_active`) VALUES
('ccp', 'CCP (Postal Check)', 'Please transfer the amount to our CCP account and upload the proof of payment.', '{"account_number":"1234567890123456","account_name":"DevAcademy"}', 1),
('baridimob', 'Baridimob', 'Please transfer the amount via Baridimob and upload the proof of payment.', '{"phone":"+213555123456"}', 1),
('whatsapp', 'WhatsApp Payment', 'Contact us via WhatsApp to complete your payment.', '{"phone":"+213555123456","message":"Hello, I want to pay for course"}', 1);

