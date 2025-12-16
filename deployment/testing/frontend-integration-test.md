# Frontend Integration Testing Guide

## Overview
This guide provides comprehensive testing procedures for the BookMyShow frontend application, including manual testing steps, automated testing setup, and integration verification with the backend API.

## Prerequisites

### Required Tools
- **Browser**: Chrome/Firefox with Developer Tools
- **VS Code Extensions**: 
  - REST Client (ms-vscode.vscode-restclient)
  - Live Server (if testing static builds)
- **Node.js**: v18+ installed
- **Backend Server**: Running on `http://localhost:3000`
- **Database**: MySQL with seeded data

### Environment Setup
```bash
# 1. Start Backend Server
cd backend
npm install
npm run dev

# 2. Start Frontend Development Server
cd frontend
npm install
npm run dev

# 3. Verify Services
curl http://localhost:3000/api/health
curl http://localhost:5173
```

## Test Categories

### 1. Component Integration Tests

#### Movie Listing Component
**Test Scenario**: Movie catalog display and filtering

**Steps**:
1. Navigate to `http://localhost:5173`
2. Verify movie cards load with proper data
3. Test search functionality
4. Test language/genre filters
5. Verify pagination controls

**Expected Results**:
- Movies display with title, poster, rating, genre
- Search returns filtered results
- Filters work independently and combined
- Pagination shows correct page counts
- Loading states appear during API calls

