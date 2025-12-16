# Database Design - Entity Models & Schema

## Entity Relationship Analysis

Based on our simplified requirements, we need these core entities:

### Core Entities

1. **Movie** - Central entity containing movie information
2. **Show** - Represents a movie screening at a specific date/time
3. **Seat** - Individual seats in a theater hall
4. **Booking** - User's ticket booking record
5. **SeatReservation** - Temporary seat holds and confirmed bookings

## Entity Models

### 1. Movie Entity
```javascript
Movie {
  id: String (Primary Key)
  title: String (Required)
  description: Text
  genre: String
  duration: Integer (minutes)
  rating: Float (1-10)
  poster_url: String
  release_date: Date
  language: String
  created_at: DateTime
  updated_at: DateTime
}
```

**Attributes Explanation:**
- `id`: Unique identifier (UUID recommended)
- `title`: Movie name for display
- `description`: Movie plot/summary
- `genre`: Category (Action, Comedy, Drama, etc.)
- `duration`: Runtime in minutes
- `rating`: Average user rating (1-10 scale)
- `poster_url`: Image URL for movie poster
- `language`: Primary language of the movie

### 2. Show Entity
```javascript
Show {
  id: String (Primary Key)
  movie_id: String (Foreign Key -> Movie.id)
  show_date: Date
  show_time: Time
  hall_name: String
  total_seats: Integer
  available_seats: Integer
  price: Float
  created_at: DateTime
  updated_at: DateTime
}
```

**Attributes Explanation:**
- `movie_id`: Reference to the movie being shown
- `show_date`: Date of the screening
- `show_time`: Time of the screening
- `hall_name`: Theater hall identifier (Hall-1, Hall-2, etc.)
- `total_seats`: Maximum capacity of the hall
- `available_seats`: Current available seats (updated real-time)
- `price`: Ticket price for this show

### 3. Seat Entity
```javascript
Seat {
  id: String (Primary Key)
  show_id: String (Foreign Key -> Show.id)
  row_number: String (A, B, C...)
  seat_number: Integer (1, 2, 3...)
  seat_type: String (Regular, Premium)
  is_available: Boolean
  created_at: DateTime
}
```

**Attributes Explanation:**
- `show_id`: Reference to the specific show
- `row_number`: Seat row (A, B, C, etc.)
- `seat_number`: Seat number within the row
- `seat_type`: Category of seat (affects pricing potentially)
- `is_available`: Current availability status

### 4. Booking Entity
```javascript
Booking {
  id: String (Primary Key)
  booking_reference: String (Unique)
  user_email: String
  user_name: String
  user_phone: String
  show_id: String (Foreign Key -> Show.id)
  total_seats: Integer
  total_amount: Float
  booking_status: String (CONFIRMED, CANCELLED)
  booking_date: DateTime
  created_at: DateTime
}
```

**Attributes Explanation:**
- `booking_reference`: Unique ticket number for user reference
- `user_email`: User's email address
- `user_name`: User's full name
- `user_phone`: Contact number
- `total_seats`: Number of seats booked
- `total_amount`: Total cost of booking
- `booking_status`: Current status of the booking

### 5. SeatReservation Entity
```javascript
SeatReservation {
  id: String (Primary Key)
  booking_id: String (Foreign Key -> Booking.id)
  seat_id: String (Foreign Key -> Seat.id)
  reservation_status: String (BLOCKED, CONFIRMED, EXPIRED)
  blocked_at: DateTime
  expires_at: DateTime
  confirmed_at: DateTime
  created_at: DateTime
}
```

**Attributes Explanation:**
- `booking_id`: Reference to the booking (null for temporary blocks)
- `seat_id`: Reference to the specific seat
- `reservation_status`: BLOCKED (5min hold), CONFIRMED (booked), EXPIRED (auto-released)
- `blocked_at`: When the seat was initially blocked
- `expires_at`: When the block will automatically expire
- `confirmed_at`: When the booking was confirmed

## Relationships

```
Movie (1) -----> (Many) Show
Show (1) -----> (Many) Seat
Show (1) -----> (Many) Booking
Booking (1) -----> (Many) SeatReservation
Seat (1) -----> (Many) SeatReservation
```

## Database Schema (SQL)

```sql
-- Movies table
CREATE TABLE movies (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    duration INTEGER,
    rating DECIMAL(3,1),
    poster_url VARCHAR(500),
    release_date DATE,
    language VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shows table
CREATE TABLE shows (
    id VARCHAR(36) PRIMARY KEY,
    movie_id VARCHAR(36) NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    hall_name VARCHAR(100) NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- Seats table
CREATE TABLE seats (
    id VARCHAR(36) PRIMARY KEY,
    show_id VARCHAR(36) NOT NULL,
    row_number VARCHAR(5) NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type VARCHAR(50) DEFAULT 'Regular',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (show_id) REFERENCES shows(id),
    UNIQUE KEY unique_seat (show_id, row_number, seat_number)
);

-- Bookings table
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_phone VARCHAR(20),
    show_id VARCHAR(36) NOT NULL,
    total_seats INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(20) DEFAULT 'CONFIRMED',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (show_id) REFERENCES shows(id)
);

-- Seat reservations table
CREATE TABLE seat_reservations (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36),
    seat_id VARCHAR(36) NOT NULL,
    reservation_status VARCHAR(20) NOT NULL,
    blocked_at TIMESTAMP,
    expires_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id),
    UNIQUE KEY unique_active_reservation (seat_id, reservation_status)
);

-- Indexes for performance
CREATE INDEX idx_shows_movie_date ON shows(movie_id, show_date);
CREATE INDEX idx_shows_date ON shows(show_date);
CREATE INDEX idx_seat_reservations_expires ON seat_reservations(expires_at);
CREATE INDEX idx_seat_reservations_status ON seat_reservations(reservation_status);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
```

## Design Considerations (Potential Issues for Discussion)

### 1. **Race Condition in Seat Selection** ⚠️
Current design might allow multiple users to select the same seat simultaneously. Better approach would be to implement atomic seat locking.

### 2. **Denormalized Available Seats** ⚠️
Storing `available_seats` in shows table can lead to consistency issues. Should be calculated dynamically or use event sourcing.

### 3. **Simple Seat Blocking** ⚠️
Basic 5-minute expiration might not handle edge cases like server restarts or long-running transactions.

### 4. **Missing Audit Trail** ⚠️
No history tracking for seat reservations or booking modifications.

### 5. **Basic User Management** ⚠️
User details stored with each booking (data redundancy). Should consider separate user entity for scalability.

### 6. **No Seat Layout Configuration** ⚠️
Current design assumes simple row/seat numbering. Real theaters have complex layouts.

These design gaps are intentional learning opportunities for architectural discussions!