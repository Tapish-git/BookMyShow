-- BookMyShow Database Schema Migration
-- MySQL 8.0+ Compatible Schema Creation
-- Run automatically during Docker container initialization

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- Create database if not exists (redundant but safe)
CREATE DATABASE IF NOT EXISTS `bookmyshow` 
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `bookmyshow`;

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS `seat_reservations`;
DROP TABLE IF EXISTS `booking_seats`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `seats`;
DROP TABLE IF EXISTS `shows`;
DROP TABLE IF EXISTS `movies`;
DROP TABLE IF EXISTS `theaters`;
DROP TABLE IF EXISTS `users`;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `phone` varchar(15) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  KEY `idx_users_phone` (`phone`),
  KEY `idx_users_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- THEATERS TABLE
-- =============================================
CREATE TABLE `theaters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `location` varchar(255) NOT NULL,
  `city` varchar(50) NOT NULL,
  `total_seats` int NOT NULL DEFAULT '0',
  `facilities` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_theaters_city` (`city`),
  KEY `idx_theaters_active` (`is_active`),
  KEY `idx_theaters_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- MOVIES TABLE
-- =============================================
CREATE TABLE `movies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `duration` int NOT NULL COMMENT 'Duration in minutes',
  `language` varchar(50) NOT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT NULL,
  `release_date` date NOT NULL,
  `poster_url` varchar(500) DEFAULT NULL,
  `trailer_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_movies_title` (`title`),
  KEY `idx_movies_language` (`language`),
  KEY `idx_movies_genre` (`genre`),
  KEY `idx_movies_release_date` (`release_date`),
  KEY `idx_movies_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SHOWS TABLE
