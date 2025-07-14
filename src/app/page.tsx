'use client';

import { useState } from 'react';
import AppointmentForm from '@/components/AppointmentForm';
import AppointmentSearch from '@/components/AppointmentSearch';
import DateCalendar from '@/components/DateCalendar';
import TimeSlotSelector from '@/components/TimeSlotSelector';
import { dbOperations, AppointmentFormValues } from '@/lib/supabase';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
    setShowForm(false); // Hide form when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowForm(true); // Show form when time is selected
  };

  const handleAppointmentSubmit = async (data: AppointmentFormValues) => {
    try {
      const appointmentData = {
        ...data,
        date: selectedDate,
        time: selectedTime,
      };
      
      await dbOperations.createAppointment(appointmentData);
      
      // Success! Reset the form
      setSelectedDate('');
      setSelectedTime('');
      setShowForm(false);
      
      alert('Appointment booked successfully! We will contact you to confirm.');
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="max-w-6xl mx-auto">
            {/* Appointment Search Section */}
            <AppointmentSearch />
            
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Book Your Appointment</h1>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Available for next 14 days</span>
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Online Booking</span>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center ${selectedDate ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                      selectedDate ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                    }`}>
                      1
                    </div>
                    <span className="ml-2 font-medium">Select Date</span>
                  </div>
                  
                  <div className={`w-8 h-0.5 ${selectedDate ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  
                  <div className={`flex items-center ${selectedTime ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                      selectedTime ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                    }`}>
                      2
                    </div>
                    <span className="ml-2 font-medium">Select Time</span>
                  </div>
                  
                  <div className={`w-8 h-0.5 ${showForm ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  
                  <div className={`flex items-center ${showForm ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                      showForm ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                    }`}>
                      3
                    </div>
                    <span className="ml-2 font-medium">Your Details</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Date Selection */}
              <div className="mb-8">
                <DateCalendar
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                />
              </div>

              {/* Step 2: Time Selection */}
              {selectedDate && (
                <div className="mb-8 border-t pt-8">
                  <TimeSlotSelector
                    selectedDate={selectedDate}
                    onTimeSelect={handleTimeSelect}
                    selectedTime={selectedTime}
                  />
                </div>
              )}

              {/* Step 3: Appointment Form */}
              {showForm && selectedDate && selectedTime && (
                <div className="border-t pt-8">
                  <AppointmentForm
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onSubmit={handleAppointmentSubmit}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
