/**
 * Database Seeder for BookMyShow Clone
 * Seeds movies, shows, and seats to the Aiven MySQL database
 * 
 * Usage: 
 *   1. Set DATABASE_URL in .env file
 *   2. Run: node seed-database.js
 * 
 * @author Tapish Bagdi
 * @version 2.0.0
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

// Database connection URL from environment (DO NOT hardcode passwords!)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env file!');
    console.log('Please add your Aiven MySQL connection URL to the .env file.');
    console.log('Example: DATABASE_URL=mysql://username:password@host:port/database');
    process.exit(1);
}

async function seedDatabase() {
    let connection;

    try {
        console.log('🔗 Connecting to Aiven MySQL database...');
        connection = await mysql.createConnection({
            uri: DATABASE_URL,
            // ssl: {
            //     rejectUnauthorized: true
            // }
        });
        console.log('✅ Connected to database!');

        // Clear existing data to start fresh
        console.log('🧹 Clearing existing data...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DELETE FROM seat_reservations');
        await connection.query('DELETE FROM bookings');
        await connection.query('DELETE FROM seats');
        await connection.query('DELETE FROM shows');
        await connection.query('DELETE FROM movies');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Existing data cleared!');

        // Insert 10 Movies with diverse genres
        console.log('📽️  Inserting movies...');
        await connection.query(`
            INSERT INTO movies (id, title, description, duration, genre, language, rating, release_date, poster_url, created_at, updated_at) VALUES
            ('550e8400-e29b-41d4-a716-446655440001', 'Avengers: Endgame', 'After the devastating events of Infinity War, the Avengers assemble once more to reverse Thanos actions and restore order to the universe.', 181, 'Action', 'English', 8.4, '2019-04-26', 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440002', 'Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 148, 'Sci-Fi', 'English', 8.8, '2010-07-16', 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440003', 'The Dark Knight', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.', 152, 'Action', 'English', 9.0, '2008-07-18', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440004', 'Interstellar', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanitys survival on a new habitable planet.', 169, 'Sci-Fi', 'English', 8.6, '2014-11-07', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440005', 'The Matrix', 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', 136, 'Sci-Fi', 'English', 8.7, '1999-03-31', 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440006', 'Oppenheimer', 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.', 180, 'Drama', 'English', 8.9, '2023-07-21', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440007', 'Dune: Part Two', 'Paul Atreides unites with Chani and the Fremen while seeking revenge against those who destroyed his family. He must choose between the love of his life and the fate of the universe.', 166, 'Sci-Fi', 'English', 8.5, '2024-03-01', 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440008', 'Spider-Man: No Way Home', 'With Spider-Mans identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.', 148, 'Action', 'English', 8.2, '2021-12-17', 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440009', 'Jawan', 'A man is driven by a personal vendetta to rectify the wrongs in society, while being hunted down by a cop who is determined to stop him.', 169, 'Action', 'Hindi', 7.9, '2023-09-07', 'https://image.tmdb.org/t/p/w500/jDaOxGvlwjpS7SzwDMjUVxfyNnP.jpg', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440010', 'Pushpa 2: The Rule', 'The clash between Pushpa Raj and SP Bhanwar Singh Shekhawat continues as Pushpa rises to become the undisputed king of the smuggling empire.', 200, 'Action', 'Telugu', 8.1, '2024-12-05', 'https://image.tmdb.org/t/p/w500/xzEMkNBlqWYejO2v9qBGjzKJWAN.jpg', NOW(), NOW())
        `);
        console.log('✅ 10 Movies inserted!');

        // Insert Shows for the next 2 weeks (Jan 20 - Feb 5, 2026)
        console.log('🎬 Inserting shows for the next 2 weeks...');
        await connection.query(`
            INSERT INTO shows (id, movie_id, show_date, show_time, hall_name, total_seats, available_seats, price, created_at, updated_at) VALUES
            -- Avengers: Endgame Shows (Jan 20-22)
            ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2026-01-20', '10:00:00', 'Hall-1', 100, 100, 250.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '2026-01-20', '14:30:00', 'IMAX-Hall', 150, 150, 400.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '2026-01-21', '19:00:00', 'Hall-1', 100, 100, 280.00, NOW(), NOW()),
            
            -- Inception Shows (Jan 20-23)
            ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '2026-01-20', '11:00:00', 'Hall-2', 100, 100, 220.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '2026-01-21', '15:30:00', 'Premium-Hall', 80, 80, 350.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', '2026-01-22', '20:00:00', 'Hall-2', 100, 100, 250.00, NOW(), NOW()),
            
            -- The Dark Knight Shows (Jan 21-24)
            ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', '2026-01-21', '09:30:00', 'Hall-3', 100, 100, 200.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', '2026-01-22', '13:00:00', 'IMAX-Hall', 150, 150, 450.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', '2026-01-23', '18:00:00', 'Hall-3', 100, 100, 280.00, NOW(), NOW()),
            
            -- Interstellar Shows (Jan 22-25)
            ('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', '2026-01-22', '10:30:00', 'IMAX-Hall', 150, 150, 420.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', '2026-01-24', '16:00:00', 'Premium-Hall', 80, 80, 380.00, NOW(), NOW()),
            
            -- The Matrix Shows (Jan 23-26)
            ('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440005', '2026-01-23', '12:00:00', 'Hall-1', 100, 100, 180.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440005', '2026-01-25', '21:00:00', 'Hall-1', 100, 100, 220.00, NOW(), NOW()),
            
            -- Oppenheimer Shows (Jan 24-28)
            ('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440006', '2026-01-24', '10:00:00', 'IMAX-Hall', 150, 150, 450.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440006', '2026-01-26', '15:00:00', 'Premium-Hall', 80, 80, 400.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440006', '2026-01-28', '19:30:00', 'Hall-2', 100, 100, 320.00, NOW(), NOW()),
            
            -- Dune: Part Two Shows (Jan 25-30)
            ('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440007', '2026-01-25', '11:30:00', 'IMAX-Hall', 150, 150, 480.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440007', '2026-01-27', '16:30:00', 'Hall-1', 100, 100, 300.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440007', '2026-01-30', '20:00:00', 'Premium-Hall', 80, 80, 420.00, NOW(), NOW()),
            
            -- Spider-Man: No Way Home Shows (Jan 26 - Feb 1)
            ('650e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440008', '2026-01-26', '10:00:00', 'Hall-3', 100, 100, 250.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440008', '2026-01-28', '14:00:00', 'IMAX-Hall', 150, 150, 400.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440008', '2026-02-01', '18:30:00', 'Hall-3', 100, 100, 280.00, NOW(), NOW()),
            
            -- Jawan Shows (Jan 27 - Feb 2)
            ('650e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440009', '2026-01-27', '09:00:00', 'Hall-2', 100, 100, 200.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440009', '2026-01-29', '13:30:00', 'Premium-Hall', 80, 80, 320.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440009', '2026-02-02', '19:00:00', 'Hall-2', 100, 100, 280.00, NOW(), NOW()),
            
            -- Pushpa 2: The Rule Shows (Jan 28 - Feb 5)
            ('650e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440010', '2026-01-28', '11:00:00', 'IMAX-Hall', 150, 150, 500.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440010', '2026-01-31', '15:30:00', 'Hall-1', 100, 100, 350.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440010', '2026-02-02', '20:30:00', 'Premium-Hall', 80, 80, 450.00, NOW(), NOW()),
            ('650e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440010', '2026-02-05', '17:00:00', 'IMAX-Hall', 150, 150, 480.00, NOW(), NOW())
        `);
        console.log('✅ 29 Shows inserted across 10 movies!');

        // Create seats for all shows
        console.log('🪑 Creating seats for all shows...');

        // Get all shows
        const [shows] = await connection.query('SELECT id, hall_name, total_seats FROM shows');

        let totalSeatsCreated = 0;
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

        for (const show of shows) {
            const seatsPerRow = Math.ceil(show.total_seats / 10);
            const seatInserts = [];

            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                const row = rows[rowIndex];
                const seatsInThisRow = Math.min(seatsPerRow, show.total_seats - (rowIndex * seatsPerRow));

                if (seatsInThisRow <= 0) break;

                for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
                    const seatId = randomUUID();
                    const seatType = rowIndex < 2 ? 'Premium' : 'Regular';
                    seatInserts.push(`('${seatId}', '${show.id}', '${row}', ${seatNum}, '${seatType}', 1, NOW(), NOW())`);
                    totalSeatsCreated++;
                }
            }

            if (seatInserts.length > 0) {
                await connection.query(`
                    INSERT INTO seats (id, show_id, \`row_number\`, seat_number, seat_type, is_available, created_at, updated_at)
                    VALUES ${seatInserts.join(', ')}
                `);
            }
        }

        console.log(`✅ Created ${totalSeatsCreated} seats for ${shows.length} shows!`);

        // Verify data
        const [moviesCount] = await connection.query('SELECT COUNT(*) as count FROM movies');
        const [showsCount] = await connection.query('SELECT COUNT(*) as count FROM shows');
        const [seatsCount] = await connection.query('SELECT COUNT(*) as count FROM seats');

        console.log('\n' + '='.repeat(50));
        console.log('📊 DATABASE SEEDING COMPLETE!');
        console.log('='.repeat(50));
        console.log(`   🎬 Movies: ${moviesCount[0].count}`);
        console.log(`   🎭 Shows: ${showsCount[0].count}`);
        console.log(`   🪑 Seats: ${seatsCount[0].count}`);
        console.log('='.repeat(50));
        console.log('🌐 Refresh your website to see the movies!');
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   Could not connect to database. Check your DATABASE_URL.');
        }
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the seeder
seedDatabase();

