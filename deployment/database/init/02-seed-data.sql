-- BookMyShow Sample Data Seeding
-- Insert test data for development and testing
-- Run after schema creation (01-schema.sql)

USE `bookmyshow`;

SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- =============================================
-- SEED USERS
-- =============================================
INSERT INTO `users` (`name`, `email`, `phone`, `password_hash`, `is_active`) VALUES
('John Doe', 'john.doe@email.com', '9876543210', '$2b$10$example.hash.for.password123', 1),
('Jane Smith', 'jane.smith@email.com', '9876543211', '$2b$10$example.hash.for.password123', 1),
('Mike Johnson', 'mike.johnson@email.com', '9876543212', '$2b$10$example.hash.for.password123', 1),
('Sarah Wilson', 'sarah.wilson@email.com', '9876543213', '$2b$10$example.hash.for.password123', 1),
('David Brown', 'david.brown@email.com', '9876543214', '$2b$10$example.hash.for.password123', 1),
('Test User', 'test@bookmyshow.com', '9999999999', '$2b$10$example.hash.for.password123', 1);

-- =============================================
-- SEED THEATERS
-- =============================================
INSERT INTO `theaters` (`name`, `location`, `city`, `total_seats`, `facilities`) VALUES
('PVR Cinemas Phoenix', 'Phoenix Marketcity, Kurla West', 'Mumbai', 150, '{"parking": true, "food_court": true, "wheelchair_access": true, "sound_system": "Dolby Atmos"}'),
('INOX Leisure Malad', 'Malad Link Road, Malad West', 'Mumbai', 200, '{"parking": true, "food_court": true, "wheelchair_access": false, "sound_system": "DTS"}'),
('Cinepolis Fun Republic', 'Fun Republic Mall, Andheri West', 'Mumbai', 180, '{"parking": true, "food_court": true, "wheelchair_access": true, "sound_system": "Dolby Digital"}'),
('PVR Select City Walk', 'Select City Walk, Saket', 'Delhi', 220, '{"parking": true, "food_court": true, "wheelchair_access": true, "sound_system": "Dolby Atmos"}'),
('INOX Nehru Place', 'Nehru Place, New Delhi', 'Delhi', 160, '{"parking": false, "food_court": true, "wheelchair_access": true, "sound_system": "DTS"}'),
('Cinepolis DLF Mall', 'DLF Mall of India, Noida', 'Delhi', 190, '{"parking": true, "food_court": true, "wheelchair_access": true, "sound_system": "Dolby Digital"}'),
('PVR Forum Koramangala', 'Forum Mall, Koramangala', 'Bangalore', 170, '{"parking": true, "food_court": true, "wheelchair_access": false, "sound_system": "Dolby Atmos"}'),
('INOX Garuda Mall', 'Garuda Mall, Magrath Road', 'Bangalore', 140, '{"parking": true, "food_court": false, "wheelchair_access": true, "sound_system": "DTS"}');

