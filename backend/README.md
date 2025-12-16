# BookMyShow Clone - Backend API

A comprehensive movie ticketing backend system built with Node.js, Express, and MySQL. This system provides robust APIs for movie browsing, show management, seat selection, and booking functionality.

## 🚀 Features

- **Movie Management**: Browse, search, and view movie details
- **Show Scheduling**: View shows by movie, date, and hall
- **Seat Selection**: Interactive seat blocking with 5-minute hold
- **Booking System**: Create, view, and cancel bookings
- **Real-time Availability**: Dynamic seat availability updates
- **Comprehensive Logging**: Structured logging with Winston
- **Error Handling**: Centralized error management
- **Input Validation**: Joi-based request validation
- **Rate Limiting**: IP-based rate limiting for security

## 🛠 Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Sequelize
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Session Management**: express-session with database store

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── models/                  # Sequelize models
│   │   ├── Movie.js
│   │   ├── Show.js
│   │   ├── Seat.js
│   │   ├── Booking.js
│   │   ├── SeatReservation.js
│   │   └── index.js
│   ├── controllers/             # Request handlers
│   │   ├── movieController.js
│   │   ├── showController.js
│   │   ├── seatController.js
│   │   └── bookingController.js
│   ├── routes/                  # API routes
│   │   ├── movieRoutes.js
│   │   ├── showRoutes.js
│   │   ├── seatRoutes.js
│   │   ├── bookingRoutes.js
│   │   └── healthRoutes.js
│   ├── middleware/              # Custom middleware
│   │   ├── logger.js
│   │   ├── errorHandler.js
│   │   └── requestValidator.js
│   └── app.js                   # Express app setup
├── logs/                        # Application logs
├── package.json
├── .env.example
└── README.md
```

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bookmyshow-clone/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Configure MySQL database**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=bookmyshow_db
   DB_USER=root
   DB_PASSWORD=your_password
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📊 Database Schema

### Core Entities

1. **Movies** - Movie information (title, genre, rating, etc.)
2. **Shows** - Movie screenings with date, time, and hall
3. **Seats** - Individual seats in theater halls
4. **Bookings** - User booking records
5. **SeatReservations** - Seat blocking and confirmation states

### Key Relationships

- Movie → Shows (1:Many)
- Show → Seats (1:Many)
- Show → Bookings (1:Many)
- Booking → SeatReservations (1:Many)
- Seat → SeatReservations (1:Many)

## 🌐 API Endpoints

### Movies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/movies` | Get all movies with filtering |
| GET | `/api/v1/movies/:id` | Get movie by ID with shows |
| GET | `/api/v1/movies/search` | Search movies |
| GET | `/api/v1/movies/now-showing` | Get currently showing movies |
| GET | `/api/v1/movies/genre/:genre` | Get movies by genre |

### Shows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/shows` | Get all shows with filtering |
| GET | `/api/v1/shows/:id` | Get show details |
| GET | `/api/v1/shows/movie/:movieId` | Get shows by movie |
| GET | `/api/v1/shows/date-range` | Get shows in date range |

### Seats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/seats/layout/:showId` | Get seat layout |
| GET | `/api/v1/seats/available/:showId` | Get available seats |
| POST | `/api/v1/seats/block` | Block seats temporarily |
| POST | `/api/v1/seats/release` | Release blocked seats |
| PATCH | `/api/v1/seats/extend-block` | Extend seat block |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bookings` | Create new booking |
| GET | `/api/v1/bookings/:reference` | Get booking details |
| GET | `/api/v1/bookings/user/:email` | Get user bookings |
| DELETE | `/api/v1/bookings/:reference` | Cancel booking |
| GET | `/api/v1/bookings/stats` | Get booking statistics |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/api/v1/health` | Detailed health info |

## 🔄 Booking Flow

1. **Browse Movies**: `GET /api/v1/movies`
2. **View Movie Shows**: `GET /api/v1/movies/:id`
3. **Select Show**: `GET /api/v1/shows/:id`
4. **View Seats**: `GET /api/v1/seats/layout/:showId`
5. **Block Seats**: `POST /api/v1/seats/block`
6. **Create Booking**: `POST /api/v1/bookings`
7. **View Ticket**: `GET /api/v1/bookings/:reference`

## 🛡 Security Features

- **Rate Limiting**: Different limits for different endpoints
- **Input Validation**: Comprehensive Joi schemas
- **SQL Injection Protection**: Sequelize ORM parameterization
- **XSS Prevention**: Input sanitization
- **CORS Configuration**: Controlled cross-origin access
- **Security Headers**: Helmet.js security headers

## 📝 Logging

The application uses structured logging with Winston:

- **Request Logging**: All HTTP requests with timing
- **Business Events**: Booking creation, seat blocking, etc.
- **Performance Metrics**: Response times and resource usage
- **Error Tracking**: Detailed error context
- **Security Events**: Suspicious activities

Log files are stored in the `logs/` directory:
- `combined.log`: All logs
- `error.log`: Error logs only
- `exceptions.log`: Uncaught exceptions

## 🔍 Monitoring

### Health Check Endpoints

- `/health`: Basic health status
- `/api/v1/health`: Detailed system information

### Key Metrics

- Database connection status
- Model record counts
- System uptime and memory usage
- Response times

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📈 Performance Considerations

### Current Optimizations

- Database indexing on key fields
- Connection pooling
- Structured logging
- Input validation

### Known Bottlenecks

- No caching layer (suitable for 100 DAU)
- Seat availability calculated real-time
- No query optimization for large datasets
- Simple session storage

### Scalability Improvements (Future)

- Redis caching layer
- Database read replicas
- Horizontal scaling with load balancers
- WebSocket for real-time updates

## 🚨 Error Handling

The API uses structured error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (seat already booked)
- `BUSINESS_LOGIC_ERROR`: Business rule violation
- `RATE_LIMIT_EXCEEDED`: Too many requests

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3000 |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_NAME` | Database name | bookmyshow_db |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | - |
| `SESSION_SECRET` | Session secret key | - |
| `LOG_LEVEL` | Logging level | info |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3001 |

### Rate Limiting

- Global: 100 requests/15 minutes (production)
- Seat blocking: 5 requests/minute
- Booking creation: 3 requests/5 minutes
- Cancellations: 5 requests/hour

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL service is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Session Store Errors**
   - Check session table creation
   - Verify database permissions

3. **Rate Limit Errors**
   - Check IP-based restrictions
   - Review rate limiting configuration

4. **Validation Errors**
   - Review request payload format
   - Check required fields

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 🤝 Contributing

1. Follow the established code structure
2. Add comprehensive logging for new features
3. Include proper error handling
4. Write descriptive comments
5. Update API documentation

## 📄 License

This project is for educational purposes and demonstration of backend development skills.

---

**Note**: This is a learning project designed to demonstrate backend development concepts. The intentional limitations and improvement opportunities are documented throughout the codebase for educational discussion.