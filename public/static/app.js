// Martial Arts Studio Frontend JavaScript

// Global state
let currentStep = 1;
let selectedCoach = null;
let selectedDateTime = null;
let sessionTypes = [];
let coaches = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadSessionTypes();
    loadCoaches();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        dateInput.min = today;
        dateInput.addEventListener('change', loadAvailableSlots);
    }
    
    // Session type change handler
    const sessionSelect = document.getElementById('session-type');
    if (sessionSelect) {
        sessionSelect.addEventListener('change', loadAvailableSlots);
    }
});

// Navigation functions
function showCoaches() {
    hideAllSections();
    document.getElementById('coaches-section').classList.remove('hidden');
}

function showBooking() {
    hideAllSections();
    document.getElementById('booking-section').classList.remove('hidden');
    resetBookingSteps();
}

function showAdmin() {
    hideAllSections();
    document.getElementById('admin-section').classList.remove('hidden');
    loadAdminBookings();
}

function showStudentBookings() {
    hideAllSections();
    document.getElementById('student-bookings-section').classList.remove('hidden');
}

function hideAllSections() {
    const sections = ['coaches-section', 'booking-section', 'admin-section', 'student-bookings-section'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    });
}

// Load data functions
async function loadCoaches() {
    try {
        const response = await axios.get('/api/coaches');
        coaches = response.data.coaches;
        renderCoaches(coaches);
        renderCoachSelection(coaches);
    } catch (error) {
        console.error('Error loading coaches:', error);
        showError('Failed to load coaches');
    }
}

async function loadSessionTypes() {
    try {
        const response = await axios.get('/api/session-types');
        sessionTypes = response.data.session_types;
        renderSessionTypes();
    } catch (error) {
        console.error('Error loading session types:', error);
    }
}

