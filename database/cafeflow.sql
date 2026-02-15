-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: cafeflow
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Coffee','Hot and cold coffee',1,'2026-02-03 20:59:49'),(2,'Tea','Refreshing teas',1,'2026-02-03 20:59:49'),(3,'Snacks','Quick bites',1,'2026-02-03 20:59:49'),(4,'Desserts','Sweet treats',1,'2026-02-04 10:28:20'),(5,'Mojito',NULL,1,'2026-02-05 07:31:10'),(6,'Pizza & Pasta',NULL,1,'2026-02-05 07:31:10'),(7,'Milkshakes & Frappe',NULL,1,'2026-02-05 07:31:10');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `order_items_ibfk_1` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (14,10,22,2,170.00),(15,10,28,1,120.00),(16,11,30,1,130.00),(17,11,25,2,50.00),(18,12,34,1,249.00),(19,12,27,1,120.00),(20,16,22,1,170.00),(21,16,28,2,120.00),(22,17,22,1,170.00),(23,17,28,2,120.00),(26,19,25,1,50.00),(27,19,26,1,80.00),(28,20,22,1,170.00),(29,20,28,2,120.00),(30,21,22,1,170.00),(31,21,28,2,120.00),(32,22,22,1,170.00),(33,22,28,2,120.00),(34,23,22,1,170.00),(36,25,56,1,170.00),(37,25,25,1,50.00),(38,26,27,1,120.00),(39,27,22,1,170.00),(40,28,22,2,170.00),(41,28,28,2,120.00),(42,29,22,1,170.00),(43,29,28,2,120.00),(44,30,27,1,120.00),(45,31,22,1,170.00),(46,31,25,1,50.00),(47,32,25,1,50.00),(48,33,22,1,170.00),(49,33,25,1,50.00),(50,34,25,1,50.00),(51,35,26,1,80.00),(52,36,35,1,299.00),(53,37,35,1,299.00),(54,38,35,1,299.00),(55,39,22,1,170.00),(56,40,34,1,249.00),(57,41,25,1,50.00),(58,42,25,1,50.00),(59,43,25,1,50.00),(60,44,26,1,80.00),(61,45,29,1,180.00),(62,46,27,1,120.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `status` enum('placed','confirmed','preparing','ready','out_for_delivery','completed','cancelled') NOT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_status_history_order_id` (`order_id`),
  CONSTRAINT `fk_order_status_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

LOCK TABLES `order_status_history` WRITE;
/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
INSERT INTO `order_status_history` VALUES (13,10,'placed','2026-02-08 15:02:06'),(14,10,'confirmed','2026-02-08 15:07:06'),(15,10,'preparing','2026-02-08 15:17:06'),(16,11,'placed','2026-02-08 14:52:06'),(17,11,'confirmed','2026-02-08 14:57:06'),(18,11,'preparing','2026-02-08 15:07:06'),(19,11,'ready','2026-02-08 15:17:06'),(20,12,'placed','2026-02-08 14:42:06'),(21,12,'confirmed','2026-02-08 14:47:06'),(22,12,'preparing','2026-02-08 14:57:06'),(23,12,'ready','2026-02-08 15:07:06'),(24,12,'out_for_delivery','2026-02-08 15:17:06'),(25,16,'placed','2026-02-08 15:52:37'),(26,17,'placed','2026-02-08 15:56:41'),(27,18,'placed','2026-02-08 18:27:57'),(28,19,'placed','2026-02-08 19:00:55'),(29,20,'placed','2026-02-08 19:13:36'),(30,21,'placed','2026-02-08 19:26:24'),(31,22,'placed','2026-02-08 19:30:05'),(32,23,'placed','2026-02-08 19:32:23'),(33,24,'placed','2026-02-08 19:40:40'),(34,25,'placed','2026-02-13 14:48:15'),(35,26,'placed','2026-02-13 14:55:01'),(36,27,'placed','2026-02-13 14:55:15'),(37,28,'placed','2026-02-13 15:02:13'),(38,29,'placed','2026-02-13 15:03:05'),(39,30,'placed','2026-02-13 15:20:54'),(40,31,'placed','2026-02-13 17:18:03'),(41,32,'placed','2026-02-13 19:05:37'),(42,33,'placed','2026-02-14 05:52:24'),(43,34,'placed','2026-02-14 05:52:55'),(44,35,'placed','2026-02-14 06:13:19'),(45,36,'placed','2026-02-14 07:06:38'),(46,37,'placed','2026-02-14 09:18:46'),(47,38,'placed','2026-02-14 09:31:06'),(48,39,'placed','2026-02-14 09:57:46'),(49,40,'placed','2026-02-14 11:59:07'),(50,41,'placed','2026-02-14 16:33:40'),(51,42,'placed','2026-02-14 17:28:40'),(52,43,'placed','2026-02-14 18:29:44'),(53,44,'placed','2026-02-14 18:57:34'),(54,45,'placed','2026-02-15 07:24:49'),(55,46,'placed','2026-02-15 07:34:39');
/*!40000 ALTER TABLE `order_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) NOT NULL,
  `user_id` int DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `order_type` enum('dine-in','takeaway','delivery') NOT NULL,
  `table_number` varchar(10) DEFAULT NULL,
  `delivery_address` text,
  `status` enum('placed','preparing','ready','dispatched','completed','cancelled') NOT NULL DEFAULT 'placed',
  `total_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `payment_mode` enum('cash','upi') DEFAULT 'cash',
  `order_note` text,
  `payment_status` enum('pending','paid','failed') DEFAULT 'pending',
  `transaction_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  UNIQUE KEY `order_number_2` (`order_number`),
  KEY `fk_orders_user` (`user_id`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_order_type` (`order_type`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (10,'ORD1001',NULL,'Ananya','dine-in','T3',NULL,'ready',410.00,'2026-02-08 15:19:51',NULL,'cash',NULL,'pending',NULL),(11,'ORD1002',NULL,'Rohit','takeaway',NULL,NULL,'ready',290.00,'2026-02-08 15:19:51',NULL,'cash',NULL,'pending',NULL),(12,'ORD1003',NULL,'Meera','delivery',NULL,'12, MG Road, Bengaluru','dispatched',469.00,'2026-02-08 15:19:51',NULL,'cash',NULL,'pending',NULL),(16,'ORD1770565957944',3,'Admin','takeaway',NULL,NULL,'completed',410.00,'2026-02-08 15:52:37',NULL,'cash',NULL,'pending',NULL),(17,'ORD1770566201098',3,'Admin','takeaway',NULL,NULL,'completed',410.00,'2026-02-08 15:56:41',NULL,'cash',NULL,'pending',NULL),(18,'ORD1770575277750',2,'Suma','dine-in',NULL,NULL,'completed',180.00,'2026-02-08 18:27:57',NULL,'cash',NULL,'pending',NULL),(19,'ORD1770577255181',2,'Suma','takeaway',NULL,NULL,'completed',130.00,'2026-02-08 19:00:55',NULL,'cash',NULL,'pending',NULL),(20,'ORD1770578016719',3,'Admin','takeaway',NULL,NULL,'placed',410.00,'2026-02-08 19:13:36',NULL,'cash',NULL,'pending',NULL),(21,'ORD1770578784725',3,'Admin','takeaway',NULL,NULL,'completed',410.00,'2026-02-08 19:26:24',NULL,'cash',NULL,'pending',NULL),(22,'ORD1770579005123',3,'Admin','takeaway',NULL,NULL,'cancelled',410.00,'2026-02-08 19:30:05',NULL,'cash',NULL,'pending',NULL),(23,'ORD1770579143770',3,'Admin','dine-in',NULL,NULL,'completed',170.00,'2026-02-08 19:32:23',NULL,'cash',NULL,'pending',NULL),(24,'ORD1770579640556',2,'Suma','takeaway',NULL,NULL,'completed',90.00,'2026-02-08 19:40:40',NULL,'cash',NULL,'pending',NULL),(25,'ORD1770994095076',3,'Admin','takeaway',NULL,NULL,'completed',220.00,'2026-02-13 14:48:15',NULL,'cash',NULL,'pending',NULL),(26,'ORD1770994501213',3,'Admin','dine-in',NULL,NULL,'completed',120.00,'2026-02-13 14:55:01',NULL,'cash',NULL,'pending',NULL),(27,'ORD1770994514989',3,'Admin','takeaway',NULL,NULL,'completed',170.00,'2026-02-13 14:55:14',NULL,'cash',NULL,'pending',NULL),(28,'ORD1770994933360',3,'Admin','takeaway',NULL,NULL,'completed',580.00,'2026-02-13 15:02:13',NULL,'cash',NULL,'pending',NULL),(29,'ORD1770994985207',3,'Admin','takeaway',NULL,NULL,'completed',410.00,'2026-02-13 15:03:05',NULL,'cash',NULL,'pending',NULL),(30,'ORD1770996054892',3,'Admin','takeaway',NULL,NULL,'completed',120.00,'2026-02-13 15:20:54',NULL,'cash',NULL,'pending',NULL),(31,'ORD1771003083414',3,'Admin','dine-in','1',NULL,'cancelled',220.00,'2026-02-13 17:18:03',NULL,'cash',NULL,'pending',NULL),(32,'ORD1771009537563',2,'Suma','takeaway',NULL,NULL,'preparing',50.00,'2026-02-13 19:05:37',NULL,'cash',NULL,'pending',NULL),(33,'ORD1771048344223',3,'Admin','dine-in','2',NULL,'cancelled',220.00,'2026-02-14 05:52:24',NULL,'cash',NULL,'pending',NULL),(34,'ORD1771048375872',3,'Admin','delivery',NULL,'Jalahalli','cancelled',50.00,'2026-02-14 05:52:55',NULL,'cash',NULL,'pending',NULL),(35,'ORD1771049599202',2,'Suma','dine-in','3',NULL,'ready',80.00,'2026-02-14 06:13:19',NULL,'cash',NULL,'pending',NULL),(36,'ORD1771052798733',3,'Admin','dine-in','4',NULL,'completed',299.00,'2026-02-14 07:06:38',NULL,'cash',NULL,'pending',NULL),(37,'ORD1771060726524',3,'Admin','dine-in','5',NULL,'preparing',299.00,'2026-02-14 09:18:46',NULL,'cash',NULL,'pending',NULL),(38,'ORD1771061466517',3,'Admin','delivery',NULL,'Yeshwanthpur','completed',299.00,'2026-02-14 09:31:06',NULL,'cash',NULL,'pending',NULL),(39,'ORD1771063066026',3,'Admin','delivery',NULL,'Yelahanka','completed',170.00,'2026-02-14 09:57:46',NULL,'cash',NULL,'pending',NULL),(40,'ORD1771070347835',2,'Suma','dine-in','6',NULL,'completed',249.00,'2026-02-14 11:59:07',NULL,'cash','Add extra cheese','pending',NULL),(41,'ORD1771086820000',3,'Admin','takeaway',NULL,NULL,'cancelled',50.00,'2026-02-14 16:33:40',NULL,'cash',NULL,'pending',NULL),(42,'ORD1771090120790',3,'Admin','takeaway',NULL,NULL,'completed',50.00,'2026-02-14 17:28:40',NULL,'cash',NULL,'pending',NULL),(43,'ORD1771093784630',3,'Admin','takeaway',NULL,NULL,'cancelled',50.00,'2026-02-14 18:29:44',NULL,'upi',NULL,'paid','T2402151830459812'),(44,'ORD1771095454697',3,'Admin','takeaway',NULL,NULL,'completed',80.00,'2026-02-14 18:57:34',NULL,'upi',NULL,'paid','TXN9845632101'),(45,'ORD1771140289454',2,'Suma','delivery',NULL,'Peenya','completed',180.00,'2026-02-15 07:24:49',NULL,'upi','Send cutlery','paid','24021412345678'),(46,'ORD1771140879591',3,'Admin','dine-in','1',NULL,'cancelled',120.00,'2026-02-15 07:34:39',NULL,'cash',NULL,'pending',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category_id` int NOT NULL,
  `description` text,
  `image_url` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_veg` tinyint(1) DEFAULT '1',
  `is_bestseller` tinyint(1) DEFAULT '0',
  `is_seasonal` tinyint(1) DEFAULT '0',
  `is_fast` tinyint(1) DEFAULT '0',
  `is_active` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_products_category` (`category_id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (22,'Cappuccino',1,'Classic cappuccino with milk foam','/images/products/cappucino.jpg',170.00,1,'2026-02-05 07:45:33',1,1,0,1,1),(25,'Masala Chai',2,'Indian spiced tea','/images/products/masalachai.jpg',50.00,1,'2026-02-05 07:45:33',1,0,0,1,1),(26,'Green Tea',2,'Healthy green tea','/images/products/greentea.jpg',80.00,1,'2026-02-05 07:45:33',1,0,1,0,1),(27,'French Fries',3,'Crispy salted fries','/images/products/frenchfries.jpg',120.00,1,'2026-02-05 07:45:33',1,0,0,1,1),(28,'Veg Sandwich',3,'Grilled vegetable sandwich','/images/products/vegsandwich.jpg',120.00,1,'2026-02-05 07:45:33',1,0,0,1,1),(29,'Chicken Nuggets',3,'Crispy chicken bites','/images/products/chickenNuggets.jpg',180.00,1,'2026-02-05 07:45:33',0,0,0,0,1),(30,'Chocolate Brownie',4,'Warm fudgy brownie','/images/products/chocolatebrownie.jpg',130.00,1,'2026-02-05 07:45:33',0,1,0,0,1),(31,'Red Velvet Cake',4,'Soft red velvet cake','/images/products/redvelvetcake.jpg',160.00,1,'2026-02-05 07:45:33',1,0,1,0,1),(32,'Mint Mojito',5,'Mint and lime cooler','/images/products/mintmojito.jpg',120.00,1,'2026-02-05 07:45:33',1,1,0,0,1),(34,'Margherita Pizza',6,'Classic cheese pizza','/images/products/margheritapizza.jpg',249.00,1,'2026-02-05 07:45:33',1,1,0,0,1),(35,'Chicken Pizza',6,'Spicy chicken pizza','/images/products/chickenpizza.jpg',299.00,1,'2026-02-05 07:45:33',0,0,0,1,1),(36,'White Sauce Pasta',6,'Creamy white sauce pasta','/images/products/whitesaucepasta.jpg',220.00,1,'2026-02-05 07:45:33',1,0,0,0,1),(37,'Oreo Milkshake',7,'Thick Oreo milkshake','/images/products/oreomilkshake.jpg',170.00,1,'2026-02-05 07:45:33',1,1,0,0,1),(38,'Cold Coffee Frappe',7,'Icy blended coffee','/images/products/coldcoffeefrappe.jpg',160.00,1,'2026-02-05 07:45:33',1,0,0,0,1),(56,'Latte',1,NULL,'/images/products/latte.jpg',170.00,1,'2026-02-09 18:22:53',1,1,0,1,1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `table_number` int NOT NULL,
  `is_occupied` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `table_number` (`table_number`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES (1,1,0),(2,2,0),(3,3,1),(4,4,1),(5,5,1),(6,6,0),(7,7,0),(8,8,0),(9,9,0),(10,10,0);
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` enum('customer','staff','admin') DEFAULT 'customer',
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','Kalpitha','kalpithasnaik21@gmail.com','9999999999','$2b$10$Fxo8DlcSB2paCabQSvZpb.Hi5PCPHYzXur2rGUTYuidzqQ7Y4Nqzm','active','2026-02-03 13:38:40','2026-02-09 14:59:56'),(2,'customer','Suma','naikkalpitha2104@gmail.com','9620429818','$2b$10$wUX4GhzOW/U7d.63GSsM4eItgefwfZYyIVq03xIGD06qCQ1xi20DK','active','2026-02-04 21:03:09','2026-02-15 07:46:55'),(3,'admin','Admin','admin@cafeflow.com','8888888888','$2b$10$7MbMdLoi9ccv8IFLKxqtp.ypvdykbI4p3JZr6lownJqTCDXfBRTZq','active','2026-02-07 20:13:31','2026-02-15 07:25:55');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-15 16:22:00