-- =============================================
CREATE TABLE `shows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `movie_id` int NOT NULL,
  `theater_id` int NOT NULL,
  `show_time` datetime NOT NULL,
  `price` decimal(8,2) NOT NULL,
  `available_seats` int NOT NULL DEFAULT '0',
  `total_seats` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shows_movie` (`movie_id`),
  KEY `idx_shows_theater` (`theater_id`),
  KEY `idx_shows_time` (`show_time`),
  KEY `idx_shows_active` (`is_active`),
  KEY `idx_shows_movie_theater_time` (`movie_id`, `theater_id`, `show_time`),
  CONSTRAINT `fk_shows_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shows_theater` FOREIGN KEY (`theater_id`) REFERENCES `theaters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SEATS TABLE
-- =============================================
CREATE TABLE `seats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `theater_id` int NOT NULL,
  `seat_number` varchar(10) NOT NULL,
  `row_name` varchar(5) NOT NULL,
  `seat_type` enum('regular','premium','vip') NOT NULL DEFAULT 'regular',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_seats_theater_number` (`theater_id`, `seat_number`),
  KEY `idx_seats_theater` (`theater_id`),
  KEY `idx_seats_row` (`row_name`),
  KEY `idx_seats_type` (`seat_type`),
  CONSTRAINT `fk_seats_theater` FOREIGN KEY (`theater_id`) REFERENCES `theaters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `show_id` int NOT NULL,
  `booking_reference` varchar(20) NOT NULL UNIQUE,
  `total_seats` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `booking_status` enum('pending','confirmed','cancelled','expired') NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  `booking_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_time` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_bookings_reference` (`booking_reference`),
  KEY `idx_bookings_user` (`user_id`),
  KEY `idx_bookings_show` (`show_id`),
  KEY `idx_bookings_status` (`booking_status`),
  KEY `idx_bookings_payment` (`payment_status`),
  KEY `idx_bookings_expires` (`expires_at`),
  KEY `idx_bookings_time` (`booking_time`),
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_show` FOREIGN KEY (`show_id`) REFERENCES `shows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- BOOKING_SEATS TABLE (Many-to-Many)
-- =============================================
CREATE TABLE `booking_seats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `seat_id` int NOT NULL,
  `seat_price` decimal(8,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_booking_seats_unique` (`booking_id`, `seat_id`),
  KEY `idx_booking_seats_booking` (`booking_id`),
  KEY `idx_booking_seats_seat` (`seat_id`),
  CONSTRAINT `fk_booking_seats_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_booking_seats_seat` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SEAT_RESERVATIONS TABLE (Temporary holds)
-- =============================================
CREATE TABLE `seat_reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `show_id` int NOT NULL,
  `seat_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `reserved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_reservations_show_seat_active` (`show_id`, `seat_id`, `is_active`),
  KEY `idx_reservations_show` (`show_id`),
  KEY `idx_reservations_seat` (`seat_id`),
  KEY `idx_reservations_user` (`user_id`),
  KEY `idx_reservations_expires` (`expires_at`),
  KEY `idx_reservations_session` (`session_id`),
  CONSTRAINT `fk_reservations_show` FOREIGN KEY (`show_id`) REFERENCES `shows` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reservations_seat` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reservations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Composite indexes for common query patterns
CREATE INDEX `idx_shows_movie_time_active` ON `shows` (`movie_id`, `show_time`, `is_active`);
CREATE INDEX `idx_bookings_user_status_time` ON `bookings` (`user_id`, `booking_status`, `booking_time`);
CREATE INDEX `idx_reservations_expires_active` ON `seat_reservations` (`expires_at`, `is_active`);

-- =============================================
-- TRIGGERS FOR DATA INTEGRITY
-- =============================================

DELIMITER $$

-- Update available seats when booking is confirmed
CREATE TRIGGER `update_available_seats_after_booking`
AFTER UPDATE ON `bookings`
FOR EACH ROW
BEGIN
    IF OLD.booking_status != 'confirmed' AND NEW.booking_status = 'confirmed' THEN
        UPDATE `shows` 
        SET `available_seats` = `available_seats` - NEW.total_seats
        WHERE `id` = NEW.show_id;
    END IF;
    
    IF OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
        UPDATE `shows` 
        SET `available_seats` = `available_seats` + NEW.total_seats
        WHERE `id` = NEW.show_id;
    END IF;
END$$

-- Auto-generate booking reference
CREATE TRIGGER `generate_booking_reference`
BEFORE INSERT ON `bookings`
FOR EACH ROW
BEGIN
    IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
        SET NEW.booking_reference = CONCAT('BMS', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(FLOOR(RAND() * 999999), 6, '0'));
    END IF;
END$$

DELIMITER ;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Active movies with show count
CREATE VIEW `active_movies_with_shows` AS
SELECT 
    m.id,
    m.title,
    m.description,
    m.duration,
    m.language,
    m.genre,
    m.rating,
    m.release_date,
    m.poster_url,
    COUNT(DISTINCT s.id) as total_shows,
    COUNT(DISTINCT s.theater_id) as theater_count,
    MIN(s.show_time) as next_show_time
FROM movies m
LEFT JOIN shows s ON m.id = s.movie_id AND s.is_active = 1 AND s.show_time > NOW()
WHERE m.is_active = 1
GROUP BY m.id, m.title, m.description, m.duration, m.language, m.genre, m.rating, m.release_date, m.poster_url;

-- Show details with theater and movie info
CREATE VIEW `show_details` AS
SELECT 
    s.id as show_id,
    s.show_time,
    s.price,
    s.available_seats,
    s.total_seats,
    m.title as movie_title,
    m.duration as movie_duration,
    m.language as movie_language,
    m.rating as movie_rating,
    t.name as theater_name,
    t.location as theater_location,
    t.city as theater_city
FROM shows s
JOIN movies m ON s.movie_id = m.id
JOIN theaters t ON s.theater_id = t.id
WHERE s.is_active = 1 AND m.is_active = 1 AND t.is_active = 1;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- Schema creation completed successfully
SELECT 'BookMyShow schema created successfully!' as status;