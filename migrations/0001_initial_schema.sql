-- Martial Arts Studio Database Schema

-- Coaches table - stores coach information and profiles
CREATE TABLE IF NOT EXISTS coaches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  bio TEXT,
  profile_image_url TEXT,
  martial_arts_styles TEXT, -- JSON array of styles like ["Muay Thai", "BJJ", "Boxing"]
  languages TEXT, -- JSON array like ["English", "Spanish", "Chinese"]
  experience_years INTEGER DEFAULT 0,
  certifications TEXT, -- JSON array of certifications
  hourly_rate DECIMAL(10,2) DEFAULT 0, -- For future pricing features
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session types - different types of training sessions offered
CREATE TABLE IF NOT EXISTS session_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- e.g. "1-on-1 Training", "Group Class", "Sparring Session"
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  buffer_minutes INTEGER DEFAULT 15, -- Time between sessions
  max_participants INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Locations - training locations/rooms (optional feature)
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- e.g. "Main Training Room", "Boxing Ring", "Mats Area"
  description TEXT,
  capacity INTEGER DEFAULT 10,
  equipment TEXT, -- JSON array of available equipment
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Coach availability rules - recurring availability patterns
CREATE TABLE IF NOT EXISTS coach_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coach_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL, -- e.g. '09:00'
  end_time TIME NOT NULL, -- e.g. '17:00'
  location_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- Coach availability exceptions - specific date overrides
CREATE TABLE IF NOT EXISTS availability_exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coach_id INTEGER NOT NULL,
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('unavailable', 'custom_hours')),
  start_time TIME, -- For custom hours
  end_time TIME, -- For custom hours
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- Bookings - student session bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coach_id INTEGER NOT NULL,
  session_type_id INTEGER NOT NULL,
  location_id INTEGER,
  
  -- Student information
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT,
  
  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Status and policies
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed', 'no_show')),
  cancellation_reason TEXT,
  special_requests TEXT,
  
  -- Booking policies and metadata
  booking_reference TEXT UNIQUE NOT NULL, -- Unique reference for students
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancelled_at DATETIME,
  
  FOREIGN KEY (coach_id) REFERENCES coaches(id),
  FOREIGN KEY (session_type_id) REFERENCES session_types(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Booking policies - system-wide booking rules
CREATE TABLE IF NOT EXISTS booking_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_name TEXT NOT NULL UNIQUE,
  policy_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table (for admin authentication)
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- Will store hashed passwords
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coaches_styles ON coaches(martial_arts_styles);
CREATE INDEX IF NOT EXISTS idx_coaches_active ON coaches(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_coach_day ON coach_availability(coach_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_exceptions_coach_date ON availability_exceptions(coach_id, exception_date);
CREATE INDEX IF NOT EXISTS idx_bookings_coach_date ON bookings(coach_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_student_email ON bookings(student_email);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_range ON bookings(booking_date, start_time);