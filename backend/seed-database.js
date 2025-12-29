/**
 * Database Seeder
 * Run this script to add sample movies and shows to your Railway database
 * 
 * Usage: node seed-database.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

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
        console.log('🎬 Inserting/Updating shows...');
        await connection.query(`
      REPLACE INTO shows (id, movie_id, show_date, show_time, hall_name, total_seats, available_seats, price, created_at, updated_at) VALUES
      ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURDATE(), '10:00:00', 'Hall-1', 100, 100, 250.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', CURDATE(), '14:00:00', 'Hall-1', 100, 100, 250.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', CURDATE(), '18:00:00', 'IMAX-Hall', 150, 150, 350.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', CURDATE(), '11:00:00', 'Hall-2', 100, 100, 200.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', CURDATE(), '15:30:00', 'Hall-2', 100, 100, 200.00, NOW(), NOW()),
      ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', CURDATE(), '20:00:00', 'Premium-Hall', 80, 80, 300.00, NOW(), NOW())
    `);
        console.log('✅ Shows inserted/updated!');

        // Verify
        const [movies] = await connection.query('SELECT COUNT(*) as count FROM movies');
        const [shows] = await connection.query('SELECT COUNT(*) as count FROM shows');

        console.log('\n📊 Summary:');
        console.log(`   Movies: ${movies[0].count}`);
        console.log(`   Shows: ${shows[0].count}`);
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
