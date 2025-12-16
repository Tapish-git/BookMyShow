# System Architecture Design

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │    │   React App     │    │   Express API   │
│                 │◄──►│   (Frontend)    │◄──►│   (Backend)     │
│  - Movie Browse │    │  - Components   │    │  - Controllers  │
│  - Seat Select  │    │  - State Mgmt   │    │  - Services     │
│  - Booking      │    │  - API Calls    │    │  - Middleware   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   MySQL DB      │
                                              │  - Movies       │
                                              │  - Shows        │
                                              │  - Seats        │
                                              │  - Bookings     │
                                              └─────────────────┘
```

## Detailed Architecture Components

### 1. Frontend Layer (React Application)

#### Component Architecture
```
App (Root)
├── Router
│   ├── HomePage
│   │   ├── MovieGrid
│   │   │   └── MovieCard
│   │   └── SearchBar
│   ├── MovieDetailsPage
│   │   ├── MovieInfo
│   │   ├── ShowTimings
│   │   └── DateSelector
│   ├── SeatSelectionPage
│   │   ├── SeatMap
│   │   │   └── SeatButton
│   │   ├── SelectedSeats
│   │   └── BookingForm
│   └── TicketPage
│       └── TicketDisplay
```

#### State Management Strategy
```javascript
// Global Context Structure
AppContext {
  selectedMovie: Movie | null,
  selectedShow: Show | null,
  selectedSeats: Seat[],
  bookingData: BookingInfo | null,
  user: UserSession | null
}

// Component-Level State
- MovieGrid: movies[], loading, error
- SeatMap: seatLayout[][], blockedSeats[], selectedSeats[]
- BookingForm: formData, validation errors
```

### 2. Backend Layer (Express.js API)

#### API Architecture Pattern
```
Request → Middleware Chain → Controller → Service → Model → Database
    ↓
Response ← Controller ← Service ← Model ← Database Result
```

#### Core Middleware Chain
1. **Logger Middleware** - Request/response logging
2. **CORS Middleware** - Cross-origin resource sharing
3. **Body Parser** - JSON request parsing
4. **Session Middleware** - User session management
5. **Validation Middleware** - Request validation (Joi)
6. **Error Handler** - Centralized error handling

#### Service Layer Design
```javascript
// Service Layer Responsibilities
MovieService {
  getAllMovies()
  getMovieById(id)
  searchMovies(query)
}

ShowService {
  getShowsByMovie(movieId)
  getShowById(id)
  getAvailableSeats(showId)
}

BookingService {
  createBooking(bookingData)
  blockSeats(showId, seatIds)
  releaseExpiredBlocks()
  confirmBooking(bookingId)
}

SeatService {
  getSeatLayout(showId)
  blockSeat(seatId, expiryTime)
  releaseSeat(seatId)
  confirmSeatBooking(seatId, bookingId)
}
```

### 3. Database Layer Design

#### Connection Architecture
```javascript
// Database Configuration
Database Connection Pool (MySQL)
├── Read Operations (80% of traffic)
├── Write Operations (20% of traffic)
└── Transaction Management for Bookings
```

#### Data Access Patterns
```javascript
// Repository Pattern Implementation
BaseRepository {
  findById(id)
  findAll(conditions)
  create(data)
  update(id, data)
  delete(id)
}

MovieRepository extends BaseRepository {
  findByGenre(genre)
  searchByTitle(title)
  findWithShows(movieId)
}

SeatRepository extends BaseRepository {
  findByShow(showId)
  findAvailableSeats(showId)
  blockSeats(seatIds, expiry)
  releaseExpiredSeats()
}
```

## Critical System Flows

### 1. Seat Selection Flow
```
User clicks seat → Frontend optimistic update → API call to block seat
    ↓
Backend validates availability → Database transaction → Block seat for 5 minutes
    ↓
Return success/failure → Frontend updates UI → Start countdown timer
    ↓
If user doesn't book within 5 minutes → Auto-release seat → Update UI
```

### 2. Booking Confirmation Flow
```
User submits booking form → Validate user details → Check seat blocks still active
    ↓
Create booking record → Convert seat blocks to confirmed reservations
    ↓
