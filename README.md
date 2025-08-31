# 🥋 Fight Club - Martial Arts Studio Booking System

A modern martial arts studio management and booking system built with **Bruce Lee/MMA inspired design**, featuring coach profiles, real-time scheduling, and admin management capabilities.

## 🚀 Live Demo

- **Production URL**: https://3000-i6j8a89cdu6n0k2d58aq0-6532622b.e2b.dev
- **API Base URL**: https://3000-i6j8a89cdu6n0k2d58aq0-6532622b.e2b.dev/api

## ✨ Currently Completed Features

### 🎯 Core User Features
- ✅ **Coach Directory**: Browse coaches with filtering by martial arts style and language
- ✅ **Real-time Availability**: View available time slots for each coach
- ✅ **Booking System**: Complete 3-step booking process (Coach → Date/Time → Details)
- ✅ **Student Dashboard**: Look up bookings by email with cancel functionality
- ✅ **Responsive Design**: Modern MMA/Bruce Lee themed UI with mobile support

### 🔧 Admin Features
- ✅ **Booking Management**: View all bookings with filtering by date/coach/status
- ✅ **Cancellation Management**: Admin can cancel bookings with reason tracking
- ✅ **Real-time Updates**: Live booking status and availability updates

### 📊 Data & Storage
- ✅ **D1 Database**: Complete schema with coaches, sessions, bookings, availability
- ✅ **Sample Data**: Pre-loaded with 4 martial arts coaches and demo bookings
- ✅ **Data Integrity**: Booking conflict prevention and validation

## 🌐 Functional Entry URIs

### 🎨 Frontend Pages
- **`/`** - Main landing page with hero section and navigation
- **`/#coaches`** - Coach directory with filtering
- **`/#book`** - Multi-step booking interface
- **`/#admin`** - Admin dashboard for booking management
- **`/#student-bookings`** - Student booking lookup

### 🔌 API Endpoints

#### Coaches & Availability
- **`GET /api/coaches`** - List all coaches with optional filtering
  - Query params: `?styles=MMA&languages=English&experience_min=5`
- **`GET /api/coaches/{id}`** - Get specific coach details with availability
- **`GET /api/coaches/{id}/availability/{date}`** - Get available slots for coach on date
  - Format: `/api/coaches/1/availability/2025-09-01`

#### Session Management
- **`GET /api/session-types`** - List available session types (Private, Sparring, etc.)

#### Booking Operations
- **`POST /api/bookings`** - Create new booking
  ```json
  {
    "coach_id": 1,
    "session_type_id": 1,
    "student_name": "John Doe",
    "student_email": "john@example.com",
    "booking_date": "2025-09-01",
    "start_time": "10:00",
    "special_requests": "Beginner level"
  }
  ```
- **`GET /api/bookings/student/{email}`** - Get bookings for student
- **`PATCH /api/bookings/{reference}/cancel`** - Cancel booking by reference

#### Admin Operations
- **`GET /api/admin/bookings`** - List all bookings with filtering
  - Query params: `?date_from=2025-09-01&date_to=2025-09-30&coach_id=1&status=confirmed`

## 🏗️ Data Architecture

### 📋 Core Data Models

**Coaches**
- Profile information (name, bio, contact)
- Martial arts styles (Kung Fu, MMA, Boxing, BJJ, etc.)
- Languages spoken
- Experience and certifications
- Hourly rates (for future pricing features)

**Session Types**
- Private Training (60 min)
- Technique Session (45 min)  
- Sparring Session (90 min)
- Fitness & Conditioning (60 min)

**Bookings**
- Student information and contact
- Coach and session type selection
- Date/time scheduling with conflict prevention
- Status tracking (confirmed, cancelled, completed, no-show)
- Booking reference system

**Availability Rules**
- Recurring weekly schedules per coach
- Exception handling for specific dates
- Location assignments (Main Training Room, Boxing Ring, Grappling Area)

### 🗄️ Storage Services Used
- **Cloudflare D1**: SQLite-based database for all relational data
- **Local Development**: Uses `--local` flag with automatic SQLite in `.wrangler/state/v3/d1`
- **Migrations**: Version-controlled schema changes in `/migrations`

### 📈 Data Flow
1. **Coach Setup**: Admin defines coaches, their styles, and availability patterns
2. **Student Browsing**: Filter coaches by preferences, view profiles and available slots
3. **Booking Creation**: Real-time availability checking and conflict prevention
4. **Management**: Admin and students can view, modify, or cancel bookings