// Render functions
function renderCoaches(coachList) {
    const grid = document.getElementById('coaches-grid');
    if (!grid) return;
    
    grid.innerHTML = coachList.map(coach => `
        <div class="bg-fight-gray rounded-xl p-6 border border-fight-red hover:border-fight-yellow transition-all transform hover:scale-105">
            <div class="text-center mb-4">
                <div class="w-24 h-24 bg-fight-red rounded-full mx-auto mb-4 flex items-center justify-center">
                    <i class="fas fa-user-ninja text-3xl text-white"></i>
                </div>
                <h3 class="text-2xl font-bold text-fight-yellow">${coach.name}</h3>
                <p class="text-fight-red font-semibold">${coach.experience_years} Years Experience</p>
            </div>
            
            <div class="space-y-3">
                <div>
                    <h4 class="text-fight-yellow font-bold mb-2">Martial Arts:</h4>
                    <div class="flex flex-wrap gap-2">
                        ${coach.martial_arts_styles.map(style => 
                            `<span class="bg-fight-red text-white px-3 py-1 rounded-full text-sm">${style}</span>`
                        ).join('')}
                    </div>
                </div>
                
                <div>
                    <h4 class="text-fight-yellow font-bold mb-2">Languages:</h4>
                    <div class="flex flex-wrap gap-2">
                        ${coach.languages.map(lang => 
                            `<span class="bg-gray-600 text-white px-3 py-1 rounded-full text-sm">${lang}</span>`
                        ).join('')}
                    </div>
                </div>
                
                ${coach.bio ? `
                <div>
                    <h4 class="text-fight-yellow font-bold mb-2">About:</h4>
                    <p class="text-gray-300 text-sm">${coach.bio}</p>
                </div>
                ` : ''}
                
                <div class="pt-4">
                    <button onclick="selectCoachForBooking(${coach.id})" 
                            class="w-full bg-fight-red hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors">
                        <i class="fas fa-calendar-plus mr-2"></i>BOOK WITH ${coach.name.toUpperCase()}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCoachSelection(coachList) {
    const container = document.getElementById('coach-selection');
    if (!container) return;
    
    container.innerHTML = coachList.map(coach => `
        <div class="coach-option bg-black border border-fight-red rounded-lg p-4 cursor-pointer hover:border-fight-yellow transition-colors" 
             onclick="selectCoach(${coach.id})">
            <div class="flex items-center space-x-4">
                <div class="w-16 h-16 bg-fight-red rounded-full flex items-center justify-center">
                    <i class="fas fa-user-ninja text-xl text-white"></i>
                </div>
                <div>
                    <h4 class="text-fight-yellow font-bold text-lg">${coach.name}</h4>
                    <p class="text-gray-400">${coach.martial_arts_styles.join(', ')}</p>
                    <p class="text-fight-red text-sm">${coach.experience_years} years experience</p>
                </div>
            </div>
        </div>
    `).join('');
}

function renderSessionTypes() {
    const select = document.getElementById('session-type');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select session type</option>' +
        sessionTypes.map(type => 
            `<option value="${type.id}">${type.name} (${type.duration_minutes} min)</option>`
        ).join('');
}

// Booking flow functions
function selectCoachForBooking(coachId) {
    selectCoach(coachId);
    showBooking();
}

function selectCoach(coachId) {
    selectedCoach = coaches.find(c => c.id === coachId);
    
    // Highlight selected coach
    document.querySelectorAll('.coach-option').forEach(el => {
        el.classList.remove('border-fight-yellow', 'bg-fight-red');
        el.classList.add('border-fight-red', 'bg-black');
    });
    
    event.currentTarget.classList.remove('border-fight-red', 'bg-black');
    event.currentTarget.classList.add('border-fight-yellow', 'bg-fight-red');
    
    // Show next step
    document.getElementById('step-datetime').classList.remove('hidden');
    
    // Clear previous selections
    selectedDateTime = null;
    document.getElementById('time-slots').innerHTML = '';
}

async function loadAvailableSlots() {
    const date = document.getElementById('booking-date').value;
    const sessionTypeId = document.getElementById('session-type').value;
    
    if (!selectedCoach || !date || !sessionTypeId) return;
    
    try {
        const response = await axios.get(`/api/coaches/${selectedCoach.id}/availability/${date}`);
        const slots = response.data.slots;
        
        const slotsContainer = document.getElementById('time-slots');
        
        if (slots.length === 0) {
            slotsContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-calendar-times text-4xl text-fight-red mb-4"></i>
                    <h4 class="text-xl font-bold text-fight-yellow mb-2">No Available Slots</h4>
                    <p class="text-gray-400">Please select a different date</p>
                </div>
            `;
            return;
        }
        
        slotsContainer.innerHTML = `
            <h4 class="text-fight-yellow font-bold mb-4">Available Time Slots:</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                ${slots.map(slot => `
                    <button onclick="selectTimeSlot('${slot.start_time}', '${slot.end_time}')" 
                            class="time-slot bg-black border border-fight-red text-white py-3 px-4 rounded-lg hover:border-fight-yellow hover:bg-fight-red transition-colors">
                        ${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}
                    </button>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading slots:', error);
        showError('Failed to load available time slots');
    }
}

function selectTimeSlot(startTime, endTime) {
    selectedDateTime = { startTime, endTime };
    
    // Highlight selected slot
    document.querySelectorAll('.time-slot').forEach(btn => {
        btn.classList.remove('bg-fight-red', 'border-fight-yellow');
        btn.classList.add('bg-black', 'border-fight-red');
    });
    
    event.currentTarget.classList.remove('bg-black', 'border-fight-red');
    event.currentTarget.classList.add('bg-fight-red', 'border-fight-yellow');
    
    // Show student details step
    document.getElementById('step-details').classList.remove('hidden');
}

