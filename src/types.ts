// TypeScript types for Martial Arts Studio

export type Bindings = {
  DB: D1Database;
}

export interface Coach {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  profile_image_url?: string;
  martial_arts_styles: string[]; // JSON parsed array
  languages: string[]; // JSON parsed array
  experience_years: number;
  certifications: string[]; // JSON parsed array
  hourly_rate?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionType {
  id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_minutes: number;
  max_participants: number;
  is_active: boolean;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  description?: string;
  capacity: number;
  equipment: string[]; // JSON parsed array
  is_active: boolean;
  created_at: string;
}

export interface CoachAvailability {
  id: number;
  coach_id: number;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string;
  end_time: string;
  location_id?: number;
  is_active: boolean;
  created_at: string;
}

export interface AvailabilityException {
  id: number;
  coach_id: number;
  exception_date: string;
  exception_type: 'unavailable' | 'custom_hours';
  start_time?: string;
  end_time?: string;
  reason?: string;
  created_at: string;
}

export interface Booking {
  id: number;
  coach_id: number;
  session_type_id: number;
  location_id?: number;
  student_name: string;
  student_email: string;
  student_phone?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show';
  cancellation_reason?: string;
  special_requests?: string;
  booking_reference: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
}

export interface BookingPolicy {
  id: number;
  policy_name: string;
  policy_value: string;
  description?: string;
  is_active: boolean;
  updated_at: string;
}

// API Request/Response types
export interface CreateBookingRequest {
  coach_id: number;
  session_type_id: number;
  location_id?: number;
  student_name: string;
  student_email: string;
  student_phone?: string;
  booking_date: string;
  start_time: string;
  special_requests?: string;
}

export interface AvailabilitySlot {
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location_id?: number;
}

export interface CoachWithAvailability extends Coach {
  availability_slots?: AvailabilitySlot[];
  next_available?: AvailabilitySlot[];
}

export interface BookingWithDetails extends Booking {
  coach_name: string;
  session_type_name: string;
  location_name?: string;
}

// Filter types for API
export interface CoachFilter {
  styles?: string[];
  languages?: string[];
  experience_min?: number;
  available_date?: string;
}

export interface BookingFilter {
  coach_id?: number;
  student_email?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

// Admin types
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}