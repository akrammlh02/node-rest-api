-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: mainline.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ad_campaigns`
--

DROP TABLE IF EXISTS `ad_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ad_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `spend_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_start_date` (`start_date`),
  KEY `idx_end_date` (`end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ad_campaigns`
--

LOCK TABLES `ad_campaigns` WRITE;
/*!40000 ALTER TABLE `ad_campaigns` DISABLE KEYS */;
INSERT INTO `ad_campaigns` VALUES (1,'DevAcademy - Courses',1704.00,'2025-11-23','2026-01-01','','2025-12-13 15:19:16','2025-12-16 19:24:50'),(2,'DevAcademy - Courses Sales',2752.50,'2025-11-20','2025-11-29','','2025-12-13 15:20:00','2025-12-16 19:24:28'),(3,'DevAcademy - Compaign latest',4054.00,'2025-11-29','2025-12-08','','2025-12-13 15:20:36','2025-12-16 19:25:17'),(4,'Algorithm Course – Sales – Algeria – 2025',3250.00,'2025-12-12','2025-12-15','','2025-12-13 15:21:04','2025-12-16 19:25:33'),(5,'DevAcademy - Algorithm Landing',8160.00,'2025-12-21','2025-12-23','','2025-12-19 13:15:58','2025-12-22 13:55:23');
/*!40000 ALTER TABLE `ad_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ad_spending`
--

DROP TABLE IF EXISTS `ad_spending`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ad_spending` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign_name` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'DA',
  `spend_date` date NOT NULL,
  `platform` varchar(50) DEFAULT 'Facebook',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_spend_date` (`spend_date`),
  KEY `idx_platform` (`platform`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ad_spending`
--

LOCK TABLES `ad_spending` WRITE;
/*!40000 ALTER TABLE `ad_spending` DISABLE KEYS */;
INSERT INTO `ad_spending` VALUES (1,'Launch Campaign - Week 1',5000.00,'DA','2025-11-21','Facebook','Initial launch campaign','2025-11-28 23:06:46','2025-11-28 23:06:46'),(2,'Retargeting Campaign',3000.00,'DA','2025-11-23','Facebook','Retargeting past visitors','2025-11-28 23:06:46','2025-11-28 23:06:46'),(3,'Black Friday Promotion',8000.00,'DA','2025-11-26','Facebook','Special Black Friday campaign','2025-11-28 23:06:46','2025-11-28 23:06:46');
/*!40000 ALTER TABLE `ad_spending` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `password` text COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,'Akram Melihi','akrammelihi2003@gmail.com','$2b$10$D2df1GW73DX.n7TYPH0oUemp4sPTpDfwveJKTaU.jlzn9aG4FHrtO');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `certificates`
--

DROP TABLE IF EXISTS `certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `course_id` int NOT NULL,
  `date_issued` date NOT NULL,
  `certificate_url` text COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificates`
--

LOCK TABLES `certificates` WRITE;
/*!40000 ALTER TABLE `certificates` DISABLE KEYS */;
INSERT INTO `certificates` VALUES (3,5,5,'2025-11-08','/course/certificate/5/5'),(4,6,5,'2025-11-16','/course/certificate/6/5');
/*!40000 ALTER TABLE `certificates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chapters`
--

DROP TABLE IF EXISTS `chapters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chapters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `title` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `order` int NOT NULL,
  `is_free` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chapters`
--

LOCK TABLES `chapters` WRITE;
/*!40000 ALTER TABLE `chapters` DISABLE KEYS */;
INSERT INTO `chapters` VALUES (15,5,'Part I : Foundations of Algorithm',1,1),(16,5,'Part II : Core Programming Logic',2,0),(17,5,'Part III : Fundamental Algorithms',3,0),(20,5,'Part IV : Algorithms Exercices',5,0),(21,5,'Part VI : Language C',7,0),(22,5,'Part V : Data Structures',6,0),(23,6,'Chapter 1',1,1);
/*!40000 ALTER TABLE `chapters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client`
--

DROP TABLE IF EXISTS `client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_token` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `verification_token_expires` datetime DEFAULT NULL,
  `xp` int DEFAULT '0',
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `membership_tier` enum('Free','Pro','VIP') COLLATE utf8mb4_general_ci DEFAULT 'Free',
  `membership_expiry` datetime DEFAULT NULL,
  `membership_status` enum('active','expired','none') COLLATE utf8mb4_general_ci DEFAULT 'none',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client`
--

LOCK TABLES `client` WRITE;
/*!40000 ALTER TABLE `client` DISABLE KEYS */;
INSERT INTO `client` VALUES (3,'Akram Melihi','akram@gmail.com','$2b$10$pAR1RaH1JYxuNfdnTrOfJOFE0vXsqfA4RiIzhgwyRvI5CGD2gBKgS',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(6,'Bennaceur Douaa','douaabennaceur5@gmail.com','$2b$10$pIJ2Cjk62G37igyoHC/1q.fC0qlSL.cvmz9uirSf.tTSMPgJIrhne',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(7,'Toufik Mouaz ','toufikmouaz287@gmail.com','$2b$10$arcQRR.nkdwaMr5y2voHvOZrG182aNpxVNpjm/wndIYC27Ai3XM9u',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(8,'drxwissal','ouissal.draiaia@gmail.com','$2b$10$NuXxwJq3dMBQqVW/CZHP8uFWLOWrNBKAmsbt5JcWi5Z1RGyAdVfUq',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(9,'ishak ayad','ishakkroos10@gmail.com','$2b$10$n1kN6P9IHFsxMgUlUx0NlOoe3FA65AWxAXqfrhFPiTkdPsUdSyQ4G',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(10,'SAYAH Moussa','moussa.sayah021984@gmail.com','$2b$10$HIgtl.wyhAthJWHJAqcr8OWHzOEyFhcUxjHNIeDvuJjO3E1FmefBW',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(11,'Nour el houda Boulmelh','boulmelhnourelhouda@gmail.com','$2b$10$6HZouLAWLnAmkaGlpcSv8.mhkYFDBwlmcppdMS7igm7ZtCrw4eQ.G',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(12,'Ikram Belbali ','ikrabel117@gmail.com','$2b$10$fnwLikkZ694L1v.At/fyOOtz2mWSEsh7U1Y/e3PZ.IRibbfA16KwS',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(15,'nabi sarra','nabisarra31@gmail.com','$2b$10$8/GOkSg1EUhV/KiJ8QIkfuUusMu.MUME4ut4MVHMgrzRuHXjJdXxq',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(16,'Boulariah Lyna','boulariahlyna@gmail.com','$2b$10$oqLTK8DwOrrIQpVFJvdnHua4VGyd6uTapU929ool.VQgOPaOFfop2',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(17,'HAMIMI Messaoud','hamimessa01@gmail.com','$2b$10$qWnBrY.JNo/JzBB12K8aX.dn2TQX4t48bJqr9SX5F3DH8G/3lGq2a',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(18,'RABAH BENAISSA','rabahbenaissa2@gmail.com','$2b$10$LlMRZURKqvtsJB/iTWMT1..TkMZYhZK/GIWuMM2TBpQXPT85TK31C',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(19,'BENHAMADA  TAYEB','benhamadatayeb@gmail.com','$2b$10$WbFlYz7bkNNghFtk0KOtvuIoOTuUl7GdY09uicJUQLG6zs4Y6hlRy',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(20,'Chalane Daoud ','daoudch06@gmail.com','$2b$10$gthBex.Dj9BjI6AIMSHpJOlB/55WEjZxUYznfHD.YMjVPUJvwe0fO',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(21,'becis omar','b6omar60@gmail.com','$2b$10$AjzusvA.KJyIpJEGx3hhoekD7mTm/jpUunF3wcGwJZncaWyfgo0Oa',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(22,'Bensaad Ahlam ','ahlambensaad85@gmail.com','$2b$10$KeX5lCTRqacx14u2jfuwL.AAmdR8t8uqnrtw9BLDUWCgggAflF8RK',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(23,'abadoui saad','abdaouisaadd@gmail.com','$2b$10$ooaXWZhrMAYqNJ2kisjiketsS8U6v9JTBWDC1DPyjpNJf7Q6grA6y',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(24,'aibout bendida','aiboutbendida01@gmail.com','$2b$10$0vqei1UuXIB9.srJ4qZSk.CLkvdIcKESnjGKrU3qYu2PFkLdZFp0.',0,NULL,NULL,0,NULL,'Free',NULL,'none'),(25,'Salima sebahi','souhila.ghanem@univ-bejaia.dz','$2b$10$7bd5uXtkpdtt4gkKgQws5eHexZWzyOKux1DJFHX2q6FRPYC0w9j8y',0,NULL,NULL,0,NULL,'Free',NULL,'none');
/*!40000 ALTER TABLE `client` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `code_submissions`
--

DROP TABLE IF EXISTS `code_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `code_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `submitted_code` text NOT NULL,
  `is_correct` tinyint(1) DEFAULT '0',
  `submission_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_output` text,
  `error_message` text,
  `attempts_count` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `lesson_id` (`lesson_id`),
  KEY `idx_client_lesson` (`client_id`,`lesson_id`),
  CONSTRAINT `code_submissions_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`) ON DELETE CASCADE,
  CONSTRAINT `code_submissions_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`lesson_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `code_submissions`
--

LOCK TABLES `code_submissions` WRITE;
/*!40000 ALTER TABLE `code_submissions` DISABLE KEYS */;
INSERT INTO `code_submissions` VALUES (17,3,70,'# Write your code here\nprint(\'Hello Wrold\')\n',0,'2025-12-16 22:54:53','Your code should produce: \"Hello Python\"',NULL,1),(18,3,70,'# Write your code here\nprint(\'Hello python\')\n',0,'2025-12-16 22:55:01','Your code should produce: \"Hello Python\"',NULL,2),(19,3,70,'# Write your code here\nprint(\'Hello Python\')\n',1,'2025-12-16 22:55:06','Great! Your code produces the correct output.',NULL,3),(28,3,183,'/* Style the h1 */\n\nh1{\n  color : blue;\n  text-align : center;\n}',0,'2025-12-17 14:53:45','Check your syntax. Something is missing or incorrect.',NULL,1),(29,3,183,'/* Style the h1 */\n\nh1 {\n  color : blue;\n  text-align : center;\n}',0,'2025-12-17 14:53:55','Check your syntax. Something is missing or incorrect.',NULL,2),(30,3,183,'/* Style the h1 */\nh1 {\n  color : blue;\n  text-align : center;\n}',0,'2025-12-17 14:54:04','Check your syntax. Something is missing or incorrect.',NULL,3),(31,3,183,'/* Style the h1 */\nh1 {\n  color: blue;\n  text-align: center;\n}',1,'2025-12-17 14:54:14','Great job! Your code follows the pattern.',NULL,4),(32,3,183,'/* Style the h1 */\nselector { property: value; }',0,'2025-12-17 15:30:09','AI service unavailable. Basic validation used.',NULL,5),(33,3,183,'/* Style the h1 */\nh1 {\n  color: blue;\n  text-align : center;\n}',0,'2025-12-17 15:31:43','AI service unavailable. Basic validation used.',NULL,6),(34,3,183,'/* Style the h1 */\nh1 {\n  color: blue;\n  text-align: center;\n}',0,'2025-12-17 15:31:55','AI service unavailable. Basic validation used.',NULL,7),(35,3,183,'/* Style the h1 */\nselector { property: value; }',0,'2025-12-17 15:33:42','AI service unavailable. Basic validation used.',NULL,8),(36,3,183,'/* Style the h1 */\nselector { property: value; }',0,'2025-12-17 15:38:45','AI service unavailable. Basic validation used.',NULL,9),(37,3,183,'/* Style the h1 */\nselector { property: value; }',0,'2025-12-17 15:41:44','AI service unavailable. Basic validation used.',NULL,10),(38,3,183,'/* Style the h1 */\nselector { property: value; }',0,'2025-12-17 15:43:29','AI service unavailable. Basic validation used.',NULL,11),(39,3,183,'/* Style the h1 */\ngfhf',0,'2025-12-17 15:43:34','AI service unavailable. Basic validation used.',NULL,12),(40,3,183,'/* Style the h1 */\nselector { property: value; }',0,'2025-12-17 15:45:27','AI service unavailable. Basic validation used.',NULL,13),(41,3,183,'/* Style the h1 */\nselector { property: value; }',0,'2025-12-17 15:49:11','AI service unavailable. Basic validation used.',NULL,14),(42,3,183,'/* Style the h1 */\nselector { property: value; }',0,'2025-12-17 16:02:37','AI service unavailable. Basic validation used.',NULL,15),(43,3,183,'/* Style the h1 */\nselector { property: value; }',0,'2025-12-17 16:10:15','AI service unavailable. Basic validation used.',NULL,16),(54,3,183,'/* Style the h1 */\nselector { property: value; }',0,'2025-12-19 16:10:23','Your code doesn\'t correctly style the h1 element as requested. You need to replace \'selector\' with the correct HTML element you want to style, which is \'h1\'. Additionally, you need to replace \'property: value;\' with the actual CSS properties and values specified in the challenge: \'color: blue;\' and \'text-align: center;\'.\n\n? Issues Found:\n1. Line 3: Incorrect CSS selector. The selector \'selector\' should be \'h1\'.\n2. Line 3: Incorrect CSS properties and values. \'property: value;\' should be replaced with \'color: blue;\' and \'text-align: center;\'.\n',NULL,17),(55,3,183,'/* Style the h1 */\nh1 {\n  color: blue;\n  text-align: center;\n}',1,'2025-12-19 16:10:39','Great job! Your CSS code correctly targets the `<h1>` element and applies both `color: blue;` and `text-align: center;` as required by the challenge. The syntax is perfect, and the styles will be applied exactly as intended.',NULL,18),(59,3,68,'// Write your code here\n\n\nhjghj',0,'2025-12-19 16:21:39','Your code does not solve the challenge. The line \'hjghj\' is not valid JavaScript syntax and will cause an error. You need to declare a variable named \'message\', assign it the string \"Hello JavaScript\", and then use \'console.log()\' to display its content. None of these steps are present in your submission.\n\nSpecific problems:\n- Line 4: \'hjghj\' is a syntax error and not valid JavaScript code.\n- The code does not create a variable named \'message\'.\n- The code does not assign the value \"Hello JavaScript\" to any variable.\n- The code does not use \'console.log()\' to display the message.\n\n? Issues Found:\n1. Line 4: Syntax error - \'hjghj\' is not valid JavaScript.\n2. Missing functionality: Variable \'message\' is not created.\n3. Missing functionality: Value \"Hello JavaScript\" is not assigned to \'message\'.\n4. Missing functionality: console.log() is not used to display the variable.\n',NULL,1),(60,3,218,'<!DOCTYPE html>\n<html>\n<body>\n    <!-- Add your code here -->\n    fdgg\n</body>\n</html>',0,'2025-12-20 23:01:18','Your code does not currently solve the challenge. You need to add the required HTML elements to achieve the task. Specifically:\n\n1.  **Line 5:** The text `fdgg` is present instead of the required HTML tags. You need to replace this with a paragraph tag `<p>` containing \"Hello World\".\n2.  **Missing Element:** After the paragraph, you need to add a line break using the `<br>` tag.\n3.  **Missing Element:** Finally, you need to add a bold tag `<b>` containing the text \"Bold\".\n\nRemember to place these elements within the `<body>` tags.\n\n? Issues Found:\n1. Line 5: Missing <p> tag with \"Hello World\" text.\n2. Line 5: Missing <br> tag.\n3. Line 5: Missing <b> tag with \"Bold\" text.\n4. Line 5: Incorrect content \'fdgg\' where HTML elements should be.\n',NULL,1),(61,3,218,'<!DOCTYPE html>\n<html>\n<body>\n    <!-- Add your code here -->\n    <p>Hello World</p>\n<br>\n<b>Bold</b>\n</body>\n</html>',1,'2025-12-20 23:01:36','Your code correctly solves the challenge! You have successfully added a paragraph with \'Hello World\', a line break, and bold text \'Bold\' within the `<body>` section. All requirements are met.',NULL,2),(62,3,68,'// Write your code here\nmessage  = \"Hello world\"\nconsole.log(\'\'Hello world \")\n\n',0,'2025-12-23 20:00:08','Your code has a few issues that prevent it from correctly solving the challenge:\n\n1.  \n    Line 2: You\'ve assigned \"Hello world\" to the `message` variable. The challenge specifically asks for the value \"Hello JavaScript\". Please update the string value.\n\n2.  \n    Line 2: While your code works, it\'s best practice in modern JavaScript to declare your variables using keywords like `let`, `const`, or `var`. For example, `let message = \"Hello JavaScript\";`.\n\n3.  \n    Line 3: There\'s a syntax error in your `console.log` statement. You have mismatched quotes (`\'\'Hello world \"`). A string should be enclosed consistently, either with single quotes (`\'...\'`) or double quotes (`\"...\"`). For example, `console.log(\'Hello world\');` or `console.log(\"Hello world\");`.\n\n4.  \n    Line 3: The challenge asks you to log the `message` *variable*, not the string literal directly. Once you\'ve fixed the value assigned to `message`, you should log the variable itself: `console.log(message);`.\n\nTo fix this, ensure the `message` variable holds the correct string and then use `console.log(message);`.\n\n? Issues Found:\n1. Line 2: Incorrect string value assigned to \'message\' variable (should be \'Hello JavaScript\').\n2. Line 2: Variable \'message\' is implicitly declared; best practice is to use \'let\', \'const\', or \'var\'.\n3. Line 3: Syntax error in console.log due to incorrect string literal quoting.\n4. Line 3: console.log should display the \'message\' variable, not a direct string literal.\n',NULL,2),(63,3,68,'// Write your code here\nconst  message  = \"Hello world\"\nconsole.log(message)\n\n',0,'2025-12-23 20:00:51','Your code correctly creates a variable named \'message\' and uses `console.log` to display it. However, the challenge specifically asks for the variable \'message\' to be assigned the value \"Hello JavaScript\". On line 2, you have assigned it the value \"Hello world\" instead.\n\n? Issues Found:\n1. Line 2: Incorrect variable assignment - The \'message\' variable should be assigned \"Hello JavaScript\" instead of \"Hello world\".\n',NULL,3),(64,3,68,'// Write your code here\nconst  message  = \"Hello javascript\"\nconsole.log(message)\n\n',0,'2025-12-23 20:01:11','Your code correctly creates a constant variable named `message` and uses `console.log` to display its value. However, there\'s a small issue with the exact string assigned to the `message` variable. On line 2, you\'ve assigned the value \"Hello javascript\" (with a lowercase \'j\' and \'s\'). The challenge required the value to be \"Hello JavaScript\" (with a capital \'J\' and \'S\'). Please correct the capitalization of \'JavaScript\' in the string literal to match the challenge requirements exactly.\n\n? Issues Found:\n1. Line 2: The string literal assigned to the \'message\' variable has incorrect capitalization. It should be \'Hello JavaScript\' instead of \'Hello javascript\'.\n',NULL,4),(65,3,68,'// Write your code here\nconst  message  = \"Hello JavaScript\"\nconsole.log(message)\n\n',1,'2025-12-23 20:01:32','Excellent! Your code correctly solves the challenge. You have successfully created a variable named \'message\', assigned it the value \'Hello JavaScript\', and then displayed it using console.log. The use of `const` is perfectly valid for this task and works just like the `let` keyword would in this context.',NULL,5),(66,3,184,'/* Styles */\n\nbody { background-color: #f0f0f0; }\np { color: rgb(50,50,50); }',1,'2025-12-23 20:42:56','Excellent work! Your CSS code correctly sets the `body` background color to `#f0f0f0` and the `p` (paragraph) element\'s text color to `rgb(50,50,50)`. Both declarations are syntactically correct and achieve the desired outcome. Keep up the great work!',NULL,1),(67,3,185,'h2 {\n  font-size: 24px;\n  font-weight: bold;\n}',1,'2025-12-23 20:43:13','Your CSS code correctly solves the challenge. You have successfully targeted the `h2` element and applied the `font-size: 24px;` and `font-weight: bold;` styles as requested.',NULL,1),(68,3,186,'.btn { padding: 10px; }\n#main { width: 100%; }',1,'2025-12-23 20:43:39','Your code correctly solves the challenge! You have successfully styled the \".btn\" class with \"padding: 10px;\" and the \"#main\" id with \"width: 100%;\". Great job!',NULL,1),(69,3,187,'div { padding: 20px; margin: 10px; }',1,'2025-12-23 20:43:59','Your code correctly applies 20px padding and 10px margin to the div element. Excellent work!',NULL,1),(70,3,188,'.card {\n  border: 1px solid #ccc;\n  border-radius: 8px;\n}',1,'2025-12-23 20:44:14','Your code correctly applies a \'1px solid #ccc\' border and an \'8px\' border-radius to the .card selector, fulfilling all requirements of the challenge. Great job!',NULL,1),(71,3,189,'.box { box-shadow: 5px 5px 10px black; }',1,'2025-12-23 20:44:30','Your code is correct! You have successfully added a box-shadow to the `.box` element with the specified x-offset (5px), y-offset (5px), blur (10px), and color (black). Great job!',NULL,1),(72,3,190,'a { text-decoration: none; text-transform: uppercase; }',1,'2025-12-23 20:44:44','Your code correctly solves the challenge! You\'ve successfully removed the underline from <a> tags using `text-decoration: none;` and made them uppercase with `text-transform: uppercase;`. Great job!',NULL,1),(73,3,190,'a { text-decoration: none; text-transform: uppercase; }',1,'2025-12-23 20:59:35','Your CSS code is absolutely correct! You have successfully selected the `<a>` tags and applied both `text-decoration: none;` to remove the underline and `text-transform: uppercase;` to make the text uppercase, exactly as requested by the challenge. Great job!',NULL,2),(74,3,219,'<!DOCTYPE html>\n<body>\n    <h1>My Gallery</h1>\n    <!-- Add image here -->\n    <img src=\"logo.png\" alt=\"Logo\">\n</body>',1,'2025-12-23 21:24:10','Your code correctly solves the challenge! You have successfully added an `<img>` tag, specified the `src` attribute as \"logo.png\", and included the `alt` attribute with the value \"Logo\". Excellent work!',NULL,1);
/*!40000 ALTER TABLE `code_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_analytics`
--

DROP TABLE IF EXISTS `course_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_analytics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `total_views` int DEFAULT '0',
  `total_enrollments` int DEFAULT '0',
  `total_revenue` decimal(10,2) DEFAULT '0.00',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `course_analytics_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_analytics`
--

LOCK TABLES `course_analytics` WRITE;
/*!40000 ALTER TABLE `course_analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `course_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `course_id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int DEFAULT NULL,
  `title` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `price` varchar(8) COLLATE utf8mb4_general_ci NOT NULL,
  `duration_hours` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `level` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `thumbnail_url` text COLLATE utf8mb4_general_ci NOT NULL,
  `is_published` tinyint(1) NOT NULL,
  `created_at` date NOT NULL,
  `preview_video_url` text COLLATE utf8mb4_general_ci,
  `skills` text COLLATE utf8mb4_general_ci,
  `is_free` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`course_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (5,NULL,'Master Algorithmics From Zero – Full Practical Course','دورة شاملة تخلّيك تفهم الخوارزميات من الأساسيات حتى المفاهيم المتقدمة بطريقة بسيطة، تطبيقية، وبالدارجة الجزائرية. تبدى من الصفر بلا أي خبرة، وتفهم كيفاه تفكر كيما المبرمجين، وتكتب الخوارزميات بطريقة صحيحة، وتستعمل الهياكل الشرطية، الحلقات، الدوال، المعالجة، وتهبط حتى للبرمجة بلغة C. كل درس فيه أمثلة، تمارين، وشرح واضح يمكّنك من بناء منطق برمجي قوي.','3500','4','Algo','https://res.cloudinary.com/dtomoxzx7/image/upload/v1763162631/devacademy/courses/axisks4nqv5txzcvhs3l.png',1,'2025-11-08','https://www.youtube.com/embed/HVltT0gmufs','Learn Algorithm from Zero to Advanced., Problem-Solving Skills, Master Pseudocode + Real Logic., 60+ Exercises With Detailed Solutions, Certificate Accepted & Verified, Personal Support & Correction',0),(6,NULL,'Web','Web','1800','12','Web','https://res.cloudinary.com/dtomoxzx7/image/upload/v1765921081/devacademy/courses/ldreidi80ljzzgrdxp0x.png',0,'2025-12-16','https://www.youtube.com/embed/ABC123','',0);
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `learning_paths`
--

DROP TABLE IF EXISTS `learning_paths`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learning_paths` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `programming_language` varchar(50) NOT NULL,
  `difficulty_level` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `required_tier` enum('Free','Pro','VIP') DEFAULT 'Free',
  PRIMARY KEY (`id`),
  KEY `idx_language` (`programming_language`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `learning_paths`
--

LOCK TABLES `learning_paths` WRITE;
/*!40000 ALTER TABLE `learning_paths` DISABLE KEYS */;
INSERT INTO `learning_paths` VALUES (1,'HTML Fundamentals','Learn HTML from scratch with interactive coding challenges','html','beginner','/images/html-path.png',1,'2025-12-16 20:11:06','Pro'),(2,'JavaScript Basics','Master JavaScript fundamentals through hands-on coding','javascript','beginner','/images/js-path.png',1,'2025-12-16 20:11:06','Free'),(3,'Python for Beginners','Start your Python journey with interactive lessons','python','beginner','/images/python-path.png',1,'2025-12-16 20:11:06','Free'),(4,'CSS Mastery','Learn CSS styling with real-time visual feedback','css','beginner','/images/css-path.png',1,'2025-12-16 20:11:06','Free');
/*!40000 ALTER TABLE `learning_paths` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lessons`
--

DROP TABLE IF EXISTS `lessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lessons` (
  `lesson_id` int NOT NULL AUTO_INCREMENT,
  `chapitre_id` int NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `content_type` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `content_url` text COLLATE utf8mb4_general_ci NOT NULL,
  `text_content` text COLLATE utf8mb4_general_ci NOT NULL,
  `duration_minutes` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `order_number` int NOT NULL,
  `created_at` date NOT NULL,
  `is_free` tinyint(1) NOT NULL DEFAULT '0',
  `lesson_type` enum('video','interactive_code','quiz','reading') COLLATE utf8mb4_general_ci DEFAULT 'video',
  `code_challenge` text COLLATE utf8mb4_general_ci COMMENT 'The coding challenge description',
  `starter_code` text COLLATE utf8mb4_general_ci COMMENT 'Initial code provided to student',
  `solution_code` text COLLATE utf8mb4_general_ci COMMENT 'Expected solution code',
  `validation_type` enum('exact_match','output_match','test_cases','regex_match') COLLATE utf8mb4_general_ci DEFAULT 'output_match',
  `expected_output` text COLLATE utf8mb4_general_ci COMMENT 'Expected output for validation',
  `test_cases` json DEFAULT NULL COMMENT 'Test cases for validation',
  `hints` json DEFAULT NULL COMMENT 'Hints to help students',
  `programming_language` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'javascript' COMMENT 'Language for the code challenge',
  `display_output` text COLLATE utf8mb4_general_ci COMMENT 'User friendly output display for regex validation',
  PRIMARY KEY (`lesson_id`)
) ENGINE=InnoDB AUTO_INCREMENT=231 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lessons`
--

LOCK TABLES `lessons` WRITE;
/*!40000 ALTER TABLE `lessons` DISABLE KEYS */;
INSERT INTO `lessons` VALUES (40,15,'Lesson 1 — Introduction to Algorithms','video','https://youtu.be/d7mJMSAEAGc','','0',1,'2025-11-15',1,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(41,15,'Lesson 2 — Algorithm Representation','video','https://youtu.be/BPrN3H_fHDQ','','0',2,'2025-11-15',1,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(42,16,'Lesson 3 — Variables, Types, and Operators','video','https://youtu.be/8kYNArhYrsg','','0',1,'2025-11-15',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(43,16,'Lesson 4 — Decision Structures','video','https://youtu.be/rBOTOpDWwi4','','0',2,'2025-11-15',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(44,16,'Lesson 5 — Loop Structures','video','https://youtu.be/A7wM6y5ieQg','','0',3,'2025-11-15',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(46,16,'Lesson 7 — Modular Algorithms','video','https://youtu.be/bUVMpEnDyJU','','0',6,'2025-11-15',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(47,16,'Lesson 8 — Recursion','video','https://youtu.be/YfMUNttUVAo','','0',7,'2025-11-15',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(48,16,'Lesson 6 — Nested Loop','video','https://youtu.be/A6Wd5u5KRAU','','0',5,'2025-11-15',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(49,16,'Exercices','video','https://youtu.be/g-aRRBDo3n0','','0',8,'2025-11-15',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(50,17,'Lesson 9 — Array Algorithms','video','https://youtu.be/JTI64y1tq2Q','','0',1,'2025-11-15',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(52,17,'Lesson 10 — Strings','video','https://youtu.be/suOYhPaoPXY','','0',3,'2025-11-16',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(56,20,'Easy level - Multi exercise','video','https://youtu.be/jVxGWdw8mCI','','0',4,'2025-11-17',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(57,20,'Medium Level - Multi exercises','video','https://youtu.be/H5COR_P85fc','','0',5,'2025-11-17',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(58,21,'Lesson C1 -- Intro and basics','video','https://youtu.be/99xBaRhL6xY','','0',1,'2025-11-20',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(59,21,'Lesson C2 -- Variables','video','https://youtu.be/EDlcO7TRptY','','0',2,'2025-11-20',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(60,21,'Lesson C3 -- Input, Arthmetic and  Logical','video','https://youtu.be/AU41PKvkGZs','','0',3,'2025-11-20',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(61,21,'Lesson C4 -- Small Program idea','video','https://youtu.be/hOFhNqn0DlI','','0',4,'2025-11-20',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(62,22,'Lesson 11 — FlowChart','video','https://youtu.be/9JXgArhL2Xg','','0',1,'2025-11-27',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(65,22,'Lesson 12 — Files','video','https://youtu.be/zi7NVGG2jw4','','0',2,'2025-11-27',0,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(68,2,'Declare Your First Variable','text','','','10',1,'2025-12-16',0,'interactive_code','Create a variable called \"message\" and assign it the value \"Hello JavaScript\". Then use console.log to display it.','// Write your code here\n\n\n','let message = \"Hello JavaScript\";\nconsole.log(message);','output_match','Hello JavaScript',NULL,'[\"Use let or const to declare variables\", \"Assign the string value using = operator\", \"Use console.log() to display the variable\"]','javascript',NULL),(69,2,'Create a Simple Function','text','','','25',2,'2025-12-16',0,'interactive_code','Create a function called \"greet\" that takes a name parameter and returns \"Hello, \" followed by the name. Then call it with \"Alice\".','// Define your function here\n\n\n// Call the function\nconsole.log(greet(\"Alice\"));','function greet(name) {\n    return \"Hello, \" + name;\n}\n\nconsole.log(greet(\"Alice\"));','output_match','Hello, Alice',NULL,'[\"Use the function keyword to define a function\", \"Use the return keyword to return a value\", \"Concatenate strings using the + operator\"]','javascript',NULL),(70,3,'Your First Python Program','text','','','5',1,'2025-12-16',0,'interactive_code','Use the print function to display \"Hello Python\" to the console.','# Write your code here\n\n','print(\"Hello Python\")','output_match','Hello Python',NULL,'[\"Use the print() function\", \"Put your text in quotes inside the parentheses\", \"Python is case-sensitive\"]','python',NULL),(79,23,'Lesson 1','video','youtube','','0',1,'2025-12-16',1,'video',NULL,NULL,NULL,'output_match',NULL,NULL,NULL,'javascript',NULL),(183,1,'CSS Syntax & Selectors','text','','<h3>CSS Basics</h3><p>CSS is used to style HTML. It uses <strong>selectors</strong> to target elements and <strong>blocks</strong> to define styles.</p><p>Syntax: <code>selector { property: value; }</code></p>','10',1,'2025-12-17',1,'interactive_code','Style the <h1> to have \"color: blue\" and \"text-align: center\".','/* Style the h1 */','h1 { color: blue; text-align: center; }','output_match','h1\\s*{\\s*color:\\s*blue;?.*text-align:\\s*center;?.*}',NULL,'[\"h1 { ... }\", \"color: blue;\", \"text-align: center;\"]','css','h1 {\r\n  color: blue;\r\n  text-align: center;\r\n}'),(184,1,'Colors & Backgrounds','text','','<h3>Colors</h3><p>Use <code>color</code> for text and <code>background-color</code> for backgrounds.</p><p>You can use names (red), HEX (#FF0000), or RGB (rgb(255,0,0)).</p>','15',2,'2025-12-17',1,'interactive_code','Set <body> background to \"#f0f0f0\" and <p> color to \"rgb(50,50,50)\".','/* Styles */','body { background-color: #f0f0f0; } p { color: rgb(50,50,50); }','output_match','body\\s*{.*background-color:\\s*#f0f0f0;?.*}.*p\\s*{.*color:\\s*rgb\\(50,\\s*50,\\s*50\\);?.*}',NULL,'[\"Use #f0f0f0\", \"Use rgb(50,50,50)\"]','css','body { background-color: #f0f0f0; }\r\np { color: rgb(50,50,50); }'),(185,1,'Typography Basics','text','','<h3>Fonts</h3><p>Control text size with <code>font-size</code> and weight with <code>font-weight</code>.</p>','15',3,'2025-12-17',1,'interactive_code','Set <h2> font-size to 24px and font-weight to \"bold\".','h2 {}','h2 { font-size: 24px; font-weight: bold; }','output_match','h2\\s*{.*font-size:\\s*24px;?.*font-weight:\\s*bold;?.*}',NULL,'[\"font-size: 24px\", \"font-weight: bold\"]','css','h2 {\r\n  font-size: 24px;\r\n  font-weight: bold;\r\n}'),(186,1,'Classes & IDs','text','','<h3>Select Specific Elements</h3><p><strong>.class</strong>: For groups (starts with dot).</p><p><strong>#id</strong>: For unique items (starts with hash).</p>','15',4,'2025-12-17',1,'interactive_code','Style class \".btn\" with \"padding: 10px\" and id \"#main\" with \"width: 100%\".','','.btn { padding: 10px; } #main { width: 100%; }','output_match','\\.btn\\s*{.*padding:\\s*10px;?.*}.*#main\\s*{.*width:\\s*100%;?.*}',NULL,'[\"Dot for class\", \"Hash for ID\"]','css','.btn { padding: 10px; }\r\n#main { width: 100%; }'),(187,1,'The Box Model','text','','<h3>Margin & Padding</h3><p><strong>Padding</strong>: Inside space.</p><p><strong>Margin</strong>: Outside space.</p>','20',5,'2025-12-17',1,'interactive_code','Give <div> 20px padding and 10px margin.','div {}','div { padding: 20px; margin: 10px; }','output_match','div\\s*{.*padding:\\s*20px;?.*margin:\\s*10px;?.*}',NULL,'[\"padding: 20px\", \"margin: 10px\"]','css','div { padding: 20px; margin: 10px; }'),(188,1,'Borders & Corners','text','','<h3>Borders</h3><p>Use <code>border: width style color</code>.</p><p>Use <code>border-radius</code> for rounded corners.</p>','15',6,'2025-12-17',1,'interactive_code','Give .card a \"1px solid #ccc\" border and \"8px\" border-radius.','.card {}','.card { border: 1px solid #ccc; border-radius: 8px; }','output_match','\\.card\\s*{.*border:\\s*1px\\s+solid\\s+#ccc;?.*border-radius:\\s*8px;?.*}',NULL,'[\"border: 1px solid #ccc\", \"border-radius: 8px\"]','css','.card {\r\n  border: 1px solid #ccc;\r\n  border-radius: 8px;\r\n}'),(189,1,'Box Shadows','text','','<h3>Depth</h3><p><code>box-shadow: x y blur color;</code> adds a shadow.</p>','15',7,'2025-12-17',1,'interactive_code','Add a shadow to .box: 5px x-offset, 5px y-offset, 10px blur, black color.','.box {}','.box { box-shadow: 5px 5px 10px black; }','output_match','\\.box\\s*{.*box-shadow:\\s*5px\\s+5px\\s+10px\\s+black;?.*}',NULL,'[\"Use box-shadow property\"]','css','.box { box-shadow: 5px 5px 10px black; }'),(190,1,'Text Formatting','text','','<h3>Text Control</h3><p><code>text-decoration: none</code> removes underlines from links.</p><p><code>text-transform: uppercase</code> capitalizes text.</p>','15',8,'2025-12-17',1,'interactive_code','Remove underline from <a> tags and make them uppercase.','a {}','a { text-decoration: none; text-transform: uppercase; }','output_match','a\\s*{.*text-decoration:\\s*none;?.*text-transform:\\s*uppercase;?.*}',NULL,'[\"text-decoration: none\"]','css','a { text-decoration: none; text-transform: uppercase; }'),(191,1,'Display Property','text','','<h3>Block vs Inline</h3><p><code>display: block</code> takes full width.</p><p><code>display: inline-block</code> sits on the same line but respects width/height.</p><p><code>display: none</code> hides element.</p>','15',9,'2025-12-17',0,'interactive_code','Make <span> behave as a block element.','span {}','span { display: block; }','output_match','span\\s*{.*display:\\s*block;?.*}',NULL,'[\"display: block\"]','css','span { display: block; }'),(192,1,'Link States','text','','<h3>Interactivity</h3><p>Target link states: <code>a:link, a:visited, a:hover, a:active</code>.</p>','15',10,'2025-12-17',0,'interactive_code','Change link color to \"red\" on hover.','a {}','a:hover { color: red; }','output_match','a:hover\\s*{.*color:\\s*red;?.*}',NULL,'[\"Use a:hover\"]','css','a:hover { color: red; }'),(193,1,'CSS Units','text','','<h3>Units</h3><p><strong>px</strong>: Fixed pixels.</p><p><strong>%</strong>: Relative to parent.</p><p><strong>rem</strong>: Relative to root font size.</p><p><strong>vh/vw</strong>: Viewport height/width.</p>','15',11,'2025-12-17',0,'interactive_code','Set .hero height to \"100vh\" and width to \"50%\".','.hero {}','.hero { height: 100vh; width: 50%; }','output_match','\\.hero\\s*{.*height:\\s*100vh;?.*width:\\s*50%;?.*}',NULL,'[\"100vh is full screen height\"]','css','.hero { height: 100vh; width: 50%; }'),(194,1,'Handling Overflow','text','','<h3>Overflow</h3><p>Control what happens when content is too big.</p><p><code>overflow: hidden</code> crops it.</p><p><code>overflow: scroll</code> adds scrollbars.</p>','15',12,'2025-12-17',0,'interactive_code','Set .container to separate axis: scroll vertically (overflow-y) and hide horizontally (overflow-x).','.container {}','.container { overflow-y: scroll; overflow-x: hidden; }','output_match','\\.container\\s*{.*overflow-y:\\s*scroll;?.*overflow-x:\\s*hidden;?.*}',NULL,'[\"overflow-y: scroll\", \"overflow-x: hidden\"]','css','.container { overflow-y: scroll; overflow-x: hidden; }'),(195,1,'Flexbox Container','text','','<h3>Flexbox</h3><p>Activate with <code>display: flex</code>.</p><p>Align horizontal with <code>justify-content: space-between</code>.</p>','20',13,'2025-12-17',0,'interactive_code','Create a flex container that spaces items equally.','.nav {}','.nav { display: flex; justify-content: space-between; }','output_match','\\.nav\\s*{.*display:\\s*flex;?.*justify-content:\\s*space-between;?.*}',NULL,'[\"display: flex\"]','css','.nav { display: flex; justify-content: space-between; }'),(196,1,'Flexbox Vertical','text','','<h3>Vertical Align</h3><p>Use <code>align-items</code> to control cross-axis alignment.</p>','15',14,'2025-12-17',0,'interactive_code','Center items vertically in .row.','.row { display: flex; height: 100px; }','.row { display: flex; height: 100px; align-items: center; }','output_match','\\.row\\s*{.*align-items:\\s*center;?.*}',NULL,'[\"align-items: center\"]','css','.row { align-items: center; }'),(197,1,'Flex Direction','text','','<h3>Direction</h3><p>Change axis with <code>flex-direction: column</code> to stack items.</p>','15',15,'2025-12-17',0,'interactive_code','Stack items in .sidebar vertically.','.sidebar { display: flex; }','.sidebar { display: flex; flex-direction: column; }','output_match','\\.sidebar\\s*{.*flex-direction:\\s*column;?.*}',NULL,'[\"flex-direction: column\"]','css','.sidebar { flex-direction: column; }'),(198,1,'Flex Wrap','text','','<h3>Wrapping</h3><p>Allow items to move to next line with <code>flex-wrap: wrap</code>.</p>','15',16,'2025-12-17',0,'interactive_code','Allow .gallery items to wrap.','.gallery { display: flex; }','.gallery { display: flex; flex-wrap: wrap; }','output_match','\\.gallery\\s*{.*flex-wrap:\\s*wrap;?.*}',NULL,'[\"flex-wrap: wrap\"]','css','.gallery { flex-wrap: wrap; }'),(199,1,'Flex Grow','text','','<h3>Sizing</h3><p><code>flex-grow: 1</code> makes an item expand to fill space.</p>','15',17,'2025-12-17',0,'interactive_code','Make .main-content take up all remaining space.','.main-content {}','.main-content { flex-grow: 1; }','output_match','\\.main-content\\s*{.*flex-grow:\\s*1;?.*}',NULL,'[\"flex-grow: 1\"]','css','.main-content { flex-grow: 1; }'),(200,1,'Grid Intro','text','','<h3>CSS Grid</h3><p><code>display: grid</code>.</p><p><code>grid-template-columns: 1fr 1fr</code> creates two equal columns.</p>','20',18,'2025-12-17',0,'interactive_code','Create a 3-column grid (1fr each).','.grid {}','.grid { display: grid; grid-template-columns: 1fr 1fr 1fr; }','output_match','\\.grid\\s*{.*display:\\s*grid;?.*grid-template-columns:\\s*1fr\\s+1fr\\s+1fr;?.*}',NULL,'[\"1fr 1fr 1fr\"]','css','.grid {\r\n  display: grid;\r\n  grid-template-columns: 1fr 1fr 1fr;\r\n}'),(201,1,'Grid Gap','text','','<h3>Spacing</h3><p>Use <code>gap</code> to add space between grid items.</p>','10',19,'2025-12-17',0,'interactive_code','Add 20px gap to grid.','.grid { display: grid; }','.grid { display: grid; gap: 20px; }','output_match','\\.grid\\s*{.*gap:\\s*20px;?.*}',NULL,'[\"Use gap property\"]','css','.grid { gap: 20px; }'),(202,1,'Grid Spanning','text','','<h3>Spanning</h3><p>Make an item span multiple columns: <code>grid-column: span 2;</code></p>','15',20,'2025-12-17',0,'interactive_code','Make .header span 3 columns.','.header {}','.header { grid-column: span 3; }','output_match','\\.header\\s*{.*grid-column:\\s*span\\s+3;?.*}',NULL,'[\"grid-column property\"]','css','.header { grid-column: span 3; }'),(203,1,'Position Absolute','text','','<h3>Absolute Position</h3><p>Removed from flow. Position relative to nearest positioned ancester.</p><p>Use <code>top, left, right, bottom</code>.</p>','20',21,'2025-12-17',0,'interactive_code','Place .badge 5px from top and right of its parent.','.badge {}','.badge { position: absolute; top: 5px; right: 5px; }','output_match','\\.badge\\s*{.*position:\\s*absolute;?.*top:\\s*5px;?.*right:\\s*5px;?.*}',NULL,'[\"position: absolute\"]','css','.badge { position: absolute; top: 5px; right: 5px; }'),(204,1,'Fixed & Sticky','text','','<h3>Fixed vs Sticky</h3><p><strong>Fixed</strong>: Stuck to viewport.</p><p><strong>Sticky</strong>: Sticks when you scroll past it.</p>','15',22,'2025-12-17',0,'interactive_code','Fix the #navbar to the top of the screen (top: 0).','#navbar {}','#navbar { position: fixed; top: 0; }','output_match','#navbar\\s*{.*position:\\s*fixed;?.*top:\\s*0;?.*}',NULL,'[\"position: fixed\"]','css','#navbar { position: fixed; top: 0; }'),(205,1,'Layering with Z-Index','text','','<h3>Stacking Order</h3><p>Higher <code>z-index</code> stays on top. Only works on positioned elements.</p>','15',23,'2025-12-17',0,'interactive_code','Ensure .modal appears on top with z-index 999.','.modal { position: absolute; }','.modal { position: absolute; z-index: 999; }','output_match','\\.modal\\s*{.*z-index:\\s*999;?.*}',NULL,'[\"z-index: 999\"]','css','.modal { z-index: 999; }'),(206,1,'Pseudo-elements','text','','<h3>Inserting Content</h3><p><code>::before</code> inserts content before an element.</p><p>Requires <code>content: \"\"</code> property.</p>','20',24,'2025-12-17',0,'interactive_code','Add \">> \" before every .link.','.link {}','.link::before { content: \">> \"; }','output_match','\\.link::before\\s*{.*content:\\s*\">> \";?.*}',NULL,'[\"Use double colons ::before\"]','css','.link::before { content: \">> \"; }'),(207,1,'Nth-Child Selector','text','','<h3>Selecting Patterns</h3><p><code>:nth-child(even)</code> selects even items.</p><p><code>:nth-child(2)</code> selects the second item.</p>','15',25,'2025-12-17',0,'interactive_code','Select every even <li> row to give it background \"grey\".','li {}','li:nth-child(even) { background: grey; }','output_match','li:nth-child\\(even\\)\\s*{.*background:\\s*grey;?.*}',NULL,'[\"li:nth-child(even)\"]','css','li:nth-child(even) { background: grey; }'),(208,1,'Attribute Selectors','text','','<h3>Attribute Matching</h3><p><code>input[type=\"text\"]</code> selects specific inputs.</p>','15',26,'2025-12-17',0,'interactive_code','Style inputs with type=\"submit\" to be bold.','input {}','input[type=\"submit\"] { font-weight: bold; }','output_match','input\\[type=[\"\']submit[\"\']\\]\\s*{.*font-weight:\\s*bold;?.*}',NULL,'[\"Square brackets [ ]\"]','css','input[type=\"submit\"] { font-weight: bold; }'),(209,1,'Transparency','text','','<h3>See-Through</h3><p><code>opacity: 0.5</code> makes element 50% transparent.</p><p><code>rgba(0,0,0,0.5)</code> is for color transparency.</p>','10',27,'2025-12-17',0,'interactive_code','Set .ghost opacity to 0.5.','.ghost {}','.ghost { opacity: 0.5; }','output_match','\\.ghost\\s*{.*opacity:\\s*0\\.5;?.*}',NULL,'[\"Value between 0 and 1\"]','css','.ghost { opacity: 0.5; }'),(210,1,'Gradients','text','','<h3>Linear Gradient</h3><p>background: <code>linear-gradient(direction, color1, color2)</code>.</p>','20',28,'2025-12-17',0,'interactive_code','Make body background a linear-gradient from blue to purple.','body {}','body { background: linear-gradient(blue, purple); }','output_match','body\\s*{.*background:\\s*linear-gradient\\(blue,\\s*purple\\);?.*}',NULL,'[\"blue, purple\"]','css','body { background: linear-gradient(blue, purple); }'),(211,1,'Transitions','text','','<h3>Smooth Changes</h3><p><code>transition: property time ease</code>.</p>','15',29,'2025-12-17',0,'interactive_code','Animate \"background\" color over \"0.5s\" on .btn.','.btn {}','.btn { transition: background 0.5s; }','output_match','\\.btn\\s*{.*transition:\\s*background\\s+0\\.5s;?.*}',NULL,'[\"transition property\"]','css','.btn { transition: background 0.5s; }'),(212,1,'Transforms','text','','<h3>Modification</h3><p><code>transform: rotate(90deg)</code>.</p>','15',30,'2025-12-17',0,'interactive_code','Rotate .icon by 180 degrees.','.icon {}','.icon { transform: rotate(180deg); }','output_match','\\.icon\\s*{.*transform:\\s*rotate\\(180deg\\);?.*}',NULL,'[\"Use deg unit\"]','css','.icon { transform: rotate(180deg); }'),(213,1,'Scale Transform','text','','<h3>Resizing</h3><p><code>transform: scale(1.5)</code> grows element by 1.5x.</p>','10',31,'2025-12-17',0,'interactive_code','Double the size of .image on hover (scale 2).','.image:hover {}','.image:hover { transform: scale(2); }','output_match','\\.image:hover\\s*{.*transform:\\s*scale\\(2\\);?.*}',NULL,'[\"No units for scale\"]','css','.image:hover { transform: scale(2); }'),(214,1,'Keyframes','text','','<h3>Custom Animation</h3><p>Define with <code>@keyframes name { from {} to {} }</code>.</p>','20',32,'2025-12-17',0,'interactive_code','Define @keyframes \"fade\" that goes from opacity 0 to opacity 1.','','@keyframes fade { from { opacity: 0; } to { opacity: 1; } }','output_match','@keyframes\\s*fade\\s*{\\s*from\\s*{\\s*opacity:\\s*0;?\\s*}\\s*to\\s*{\\s*opacity:\\s*1;?\\s*}\\s*}',NULL,'[\"Use from and to\"]','css','@keyframes fade {\r\n  from { opacity: 0; }\r\n  to { opacity: 1; }\r\n}'),(215,1,'Running Animations','text','','<h3>Usage</h3><p><code>animation: name duration infinite;</code></p>','15',33,'2025-12-17',0,'interactive_code','Apply animation \"spin\" for \"2s\" infinitely to .loader.','.loader {}','.loader { animation: spin 2s infinite; }','output_match','\\.loader\\s*{.*animation:\\s*spin\\s+2s\\s+infinite;?.*}',NULL,'[\"Order: name duration loop\"]','css','.loader { animation: spin 2s infinite; }'),(216,1,'Variables','text','','<h3>Custom Properties</h3><p>Define: <code>--main: blue;</code>.</p><p>Use: <code>var(--main)</code>.</p>','15',34,'2025-12-17',0,'interactive_code','Define --color: red in :root and apply it to h1.',':root {} h1 {}',':root { --color: red; } h1 { color: var(--color); }','output_match',':root\\s*{.*--color:\\s*red;?.*}.*h1\\s*{.*color:\\s*var\\(--color\\);?.*}',NULL,'[\"Starts with --\"]','css',':root { --color: red; }\r\nh1 { color: var(--color); }'),(217,1,'Media Queries','text','','<h3>Responsive</h3><p><code>@media (max-width: 600px) { ... }</code>.</p>','20',35,'2025-12-17',0,'interactive_code','Hide .sidebar when screen is max-width 768px.','','@media (max-width: 768px) { .sidebar { display: none; } }','output_match','@media\\s*\\(\\s*max-width:\\s*768px\\s*\\)\\s*{\\s*\\.sidebar\\s*{\\s*display:\\s*none;?\\s*}\\s*}',NULL,'[\"Check brackets carefully\"]','css','@media (max-width: 768px) {\r\n  .sidebar { display: none; }\r\n}'),(218,1,'Text and Paragraphs','text','','<h3>HTML Text Basics</h3><p>HTML uses tags to structure text. The <code>&lt;p&gt;</code> tag defines a paragraph block.</p><p>To create a line break without starting a new paragraph, use the <code>&lt;br&gt;</code> tag.</p><p>You can also format text using tags like <code>&lt;b&gt;</code> for <strong>bold</strong> text.</p>','10',1,'2025-12-20',0,'interactive_code','Create a paragraph using the <p> tag with the text \"Hello World\". Also add a line break <br> and a bold text <b>Bold</b>.','<!DOCTYPE html>\n<html>\n<body>\n    <!-- Add your code here -->\n    \n</body>\n</html>','<!DOCTYPE html>\n<html>\n<body>\n    <p>Hello World</p>\n    <br>\n    <b>Bold</b>\n</body>\n</html>','regex_match','<p>.*Hello World.*</p>.*<br>.*<b>.*Bold.*</b>',NULL,'[\"Use the <p> tag for paragraphs\", \"Use <br> for line breaks\", \"Use <b> or <strong> for bold text\"]','html','<p>Hello World</p>\n<br>\n<b>Bold</b>'),(219,1,'Working with Images','text','','<h3>Displaying Images</h3><p>Images are added using the <code>&lt;img&gt;</code> tag. This tag is self-closing, meaning it does not have a closing tag.</p><p>Important attributes:</p><ul><li><code>src</code>: The path to the image file (URL or local path).</li><li><code>alt</code>: Alternative text description for accessibility and SEO.</li></ul>','15',2,'2025-12-20',0,'interactive_code','Add an image to the page. Use the src attribute to point to \"logo.png\" and add an alt attribute \"Logo\".','<!DOCTYPE html>\n<body>\n    <h1>My Gallery</h1>\n    <!-- Add image here -->\n    \n</body>','<!DOCTYPE html>\n<body>\n    <h1>My Gallery</h1>\n    <img src=\"logo.png\" alt=\"Logo\">\n</body>','regex_match','<img\\s+src=[\"\']logo\\.png[\"\'].*alt=[\"\']Logo[\"\']',NULL,'[\"The input tag is <img> (self-closing)\", \"Use src=\'\'...\'\' for the source\", \"Use alt=\'\'...\'\' for the description\"]','html','<img src=\"logo.png\" alt=\"Logo\">'),(220,1,'Links and Anchors','text','','<h3>Hyperlinks</h3><p>Links allow users to navigate between pages. They are created using the <code>&lt;a&gt;</code> (anchor) tag.</p><p>Key attributes:</p><ul><li><code>href</code>: The destination URL the link points to.</li><li><code>target</code>: Where to open the link. <code>_blank</code> opens it in a new tab.</li></ul>','15',3,'2025-12-20',0,'interactive_code','Create a link to \"https://google.com\" with the text \"Search\". make it open in a new tab using target=\"_blank\".','<!DOCTYPE html>\n<body>\n    <!-- Add link here -->\n    \n</body>','<!DOCTYPE html>\n<body>\n    <a href=\"https://google.com\" target=\"_blank\">Search</a>\n</body>','regex_match','<a\\s+href=[\"\']https://google\\.com[\"\'].*target=[\"\']_blank[\"\']>.*Search.*</a>',NULL,'[\"Use the <a> tag\", \"The href attribute specifies the URL\", \"target=\'\'_blank\'\' opens in a new tab\"]','html','<a href=\"https://google.com\" target=\"_blank\">Search</a>'),(221,1,'Ordered and Unordered Lists','text','','<h3>HTML Lists</h3><p>There are two main types of lists in HTML:</p><ul><li><strong>Unordered List &lt;ul&gt;:</strong> Items are marked with bullets.</li><li><strong>Ordered List &lt;ol&gt;:</strong> Items are marked with numbers.</li></ul><p>Inside both list types, each item is defined with the <code>&lt;li&gt;</code> (list item) tag.</p>','20',4,'2025-12-20',0,'interactive_code','Create an unordered list (ul) with 3 items: \"Apple\", \"Banana\", \"Cherry\".','<!DOCTYPE html>\n<body>\n    <h3>Shopping List</h3>\n    <!-- Add list here -->\n    \n</body>','<!DOCTYPE html>\n<body>\n    <h3>Shopping List</h3>\n    <ul>\n        <li>Apple</li>\n        <li>Banana</li>\n        <li>Cherry</li>\n    </ul>\n</body>','regex_match','<ul>.*<li>.*Apple.*</li>.*<li>.*Banana.*</li>.*<li>.*Cherry.*</li>.*</ul>',NULL,'[\"Use <ul> for the list container\", \"Use <li> for each list item\", \"Close all tags correctly\"]','html','<ul>\n    <li>Apple</li>\n    <li>Banana</li>\n    <li>Cherry</li>\n</ul>'),(222,1,'Forms: Inputs & Buttons','text','','<h3>Forms and Inputs</h3><p>Forms allow users to interact with your webpage. The <code>&lt;input&gt;</code> tag is the most common form element.</p><p>Common input types:</p><ul><li><code>text</code>: Single-line text field.</li><li><code>email</code>: Validates email addresses.</li><li><code>password</code>: Hides characters.</li></ul><p>Use the <code>&lt;button&gt;</code> tag to submit forms.</p>','20',5,'2025-12-20',0,'interactive_code','Create a simple login form. Add an input of type \"email\" with placeholder \"Email\", and a button that says \"Login\".','<!DOCTYPE html>\n<body>\n    <h2>Login</h2>\n    <!-- Add input and button here -->\n    \n</body>','<!DOCTYPE html>\n<body>\n    <h2>Login</h2>\n    <input type=\"email\" placeholder=\"Email\">\n    <button>Login</button>\n</body>','regex_match','<input.*type=[\"\']email[\"\'].*placeholder=[\"\']Email[\"\'].*>.*<button>.*Login.*</button>',NULL,'[\"Use <input type=\'\'email\'\'>\", \"Use the placeholder attribute\", \"The <button> tag needs closing\"]','html','<input type=\"email\" placeholder=\"Email\">\n<button>Login</button>'),(223,1,'Semantic Structure','text','','<h3>Semantic HTML</h3><p>Semantic tags describe the <em>meaning</em> of the content rather than just its appearance. This helps search engines and screen readers understand your page.</p><p>Common semantic tags:</p><ul><li><code>&lt;header&gt;</code>: Introductory content or navigation.</li><li><code>&lt;main&gt;</code>: The dominant content of the page.</li><li><code>&lt;footer&gt;</code>: Copyright, contact info, etc.</li></ul>','25',6,'2025-12-20',0,'interactive_code','Structure a page using <header>, <main>, and<footer> tags. Put \"Welcome\" in header, \"Content\" in main, and \"Copyright\" in footer.','<!DOCTYPE html>\n<body>\n    <!-- Add semantic tags -->\n    \n</body>','<!DOCTYPE html>\n<body>\n    <header>Welcome</header>\n    <main>Content</main>\n    <footer>Copyright</footer>\n</body>','regex_match','<header>.*Welcome.*</header>.*<main>.*Content.*</main>.*<footer>.*Copyright.*</footer>',NULL,'[\"Semantic tags help describe content meaning\", \"<header> is for top content\", \"<main> is for body content\", \"<footer> is for bottom content\"]','html','<header>Welcome</header>\n<main>Content</main>\n<footer>Copyright</footer>'),(224,1,'Divs and Spans','text','','<h3>Grouping Elements</h3><p><code>&lt;div&gt;</code> is a block-level container used to group larger sections of content.</p><p><code>&lt;span&gt;</code> is an inline container used to group text or smaller elements within a line.</p>','15',7,'2025-12-20',0,'interactive_code','Wrap the text \"Header\" in a <div> code, and the word \"blue\" in a <span> code.','<!DOCTYPE html>\n<body>\n    Header\n    <p>I am blue</p>\n</body>','<!DOCTYPE html>\n<body>\n    <div>Header</div>\n    <p>I am <span>blue</span></p>\n</body>','regex_match','<div>\\s*Header\\s*</div>.*<span>\\s*blue\\s*</span>',NULL,'[\"<div> is for blocks\", \"<span> is for inline text\"]','html','<div>Header</div>\n<p>I am <span>blue</span></p>'),(225,1,'IDs and Classes','text','','<h3>Global Attributes</h3><p><code>id</code>: A unique identifier for an element (used by CSS/JS). Each ID must be unique on the page.</p><p><code>class</code>: A name used to group multiple elements (used by CSS).</p>','15',8,'2025-12-20',0,'interactive_code','Add an id=\"main-title\" to the <h1> tag, and class=\"highlight\" to the <p> tag.','<!DOCTYPE html>\n<body>\n    <h1>Welcome</h1>\n    <p>Important text</p>\n</body>','<!DOCTYPE html>\n<body>\n    <h1 id=\"main-title\">Welcome</h1>\n    <p class=\"highlight\">Important text</p>\n</body>','regex_match','<h1\\s+id=[\"\']main-title[\"\'].*>.*<p\\s+class=[\"\']highlight[\"\'].*>',NULL,'[\"Attributes go inside the opening tag\", \"id=\\\"...\\\"\", \"class=\\\"...\\\"\"]','html','<h1 id=\"main-title\">Welcome</h1>\n<p class=\"highlight\">Important text</p>'),(226,1,'HTML Tables','text','','<h3>Creating Tables</h3><p>Tables are defined with <code>&lt;table&gt;</code>.</p><ul><li><code>&lt;tr&gt;</code>: Table Row</li><li><code>&lt;td&gt;</code>: Table Data (cell)</li><li><code>&lt;th&gt;</code>: Table Header (bold and centered)</li></ul>','20',9,'2025-12-20',0,'interactive_code','Create a table with one row (tr). Inside the row, add two cells (td): \"Name\" and \"Score\".','<!DOCTYPE html>\n<body>\n    <!-- Create table here -->\n    \n</body>','<!DOCTYPE html>\n<body>\n    <table>\n        <tr>\n            <td>Name</td>\n            <td>Score</td>\n        </tr>\n    </table>\n</body>','regex_match','<table>.*<tr>.*<td>.*Name.*</td>.*<td>.*Score.*</td>.*</tr>.*</table>',NULL,'[\"Start with <table>\", \"Add a <tr> inside\", \"Add two <td> inside the <tr>\"]','html','<table>\n    <tr>\n        <td>Name</td>\n        <td>Score</td>\n    </tr>\n</table>'),(227,1,'Checkboxes and Radios','text','','<h3>Selection Inputs</h3><p><code>type=\"checkbox\"</code>: Allows selecting multiple options.</p><p><code>type=\"radio\"</code>: Allows selecting only one option from a group (radio buttons must share the same <code>name</code> attribute).</p>','15',10,'2025-12-20',0,'interactive_code','Create a checkbox for \"Subscribe\" and a radio button for \"Gender\" with name=\"gender\".','<!DOCTYPE html>\n<body>\n    <form>\n        <!-- Add inputs here -->\n        \n    </form>\n</body>','<!DOCTYPE html>\n<body>\n    <form>\n        <input type=\"checkbox\"> Subscribe\n        <input type=\"radio\" name=\"gender\"> Male\n    </form>\n</body>','regex_match','<input\\s+type=[\"\']checkbox[\"\'].*>.*<input\\s+type=[\"\']radio[\"\']\\s+name=[\"\']gender[\"\'].*>',NULL,'[\"Use <input type=\\\"checkbox\\\">\", \"Use <input type=\\\"radio\\\" name=\\\"gender\\\">\"]','html','<form>\n    <input type=\"checkbox\"> Subscribe\n    <input type=\"radio\" name=\"gender\"> Male\n</form>'),(228,1,'Dropdowns and Text Areas','text','','<h3>More Form Elements</h3><p><code>&lt;select&gt;</code>: Creates a dropdown list. Options are defined with <code>&lt;option&gt;</code>.</p><p><code>&lt;textarea&gt;</code>: A multi-line text input field.</p>','15',11,'2025-12-20',0,'interactive_code','Create a <select> dropdown with an option \"Yes\", and a <textarea> below it.','<!DOCTYPE html>\n<body>\n    <form>\n        <!-- Add select and textarea here -->\n        \n    </form>\n</body>','<!DOCTYPE html>\n<body>\n    <form>\n        <select>\n            <option>Yes</option>\n        </select>\n        <textarea></textarea>\n    </form>\n</body>','regex_match','<select>.*<option>.*Yes.*</option>.*</select>.*<textarea>.*</textarea>',NULL,'[\"Use <select> and <option>\", \"Use <textarea></textarea> (it usually has a closing tag)\"]','html','<select>\n    <option>Yes</option>\n</select>\n<textarea></textarea>'),(229,1,'Multimedia: Video','text','','<h3>Video and Audio</h3><p>HTML5 introduced native support for media.</p><p>Use the <code>&lt;video&gt;</code> or <code>&lt;audio&gt;</code> tags. The <code>controls</code> attribute adds play/pause buttons.</p>','20',12,'2025-12-20',0,'interactive_code','Add a <video> tag with src=\"movie.mp4\" and the \"controls\" attribute.','<!DOCTYPE html>\n<body>\n    <h3>My Movie</h3>\n    <!-- Add video tag here -->\n    \n</body>','<!DOCTYPE html>\n<body>\n    <h3>My Movie</h3>\n    <video src=\"movie.mp4\" controls></video>\n</body>','regex_match','<video\\s+src=[\"\']movie\\.mp4[\"\']\\s+controls.*>.*</video>',NULL,'[\"<video src=\\\"...\\\" controls></video>\", \"Don\'t forget the closing tag\"]','html','<video src=\"movie.mp4\" controls></video>'),(230,1,'HTML Comments','text','','<h3>Comments</h3><p>Comments are not displayed in the browser but help developers understand the code.</p><p>Syntax: <code>&lt;!-- This is a comment --&gt;</code></p>','10',13,'2025-12-20',0,'interactive_code','Add a comment that says \"TODO: Add style\".','<!DOCTYPE html>\n<body>\n    <h1>Work in Progress</h1>\n    <!-- Add comment below -->\n    \n</body>','<!DOCTYPE html>\n<body>\n    <h1>Work in Progress</h1>\n    <!-- TODO: Add style -->\n</body>','regex_match','<!--\\s*TODO:\\s*Add style\\s*-->',NULL,'[\"Starts with <!--\", \"Ends with -->\"]','html','<!-- TODO: Add style -->');
/*!40000 ALTER TABLE `lessons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `path_lessons`
--

DROP TABLE IF EXISTS `path_lessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `path_lessons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `path_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `order_number` int NOT NULL,
  `is_locked` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_path_lesson` (`path_id`,`lesson_id`),
  KEY `lesson_id` (`lesson_id`),
  KEY `idx_path_order` (`path_id`,`order_number`),
  CONSTRAINT `path_lessons_ibfk_1` FOREIGN KEY (`path_id`) REFERENCES `learning_paths` (`id`) ON DELETE CASCADE,
  CONSTRAINT `path_lessons_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`lesson_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=165 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `path_lessons`
--

LOCK TABLES `path_lessons` WRITE;
/*!40000 ALTER TABLE `path_lessons` DISABLE KEYS */;
INSERT INTO `path_lessons` VALUES (3,2,68,1,0),(4,2,69,2,0),(5,3,70,1,0),(117,4,183,1,0),(118,4,184,2,0),(119,4,185,3,0),(120,4,186,4,0),(121,4,187,5,0),(122,4,188,6,0),(123,4,189,7,0),(124,4,190,8,0),(125,4,191,9,0),(126,4,192,10,0),(127,4,193,11,0),(128,4,194,12,0),(129,4,195,13,0),(130,4,196,14,0),(131,4,197,15,0),(132,4,198,16,0),(133,4,199,17,0),(134,4,200,18,0),(135,4,201,19,0),(136,4,202,20,0),(137,4,203,21,0),(138,4,204,22,0),(139,4,205,23,0),(140,4,206,24,0),(141,4,207,25,0),(142,4,208,26,0),(143,4,209,27,0),(144,4,210,28,0),(145,4,211,29,0),(146,4,212,30,0),(147,4,213,31,0),(148,4,214,32,0),(149,4,215,33,0),(150,4,216,34,0),(151,4,217,35,0),(152,1,218,1,0),(153,1,219,2,0),(154,1,220,3,0),(155,1,221,4,0),(156,1,222,5,0),(157,1,223,6,0),(158,1,224,7,0),(159,1,225,8,0),(160,1,226,9,0),(161,1,227,10,0),(162,1,228,11,0),(163,1,229,12,0),(164,1,230,13,0);
/*!40000 ALTER TABLE `path_lessons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_info`
--

DROP TABLE IF EXISTS `payment_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `method` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `info_text` text COLLATE utf8mb4_general_ci NOT NULL,
  `contact_info` text COLLATE utf8mb4_general_ci COMMENT 'JSON format for contact details',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_method` (`method`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_info`
--

LOCK TABLES `payment_info` WRITE;
/*!40000 ALTER TABLE `payment_info` DISABLE KEYS */;
INSERT INTO `payment_info` VALUES (1,'ccp','CCP (Postal Check)','Please transfer the amount to our CCP account and upload the proof of payment.','{\"rip_baridimob\":\"00799999002692070112\",\"ccp_account\":\"002692070112\",\"name\":\"Melihi Akram\",\"city\":\"Chlef\",\"note\":\"Veuillez envoyer le reçu de paiement via WhatsApp ou par mail après le transfert.\"}',1,'2025-12-21 16:34:46','2025-12-22 12:15:27'),(2,'baridimob','Baridimob','Please transfer the amount via Baridimob and upload the proof of payment.','{\"rip_baridimob\":\"00799999002692070112\",\"ccp_account\":\"002692070112\",\"name\":\"Melihi Akram\",\"city\":\"Chlef\",\"note\":\"Veuillez envoyer le reçu de paiement via WhatsApp ou par mail après le transfert.\"}',1,'2025-12-21 16:34:46','2025-12-22 12:15:27'),(3,'whatsapp','WhatsApp Payment','Contact us via WhatsApp to complete your payment.','{\"phone\": \"213540921726\", \"message\": \"Hello, I want to pay for course\"}',1,'2025-12-21 16:34:46','2025-12-22 13:51:18');
/*!40000 ALTER TABLE `payment_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_proofs`
--

DROP TABLE IF EXISTS `payment_proofs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_proofs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `proof_type` varchar(50) DEFAULT NULL,
  `file_url` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payment_id` (`payment_id`),
  CONSTRAINT `payment_proofs_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_proofs`
--

LOCK TABLES `payment_proofs` WRITE;
/*!40000 ALTER TABLE `payment_proofs` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_proofs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `course_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'slickpay_edahabia, slickpay_cib, ccp, baridimob, whatsapp',
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending' COMMENT 'pending, completed, failed, cancelled',
  `transaction_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Slick Pay transaction ID or reference',
  `payment_reference` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'CCP/Baridimob reference number',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `payment_type` enum('course','membership') COLLATE utf8mb4_general_ci DEFAULT 'course',
  `membership_plan` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_client_id` (`client_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `progress`
--

DROP TABLE IF EXISTS `progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `completed` tinyint(1) NOT NULL,
  `completation_date` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `progress`
--

LOCK TABLES `progress` WRITE;
/*!40000 ALTER TABLE `progress` DISABLE KEYS */;
INSERT INTO `progress` VALUES (3,5,3,1,'2025-11-08'),(4,5,40,1,'2025-11-15'),(5,8,40,1,'2025-11-18'),(6,8,41,1,'2025-11-18'),(7,9,40,1,'2025-11-24'),(8,10,41,1,'2025-11-24'),(9,10,40,1,'2025-11-24'),(10,11,40,1,'2025-11-24'),(11,11,48,1,'2025-11-24'),(15,11,62,1,'2025-11-27'),(18,15,40,1,'2025-12-01'),(19,19,40,1,'2025-12-14'),(20,19,41,1,'2025-12-14'),(21,19,42,1,'2025-12-14'),(22,19,43,1,'2025-12-14'),(23,19,44,1,'2025-12-14'),(24,19,48,1,'2025-12-15'),(25,19,46,1,'2025-12-15'),(26,19,58,1,'2025-12-15'),(27,20,44,1,'2025-12-16'),(28,3,66,1,'2025-12-16'),(29,3,66,1,'2025-12-16'),(30,3,68,1,'2025-12-16'),(31,3,66,1,'2025-12-16'),(32,3,66,1,'2025-12-16'),(33,3,66,1,'2025-12-16'),(34,3,66,1,'2025-12-16'),(35,3,66,1,'2025-12-16'),(36,3,67,1,'2025-12-16'),(37,3,70,1,'2025-12-16'),(38,3,66,1,'2025-12-16'),(39,3,66,1,'2025-12-16'),(40,3,145,1,'2025-12-17'),(41,3,183,1,'2025-12-17'),(42,22,40,1,'2025-12-18'),(43,22,41,1,'2025-12-18'),(44,22,42,1,'2025-12-18'),(45,22,43,1,'2025-12-18'),(46,3,132,1,'2025-12-19'),(47,3,145,1,'2025-12-19'),(48,3,145,1,'2025-12-19'),(49,3,183,1,'2025-12-19'),(50,3,133,1,'2025-12-19'),(51,3,218,1,'2025-12-20'),(52,22,44,1,'2025-12-21'),(53,22,44,1,'2025-12-21'),(54,22,49,1,'2025-12-22'),(55,22,56,1,'2025-12-22'),(56,3,68,1,'2025-12-23'),(57,3,184,1,'2025-12-23'),(58,3,185,1,'2025-12-23'),(59,3,186,1,'2025-12-23'),(60,3,187,1,'2025-12-23'),(61,3,188,1,'2025-12-23'),(62,3,189,1,'2025-12-23'),(63,3,190,1,'2025-12-23'),(64,3,190,1,'2025-12-23'),(65,3,219,1,'2025-12-23');
/*!40000 ALTER TABLE `progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `course_id` int NOT NULL,
  `purchase_date` date NOT NULL,
  `paid` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_purchase_date` (`purchase_date`),
  KEY `idx_client_id` (`client_id`),
  KEY `idx_course_id` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
INSERT INTO `purchases` VALUES (7,8,5,'2025-11-18',1),(8,9,5,'2025-11-21',1),(9,10,5,'2025-11-23',1),(10,11,5,'2025-11-24',1),(16,15,5,'2025-12-01',1),(17,16,5,'2025-12-04',1),(18,17,5,'2025-12-11',1),(19,18,5,'2025-12-12',1),(20,19,5,'2025-12-14',1),(21,20,5,'2025-12-16',1),(22,21,5,'2025-12-17',1),(23,22,5,'2025-12-18',1),(24,23,5,'2025-12-18',1),(25,25,5,'2025-12-21',1),(27,3,0,'2025-12-23',1);
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_attempts`
--

DROP TABLE IF EXISTS `quiz_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `question_id` int NOT NULL,
  `selected_answer` varchar(1) NOT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `time_spent_seconds` int DEFAULT '0',
  `attempted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attempt` (`session_id`,`question_id`),
  KEY `question_id` (`question_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_correct` (`is_correct`),
  CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quiz_attempts_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_attempts`
--

LOCK TABLES `quiz_attempts` WRITE;
/*!40000 ALTER TABLE `quiz_attempts` DISABLE KEYS */;
INSERT INTO `quiz_attempts` VALUES (1,1,63,'B',1,0,'2025-12-01 22:23:22'),(2,1,64,'B',0,0,'2025-12-01 22:28:47'),(3,1,65,'B',1,0,'2025-12-01 22:28:58'),(4,2,23,'B',1,0,'2025-12-01 22:29:47'),(5,2,24,'A',0,0,'2025-12-01 22:29:57'),(6,1,66,'B',1,0,'2025-12-01 22:37:37'),(7,1,67,'B',1,0,'2025-12-01 22:37:47'),(8,1,68,'D',0,0,'2025-12-01 22:37:51'),(9,3,63,'B',1,0,'2025-12-01 22:38:25'),(10,3,64,'A',0,0,'2025-12-01 22:38:31'),(11,4,63,'B',1,0,'2025-12-01 22:41:47'),(12,4,64,'C',1,0,'2025-12-01 22:41:52'),(13,4,65,'B',1,0,'2025-12-01 22:41:59'),(14,4,66,'B',1,0,'2025-12-01 22:42:07'),(15,4,67,'D',0,0,'2025-12-01 22:42:15'),(16,4,68,'C',1,0,'2025-12-02 10:49:57'),(17,4,69,'A',1,0,'2025-12-02 10:50:05'),(18,4,70,'C',0,0,'2025-12-02 10:50:11'),(19,7,63,'A',0,0,'2025-12-16 15:30:17'),(20,8,63,'B',1,0,'2025-12-18 14:41:15'),(21,8,64,'A',0,0,'2025-12-18 14:41:38'),(22,6,63,'B',1,0,'2025-12-22 20:20:45'),(23,2,25,'A',1,0,'2025-12-22 20:21:05'),(24,6,64,'A',0,0,'2025-12-22 20:29:05'),(25,6,65,'B',1,0,'2025-12-22 20:29:13');
/*!40000 ALTER TABLE `quiz_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_sessions`
--

DROP TABLE IF EXISTS `quiz_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `language` varchar(50) NOT NULL,
  `current_question_index` int DEFAULT '0',
  `total_questions` int DEFAULT '0',
  `correct_count` int DEFAULT '0',
  `incorrect_count` int DEFAULT '0',
  `skipped_count` int DEFAULT '0',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `completed` tinyint(1) DEFAULT '0',
  `score_percentage` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_client_language` (`client_id`,`language`),
  KEY `idx_completed` (`completed`),
  CONSTRAINT `quiz_sessions_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_sessions`
--

LOCK TABLES `quiz_sessions` WRITE;
/*!40000 ALTER TABLE `quiz_sessions` DISABLE KEYS */;
INSERT INTO `quiz_sessions` VALUES (1,3,'Algo',6,45,4,2,0,'2025-12-01 22:23:13','2025-12-01 22:37:56',NULL,1,8.89),(2,3,'C',3,40,2,1,0,'2025-12-01 22:29:43','2025-12-22 20:21:05',NULL,0,5.00),(3,3,'Algo',2,45,1,1,0,'2025-12-01 22:37:56','2025-12-01 22:38:36',NULL,1,2.22),(4,3,'Algo',8,45,6,2,0,'2025-12-01 22:38:37','2025-12-02 10:50:29',NULL,1,13.33),(5,3,'Algo',0,45,0,0,0,'2025-12-02 10:50:29','2025-12-02 10:50:33',NULL,1,0.00),(6,3,'Algo',3,45,2,1,0,'2025-12-02 10:50:33','2025-12-22 20:29:18',NULL,1,4.44),(7,20,'Algo',1,45,0,1,0,'2025-12-16 15:30:08','2025-12-16 15:30:17',NULL,0,0.00),(8,22,'Algo',2,45,1,1,0,'2025-12-18 14:41:02','2025-12-18 14:41:38',NULL,0,2.22),(9,25,'C',0,40,0,0,0,'2025-12-21 22:33:23','2025-12-21 22:33:23',NULL,0,0.00),(10,3,'Algo',0,45,0,0,0,'2025-12-22 20:29:18','2025-12-22 20:29:18',NULL,0,0.00);
/*!40000 ALTER TABLE `quiz_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `language` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `question` text COLLATE utf8mb4_general_ci NOT NULL,
  `option_a` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `option_b` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `option_c` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `option_d` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `correct_option` enum('A','B','C','D') COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_language` (`language`)
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizzes`
--

LOCK TABLES `quizzes` WRITE;
/*!40000 ALTER TABLE `quizzes` DISABLE KEYS */;
INSERT INTO `quizzes` VALUES (23,'C','What is the correct syntax to print something in C?','print(\"Hello\");','printf(\"Hello\");','cout << \"Hello\";','System.out.println(\"Hello\");','B','2025-11-14 10:25:23'),(24,'C','Which symbol ends every statement in C?',':','.',';',',','C','2025-11-14 10:25:54'),(25,'C','Which data type is used for whole numbers?','int','char','float','double','A','2025-11-14 10:26:21'),(26,'C','What is the correct way to declare a character variable?','char c;','character c;','string c;','chr c;','A','2025-11-14 10:26:53'),(27,'C','Which type is used for decimals?','int','float','char','short','B','2025-11-14 10:27:13'),(28,'C','What is the range of char?','-128 to 127','0 to 255','-32768 to 32767','0 to 32','A','2025-11-14 10:27:38'),(29,'C','What does // mean in C?','Division','Single-line comment','Multi-line comment','Pointer','B','2025-11-14 10:28:09'),(30,'C','Which function takes input from the user?','input()','scanf()','gets()','read()','B','2025-11-14 10:28:34'),(31,'C','Which keyword defines a constant value?','static','final','const','constant','C','2025-11-14 10:28:53'),(32,'C','Which operator is the assignment operator?','==','=','!=','+=','B','2025-11-14 10:29:18'),(33,'C','Which loop executes at least once?','for','while','do ... while','repeat','C','2025-11-14 10:29:59'),(34,'C','What is the correct syntax of a for loop?','for(i = 0; i < 5; i++)','for i < 5','loop(i=0 to 5)','for(int i in 5)','A','2025-11-14 10:30:30'),(35,'C','Which header file is required for printf?','<stdlib.h>','<string.h>','<stdio.h>','<math.h>','C','2025-11-14 10:31:00'),(36,'C','What will 5 / 2 give in C (int division)?','2.5','3','2','Error','C','2025-11-14 10:31:21'),(37,'C','What is the correct way to write an array of 10 integers?','int arr(10);','int arr[10];','integer arr[10];','array arr = 10;','B','2025-11-14 10:31:43'),(38,'C','Which operator gets the remainder of division?','/','*','%','&','C','2025-11-14 10:32:09'),(39,'C','What is the size of an int in most systems?','1 byte','2 bytes','4 bytes','8 bytes','C','2025-11-14 10:32:32'),(40,'C','What is the output of: printf(\"%d\", 3 == 3);','true','false','1','0','C','2025-11-14 10:32:48'),(41,'C','Which is NOT a valid C keyword?','auto','class','static','return','B','2025-11-14 10:33:05'),(42,'C','What is a pointer?','A variable that stores a value','A variable that stores an addres','A loop','A function','B','2025-11-14 10:33:29'),(43,'C','Which symbol is used to get the address of a variable?','*','&','@','#','B','2025-11-14 10:33:51'),(44,'C','What is the output of: sizeof(char)?','4','2','1','8','C','2025-11-14 10:34:12'),(45,'C','Which function allocates memory dynamically?','malloc()','alloc()','mem()','memory()','A','2025-11-14 10:34:35'),(46,'C','What is the output of \"Hello\"[1]?','H','e','I','o','B','2025-11-14 10:35:00'),(47,'C','Which operator is used to access a pointer\'s value?','->','.','*','&','C','2025-11-14 10:35:16'),(48,'C','Which of the following is NOT a loop?','for','while','repeat','do','C','2025-11-14 10:35:43'),(49,'C','What is the correct prototype of main?','main()','int main()','void main()','program main()','B','2025-11-14 10:36:11'),(50,'C','Which function releases allocated memory?','delete()','free()','destroy()','remove()','B','2025-11-14 10:36:32'),(51,'C','What does break do in a loop?','Stops the loop immediately','Skips one iteration','Ends the program','Creates a new loop','A','2025-11-14 10:36:53'),(52,'C','What is the output of: printf(\"%d\", 5>10);','true','flase','1','0','D','2025-11-14 10:37:13'),(53,'C','What is the value of uninitialized local variables?','0','Random (garbage)','null','-1','B','2025-11-14 10:37:36'),(54,'C','Which of these is a valid pointer declaration?','int p;','int *p;','pointer p;','int p*;','B','2025-11-14 10:38:02'),(55,'C','What is the result of strcmp(\"abc\",\"abd\")?','1','-1','0','Error','B','2025-11-14 10:38:19'),(56,'C','Arrays in C are:','Dynamic by default','Static (fixed size)','Automatically sorted','Two-dimensional only','B','2025-11-14 10:38:41'),(57,'C','What is the output of: printf(\"%c\", 65);','65','6','A','Error','C','2025-11-14 10:38:57'),(58,'C','Which is a correct file extension for C source files?','.cpp','.c','.cs','.exe','B','2025-11-14 10:39:15'),(59,'C','Which function reads a string safely?','gets();','readln();','fgets();','scanf(\"%s\")','C','2025-11-14 10:39:54'),(60,'C','Which operator is used for pointer-to-structure?','->','.','*','&','A','2025-11-14 10:40:12'),(61,'C','What is the starting index of arrays in C?','1','0','-1','Depends on compiler','B','2025-11-14 10:40:29'),(62,'C','What is recursion?','Loop inside a loop','Function calling itself','Pointer to an array','Sorting technique','B','2025-11-14 10:40:51'),(63,'Algo','What is an algorithm?','A computer program','A step-by-step solution to a problem','A programming language','A database rule','B','2025-11-14 23:32:20'),(64,'Algo','Which of the following is NOT a property of an algorithm?','Finiteness','Input','Ambiguity','Output','C','2025-11-14 23:32:53'),(65,'Algo','Which one describes the complexity of an algorithm?','Its correctness','Its execution time','Its number of lines','Its name','B','2025-11-14 23:33:28'),(66,'Algo','The goal of an algorithm is to:','Generate random results','Describe steps to solve a problem','Replace programming languages','Make graphics','B','2025-11-14 23:33:55'),(67,'Algo','What is the first step before writing an algorithm?','Write code','Understand the problem','Choose a language','Test the result','B','2025-11-14 23:34:27'),(68,'Algo','An algorithm must:','Run on Windows','Always use loops','Be unambiguous','Print output','C','2025-11-14 23:35:19'),(69,'Algo','Which is an example of an algorithm?','A recipe','A song','An image','A folder','A','2025-11-14 23:35:46'),(70,'Algo','Algorithms are written using:','Machine code','Pseudocode','Images','Only Java','B','2025-11-14 23:36:10'),(71,'Algo','If an algorithm never ends, it violates:','Input','Output','Finiteness','Correctness','C','2025-11-14 23:36:35'),(72,'Algo','The result produced by an algorithm is called:','Output','Function','Pointer','Branch','A','2025-11-14 23:36:56'),(73,'Algo','Pseudocode is used because:','It runs faster','It is readable and simple','It replaces coding','It compiles automatically','B','2025-11-14 23:37:32'),(74,'Algo','\"IF … THEN\" is an example of:','Loop','Condition','Array','Assignment','B','2025-11-14 23:38:00'),(75,'Algo','\"READ X\" means:','Print X','Input value into X','Delete X','Compare X','B','2025-11-14 23:38:27'),(76,'Algo','In pseudocode, \"←\" means:','Output','Input','Assignment','Branch','C','2025-11-14 23:38:52'),(77,'Algo','\"WRITE X\" means:','Input X','Output X','Loop X','Delete X','B','2025-11-14 23:39:20'),(78,'Algo','What does a condition return?','Integer','Boolean (True/False)','Character','Loop','B','2025-11-14 23:39:47'),(79,'Algo','In pseudocode, OR means:','Both must be true','At least one must be true','Always false','None','B','2025-11-14 23:40:18'),(80,'Algo','\"IF X > 10 THEN\" executes when:','X is 10','X is less than 10','X is greater than 10','Any value of X','C','2025-11-14 23:40:40'),(81,'Algo','ELSE part executes when:','IF is true','IF is false','Both','Never','B','2025-11-14 23:41:03'),(82,'Algo','Nested IF means:','Multiple IF inside another IF','No conditions','Infinite loop','Next instruction','A','2025-11-14 23:41:27'),(83,'Algo','Which operator checks equality?','>','<','=','←','C','2025-11-14 23:41:47'),(84,'Algo','Logical NOT reverses:','Output','Condition','Variable','Loop','B','2025-11-14 23:42:12'),(85,'Algo','Which is a valid condition?','X +','IF = 3','X < 5','Print X','C','2025-11-14 23:42:32'),(86,'Algo','A condition controls:','Decisions','Arrays','RAM','Keyboard','A','2025-11-14 23:42:52'),(87,'Algo','The ELSE IF is used for:','Multiple conditions','Loops','Sorting','Comments','A','2025-11-14 23:43:13'),(88,'Algo','A loop is used to:','Print one value','Repeat instructions','Close program','Delete variables','B','2025-11-14 23:43:53'),(89,'Algo','The loop that checks condition first:','DO WHILE','WHILE','REPEAT UNTIL','IF','B','2025-11-14 23:44:18'),(90,'Algo','REPEAT UNTIL executes:','Zero times','At least once','Only twice','Never','B','2025-11-14 23:44:44'),(91,'Algo','Which loop is best for counting?','WHILE','FOR','Switch','IF','B','2025-11-14 23:45:08'),(92,'Algo','An infinite loop happens when:','Condition wrong','One variable','No input','Wrong syntax','A','2025-11-14 23:48:35'),(93,'Algo','In FOR I ← 1 TO 10:','I goes from 1 to 9','I goes from 1 to 10','I stops at 5','I starts at 0','B','2025-11-14 23:48:59'),(94,'Algo','BREAK is used to:','Stop loop','End program','Repeat','Print','A','2025-11-14 23:49:30'),(95,'Algo','CONTINUE is used to:','Exit loop','Skip iteration','Skip whole code','Print','B','2025-11-14 23:50:00'),(96,'Algo','WHILE loop stops when:','Condition becomes false','Key pressed','Output printed','Input read','A','2025-11-14 23:50:22'),(97,'Algo','The loop for menu-based programs is:','FOR','WHILE','REPEAT UNTIL','SWITCH','C','2025-11-14 23:50:44'),(98,'Algo','A function is:','Loop','Reusable block of code','Variable','File','B','2025-11-14 23:51:07'),(99,'Algo','A recursive function is:','Function that calls itself','Infinite loop','Condition','Array','A','2025-11-14 23:51:30'),(100,'Algo','Recursion must have:','Delay','Base case','Two loops','Input','B','2025-11-14 23:51:50'),(101,'Algo','Recursion is good for:','Searching trees','Keyboard input','Printing','RAM','A','2025-11-14 23:52:14'),(102,'Algo','Missing base case leads to:','Fast result','Infinite recursion','Sorting','Compilation','B','2025-11-14 23:52:36'),(103,'Algo','An array stores:','Many files','Multiple values','Only strings','Only numbers','B','2025-11-14 23:53:03'),(104,'Algo','Array index starts at:','1','0','-1','2','B','2025-11-14 23:53:21'),(105,'Algo','A[3] refers to','Third element','Fourth element','Fifth','First','B','2025-11-14 23:53:42'),(106,'Algo','Traversing an array means:','Deleting it','Searching every element','Copying','Dividing','B','2025-11-14 23:54:02'),(107,'Algo','Which loop is commonly used with arrays?','FOR','IF','SWITCH','BREAK','A','2025-11-14 23:54:22');
/*!40000 ALTER TABLE `quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `skill_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `skills_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skills`
--

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` VALUES (1,5,'Learn Algorithme From 0.');
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `bio` text COLLATE utf8mb4_general_ci,
  `profile_image` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_results`
--

DROP TABLE IF EXISTS `user_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `question_id` int NOT NULL,
  `selected_option` enum('A','B','C','D') COLLATE utf8mb4_general_ci NOT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `language` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `answered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_question` (`client_id`,`question_id`),
  KEY `idx_client_id` (`client_id`),
  KEY `idx_question_id` (`question_id`),
  KEY `idx_language` (`language`),
  CONSTRAINT `user_results_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_results_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_results`
--

LOCK TABLES `user_results` WRITE;
/*!40000 ALTER TABLE `user_results` DISABLE KEYS */;
INSERT INTO `user_results` VALUES (12,3,63,'B',1,'Algo','2025-11-16 19:03:54'),(13,3,64,'D',0,'Algo','2025-11-16 19:03:57'),(14,3,65,'C',0,'Algo','2025-11-16 19:01:40'),(15,3,66,'B',1,'Algo','2025-11-14 23:55:24'),(16,6,63,'B',1,'Algo','2025-11-16 12:34:15'),(17,6,64,'A',0,'Algo','2025-11-15 18:03:51'),(18,6,65,'B',1,'Algo','2025-11-15 18:08:55'),(19,6,66,'B',1,'Algo','2025-11-15 18:09:08'),(20,6,67,'B',1,'Algo','2025-11-15 18:09:20'),(21,6,68,'C',1,'Algo','2025-11-15 18:09:42'),(22,6,69,'A',1,'Algo','2025-11-15 18:09:59'),(23,6,70,'B',1,'Algo','2025-11-15 18:10:06'),(24,6,71,'B',0,'Algo','2025-11-15 18:10:25'),(25,6,23,'B',1,'C','2025-11-15 18:11:02'),(26,6,24,'C',1,'C','2025-11-15 18:11:12'),(27,6,25,'D',0,'C','2025-11-15 18:11:31');
/*!40000 ALTER TABLE `user_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `youtube_tokens`
--

DROP TABLE IF EXISTS `youtube_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `youtube_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `access_token` text COLLATE utf8mb4_general_ci NOT NULL,
  `refresh_token` text COLLATE utf8mb4_general_ci NOT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `youtube_tokens`
--

LOCK TABLES `youtube_tokens` WRITE;
/*!40000 ALTER TABLE `youtube_tokens` DISABLE KEYS */;
INSERT INTO `youtube_tokens` VALUES (1,'ya29.a0Aa7pCA9o6mpPvQ62bH1u32A0xgFqikJe4AoVNjJ3vT0mYTsiHkRqfvVqN5evU_jcCozMSDEkM0n51sS7AmZkRAMyI0KIqvk4y67qYyTui7xHiek38rmymGNq_9w0tgl5oh3ylTQytXtkyMKF9QMsQ5No7LEVcnCICrqY3MRtBOxfmofxZ3y0U_cLDtBG0PfZ64_x_S0aCgYKAfwSARASFQHGX2MiSe8avOp05wPrTP35gdTaCQ0206','1//03_rGQPevk-TmCgYIARAAGAMSNwF-L9IrANbe7n_JPsF20DlEP8Y9mOWc8MdPR8_Kz78Lfhi3zWWmMFdYygfZZyQZ3h31sia_QA4','2025-12-22 17:03:46','2025-12-22 15:03:47','2025-12-22 15:03:47');
/*!40000 ALTER TABLE `youtube_tokens` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-24 10:49:32