async function submitBooking() {
    const studentName = document.getElementById('student-name').value;
    const studentEmail = document.getElementById('student-email').value;
    const studentPhone = document.getElementById('student-phone').value;
    const specialRequests = document.getElementById('special-requests').value;
    const bookingDate = document.getElementById('booking-date').value;
    const sessionTypeId = document.getElementById('session-type').value;
    
    if (!studentName || !studentEmail || !selectedCoach || !selectedDateTime || !bookingDate || !sessionTypeId) {
        showError('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await axios.post('/api/bookings', {
            coach_id: selectedCoach.id,
            session_type_id: parseInt(sessionTypeId),
            student_name: studentName,
            student_email: studentEmail,
            student_phone: studentPhone,
            booking_date: bookingDate,
            start_time: selectedDateTime.startTime,
            special_requests: specialRequests
        });
        
        const booking = response.data;
        
        showSuccess(`
            <div class="text-center">
                <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                <h3 class="text-2xl font-bold text-fight-yellow mb-4">BOOKING CONFIRMED!</h3>
                <div class="bg-black rounded-lg p-6 text-left">
                    <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
                    <p><strong>Coach:</strong> ${selectedCoach.name}</p>
                    <p><strong>Date:</strong> ${formatDate(bookingDate)}</p>
                    <p><strong>Time:</strong> ${formatTime(selectedDateTime.startTime)} - ${formatTime(selectedDateTime.endTime)}</p>
                </div>
                <p class="text-gray-400 mt-4">Save your booking reference for future use</p>
            </div>
        `);
        
        resetBookingSteps();
    } catch (error) {
        console.error('Error creating booking:', error);
        if (error.response?.data?.error) {
            showError(error.response.data.error);
        } else {
            showError('Failed to create booking. Please try again.');
        }
    }
}

function resetBookingSteps() {
    selectedCoach = null;
    selectedDateTime = null;
    document.getElementById('step-datetime').classList.add('hidden');
    document.getElementById('step-details').classList.add('hidden');
    
    // Clear form
    document.getElementById('booking-date').value = '';
    document.getElementById('session-type').value = '';
    document.getElementById('student-name').value = '';
    document.getElementById('student-email').value = '';
    document.getElementById('student-phone').value = '';
    document.getElementById('special-requests').value = '';
    
    // Reset coach selection
    document.querySelectorAll('.coach-option').forEach(el => {
        el.classList.remove('border-fight-yellow', 'bg-fight-red');
        el.classList.add('border-fight-red', 'bg-black');
    });
}

// Filter functions
function filterCoaches() {
    const styleFilter = document.getElementById('style-filter').value;
    const languageFilter = document.getElementById('language-filter').value;
    
    let filteredCoaches = coaches;
    
    if (styleFilter) {
        filteredCoaches = filteredCoaches.filter(coach => 
            coach.martial_arts_styles.includes(styleFilter)
        );
    }
    
    if (languageFilter) {
        filteredCoaches = filteredCoaches.filter(coach => 
            coach.languages.includes(languageFilter)
        );
    }
    
    renderCoaches(filteredCoaches);
}

// Admin functions
async function loadAdminBookings() {
    const dateFrom = document.getElementById('admin-date-from')?.value;
    const dateTo = document.getElementById('admin-date-to')?.value;
    
    try {
        let url = '/api/admin/bookings';
        const params = new URLSearchParams();
        
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await axios.get(url);
        const bookings = response.data.bookings;
        
        renderAdminBookings(bookings);
    } catch (error) {
        console.error('Error loading admin bookings:', error);
        showError('Failed to load bookings');
    }
}

