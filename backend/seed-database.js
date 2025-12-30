/**
 * Database Seeder
 * Run this script to add sample movies and shows to your Railway database
 * 
 * Usage: node seed-database.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

// Use Railway's public MySQL URL
const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:QbGTPbRcyPQBLAjuXiPtTijxkeBUjoRP@nozomi.proxy.rlwy.net:51938/railway';

async function seedDatabase() {
    let connection;

    try {
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection(DATABASE_URL);
        console.log('✅ Connected!');

        // Insert Movies
        console.log('📽️  Inserting movies...');
        //     await connection.query(`
        //   INSERT INTO movies (id, title, description, duration, genre, language, rating, release_date, poster_url, created_at, updated_at) VALUES
        //   ('550e8400-e29b-41d4-a716-446655440001', 'Avengers: Endgame', 'After the devastating events of Infinity War, the Avengers assemble once more.', 181, 'Action', 'English', 8.4, '2019-04-26', 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg', NOW(), NOW()),
        //   ('550e8400-e29b-41d4-a716-446655440002', 'Inception', 'A thief who steals corporate secrets through dream-sharing technology.', 148, 'Sci-Fi', 'English', 8.8, '2010-07-16', 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', NOW(), NOW()),
        //   ('550e8400-e29b-41d4-a716-446655440003', 'The Dark Knight', 'Batman must accept one of the greatest psychological tests.', 152, 'Action', 'English', 9.0, '2008-07-18', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', NOW(), NOW()),
        //   ('550e8400-e29b-41d4-a716-446655440004', 'Interstellar', 'A team of explorers travel through a wormhole in space.', 169, 'Sci-Fi', 'English', 8.6, '2014-11-07', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', NOW(), NOW()),
        //   ('550e8400-e29b-41d4-a716-446655440005', 'The Matrix', 'A computer hacker learns about the true nature of his reality.', 136, 'Sci-Fi', 'English', 8.7, '1999-03-31', 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', NOW(), NOW())
        // `);
        //     console.log('✅ Movies inserted!');

        // Insert Shows (REPLACE will update if exists, insert if not)
        // Using DATE_ADD to schedule shows 10 days in the future
        console.log('🎬 Inserting/Updating shows (10 days from today)...');
        await connection.query(`
      REPLACE INTO shows (id, movie_id, show_date, show_time, hall_name, total_seats, available_seats, price, created_at, updated_at) VALUES
      ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', DATE_ADD(CURDATE(), INTERVAL 10 DAY), '10:00:00', 'Hall-1', 100, 100, 250.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', DATE_ADD(CURDATE(), INTERVAL 10 DAY), '14:00:00', 'Hall-1', 100, 100, 250.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', DATE_ADD(CURDATE(), INTERVAL 10 DAY), '18:00:00', 'IMAX-Hall', 150, 150, 350.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', DATE_ADD(CURDATE(), INTERVAL 10 DAY), '11:00:00', 'Hall-2', 100, 100, 200.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', DATE_ADD(CURDATE(), INTERVAL 10 DAY), '15:30:00', 'Hall-2', 100, 100, 200.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', DATE_ADD(CURDATE(), INTERVAL 10 DAY), '20:00:00', 'Premium-Hall', 80, 80, 300.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', DATE_ADD(CURDATE(), INTERVAL 11 DAY), '09:30:00', 'Hall-3', 100, 100, 220.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', DATE_ADD(CURDATE(), INTERVAL 11 DAY), '13:00:00', 'IMAX-Hall', 150, 150, 400.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', DATE_ADD(CURDATE(), INTERVAL 12 DAY), '10:30:00', 'Premium-Hall', 80, 80, 350.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', DATE_ADD(CURDATE(), INTERVAL 13 DAY), '12:00:00', 'Hall-1', 100, 100, 180.00, NOW(), NOW())
    `);
        console.log('✅ Shows inserted/updated!');

        // Create seats for all shows
        console.log('🪑 Creating seats for all shows...');
        
        // Reset seats to avoid duplicate primary keys when reseeding
        await connection.query('DELETE FROM seats');

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
                    // Generate a UUID for each seat to avoid collisions and stay within CHAR(36)
                    const seatId = randomUUID();
                    const seatType = rowIndex < 2 ? 'Premium' : 'Regular';
                    seatInserts.push(`('${seatId}', '${show.id}', '${row}', ${seatNum}, '${seatType}', 1, NOW(), NOW())`);
                    totalSeatsCreated++;
                }
            }
            
            if (seatInserts.length > 0) {
                await connection.query(`
                    INSERT IGNORE INTO seats (id, show_id, \`row_number\`, seat_number, seat_type, is_available, created_at, updated_at)
                    VALUES ${seatInserts.join(', ')}
                `);
            }
        }
        
        console.log(`✅ Created ${totalSeatsCreated} seats for ${shows.length} shows!`);

        // Verify
        const [moviesCount] = await connection.query('SELECT COUNT(*) as count FROM movies');
        const [showsCount] = await connection.query('SELECT COUNT(*) as count FROM shows');
        const [seatsCount] = await connection.query('SELECT COUNT(*) as count FROM seats');

        console.log('\n📊 Summary:');
        console.log(`   Movies: ${moviesCount[0].count}`);
        console.log(`   Shows: ${showsCount[0].count}`);
        console.log(`   Seats: ${seatsCount[0].count}`);
        console.log('\n🎉 Database seeded successfully!');
        console.log('🌐 Refresh your website to see the movies!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the seeder
seedDatabase();