## 📖 User Guide

### 👥 For Students

1. **Find a Coach**
   - Click "VIEW COACHES" to browse all martial arts instructors
   - Use filters to narrow by martial art style or language
   - Read coach bios and see their certifications

2. **Book a Session**
   - Click "BOOK SESSION" or select a specific coach
   - Choose your preferred coach from the list
   - Select date and session type
   - Pick an available time slot
   - Fill in your contact details and any special requests
   - Get instant booking confirmation with reference number

3. **Manage Your Bookings**
   - Click "My Bookings" in footer
   - Enter your email to view all your sessions
   - Cancel bookings if needed (subject to cancellation policy)

### 👨‍💼 For Admins

1. **View All Bookings**
   - Go to "ADMIN" section
   - Filter bookings by date range, coach, or status
   - See complete booking details and student information

2. **Manage Bookings**
   - Cancel bookings with reason tracking
   - View booking patterns and coach utilization
   - Export booking data (future feature)

### 🥋 Sample Coaches Available

- **Bruce Chen** - Kung Fu, Wing Chun, Kickboxing (15+ years)
- **Maria Rodriguez** - BJJ, Muay Thai, MMA (Former pro fighter)
- **Jake Thompson** - Boxing, Kickboxing (Golden Gloves champion)
- **Sensei Tanaka** - Karate, Judo, Aikido (Traditional master)

## 🛠️ Tech Stack

- **Backend**: Hono Framework + TypeScript
- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages/Workers
- **Icons**: Font Awesome 6
- **Styling**: Custom martial arts theme with Bruce Lee inspiration

## 📅 Deployment Status

- **Platform**: Cloudflare Pages (Ready for production deployment)
- **Status**: ✅ **Development Active** - Fully functional in sandbox
- **Database**: ✅ Local D1 with sample data loaded
- **APIs**: ✅ All endpoints operational
- **Frontend**: ✅ Complete booking flow working
- **Last Updated**: August 31, 2025

## 🔄 Features Not Yet Implemented

### 🚧 Phase 2 Features (Recommended Next Steps)
- **Booking Policies Enforcement**: Lead time requirements, cancellation windows
- **Email Notifications**: Booking confirmations and reminders
- **Coach Authentication**: Optional coach login portal
- **Payment Integration**: Pricing and checkout system
- **SMS Notifications**: Text reminders for sessions
- **Advanced Scheduling**: Recurring bookings, group sessions
- **Calendar Integration**: iCal/Google Calendar sync
- **Reviews & Ratings**: Student feedback system
- **Inventory Management**: Equipment and room scheduling
- **Multi-location Support**: Franchise/branch management

### 🎯 Immediate Development Priorities
1. **Production Deployment**: Deploy to live Cloudflare Pages with real D1 database
2. **Booking Policy Engine**: Implement time-based booking rules
3. **Email System**: Integration with SendGrid/Mailgun for notifications
4. **Enhanced Admin Panel**: Coach management, schedule exceptions
5. **Mobile App**: Progressive Web App (PWA) capabilities

## 🚦 Getting Started (Development)

```bash
# Clone and setup
git clone https://github.com/lenjoy/martial-art-studio-demo-new.git
cd martial-art-studio-demo-new

# Install dependencies
npm install

# Setup local D1 database
npm run db:migrate:local
npm run db:seed

# Start development server
npm run build
npm run dev:sandbox

# Access application
# Local: http://localhost:3000
# Sandbox: [provided URL]
```

## 📞 API Testing Examples

```bash
# Get all coaches
curl https://3000-i6j8a89cdu6n0k2d58aq0-6532622b.e2b.dev/api/coaches

# Check availability
curl https://3000-i6j8a89cdu6n0k2d58aq0-6532622b.e2b.dev/api/coaches/1/availability/2025-09-01

# Create booking
curl -X POST https://3000-i6j8a89cdu6n0k2d58aq0-6532622b.e2b.dev/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "coach_id": 1,
    "session_type_id": 1,
    "student_name": "Test Student",
    "student_email": "test@example.com",
    "booking_date": "2025-09-01",
    "start_time": "10:00"
  }'
```

---

**🥋 Train Like Bruce Lee - Master Your Martial Arts Journey** 

*"Be like water making its way through cracks. Do not be assertive, but adjust to the object, and you shall find a way around or through it."* - Bruce Lee