function renderAdminBookings(bookings) {
    const container = document.getElementById('admin-bookings');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-calendar text-4xl text-fight-red mb-4"></i>
                <p class="text-gray-400">No bookings found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table class="w-full bg-black rounded-lg overflow-hidden">
            <thead class="bg-fight-red">
                <tr>
                    <th class="text-left p-4">Reference</th>
                    <th class="text-left p-4">Student</th>
                    <th class="text-left p-4">Coach</th>
                    <th class="text-left p-4">Date & Time</th>
                    <th class="text-left p-4">Status</th>
                    <th class="text-left p-4">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${bookings.map(booking => `
                    <tr class="border-b border-fight-gray">
                        <td class="p-4 font-mono text-fight-yellow">${booking.booking_reference}</td>
                        <td class="p-4">
                            <div>
                                <div class="font-semibold">${booking.student_name}</div>
                                <div class="text-sm text-gray-400">${booking.student_email}</div>
                            </div>
                        </td>
                        <td class="p-4">${booking.coach_name}</td>
                        <td class="p-4">
                            <div>${formatDate(booking.booking_date)}</div>
                            <div class="text-sm text-gray-400">${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</div>
                        </td>
                        <td class="p-4">
                            <span class="px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)}">
                                ${booking.status.toUpperCase()}
                            </span>
                        </td>
                        <td class="p-4">
                            ${booking.status === 'confirmed' ? 
                                `<button onclick="cancelBookingAdmin('${booking.booking_reference}')" 
                                        class="text-fight-red hover:text-red-400 transition-colors">
                                    <i class="fas fa-times"></i> Cancel
                                </button>` : 
                                '-'
                            }
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Student bookings functions
async function loadStudentBookings() {
    const email = document.getElementById('student-lookup-email').value;
    
    if (!email) {
        showError('Please enter your email address');
        return;
    }
    
    try {
        const response = await axios.get(`/api/bookings/student/${encodeURIComponent(email)}`);
        const bookings = response.data.bookings;
        
        renderStudentBookings(bookings);
    } catch (error) {
        console.error('Error loading student bookings:', error);
        showError('Failed to load your bookings');
    }
}

function renderStudentBookings(bookings) {
    const container = document.getElementById('student-bookings');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-calendar text-4xl text-fight-red mb-4"></i>
                <p class="text-gray-400">No bookings found for this email address</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="bg-fight-gray rounded-xl p-6 border border-fight-red mb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-bold text-fight-yellow mb-2">${booking.session_type_name} with ${booking.coach_name}</h3>
                    <div class="space-y-2 text-gray-300">
                        <p><i class="fas fa-calendar mr-2 text-fight-red"></i>${formatDate(booking.booking_date)} at ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</p>
                        <p><i class="fas fa-clock mr-2 text-fight-red"></i>${booking.duration_minutes} minutes</p>
                        ${booking.location_name ? `<p><i class="fas fa-map-marker-alt mr-2 text-fight-red"></i>${booking.location_name}</p>` : ''}
                        <p><i class="fas fa-tag mr-2 text-fight-red"></i>Reference: ${booking.booking_reference}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="px-4 py-2 rounded-full text-sm ${getStatusColor(booking.status)}">
                        ${booking.status.toUpperCase()}
                    </span>
                    ${booking.status === 'confirmed' && new Date(booking.booking_date + ' ' + booking.start_time) > new Date() ? `
                        <button onclick="cancelBookingStudent('${booking.booking_reference}')" 
                                class="block mt-2 text-fight-red hover:text-red-400 transition-colors">
                            <i class="fas fa-times mr-1"></i>Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Cancel booking functions
async function cancelBookingStudent(reference) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        await axios.patch(`/api/bookings/${reference}/cancel`, {
            cancellation_reason: 'Cancelled by student'
        });
        
        showSuccess('Booking cancelled successfully');
        loadStudentBookings(); // Reload bookings
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showError('Failed to cancel booking');
    }
}

async function cancelBookingAdmin(reference) {
    const reason = prompt('Enter cancellation reason (optional):');
    if (reason === null) return; // User cancelled
    
    try {
        await axios.patch(`/api/bookings/${reference}/cancel`, {
            cancellation_reason: reason || 'Cancelled by admin'
        });
        
        showSuccess('Booking cancelled successfully');
        loadAdminBookings(); // Reload bookings
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showError('Failed to cancel booking');
    }
}

// Utility functions
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getStatusColor(status) {
    switch (status) {
        case 'confirmed': return 'bg-green-600 text-white';
        case 'cancelled': return 'bg-red-600 text-white';
        case 'completed': return 'bg-blue-600 text-white';
        case 'no_show': return 'bg-gray-600 text-white';
        case 'rescheduled': return 'bg-yellow-600 text-black';
        default: return 'bg-gray-600 text-white';
    }
}

function showError(message) {
    // Create and show error modal/toast
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg z-50 max-w-md';
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-300">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    // Create and show success modal
    const modalDiv = document.createElement('div');
    modalDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modalDiv.innerHTML = `
        <div class="bg-fight-gray border border-fight-red rounded-xl p-8 max-w-md mx-4">
            ${message}
            <div class="text-center mt-6">
                <button onclick="this.closest('.fixed').remove()" 
                        class="bg-fight-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                    CLOSE
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modalDiv);
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            // Toggle mobile menu (you can implement this if needed)
            console.log('Mobile menu clicked');
        });
    }
});