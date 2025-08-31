import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings, Coach, SessionType, Booking, CreateBookingRequest, CoachFilter, BookingFilter } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Utility functions
function generateBookingReference(): string {
  return 'BK' + Math.random().toString(36).substr(2, 6).toUpperCase()
}

function parseJsonField(field: string | null): any[] {
  if (!field) return []
  try {
    return JSON.parse(field)
  } catch {
    return []
  }
}

// API Routes

// Get all coaches with filtering
app.get('/api/coaches', async (c) => {
  const { styles, languages, experience_min, available_date } = c.req.query()
  
  let query = `
    SELECT c.*, 
           GROUP_CONCAT(DISTINCT l.name) as location_names
    FROM coaches c
    LEFT JOIN coach_availability ca ON c.id = ca.coach_id AND ca.is_active = 1
    LEFT JOIN locations l ON ca.location_id = l.id
    WHERE c.is_active = 1
  `
  
  const params: any[] = []
  
  if (styles) {
    query += ` AND c.martial_arts_styles LIKE ?`
    params.push(`%${styles}%`)
  }
  
  if (languages) {
    query += ` AND c.languages LIKE ?`
    params.push(`%${languages}%`)
  }
  
  if (experience_min) {
    query += ` AND c.experience_years >= ?`
    params.push(parseInt(experience_min))
  }
  
  query += ` GROUP BY c.id ORDER BY c.experience_years DESC`
  
  const stmt = c.env.DB.prepare(query)
  const { results } = await stmt.bind(...params).all()
  
  const coaches = results.map((coach: any) => ({
    ...coach,
    martial_arts_styles: parseJsonField(coach.martial_arts_styles),
    languages: parseJsonField(coach.languages),
    certifications: parseJsonField(coach.certifications)
  }))
  
  return c.json({ coaches })
})

// Get specific coach with availability
app.get('/api/coaches/:id', async (c) => {
  const coachId = parseInt(c.req.param('id'))
  
  // Get coach details
  const coachStmt = c.env.DB.prepare('SELECT * FROM coaches WHERE id = ? AND is_active = 1')
  const coach = await coachStmt.bind(coachId).first()
  
  if (!coach) {
    return c.json({ error: 'Coach not found' }, 404)
  }
  
  // Get coach availability
  const availStmt = c.env.DB.prepare(`
    SELECT ca.*, l.name as location_name 
    FROM coach_availability ca
    LEFT JOIN locations l ON ca.location_id = l.id
    WHERE ca.coach_id = ? AND ca.is_active = 1
    ORDER BY ca.day_of_week, ca.start_time
  `)
  const { results: availability } = await availStmt.bind(coachId).all()
  
  return c.json({
    coach: {
      ...coach,
      martial_arts_styles: parseJsonField(coach.martial_arts_styles),
      languages: parseJsonField(coach.languages),
      certifications: parseJsonField(coach.certifications)
    },
    availability
  })
})