-- =============================================
-- SEED MOVIES
-- =============================================
INSERT INTO `movies` (`title`, `description`, `duration`, `language`, `genre`, `rating`, `release_date`, `poster_url`, `trailer_url`) VALUES
('Avengers: Endgame', 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos\' actions.', 181, 'English', 'Action/Adventure', 8.4, '2019-04-26', 'https://example.com/posters/avengers-endgame.jpg', 'https://example.com/trailers/avengers-endgame.mp4'),
('The Batman', 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption.', 176, 'English', 'Action/Crime', 7.8, '2022-03-04', 'https://example.com/posters/the-batman.jpg', 'https://example.com/trailers/the-batman.mp4'),
('Spider-Man: No Way Home', 'With Spider-Man\'s identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.', 148, 'English', 'Action/Adventure', 8.2, '2021-12-17', 'https://example.com/posters/spiderman-nwh.jpg', 'https://example.com/trailers/spiderman-nwh.mp4'),
('RRR', 'A fearless revolutionary and an officer in the British force, who once shared a deep bond, decide to join forces and chart out an inspirational path of freedom against the despotic rule.', 187, 'Telugu', 'Action/Drama', 8.0, '2022-03-24', 'https://example.com/posters/rrr.jpg', 'https://example.com/trailers/rrr.mp4'),
('Dangal', 'Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory at the Commonwealth Games in the face of societal oppression.', 161, 'Hindi', 'Biography/Drama', 8.4, '2016-12-23', 'https://example.com/posters/dangal.jpg', 'https://example.com/trailers/dangal.mp4'),
('3 Idiots', 'Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently.', 170, 'Hindi', 'Comedy/Drama', 8.4, '2009-12-25', 'https://example.com/posters/3-idiots.jpg', 'https://example.com/trailers/3-idiots.mp4'),
('Bahubali 2', 'When Shiva, the son of Bahubali, learns about his heritage, he begins to look for answers. His story is juxtaposed with past events that unfolded in the Mahishmati Kingdom.', 167, 'Telugu', 'Action/Drama', 8.2, '2017-04-28', 'https://example.com/posters/bahubali2.jpg', 'https://example.com/trailers/bahubali2.mp4'),
('Zindagi Na Milegi Dobara', 'Three friends decide to turn their fantasy vacation into reality after one of their friends gets engaged.', 155, 'Hindi', 'Comedy/Drama', 8.1, '2011-07-15', 'https://example.com/posters/znmd.jpg', 'https://example.com/trailers/znmd.mp4');

-- =============================================
-- GENERATE SEATS FOR ALL THEATERS
-- =============================================
-- Theater 1: PVR Cinemas Phoenix (150 seats)
INSERT INTO `seats` (`theater_id`, `seat_number`, `row_name`, `seat_type`) 
SELECT 1, 
       CONCAT(seat_row, seat_num), 
       seat_row,
       CASE 
         WHEN seat_row IN ('A', 'B') THEN 'regular'
         WHEN seat_row IN ('C', 'D', 'E') THEN 'premium' 
         ELSE 'vip'
       END
FROM (
  SELECT 
    CHAR(ASCII('A') + (ROW_NUMBER() OVER (ORDER BY t1.id, t2.id) - 1) DIV 15) AS seat_row,
    LPAD((ROW_NUMBER() OVER (ORDER BY t1.id, t2.id) - 1) % 15 + 1, 2, '0') AS seat_num
  FROM (SELECT 1 as id UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t1
  CROSS JOIN (SELECT 1 as id UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
              UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
              UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
              UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
              UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25
              UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30) t2
  LIMIT 150
) seats_data;

-- Theater 2: INOX Leisure Malad (200 seats)
INSERT INTO `seats` (`theater_id`, `seat_number`, `row_name`, `seat_type`) 
SELECT 2, 
       CONCAT(seat_row, seat_num), 
       seat_row,
       CASE 
         WHEN seat_row IN ('A', 'B', 'C') THEN 'regular'
         WHEN seat_row IN ('D', 'E', 'F', 'G') THEN 'premium' 
         ELSE 'vip'
       END
FROM (
  SELECT 
    CHAR(ASCII('A') + (ROW_NUMBER() OVER (ORDER BY t1.id, t2.id) - 1) DIV 20) AS seat_row,
    LPAD((ROW_NUMBER() OVER (ORDER BY t1.id, t2.id) - 1) % 20 + 1, 2, '0') AS seat_num
  FROM (SELECT 1 as id UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t1
  CROSS JOIN (SELECT 1 as id UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
              UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
              UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
              UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
              UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25
              UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
              UNION SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35
              UNION SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40) t2
  LIMIT 200
) seats_data;

-- Simplified seat generation for remaining theaters
-- Theater 3: 180 seats
INSERT INTO `seats` (`theater_id`, `seat_number`, `row_name`, `seat_type`)
SELECT 3, CONCAT(seat_row, LPAD(seat_num, 2, '0')), seat_row, 'regular'
FROM (
    SELECT 'A' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'B' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'C' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'D' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'E' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'F' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'G' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'H' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'I' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'J' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'K' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
    UNION ALL
    SELECT 'L' AS seat_row, n AS seat_num FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) nums
) AS all_seats
LIMIT 180;

-- Update seat types for theater 3
UPDATE `seats` SET `seat_type` = 'premium' WHERE `theater_id` = 3 AND `row_name` IN ('D', 'E', 'F', 'G');
UPDATE `seats` SET `seat_type` = 'vip' WHERE `theater_id` = 3 AND `row_name` IN ('H', 'I', 'J', 'K', 'L');

-- =============================================
-- SEED SHOWS (Next 7 days)
-- =============================================
INSERT INTO `shows` (`movie_id`, `theater_id`, `show_time`, `price`, `total_seats`, `available_seats`) VALUES
-- Today's shows
(1, 1, DATE_ADD(NOW(), INTERVAL 2 HOUR), 250.00, 150, 150),
(1, 1, DATE_ADD(NOW(), INTERVAL 6 HOUR), 300.00, 150, 150),
(2, 1, DATE_ADD(NOW(), INTERVAL 4 HOUR), 280.00, 150, 150),
(3, 2, DATE_ADD(NOW(), INTERVAL 3 HOUR), 320.00, 200, 200),
(3, 2, DATE_ADD(NOW(), INTERVAL 7 HOUR), 350.00, 200, 200),
(4, 3, DATE_ADD(NOW(), INTERVAL 5 HOUR), 200.00, 180, 180),

-- Tomorrow's shows
(1, 4, DATE_ADD(NOW(), INTERVAL 1 DAY), 270.00, 220, 220),
(2, 4, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 4 HOUR, 300.00, 220, 220),
(3, 5, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR, 250.00, 160, 160),
(4, 5, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 6 HOUR, 220.00, 160, 160),
(5, 6, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 3 HOUR, 180.00, 190, 190),
(6, 7, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 5 HOUR, 200.00, 170, 170),

-- Day after tomorrow
(7, 8, DATE_ADD(NOW(), INTERVAL 2 DAY), 190.00, 140, 140),
(8, 1, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR, 210.00, 150, 150),
(1, 2, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 7 HOUR, 330.00, 200, 200),

-- Weekend shows (day 3-4)
(2, 3, DATE_ADD(NOW(), INTERVAL 3 DAY), 350.00, 180, 180),
(3, 4, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 4 HOUR, 380.00, 220, 220),
(4, 5, DATE_ADD(NOW(), INTERVAL 4 DAY), 240.00, 160, 160),
(5, 6, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 3 HOUR, 200.00, 190, 190),

-- Next week shows (day 5-7)
(6, 7, DATE_ADD(NOW(), INTERVAL 5 DAY), 220.00, 170, 170),
(7, 8, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 6 HOUR, 210.00, 140, 140),
(8, 1, DATE_ADD(NOW(), INTERVAL 6 DAY), 250.00, 150, 150),
(1, 2, DATE_ADD(NOW(), INTERVAL 7 DAY), 300.00, 200, 200);

-- =============================================
-- SAMPLE BOOKINGS (Some confirmed, some pending)
-- =============================================
INSERT INTO `bookings` (`user_id`, `show_id`, `booking_reference`, `total_seats`, `total_amount`, `booking_status`, `payment_status`, `booking_time`, `payment_time`, `expires_at`) VALUES
(1, 1, 'BMS20241201001234', 2, 500.00, 'confirmed', 'completed', DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 50 MINUTE), DATE_ADD(NOW(), INTERVAL 23 HOUR)),
(2, 2, 'BMS20241201002345', 4, 1200.00, 'confirmed', 'completed', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 110 MINUTE), DATE_ADD(NOW(), INTERVAL 22 HOUR)),
(3, 3, 'BMS20241201003456', 3, 960.00, 'pending', 'pending', DATE_SUB(NOW(), INTERVAL 5 MINUTE), NULL, DATE_ADD(NOW(), INTERVAL 10 MINUTE)),
(4, 4, 'BMS20241201004567', 1, 200.00, 'confirmed', 'completed', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 170 MINUTE), DATE_ADD(NOW(), INTERVAL 21 HOUR)),
(5, 5, 'BMS20241201005678', 2, 500.00, 'pending', 'pending', DATE_SUB(NOW(), INTERVAL 2 MINUTE), NULL, DATE_ADD(NOW(), INTERVAL 13 MINUTE)),
(6, 6, 'BMS20241201006789', 5, 1000.00, 'cancelled', 'refunded', DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- =============================================
-- SAMPLE BOOKING SEATS
-- =============================================
-- Booking 1: 2 seats (A01, A02) for show 1
INSERT INTO `booking_seats` (`booking_id`, `seat_id`, `seat_price`) VALUES
(1, 1, 250.00),
(1, 2, 250.00);

-- Booking 2: 4 seats for show 2  
INSERT INTO `booking_seats` (`booking_id`, `seat_id`, `seat_price`) VALUES
(2, 3, 300.00),
(2, 4, 300.00),
(2, 5, 300.00),
(2, 6, 300.00);

-- Booking 3: 3 seats for show 3 (pending)
INSERT INTO `booking_seats` (`booking_id`, `seat_id`, `seat_price`) VALUES
(3, 351, 320.00),
(3, 352, 320.00),
(3, 353, 320.00);

-- Booking 4: 1 seat for show 4
INSERT INTO `booking_seats` (`booking_id`, `seat_id`, `seat_price`) VALUES
(4, 531, 200.00);

-- Booking 5: 2 seats for show 5 (pending)
INSERT INTO `booking_seats` (`booking_id`, `seat_id`, `seat_price`) VALUES
(5, 7, 250.00),
(5, 8, 250.00);

-- =============================================
-- SAMPLE SEAT RESERVATIONS (Active holds)
-- =============================================
INSERT INTO `seat_reservations` (`show_id`, `seat_id`, `user_id`, `session_id`, `expires_at`) VALUES
(1, 10, 1, 'sess_123456789', DATE_ADD(NOW(), INTERVAL 15 MINUTE)),
(1, 11, 1, 'sess_123456789', DATE_ADD(NOW(), INTERVAL 15 MINUTE)),
(3, 354, 3, 'sess_987654321', DATE_ADD(NOW(), INTERVAL 8 MINUTE)),
(3, 355, 3, 'sess_987654321', DATE_ADD(NOW(), INTERVAL 8 MINUTE));

-- =============================================
-- UPDATE AVAILABLE SEATS BASED ON CONFIRMED BOOKINGS
-- =============================================
UPDATE `shows` s 
SET `available_seats` = `total_seats` - (
    SELECT COALESCE(SUM(b.total_seats), 0) 
    FROM `bookings` b 
    WHERE b.show_id = s.id AND b.booking_status = 'confirmed'
);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- =============================================
-- DATA VERIFICATION QUERIES
-- =============================================
SELECT 'Data seeding completed successfully!' as status;

SELECT 
    'Users' as entity, 
    COUNT(*) as count 
FROM users
UNION ALL
SELECT 
    'Theaters' as entity, 
    COUNT(*) as count 
FROM theaters
UNION ALL
SELECT 
    'Movies' as entity, 
    COUNT(*) as count 
FROM movies
UNION ALL
SELECT 
    'Shows' as entity, 
    COUNT(*) as count 
FROM shows
UNION ALL
SELECT 
    'Seats' as entity, 
    COUNT(*) as count 
FROM seats
UNION ALL
SELECT 
    'Bookings' as entity, 
    COUNT(*) as count 
FROM bookings;

-- Show sample data overview
SELECT 'Sample show data with availability:' as info;
SELECT 
    m.title as movie,
    t.name as theater,
    s.show_time,
    s.price,
    CONCAT(s.available_seats, '/', s.total_seats) as seats_available
FROM shows s
JOIN movies m ON s.movie_id = m.id
JOIN theaters t ON s.theater_id = t.id
WHERE s.show_time > NOW()
ORDER BY s.show_time
LIMIT 10;