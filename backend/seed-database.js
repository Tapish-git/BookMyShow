/**
 * Database Seeder for BookMyShow Clone
 * Seeds movies, shows, and seats to the Aiven MySQL database
 * 
 * Features:
 * - 10 movies with rich descriptions (inspired by real BookMyShow)
 * - Multiple halls: IMAX, 4DX, Dolby Atmos, Premium, Standard halls
 * - Shows scheduled for 1 month (Jan 20 - Feb 20, 2026)
 * - Multiple showtimes per day
 * 
 * Usage: 
 *   1. Set DATABASE_URL in .env file
 *   2. Run: node seed-database.js
 * 
 * @author Tapish Bagdi
 * @version 3.0.0
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

// Hall configurations
const HALLS = [
    { name: 'IMAX Screen 1', seats: 150, priceMultiplier: 1.8 },
    { name: 'Dolby Atmos', seats: 120, priceMultiplier: 1.5 },
    { name: '4DX Experience', seats: 80, priceMultiplier: 2.0 },
    { name: 'Premium Lounge', seats: 60, priceMultiplier: 1.6 },
    { name: 'Screen 1', seats: 200, priceMultiplier: 1.0 },
    { name: 'Screen 2', seats: 180, priceMultiplier: 1.0 },
    { name: 'Screen 3', seats: 150, priceMultiplier: 1.0 },
    { name: 'Gold Class', seats: 40, priceMultiplier: 2.5 },
];

// Base ticket prices
const BASE_PRICES = {
    weekday: 200,
    weekend: 280,
    morning: 150,
    night: 250,
};

// Show times throughout the day
const SHOW_TIMES = [
    '09:00:00', '10:30:00', '12:00:00', '13:30:00',
    '15:00:00', '16:30:00', '18:00:00', '19:30:00',
    '21:00:00', '22:30:00'
];

// Movies with rich content (inspired by BookMyShow)
const MOVIES = [
    {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Avengers: Endgame',
        description: 'The epic conclusion to the Infinity Saga! After the devastating events of Infinity War where Thanos wiped out half of all life, the remaining Avengers assemble once more for one final stand. With the help of Captain Marvel and Ant-Man, our heroes devise a daring plan to travel through time, retrieve the Infinity Stones, and reverse Thanos\' snap. Featuring unprecedented action sequences and emotional farewells, this is the ultimate superhero epic. Directed by the Russo Brothers. Starring Robert Downey Jr., Chris Evans, Scarlett Johansson, Chris Hemsworth, Mark Ruffalo, Jeremy Renner, and Josh Brolin.',
        duration: 181,
        genre: 'Action',
        language: 'English',
        rating: 8.4,
        releaseDate: '2019-04-26',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Inception',
        description: 'Enter a world where dreams become reality. Dom Cobb is a skilled thief who specializes in "extraction" - stealing valuable secrets from deep within the subconscious during the dream state. His rare ability has made him a coveted player in the dangerous world of corporate espionage, but it has also cost him everything he loves. Now Cobb is offered a chance at redemption. One last job could give him his life back, but only if he can accomplish the impossible: inception - planting an idea in someone\'s mind. A breathtaking journey through layered dreamscapes. Directed by Christopher Nolan. Starring Leonardo DiCaprio, Joseph Gordon-Levitt, Ellen Page, Tom Hardy, and Marion Cotillard.',
        duration: 148,
        genre: 'Sci-Fi',
        language: 'English',
        rating: 8.8,
        releaseDate: '2010-07-16',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'The Dark Knight',
        description: 'Why so serious? When the menace known as the Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham. The Dark Knight must accept one of the greatest psychological and physical tests of his ability to fight injustice. With a stellar performance by Heath Ledger as the iconic Joker, this film redefined the superhero genre and set new standards for comic book adaptations. Experience the ultimate battle between order and chaos. Directed by Christopher Nolan. Starring Christian Bale, Heath Ledger (in his legendary Oscar-winning performance), Gary Oldman, Aaron Eckhart, Michael Caine, and Morgan Freeman.',
        duration: 152,
        genre: 'Action',
        language: 'English',
        rating: 9.0,
        releaseDate: '2008-07-18',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440004',
        title: 'Interstellar',
        description: 'Mankind was born on Earth. It was never meant to die here. In a future where Earth is becoming uninhabitable, a team of astronauts travels through a newly discovered wormhole in search of a new home for humanity. Cooper, a former NASA pilot turned farmer, must leave his beloved children behind to lead this expedition. Through black holes, time dilation, and the power of love that transcends dimensions, Interstellar is a stunning exploration of space, time, and the human spirit. Features groundbreaking visual effects supervised by Nobel laureate Kip Thorne. Directed by Christopher Nolan. Starring Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine, and Matt Damon.',
        duration: 169,
        genre: 'Sci-Fi',
        language: 'English',
        rating: 8.6,
        releaseDate: '2014-11-07',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440005',
        title: 'The Matrix',
        description: 'What is the Matrix? Have you ever had a dream that you were so sure was real? Neo, a computer hacker, discovers that the world he knows is actually a simulated reality created by intelligent machines to subdue the human population. Morpheus and Trinity show him the devastating truth and his role as "The One" who can end the war between humans and machines. Featuring revolutionary "bullet-time" visual effects that changed cinema forever, The Matrix is a philosophical action masterpiece. Directed by the Wachowskis. Starring Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss, and Hugo Weaving.',
        duration: 136,
        genre: 'Sci-Fi',
        language: 'English',
        rating: 8.7,
        releaseDate: '1999-03-31',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440006',
        title: 'Oppenheimer',
        description: 'The world changed forever. This epic biographical thriller chronicles the life of J. Robert Oppenheimer, the theoretical physicist who led the Manhattan Project to develop the atomic bomb during World War II. From his early academic career through the Trinity test and beyond, the film explores the moral complexities of scientific progress and the devastating consequences of unlimited power. Shot on IMAX 65mm and 65mm large-format film, this is Christopher Nolan\'s most ambitious project yet. Winner of 7 Academy Awards including Best Picture and Best Director. Starring Cillian Murphy in his Oscar-winning role, with Emily Blunt, Matt Damon, Robert Downey Jr. (Oscar winner for Best Supporting Actor), and Florence Pugh.',
        duration: 180,
        genre: 'Drama',
        language: 'English',
        rating: 8.9,
        releaseDate: '2023-07-21',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440007',
        title: 'Dune: Part Two',
        description: 'The epic continues. Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee. As Paul embraces his destiny as Muad\'Dib, he must navigate prophecy, politics, and warfare on an unprecedented scale. The spice must flow. Shot primarily in IMAX, this sequel expands the scope of Frank Herbert\'s masterpiece. Directed by Denis Villeneuve. Starring Timothée Chalamet, Zendaya, Rebecca Ferguson, Josh Brolin, Austin Butler, Florence Pugh, and Javier Bardem.',
        duration: 166,
        genre: 'Sci-Fi',
        language: 'English',
        rating: 8.5,
        releaseDate: '2024-03-01',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BN2QyZGU4ZDctOWMzMy00NTc5LThlOGQtODhmNDI1NmY5YzAwXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440008',
        title: 'Spider-Man: No Way Home',
        description: 'The Multiverse unleashed! For the first time in the cinematic history of Spider-Man, our friendly neighborhood hero is unmasked and no longer able to separate his normal life from the high-stakes of being a Super Hero. When he asks for help from Doctor Strange, the stakes become even more dangerous, forcing him to discover what it truly means to be Spider-Man. Featuring the return of beloved villains and surprise appearances that broke the internet, this is the ultimate Spider-Man experience. Part of the Marvel Cinematic Universe. Directed by Jon Watts. Starring Tom Holland, Zendaya, Benedict Cumberbatch, with special appearances by Tobey Maguire and Andrew Garfield.',
        duration: 148,
        genre: 'Action',
        language: 'English',
        rating: 8.2,
        releaseDate: '2021-12-17',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BZWMyYzFjYTYtNTRjYi00OGExLWE2YzgtOGRmYjAxZTU3NzBiXkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_.jpg'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440009',
        title: 'Jawan',
        description: 'Ek Aadmi Ka Army! A high-octane action thriller that tells the story of a man who is driven by a personal vendetta to rectify the wrongs in society. As he takes on corrupt politicians and a broken system, he becomes a symbol of hope for the common people. But a relentless cop is determined to stop him at any cost. Featuring Shah Rukh Khan in a dual role, spectacular action sequences choreographed by international stunt coordinators, and a powerful social message. This is Bollywood at its finest. Directed by Atlee. Starring Shah Rukh Khan, Nayanthara, Vijay Sethupathi, Deepika Padukone (special appearance), and Sanjay Dutt.',
        duration: 169,
        genre: 'Action',
        language: 'Hindi',
        rating: 7.9,
        releaseDate: '2023-09-07',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDYxOWM0OTMtMzJkNy00M2JhLTg4MTktZGE0NDI3MjYwNGYzXkEyXkFqcGdeQXVyMTUzNTgzNzM0._V1_.jpg'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440010',
        title: 'Pushpa 2: The Rule',
        description: 'The rule has begun! The clash between Pushpa Raj and SP Bhanwar Singh Shekhawat continues as Pushpa rises to become the undisputed king of the red sandalwood smuggling empire. With his newfound power comes greater enemies, deadlier confrontations, and a battle for supremacy that will shake the entire syndicate. The sequel to the blockbuster Pushpa: The Rise raises the stakes with more intense action, memorable dialogues, and Allu Arjun\'s iconic swag. Thaggedhe Le! Featuring chart-topping music by Devi Sri Prasad. Directed by Sukumar. Starring Allu Arjun in his career-defining role, Rashmika Mandanna, and Fahadh Faasil as the menacing antagonist.',
        duration: 200,
        genre: 'Action',
        language: 'Telugu',
        rating: 8.1,
        releaseDate: '2024-12-05',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BYThmYjJhMGItYzAyYS00YjQzLWFiOTUtNWM1NmIxMjYxNDM5XkEyXkFqcGdeQXVyMTUzNjMxNjE2._V1_.jpg'
    }
];

async function seedDatabase() {
    let connection;

    try {
        console.log('🔗 Connecting to Aiven MySQL database...');
        connection = await mysql.createConnection({
            uri: DATABASE_URL,
            ssl: {
                rejectUnauthorized: false  // Allow self-signed certificates
            }
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

        // Insert Movies
        console.log('📽️  Inserting movies with rich content...');
        for (const movie of MOVIES) {
            const escapedDescription = movie.description.replace(/'/g, "''");
            await connection.query(`
                INSERT INTO movies (id, title, description, duration, genre, language, rating, release_date, poster_url, created_at, updated_at)
                VALUES ('${movie.id}', '${movie.title}', '${escapedDescription}', ${movie.duration}, '${movie.genre}', '${movie.language}', ${movie.rating}, '${movie.releaseDate}', '${movie.posterUrl}', NOW(), NOW())
            `);
        }
        console.log(`✅ ${MOVIES.length} Movies inserted with detailed descriptions!`);

        // Generate shows for 1 month (Jan 20 - Feb 20, 2026)
        // Each movie gets 6-10 shows spread across the month
        console.log('🎬 Generating shows for 1 month (Jan 20 - Feb 20, 2026)...');
        let showCount = 0;

        // Track ALL used hall+date+time slots globally to avoid duplicates
        const usedSlots = new Set();

        // Calculate show dates for each movie (spread across 1 month)
        const startDate = new Date('2026-01-20');
        const timeSlots = ['09:00:00', '10:30:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00', '20:00:00', '22:00:00'];

        for (let movieIndex = 0; movieIndex < MOVIES.length; movieIndex++) {
            const movie = MOVIES[movieIndex];

            // Higher rated movies get more shows (8-10), lower rated get 6-7
            const numShows = movie.rating >= 8.5 ? 10 : (movie.rating >= 8.0 ? 8 : 6);

            // Spread shows across the month with different day offsets per movie
            const dayGap = Math.floor(30 / numShows);

            for (let showNum = 0; showNum < numShows; showNum++) {
                // Calculate date for this show
                const showDate = new Date(startDate);
                showDate.setDate(startDate.getDate() + (showNum * dayGap) + movieIndex); // Unique offset per movie

                // Don't exceed Feb 20
                if (showDate > new Date('2026-02-20')) break;

                const dateStr = showDate.toISOString().split('T')[0];
                const dayOfWeek = showDate.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // Try to find an available hall+time slot for this date
                let showCreated = false;
                for (let hallOffset = 0; hallOffset < HALLS.length && !showCreated; hallOffset++) {
                    const hall = HALLS[(movieIndex + hallOffset) % HALLS.length];

                    for (let timeOffset = 0; timeOffset < timeSlots.length && !showCreated; timeOffset++) {
                        const time = timeSlots[(showNum + timeOffset) % timeSlots.length];
                        const slotKey = `${hall.name}-${dateStr}-${time}`;

                        if (!usedSlots.has(slotKey)) {
                            usedSlots.add(slotKey);
                            const showId = randomUUID();

                            // Calculate price based on time, day, and hall
                            let basePrice = BASE_PRICES.weekday;
                            if (isWeekend) basePrice = BASE_PRICES.weekend;
                            if (time < '12:00:00') basePrice = BASE_PRICES.morning;
                            if (time >= '21:00:00') basePrice = BASE_PRICES.night;

                            const finalPrice = Math.round(basePrice * hall.priceMultiplier);

                            await connection.query(`
                                INSERT INTO shows (id, movie_id, show_date, show_time, hall_name, total_seats, available_seats, price, created_at, updated_at)
                                VALUES ('${showId}', '${movie.id}', '${dateStr}', '${time}', '${hall.name}', ${hall.seats}, ${hall.seats}, ${finalPrice}, NOW(), NOW())
                            `);
                            showCount++;
                            showCreated = true;
                        }
                    }
                }
            }
        }
        console.log(`✅ ${showCount} Shows generated (6-10 per movie)!`);

        // Create seats for all shows
        console.log('🪑 Creating seats for all shows...');
        const [shows] = await connection.query('SELECT id, hall_name, total_seats FROM shows');

        let totalSeatsCreated = 0;
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

        // Process shows in batches for better performance
        const BATCH_SIZE = 50;
        for (let i = 0; i < shows.length; i += BATCH_SIZE) {
            const batch = shows.slice(i, i + BATCH_SIZE);
            const allSeatInserts = [];

            for (const show of batch) {
                const seatsPerRow = Math.ceil(show.total_seats / 10);

                for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
                    const row = rows[rowIndex];
                    const seatsInThisRow = Math.min(seatsPerRow, show.total_seats - (rowIndex * seatsPerRow));

                    if (seatsInThisRow <= 0) break;

                    for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
                        const seatId = randomUUID();
                        const seatType = rowIndex < 2 ? 'Premium' : 'Regular';
                        allSeatInserts.push(`('${seatId}', '${show.id}', '${row}', ${seatNum}, '${seatType}', 1, NOW(), NOW())`);
                        totalSeatsCreated++;
                    }
                }
            }

            if (allSeatInserts.length > 0) {
                // Split into smaller chunks if needed
                const CHUNK_SIZE = 500;
                for (let j = 0; j < allSeatInserts.length; j += CHUNK_SIZE) {
                    const chunk = allSeatInserts.slice(j, j + CHUNK_SIZE);
                    await connection.query(`
                        INSERT INTO seats (id, show_id, \`row_number\`, seat_number, seat_type, is_available, created_at, updated_at)
                        VALUES ${chunk.join(', ')}
                    `);
                }
            }

            // Progress indicator
            const progress = Math.min(100, Math.round(((i + BATCH_SIZE) / shows.length) * 100));
            process.stdout.write(`\r   Progress: ${progress}%`);
        }
        console.log(`\n✅ Created ${totalSeatsCreated.toLocaleString()} seats for ${shows.length} shows!`);

        // Verify data
        const [moviesCount] = await connection.query('SELECT COUNT(*) as count FROM movies');
        const [showsCount] = await connection.query('SELECT COUNT(*) as count FROM shows');
        const [seatsCount] = await connection.query('SELECT COUNT(*) as count FROM seats');

        console.log('\n' + '═'.repeat(60));
        console.log('📊 DATABASE SEEDING COMPLETE!');
        console.log('═'.repeat(60));
        console.log(`   🎬 Movies: ${moviesCount[0].count}`);
        console.log(`   🎭 Shows: ${showsCount[0].count.toLocaleString()} (1 month of shows)`);
        console.log(`   🪑 Seats: ${seatsCount[0].count.toLocaleString()}`);
        console.log('═'.repeat(60));
        console.log('   📅 Date Range: Jan 20, 2026 - Feb 20, 2026');
        console.log('   🏛️  Halls: IMAX, Dolby Atmos, 4DX, Premium, Standard');
        console.log('═'.repeat(60));
        console.log('🌐 Refresh your website to see the movies!');
        console.log('═'.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
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