Update available seat counts → Generate booking reference → Return ticket data
```

### 3. Concurrent User Handling
```
Multiple users select same seat → First user gets block → Others receive "unavailable"
    ↓
Database-level constraints prevent double booking → Graceful error handling
    ↓
Frontend shows real-time seat availability updates
```

## API Design

### RESTful Endpoint Structure
```
GET    /api/movies                    # Get all movies
GET    /api/movies/:id                # Get movie details
GET    /api/movies/:id/shows          # Get shows for a movie

GET    /api/shows/:id                 # Get show details
GET    /api/shows/:id/seats           # Get seat layout

POST   /api/seats/block               # Block selected seats
DELETE /api/seats/:id/block           # Release seat block

POST   /api/bookings                  # Create new booking
GET    /api/bookings/:reference       # Get booking details
```

### Request/Response Formats
```javascript
// Seat Block Request
POST /api/seats/block
{
  showId: "show-123",
  seatIds: ["seat-a1", "seat-a2"],
  blockDuration: 300 // 5 minutes in seconds
}

// Seat Block Response
{
  success: true,
  blockedSeats: [
    {
      seatId: "seat-a1",
      expiresAt: "2024-01-01T10:05:00Z"
    }
  ],
  message: "Seats blocked successfully"
}
```

## Performance Considerations

### 1. Database Optimization
- **Indexing Strategy**: Show date, movie ID, seat availability
- **Connection Pooling**: Reuse database connections
- **Query Optimization**: Avoid N+1 queries, use joins efficiently

### 2. Caching Strategy (Intentionally Basic)
```javascript
// Simple in-memory cache for movie data
const movieCache = new Map();

// Cache movie data for 1 hour (static data)
// Real-time data (seats) always fetched from DB
```

### 3. Concurrency Handling
```javascript
// Database transactions for seat booking
const transaction = await sequelize.transaction();
try {
  await SeatService.blockSeats(seatIds, { transaction });
  await ShowService.updateAvailableCount(showId, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## Scalability Bottlenecks (Intentional Design Issues)

### 1. **Session Storage Bottleneck** ⚠️
- **Current**: Server-side sessions in database
- **Issue**: Doesn't scale horizontally
- **Discussion**: Move to Redis or JWT tokens

### 2. **Real-time Updates Missing** ⚠️
- **Current**: Polling for seat availability
- **Issue**: Delayed updates, high server load
- **Discussion**: WebSockets, Server-Sent Events

### 3. **Single Database Instance** ⚠️
- **Current**: One MySQL instance for everything
- **Issue**: Single point of failure, performance bottleneck
- **Discussion**: Read replicas, database clustering

### 4. **No Load Balancing** ⚠️
- **Current**: Single server instance
- **Issue**: Can't handle traffic spikes
- **Discussion**: Horizontal scaling, load balancers

### 5. **Naive Seat Locking** ⚠️
- **Current**: Simple expiry-based locking
- **Issue**: Race conditions possible
- **Discussion**: Distributed locks, Redis-based locking

## Security Considerations

### 1. Input Validation
```javascript
// All API inputs validated with Joi schemas
const movieSchema = Joi.object({
  title: Joi.string().required().max(255),
  genre: Joi.string().required(),
  duration: Joi.number().integer().min(1).max(500)
});
```

### 2. Basic Authentication
```javascript
// Simple session-based auth (intentionally basic)
// Real systems would use OAuth, JWT, etc.
```

### 3. SQL Injection Prevention
```javascript
// Sequelize ORM prevents SQL injection
// All queries parameterized automatically
```

## Monitoring and Logging

### 1. Application Logging
```javascript
// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'app.log' })
  ]
});
```

### 2. Error Tracking
```javascript
// Basic error handling middleware
app.use((error, req, res, next) => {
  logger.error('Application Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    requestId: req.id 
  });
});
```

## Deployment Architecture

### Development Environment
```
Local Machine
├── MySQL (Docker container)
├── Node.js Backend (localhost:3000)
└── React Frontend (localhost:3001)
```

### Production Environment
```
Frontend (Vercel) ─── API Gateway ─── Backend (Railway)
                                           │
                                           ▼
                                    Database (PlanetScale)
```

This architecture provides a solid foundation for learning while deliberately including improvement opportunities for educational discussions about scalability, performance, and best practices.