**Test Data Validation**:
```javascript
// Expected API response structure
{
  "data": [
    {
      "id": 1,
      "title": "Movie Title",
      "poster_url": "https://...",
      "rating": 8.4,
      "genre": "Action/Adventure",
      "language": "English",
      "duration": 181
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

#### Show Selection Component  
**Test Scenario**: Theater and show time selection

**Steps**:
1. Click on any movie card
2. Verify navigation to `/movie/:id`
3. Check theater list loads for selected movie
4. Verify show times display correctly
5. Test date selection functionality

**Expected Results**:
- Movie details page loads with correct data
- Available theaters show for current city
- Show times grouped by theater and date
- Price information displays correctly
- "Book Now" buttons are functional

#### Seat Selection Component
**Test Scenario**: Interactive seat map and selection

**Steps**:
1. Click "Book Now" for any show
2. Verify navigation to `/booking/:showId`
3. Test seat map loading and display
4. Select multiple seats
5. Verify seat categories (Regular/Premium/VIP)
6. Test seat selection limits

**Expected Results**:
- Seat map renders correctly with proper layout
- Available seats are clickable
- Booked seats are disabled and visually distinct
- Reserved seats show temporary hold status
- Price updates dynamically with selection
- Maximum seat limit enforced (6 seats)

#### Booking Flow Component
**Test Scenario**: Complete booking process

**Steps**:
1. Select seats and proceed to checkout
2. Fill in user details (if not logged in)
3. Review booking summary
4. Complete payment simulation
5. Verify booking confirmation

**Expected Results**:
- Booking summary shows correct details
- User can review and modify selection
- Payment interface loads properly
- Booking confirmation with reference number
- Email notification sent (if implemented)

### 2. API Integration Tests

#### Authentication Flow
**Test Scenario**: User login and session management

```javascript
// Test login API call
const testLogin = async () => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@bookmyshow.com',
      password: 'password123'
    })
  });
  
  console.log('Login Status:', response.status);
  console.log('Session Cookie:', document.cookie);
};
```

**Manual Test Steps**:
1. Open browser DevTools → Application → Cookies
2. Navigate to login page
3. Enter test credentials
4. Verify session cookie creation
5. Test protected routes access
6. Verify logout functionality

#### Real-time Seat Updates
**Test Scenario**: Concurrent seat selection handling

**Setup**: Open two browser windows side by side

**Steps**:
1. Window A: Select seats for a show
2. Window B: Navigate to same show
3. Window A: Reserve selected seats
4. Window B: Verify seat status updates
5. Window A: Complete or cancel booking
6. Window B: Verify seat availability changes

**Expected Results**:
- Window B shows seats as "being selected" in real-time
- Reserved seats become unavailable immediately
- Released seats become available again
- No double booking occurs
- Proper error messages for conflicts

### 3. Performance Testing

#### Page Load Performance
**Test Scenario**: Frontend application loading metrics

**Browser DevTools Steps**:
1. Open DevTools → Network tab
2. Hard refresh page (Ctrl+Shift+R)
3. Check performance metrics
4. Analyze bundle sizes
5. Verify image loading optimization

**Performance Benchmarks**:
- Initial page load: < 2 seconds
- JavaScript bundle: < 500KB
- CSS bundle: < 100KB
- Images: Properly compressed and lazy-loaded
- API response time: < 500ms

#### Stress Testing
**Test Scenario**: High concurrent user simulation

**Manual Simulation**:
1. Open 5-10 browser tabs
2. Navigate to same show in all tabs
3. Attempt seat selection simultaneously
4. Monitor server response times
5. Check for race condition errors

### 4. Cross-Browser Compatibility

#### Browser Testing Matrix
| Browser | Version | OS | Status |
|---------|---------|----|---------
| Chrome | Latest | Windows | ✓ |
| Firefox | Latest | Windows | ✓ |
| Safari | Latest | macOS | ⚠️ |
| Edge | Latest | Windows | ✓ |
| Mobile Chrome | Latest | Android | ⚠️ |
| Mobile Safari | Latest | iOS | ⚠️ |

**Test Procedure for Each Browser**:
1. Complete booking flow end-to-end
2. Verify responsive design breakpoints
3. Test touch interactions (mobile)
4. Check console for JavaScript errors
5. Validate CSS rendering consistency

### 5. Error Handling Tests

#### Network Error Simulation
**Test Scenario**: Offline/poor connectivity handling

**Chrome DevTools Setup**:
1. DevTools → Network → Throttling → Offline
2. Attempt various user actions
3. Check error messages and retry mechanisms

**Test Cases**:
- API timeout handling
- Network disconnection during booking
- Server error responses (500, 503)
- Invalid API responses
- CORS errors

#### Form Validation Testing
**Test Scenario**: Input validation and error messages

**Test Cases**:
1. **Email Validation**: Invalid formats, missing @, etc.
2. **Phone Validation**: Invalid lengths, non-numeric
3. **Required Fields**: Empty submissions
4. **Payment Fields**: Invalid card numbers, expired dates
5. **Seat Selection**: No seats selected, too many seats

### 6. Accessibility Testing

#### Keyboard Navigation
**Test Scenario**: Complete app navigation using only keyboard

**Steps**:
1. Use Tab key to navigate through all interactive elements
2. Use Enter/Space to activate buttons
3. Use Arrow keys for custom components
4. Test modal dialogs and popups
5. Verify focus indicators are visible

#### Screen Reader Testing
**Test Scenario**: Content accessibility for visually impaired users

**Tools**: 
- NVDA (Windows)
- VoiceOver (macOS)
- Browser accessibility DevTools

**Test Points**:
- Proper heading hierarchy (h1, h2, h3)
- Alt text for images
- ARIA labels for interactive elements
- Form field labels and error announcements
- Status messages for dynamic content

### 7. Mobile Responsiveness

#### Responsive Design Testing
**Browser DevTools**:
1. Toggle device toolbar (F12 → Toggle device)
2. Test various screen sizes:
   - Mobile: 375px, 414px
   - Tablet: 768px, 1024px
   - Desktop: 1200px, 1440px

**Touch Interface Testing**:
- Seat selection with touch
- Swipe gestures (if implemented)
- Pinch-to-zoom on seat maps
- Touch target sizes (minimum 44px)

## Automated Testing Setup

### Jest + React Testing Library
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Run component tests
npm run test
```

### Cypress End-to-End Testing
```bash
# Install Cypress
npm install --save-dev cypress

# Open Cypress Test Runner
npx cypress open
```

