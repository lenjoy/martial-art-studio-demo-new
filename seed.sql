-- Seed data for Martial Arts Studio

-- Insert session types
INSERT OR IGNORE INTO session_types (id, name, description, duration_minutes, buffer_minutes, max_participants) VALUES 
  (1, 'Private Training', 'One-on-one personalized martial arts training', 60, 15, 1),
  (2, 'Technique Session', 'Focused technique development and drilling', 45, 15, 1),
  (3, 'Sparring Session', 'Supervised sparring and competition preparation', 90, 30, 1),
  (4, 'Fitness & Conditioning', 'Martial arts fitness and conditioning workout', 60, 15, 1);

-- Insert locations
INSERT OR IGNORE INTO locations (id, name, description, capacity, equipment) VALUES 
  (1, 'Main Training Room', 'Large open space with mats and mirrors', 20, '["Mats", "Mirrors", "Heavy Bags", "Speed Bags"]'),
  (2, 'Boxing Ring', 'Professional boxing ring for sparring', 10, '["Boxing Ring", "Corner Stools", "Ring Bell"]'),
  (3, 'Grappling Area', 'Specialized area for ground work and grappling', 12, '["Grappling Mats", "Submission Dummies"]');

-- Insert sample coaches
INSERT OR IGNORE INTO coaches (id, name, email, phone, bio, martial_arts_styles, languages, experience_years, certifications) VALUES 
  (1, 'Bruce Chen', 'bruce@fightclub.com', '+1-555-0101', 
   'Master of multiple martial arts disciplines with over 15 years of competition experience. Specializes in striking and traditional forms.',
   '["Kung Fu", "Wing Chun", "Kickboxing", "Karate"]', 
   '["English", "Mandarin", "Cantonese"]', 
   15, 
   '["Black Belt 6th Dan Karate", "Wing Chun Master Instructor", "Certified Personal Trainer"]'),
   
  (2, 'Maria Rodriguez', 'maria@fightclub.com', '+1-555-0102',
   'Former professional MMA fighter turned coach. Expert in Brazilian Jiu-Jitsu and Muay Thai with a focus on practical self-defense.',
   '["Brazilian Jiu-Jitsu", "Muay Thai", "MMA", "Boxing"]',
   '["English", "Spanish", "Portuguese"]',
   12,
   '["BJJ Black Belt", "Muay Thai Kru", "MMA Pro Fighter License"]'),
   
  (3, 'Jake Thompson', 'jake@fightclub.com', '+1-555-0103',
   'Boxing specialist and former Golden Gloves champion. Focuses on technique, footwork, and mental preparation.',
   '["Boxing", "Kickboxing", "Fitness Boxing"]',
   '["English"]',
   8,
   '["Golden Gloves Champion", "USA Boxing Certified Coach", "Strength & Conditioning Specialist"]'),
   
  (4, 'Sensei Tanaka', 'tanaka@fightclub.com', '+1-555-0104',
   'Traditional martial arts master with deep knowledge of Japanese fighting systems and philosophy.',
   '["Karate", "Judo", "Aikido", "Kendo"]',
   '["English", "Japanese"]',
   20,
   '["Karate 8th Dan Black Belt", "Judo 5th Dan", "Aikido 4th Dan", "International Referee"]');

-- Insert coach availability (Monday = 1, Tuesday = 2, etc.)
-- Bruce Chen - Available Mon, Wed, Fri 9AM-6PM
INSERT OR IGNORE INTO coach_availability (coach_id, day_of_week, start_time, end_time, location_id) VALUES 
  (1, 1, '09:00', '18:00', 1), -- Monday
  (1, 3, '09:00', '18:00', 1), -- Wednesday  
  (1, 5, '09:00', '18:00', 1); -- Friday

-- Maria Rodriguez - Available Tue, Thu, Sat 10AM-7PM
INSERT OR IGNORE INTO coach_availability (coach_id, day_of_week, start_time, end_time, location_id) VALUES 
  (2, 2, '10:00', '19:00', 3), -- Tuesday
  (2, 4, '10:00', '19:00', 3), -- Thursday
  (2, 6, '10:00', '19:00', 2); -- Saturday

-- Jake Thompson - Available Mon-Fri 6AM-2PM (morning sessions)
INSERT OR IGNORE INTO coach_availability (coach_id, day_of_week, start_time, end_time, location_id) VALUES 
  (3, 1, '06:00', '14:00', 2), -- Monday
  (3, 2, '06:00', '14:00', 2), -- Tuesday
  (3, 3, '06:00', '14:00', 2), -- Wednesday
  (3, 4, '06:00', '14:00', 2), -- Thursday
  (3, 5, '06:00', '14:00', 2); -- Friday

-- Sensei Tanaka - Available Wed, Fri, Sun 2PM-9PM
INSERT OR IGNORE INTO coach_availability (coach_id, day_of_week, start_time, end_time, location_id) VALUES 
  (4, 3, '14:00', '21:00', 1), -- Wednesday
  (4, 5, '14:00', '21:00', 1), -- Friday
  (4, 0, '14:00', '21:00', 1); -- Sunday

-- Insert default booking policies
INSERT OR IGNORE INTO booking_policies (policy_name, policy_value, description) VALUES 
  ('min_lead_time_hours', '24', 'Minimum hours required to book a session in advance'),
  ('max_advance_days', '30', 'Maximum days in advance that bookings can be made'),
  ('cancellation_hours', '12', 'Hours before session that cancellations are allowed'),
  ('reschedule_hours', '24', 'Hours before session that rescheduling is allowed'),
  ('session_buffer_minutes', '15', 'Default buffer time between sessions'),
  ('auto_confirm_bookings', 'true', 'Whether bookings are automatically confirmed'),
  ('max_bookings_per_student_per_week', '3', 'Maximum bookings per student per week'),
  ('timezone', 'America/Los_Angeles', 'Default timezone for the studio');

-- Insert sample admin user (password: admin123 - should be hashed in real app)
INSERT OR IGNORE INTO admin_users (username, email, password_hash) VALUES 
  ('admin', 'admin@fightclub.com', '$2b$10$example_hash_here'); -- This should be properly hashed

-- Insert some sample bookings for demonstration
INSERT OR IGNORE INTO bookings (
  coach_id, session_type_id, location_id, student_name, student_email, student_phone,
  booking_date, start_time, end_time, duration_minutes, booking_reference, status
) VALUES 
  (1, 1, 1, 'John Smith', 'john@example.com', '+1-555-1001', 
   date('now', '+1 day'), '10:00', '11:00', 60, 'BK001', 'confirmed'),
  (2, 2, 3, 'Sarah Johnson', 'sarah@example.com', '+1-555-1002', 
   date('now', '+2 days'), '15:00', '15:45', 45, 'BK002', 'confirmed'),
  (3, 1, 2, 'Mike Wilson', 'mike@example.com', '+1-555-1003', 
   date('now', '+3 days'), '07:00', '08:00', 60, 'BK003', 'confirmed');