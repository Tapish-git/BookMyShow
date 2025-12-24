// Quick test to verify DATABASE_URL parsing
const testUrl = 'mysql://root:QbGlPhRcyPQBLAjuXlPtIjjkeBUjoRp@mysql.railway.internal:3306/railway';

function parseDatabaseUrl(url) {
    if (!url) return null;

    try {
        const urlPattern = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
        const match = url.match(urlPattern);

        if (match) {
            return {
                username: match[1],
                password: match[2],
                host: match[3],
                port: parseInt(match[4], 10),
                database: match[5],
            };
        }
    } catch (error) {
        console.error('Failed to parse DATABASE_URL:', error.message);
    }

    return null;
}

const result = parseDatabaseUrl(testUrl);
console.log('Parsed result:', result);