**Sample E2E Test**:
```javascript
// cypress/e2e/booking-flow.cy.js
describe('Complete Booking Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('should complete a movie booking successfully', () => {
    // Select movie
    cy.get('[data-testid="movie-card"]').first().click()
    
    // Select show
    cy.get('[data-testid="show-time-button"]').first().click()
    
    // Select seats
    cy.get('[data-testid="seat-A01"]').click()
    cy.get('[data-testid="seat-A02"]').click()
    
    // Proceed to checkout
    cy.get('[data-testid="proceed-button"]').click()
    
    // Fill user details
    cy.get('[data-testid="user-email"]').type('test@example.com')
    cy.get('[data-testid="user-phone"]').type('9876543210')
    
    // Complete booking
    cy.get('[data-testid="confirm-booking"]').click()
    
    // Verify confirmation
    cy.get('[data-testid="booking-reference"]').should('be.visible')
  })
})
```

## Integration Test Checklist

### Frontend-Backend Integration
- [ ] API endpoints return expected data structure
- [ ] Error responses handled gracefully
- [ ] Authentication state managed correctly
- [ ] Session persistence across page refreshes
- [ ] CORS configured properly
- [ ] Request/response logging working

### Database Integration
- [ ] Booking data persisted correctly
- [ ] Seat reservations expired properly
- [ ] User data validation working
- [ ] Transaction rollback on errors
- [ ] Data consistency maintained

### Third-Party Integration (if applicable)
- [ ] Payment gateway integration
- [ ] Email service integration
- [ ] SMS service integration
- [ ] Analytics tracking
- [ ] Error monitoring service

## Test Data Management

### Seed Data Verification
```sql
-- Verify test data is available
SELECT COUNT(*) FROM movies WHERE is_active = 1;
SELECT COUNT(*) FROM shows WHERE show_time > NOW();
SELECT COUNT(*) FROM theaters WHERE is_active = 1;
```

### Test User Accounts
| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| test@bookmyshow.com | password123 | User | General testing |
| admin@bookmyshow.com | admin123 | Admin | Admin features |
| load@bookmyshow.com | load123 | User | Load testing |

## Troubleshooting Guide

### Common Issues

#### CORS Errors
**Problem**: API calls blocked by CORS policy
**Solution**: 
```javascript
// backend/src/app.js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

#### Session Issues
**Problem**: Login state not persisting
**Solution**: Check cookie settings and HTTPS requirements

#### Database Connection
**Problem**: Backend can't connect to MySQL
**Solution**: Verify connection string and database status

#### Build Errors
**Problem**: Frontend build fails
**Solution**: Check TypeScript errors and dependency versions

### Logging and Debugging

#### Backend Logs
```bash
# View real-time backend logs
tail -f backend/logs/app.log
```

#### Frontend Console
```javascript
// Enable debug logging
localStorage.setItem('debug', 'bookmyshow:*');
```

#### Database Monitoring
```sql
-- Check active connections
SHOW PROCESSLIST;

-- Monitor slow queries
SELECT * FROM information_schema.PROCESSLIST WHERE TIME > 5;
```

## Test Reporting

### Test Results Documentation
- Create test execution reports
- Screenshot failures
- Document environment details
- Track performance metrics
- Log bug reports with reproduction steps

### Success Criteria
- [ ] All critical user journeys working
- [ ] No console errors in browser
- [ ] Responsive design verified
- [ ] Performance benchmarks met
- [ ] Security measures functioning
- [ ] Error handling tested
- [ ] Accessibility standards met

## Continuous Testing

### Pre-deployment Checklist
1. Run full test suite
2. Verify API endpoints
3. Check database migrations
4. Test in production-like environment
5. Performance testing
6. Security scanning
7. Browser compatibility check

### Post-deployment Monitoring
- Error tracking (Sentry/Bugsnag)
- Performance monitoring (Web Vitals)
- User behavior analytics
- API response time monitoring
- Database performance metrics

---

*This testing guide ensures comprehensive validation of the BookMyShow application across all user scenarios and technical requirements.*