// Get available slots for a coach on a specific date
app.get('/api/coaches/:id/availability/:date', async (c) => {
  const coachId = parseInt(c.req.param('id'))
  const date = c.req.param('date')
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = new Date(date).getDay()
  
  // Get coach's regular availability for this day
  const availStmt = c.env.DB.prepare(`
    SELECT * FROM coach_availability 
    WHERE coach_id = ? AND day_of_week = ? AND is_active = 1
  `)
  const availability = await availStmt.bind(coachId, dayOfWeek).first()
  
  if (!availability) {
    return c.json({ slots: [] })
  }
  
  // Check for exceptions on this date
  const exceptionStmt = c.env.DB.prepare(`
    SELECT * FROM availability_exceptions 
    WHERE coach_id = ? AND exception_date = ?
  `)
  const exception = await exceptionStmt.bind(coachId, date).first()
  
  if (exception && exception.exception_type === 'unavailable') {
    return c.json({ slots: [] })
  }
  
  // Get existing bookings for this date
  const bookingsStmt = c.env.DB.prepare(`
    SELECT start_time, end_time FROM bookings 
    WHERE coach_id = ? AND booking_date = ? AND status IN ('confirmed', 'rescheduled')
  `)
  const { results: bookings } = await bookingsStmt.bind(coachId, date).all()
  
  // Generate available time slots (simplified - 1 hour slots)
  const slots = []
  const startHour = parseInt(availability.start_time.split(':')[0])
  const endHour = parseInt(availability.end_time.split(':')[0])
  
  for (let hour = startHour; hour < endHour; hour++) {
    const slotStart = `${hour.toString().padStart(2, '0')}:00`
    const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`
    
    // Check if this slot conflicts with existing bookings
    const isBooked = bookings.some((booking: any) => {
      return (slotStart >= booking.start_time && slotStart < booking.end_time) ||
             (slotEnd > booking.start_time && slotEnd <= booking.end_time)
    })
    
    if (!isBooked) {
      slots.push({
        start_time: slotStart,
        end_time: slotEnd,
        duration_minutes: 60,
        location_id: availability.location_id
      })
    }
  }
  
  return c.json({ date, slots })
})

// Get session types
app.get('/api/session-types', async (c) => {
  const stmt = c.env.DB.prepare('SELECT * FROM session_types WHERE is_active = 1 ORDER BY name')
  const { results } = await stmt.all()
  return c.json({ session_types: results })
})

// Create a booking
app.post('/api/bookings', async (c) => {
  const bookingData: CreateBookingRequest = await c.req.json()
  
  // Validate required fields
  if (!bookingData.coach_id || !bookingData.session_type_id || !bookingData.student_name || 
      !bookingData.student_email || !bookingData.booking_date || !bookingData.start_time) {
    return c.json({ error: 'Missing required fields' }, 400)
  }
  
  // Get session type for duration
  const sessionStmt = c.env.DB.prepare('SELECT * FROM session_types WHERE id = ?')
  const sessionType = await sessionStmt.bind(bookingData.session_type_id).first()
  
  if (!sessionType) {
    return c.json({ error: 'Invalid session type' }, 400)
  }
  
  // Calculate end time
  const startTime = bookingData.start_time
  const startHour = parseInt(startTime.split(':')[0])
  const startMin = parseInt(startTime.split(':')[1])
  const totalMinutes = startHour * 60 + startMin + sessionType.duration_minutes
  const endHour = Math.floor(totalMinutes / 60)
  const endMin = totalMinutes % 60
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
  
  // Check for conflicts
  const conflictStmt = c.env.DB.prepare(`
    SELECT id FROM bookings 
    WHERE coach_id = ? AND booking_date = ? AND status IN ('confirmed', 'rescheduled')
    AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
  `)
  
  const conflict = await conflictStmt.bind(
    bookingData.coach_id, 
    bookingData.booking_date,
    startTime, startTime, endTime, endTime
  ).first()
  
  if (conflict) {
    return c.json({ error: 'Time slot not available' }, 409)
  }
  
  // Create booking
  const bookingRef = generateBookingReference()
  const insertStmt = c.env.DB.prepare(`
    INSERT INTO bookings 
    (coach_id, session_type_id, location_id, student_name, student_email, student_phone,
     booking_date, start_time, end_time, duration_minutes, booking_reference, special_requests)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  const result = await insertStmt.bind(
    bookingData.coach_id,
    bookingData.session_type_id,
    bookingData.location_id || null,
    bookingData.student_name,
    bookingData.student_email,
    bookingData.student_phone || null,
    bookingData.booking_date,
    startTime,
    endTime,
    sessionType.duration_minutes,
    bookingRef,
    bookingData.special_requests || null
  ).run()
  
  return c.json({ 
    booking_id: result.meta.last_row_id,
    booking_reference: bookingRef,
    status: 'confirmed'
  })
})

// Get bookings for a student
app.get('/api/bookings/student/:email', async (c) => {
  const studentEmail = c.req.param('email')
  
  const stmt = c.env.DB.prepare(`
    SELECT b.*, c.name as coach_name, st.name as session_type_name, l.name as location_name
    FROM bookings b
    JOIN coaches c ON b.coach_id = c.id
    JOIN session_types st ON b.session_type_id = st.id
    LEFT JOIN locations l ON b.location_id = l.id
    WHERE b.student_email = ?
    ORDER BY b.booking_date DESC, b.start_time DESC
  `)
  
  const { results } = await stmt.bind(studentEmail).all()
  return c.json({ bookings: results })
})

// Cancel a booking
app.patch('/api/bookings/:reference/cancel', async (c) => {
  const reference = c.req.param('reference')
  const { cancellation_reason } = await c.req.json()
  
  const stmt = c.env.DB.prepare(`
    UPDATE bookings 
    SET status = 'cancelled', cancellation_reason = ?, cancelled_at = datetime('now')
    WHERE booking_reference = ? AND status = 'confirmed'
  `)
  
  const result = await stmt.bind(cancellation_reason || 'Cancelled by student', reference).run()
  
  if (result.changes === 0) {
    return c.json({ error: 'Booking not found or already cancelled' }, 404)
  }
  
  return c.json({ success: true, message: 'Booking cancelled successfully' })
})

// Admin routes (simplified - no auth for now)

// Get all bookings for admin
app.get('/api/admin/bookings', async (c) => {
  const { date_from, date_to, coach_id, status } = c.req.query()
  
  let query = `
    SELECT b.*, c.name as coach_name, st.name as session_type_name, l.name as location_name
    FROM bookings b
    JOIN coaches c ON b.coach_id = c.id
    JOIN session_types st ON b.session_type_id = st.id
    LEFT JOIN locations l ON b.location_id = l.id
    WHERE 1=1
  `
  
  const params: any[] = []
  
  if (date_from) {
    query += ` AND b.booking_date >= ?`
    params.push(date_from)
  }
  
  if (date_to) {
    query += ` AND b.booking_date <= ?`
    params.push(date_to)
  }
  
  if (coach_id) {
    query += ` AND b.coach_id = ?`
    params.push(parseInt(coach_id))
  }
  
  if (status) {
    query += ` AND b.status = ?`
    params.push(status)
  }
  
  query += ` ORDER BY b.booking_date DESC, b.start_time DESC`
  
  const stmt = c.env.DB.prepare(query)
  const { results } = await stmt.bind(...params).all()
  
  return c.json({ bookings: results })
})

// Main landing page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fight Club - Martial Arts Studio</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'fight-red': '#dc2626',
                  'fight-yellow': '#fbbf24',
                  'fight-black': '#111827',
                  'fight-gray': '#374151'
                },
                fontFamily: {
                  'martial': ['Impact', 'Arial Black', 'sans-serif']
                }
              }
            }
          }
        </script>
    </head>
    <body class="bg-black text-white min-h-screen">
        <!-- Header -->
        <header class="bg-gradient-to-r from-fight-black via-fight-gray to-fight-black border-b-4 border-fight-red">
            <nav class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-fist-raised text-fight-red text-3xl"></i>
                        <h1 class="text-3xl font-martial font-bold text-fight-yellow">FIGHT CLUB</h1>
                    </div>
                    <div class="hidden md:flex space-x-6">
                        <a href="#coaches" class="hover:text-fight-red transition-colors font-semibold">COACHES</a>
                        <a href="#book" class="hover:text-fight-red transition-colors font-semibold">BOOK NOW</a>
                        <a href="#admin" class="hover:text-fight-red transition-colors font-semibold">ADMIN</a>
                    </div>
                    <button id="mobile-menu-btn" class="md:hidden text-2xl">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
            </nav>
        </header>

        <!-- Hero Section -->
        <section class="relative bg-gradient-to-br from-fight-black via-fight-gray to-black py-20">
            <div class="absolute inset-0 bg-black bg-opacity-50"></div>
            <div class="container mx-auto px-6 relative z-10">
                <div class="text-center">
                    <h2 class="text-5xl md:text-7xl font-martial font-bold mb-6">
                        <span class="text-fight-yellow">TRAIN</span> 
                        <span class="text-fight-red">LIKE</span> 
                        <span class="text-white">BRUCE LEE</span>
                    </h2>
                    <p class="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                        Master martial arts with world-class coaches. Book personalized training sessions 
                        in Kung Fu, MMA, Boxing, and more.
                    </p>
                    <div class="flex flex-col md:flex-row gap-4 justify-center">
                        <button onclick="showCoaches()" class="bg-fight-red hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105">
                            <i class="fas fa-fist-raised mr-2"></i>
                            VIEW COACHES
                        </button>
                        <button onclick="showBooking()" class="border-2 border-fight-yellow text-fight-yellow hover:bg-fight-yellow hover:text-black font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105">
                            <i class="fas fa-calendar-plus mr-2"></i>
                            BOOK SESSION
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Main Content -->
        <main class="container mx-auto px-6 py-12">
            <!-- Coaches Section -->
            <section id="coaches-section" class="hidden">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-martial font-bold text-fight-yellow mb-4">OUR MASTERS</h2>
                    <p class="text-xl text-gray-400">Train with legendary martial artists</p>
                    
                    <!-- Filters -->
                    <div class="mt-8 flex flex-wrap gap-4 justify-center">
                        <select id="style-filter" class="bg-fight-gray text-white border border-fight-red rounded-lg px-4 py-2">
                            <option value="">All Styles</option>
                            <option value="Kung Fu">Kung Fu</option>
                            <option value="MMA">MMA</option>
                            <option value="Boxing">Boxing</option>
                            <option value="Brazilian Jiu-Jitsu">BJJ</option>
                            <option value="Muay Thai">Muay Thai</option>
                            <option value="Karate">Karate</option>
                        </select>
                        <select id="language-filter" class="bg-fight-gray text-white border border-fight-red rounded-lg px-4 py-2">
                            <option value="">All Languages</option>
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="Mandarin">Mandarin</option>
                            <option value="Japanese">Japanese</option>
                        </select>
                        <button onclick="filterCoaches()" class="bg-fight-red hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
                            <i class="fas fa-filter mr-2"></i>FILTER
                        </button>
                    </div>
                </div>
                
                <div id="coaches-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <!-- Coaches will be loaded here -->
                </div>
            </section>

            <!-- Booking Section -->
            <section id="booking-section" class="hidden">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-martial font-bold text-fight-yellow mb-4">BOOK YOUR TRAINING</h2>
                    <p class="text-xl text-gray-400">Schedule your path to mastery</p>
                </div>
                
                <div class="max-w-4xl mx-auto">
                    <div id="booking-steps" class="space-y-8">
                        <!-- Step 1: Select Coach -->
                        <div id="step-coach" class="booking-step bg-fight-gray rounded-xl p-8 border border-fight-red">
                            <h3 class="text-2xl font-bold text-fight-yellow mb-6">
                                <span class="text-fight-red">1.</span> SELECT YOUR MASTER
                            </h3>
                            <div id="coach-selection" class="grid md:grid-cols-2 gap-4">
                                <!-- Coach selection will be loaded here -->
                            </div>
                        </div>

                        <!-- Step 2: Select Date & Time -->
                        <div id="step-datetime" class="booking-step bg-fight-gray rounded-xl p-8 border border-fight-red hidden">
                            <h3 class="text-2xl font-bold text-fight-yellow mb-6">
                                <span class="text-fight-red">2.</span> CHOOSE DATE & TIME
                            </h3>
                            <div class="grid md:grid-cols-2 gap-8">
                                <div>
                                    <label class="block text-fight-yellow font-bold mb-2">Training Date:</label>
                                    <input type="date" id="booking-date" class="w-full bg-black text-white border border-fight-red rounded-lg px-4 py-3">
                                </div>
                                <div>
                                    <label class="block text-fight-yellow font-bold mb-2">Session Type:</label>
                                    <select id="session-type" class="w-full bg-black text-white border border-fight-red rounded-lg px-4 py-3">
                                        <!-- Session types will be loaded here -->
                                    </select>
                                </div>
                            </div>
                            <div id="time-slots" class="mt-6">
                                <!-- Available time slots will appear here -->
                            </div>
                        </div>

                        <!-- Step 3: Student Details -->
                        <div id="step-details" class="booking-step bg-fight-gray rounded-xl p-8 border border-fight-red hidden">
                            <h3 class="text-2xl font-bold text-fight-yellow mb-6">
                                <span class="text-fight-red">3.</span> YOUR DETAILS
                            </h3>
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-fight-yellow font-bold mb-2">Name *</label>
                                    <input type="text" id="student-name" class="w-full bg-black text-white border border-fight-red rounded-lg px-4 py-3" required>
                                </div>
                                <div>
                                    <label class="block text-fight-yellow font-bold mb-2">Email *</label>
                                    <input type="email" id="student-email" class="w-full bg-black text-white border border-fight-red rounded-lg px-4 py-3" required>
                                </div>
                                <div>
                                    <label class="block text-fight-yellow font-bold mb-2">Phone</label>
                                    <input type="tel" id="student-phone" class="w-full bg-black text-white border border-fight-red rounded-lg px-4 py-3">
                                </div>
                                <div>
                                    <label class="block text-fight-yellow font-bold mb-2">Special Requests</label>
                                    <textarea id="special-requests" class="w-full bg-black text-white border border-fight-red rounded-lg px-4 py-3" rows="3"></textarea>
                                </div>
                            </div>
                            <div class="mt-8 text-center">
                                <button onclick="submitBooking()" class="bg-fight-red hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105">
                                    <i class="fas fa-check mr-2"></i>
                                    CONFIRM BOOKING
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Admin Section -->
            <section id="admin-section" class="hidden">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-martial font-bold text-fight-yellow mb-4">ADMIN DASHBOARD</h2>
                    <p class="text-xl text-gray-400">Manage bookings and studio operations</p>
                </div>
                
                <div class="bg-fight-gray rounded-xl p-8 border border-fight-red">
                    <div class="mb-6">
                        <h3 class="text-2xl font-bold text-fight-yellow mb-4">ALL BOOKINGS</h3>
                        <div class="flex gap-4 mb-4">
                            <input type="date" id="admin-date-from" class="bg-black text-white border border-fight-red rounded-lg px-4 py-2">
                            <input type="date" id="admin-date-to" class="bg-black text-white border border-fight-red rounded-lg px-4 py-2">
                            <button onclick="loadAdminBookings()" class="bg-fight-red hover:bg-red-700 text-white px-6 py-2 rounded-lg">
                                <i class="fas fa-search mr-2"></i>FILTER
                            </button>
                        </div>
                    </div>
                    <div id="admin-bookings" class="overflow-x-auto">
                        <!-- Admin bookings table will be loaded here -->
                    </div>
                </div>
            </section>

            <!-- Student Bookings Section -->
            <section id="student-bookings-section" class="hidden">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-martial font-bold text-fight-yellow mb-4">YOUR BOOKINGS</h2>
                    <div class="flex justify-center">
                        <div class="flex gap-2">
                            <input type="email" id="student-lookup-email" placeholder="Enter your email" 
                                   class="bg-black text-white border border-fight-red rounded-lg px-4 py-2">
                            <button onclick="loadStudentBookings()" class="bg-fight-red hover:bg-red-700 text-white px-6 py-2 rounded-lg">
                                <i class="fas fa-search mr-2"></i>FIND
                            </button>
                        </div>
                    </div>
                </div>
                <div id="student-bookings" class="max-w-4xl mx-auto">
                    <!-- Student bookings will be loaded here -->
                </div>
            </section>
        </main>

        <!-- Footer -->
        <footer class="bg-fight-black border-t-4 border-fight-red py-8 mt-12">
            <div class="container mx-auto px-6">
                <div class="flex flex-col md:flex-row justify-between items-center">
                    <div class="flex items-center space-x-3 mb-4 md:mb-0">
                        <i class="fas fa-fist-raised text-fight-red text-2xl"></i>
                        <span class="text-xl font-martial font-bold text-fight-yellow">FIGHT CLUB</span>
                    </div>
                    <div class="flex space-x-6">
                        <button onclick="showStudentBookings()" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fas fa-user mr-2"></i>My Bookings
                        </button>
                        <span class="text-gray-400">© 2024 Fight Club Martial Arts Studio</span>
                    </div>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
