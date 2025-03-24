'use client';

import { useState, useEffect } from 'react';

// Define available time slots
const DEFAULT_TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', 
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

// Properly type the AVAILABLE_DATES object
interface AvailableDates {
  [date: string]: string[];
}

// Simulated admin-defined availability (would come from backend in real app)
const AVAILABLE_DATES: AvailableDates = {
  // Format: 'YYYY-MM-DD': [array of available time slots]
  // Example of dates with all slots available by default
};

// Type for date objects
interface DateInfo {
  date: string;
  dayName: string;
  dayNumber: number;
  month: string;
}

export default function Home() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    instagram: '',
    phone: '',
    service: 'haircut',
    date: '',
    time: '',
  });
  
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Date selection, 2: Time & details
  const [showPhone, setShowPhone] = useState(false);

  // Generate dates for the next 14 days
  const getNextTwoWeeks = (): DateInfo[] => {
    const dates: DateInfo[] = [];
    
    for (let i = 0; i < 14; i++) {
      // Create a new Date object for today and add i days
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time part to avoid time zone issues
      currentDate.setDate(currentDate.getDate() + i);
      
      // Format the date as YYYY-MM-DD
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      dates.push({
        date: formattedDate,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: currentDate.getDate(),
        month: currentDate.toLocaleDateString('en-US', { month: 'short' })
      });
      
      // Initialize available time slots for this date if not already set
      if (!AVAILABLE_DATES[formattedDate]) {
        AVAILABLE_DATES[formattedDate] = [...DEFAULT_TIME_SLOTS];
      }
    }
    return dates;
  };

  const [availableDates, setAvailableDates] = useState<DateInfo[]>(getNextTwoWeeks());

  // Update available time slots when date changes
  useEffect(() => {
    // Fetch available dates
    const dates = getNextTwoWeeks();
    setAvailableDates(dates);
    
    // Fetch available time slots from API
    const fetchTimeSlots = async () => {
      try {
        const response = await fetch('/api/timeslots');
        if (response.ok) {
          const data = await response.json();
          if (Object.keys(data).length > 0) {
            // Use admin-defined time slots
            Object.keys(AVAILABLE_DATES).forEach(date => {
              AVAILABLE_DATES[date] = data[date] || DEFAULT_TIME_SLOTS;
            });
          } else {
            // If no data, use default time slots
            dates.forEach(date => {
              if (!AVAILABLE_DATES[date.date]) {
                AVAILABLE_DATES[date.date] = [...DEFAULT_TIME_SLOTS];
              }
            });
          }
        } else {
          // If API fails, use default time slots
          dates.forEach(date => {
            if (!AVAILABLE_DATES[date.date]) {
              AVAILABLE_DATES[date.date] = [...DEFAULT_TIME_SLOTS];
            }
          });
        }
      } catch (error) {
        console.error('Error fetching time slots:', error);
        // Fallback to defaults
        dates.forEach(date => {
          if (!AVAILABLE_DATES[date.date]) {
            AVAILABLE_DATES[date.date] = [...DEFAULT_TIME_SLOTS];
          }
        });
      }
    };
    
    fetchTimeSlots();
  }, []);

  // Also update the useEffect that sets available time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      // Check if we need to fetch time slots for this date
      if (!AVAILABLE_DATES[selectedDate] || AVAILABLE_DATES[selectedDate].length === 0) {
        // Try to fetch from API for this specific date
        fetch('/api/timeslots')
          .then(response => response.json())
          .then(data => {
            if (data[selectedDate] && data[selectedDate].length > 0) {
              AVAILABLE_DATES[selectedDate] = data[selectedDate];
              filterBookedTimeSlots();
            } else {
              // If no slots defined, use default
              AVAILABLE_DATES[selectedDate] = [...DEFAULT_TIME_SLOTS];
              filterBookedTimeSlots();
            }
          })
          .catch(error => {
            console.error('Error fetching time slots:', error);
            AVAILABLE_DATES[selectedDate] = [...DEFAULT_TIME_SLOTS];
            filterBookedTimeSlots();
          });
      } else {
        // Use cached time slots
        filterBookedTimeSlots();
      }
      
      setFormData(prev => ({ ...prev, date: selectedDate, time: '' }));
    }
    
    // Helper function to filter out already booked time slots
    function filterBookedTimeSlots() {
      // Get existing appointments from localStorage
      const storedAppointments = JSON.parse(localStorage.getItem('qcb-appointments') || '[]');
      
      // Find appointments for the selected date
      const appointmentsForDate = storedAppointments.filter(
        (appointment: any) => appointment.date === selectedDate
      );
      
      // Get booked time slots
      const bookedTimeSlots = appointmentsForDate.map((appointment: any) => appointment.time);
      
      // Filter out booked time slots
      const availableTimeSlotsForDate = AVAILABLE_DATES[selectedDate].filter(
        time => !bookedTimeSlots.includes(time)
      );
      
      setAvailableTimeSlots(availableTimeSlotsForDate);
    }
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Make sure date is properly set in formData before submission
    const submissionData = {
      ...formData,
      date: selectedDate,
    };
    
    try {
      // Generate a booking ID
      const bookingId = `booking-${Date.now()}`;
      
      // Store the appointment data in localStorage so it can be accessed by the admin panel
      // In a real app, this would be sent to a backend API
      const storedAppointments = JSON.parse(localStorage.getItem('qcb-appointments') || '[]');
      
      // Parse the date for proper formatted date display
      const [year, month, day] = selectedDate.split('-').map(num => parseInt(num));
      const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Add the new appointment
      storedAppointments.push({
        id: bookingId,
        ...submissionData,
        formattedDate
      });
      
      // Save back to localStorage
      localStorage.setItem('qcb-appointments', JSON.stringify(storedAppointments));
      
      console.log('Booking data saved:', submissionData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Successful response
      setSubmitStatus('success');
      setFormData({
        firstName: '',
        lastName: '',
        instagram: '',
        phone: '',
        service: 'haircut',
        date: '',
        time: '',
      });
      setSelectedDate('');
      setCurrentStep(1);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setCurrentStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleContactMethod = () => {
    setShowPhone(!showPhone);
  };

  const goBack = () => {
    setCurrentStep(1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Queen City Blendz</h1>
          <p className="text-xl text-purple-200">Professional Haircuts & Styling</p>
        </div>

        {/* Booking Form */}
        <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-purple-900 mb-6">Book Your Appointment</h2>
          
          {submitStatus === 'success' ? (
            <div className="text-center py-10">
              <svg className="w-16 h-16 text-purple-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <h3 className="text-2xl font-semibold text-purple-900 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-6">We'll contact you shortly with confirmation.</p>
              <button 
                onClick={() => setSubmitStatus(null)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-6 rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors"
              >
                Book Another Appointment
              </button>
            </div>
          ) : (
            <>
              {currentStep === 1 ? (
                <div>
                  <h3 className="text-lg font-medium text-purple-800 mb-4">Select a Date</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
                    {availableDates.map((date) => (
                      <button
                        key={date.date}
                        onClick={() => handleDateSelect(date.date)}
                        className={`p-3 rounded-lg border transition-colors text-center ${
                          selectedDate === date.date
                            ? 'bg-purple-100 border-purple-500 text-purple-800 font-medium'
                            : 'hover:bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                      >
                        <div className="text-sm font-medium">{date.dayName}</div>
                        <div className="text-xl font-bold">{date.dayNumber}</div>
                        <div className="text-xs text-purple-600">{date.month}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <button 
                    type="button" 
                    onClick={goBack} 
                    className="flex items-center text-purple-600 hover:text-purple-800 mb-4 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Back to Calendar
                  </button>
                  
                  <h3 className="text-lg font-medium text-purple-800 mb-4">
                    Select Time for {selectedDate ? 
                      (() => {
                        // Parse the date and create a new Date object
                        const [year, month, day] = selectedDate.split('-').map(num => parseInt(num));
                        const formattedDate = new Date(year, month - 1, day);
                        return formattedDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                      })() 
                    : ''}
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                    {availableTimeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeSelect(time)}
                        className={`p-3 rounded-lg border transition-colors text-center ${
                          formData.time === time
                            ? 'bg-purple-100 border-purple-500 text-purple-800 font-medium'
                            : 'hover:bg-gray-100 border-gray-300 text-gray-800'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="service">Service</label>
                      <div className="w-full px-4 py-2 border rounded-md bg-gray-50 text-gray-900 font-medium">
                        Haircut - $15
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2" htmlFor="firstName">First Name</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 mb-2" htmlFor="lastName">Last Name</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                    </div>
                    
                    <div>
                      {!showPhone ? (
                        <div>
                          <label className="block text-gray-700 mb-2" htmlFor="instagram">Instagram Handle</label>
                          <input
                            type="text"
                            id="instagram"
                            name="instagram"
                            value={formData.instagram}
                            onChange={handleChange}
                            required={!showPhone}
                            placeholder="@username"
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          />
                          <button 
                            type="button" 
                            onClick={toggleContactMethod}
                            className="text-purple-600 text-sm mt-2 hover:text-purple-800"
                          >
                            No Instagram account? Use phone number instead
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-gray-700 mb-2" htmlFor="phone">Phone Number</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required={showPhone}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          />
                          <button 
                            type="button" 
                            onClick={toggleContactMethod}
                            className="text-purple-600 text-sm mt-2 hover:text-purple-800"
                          >
                            Have Instagram? Use Instagram instead
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.time}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
                  </button>
                  
                  {submitStatus === 'error' && (
                    <p className="text-red-600 text-center mt-4">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
