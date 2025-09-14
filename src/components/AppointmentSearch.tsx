'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  instagram?: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export default function AppointmentSearch() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Apply formatting: (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (error) setError('');
  };

  const searchAppointments = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(false);

    try {
      const response = await fetch(`/api/search-appointments?phone=${encodeURIComponent(cleanPhone)}`);
      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments);
        setSearched(true);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to search appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchAppointments();
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const parseSelectedDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Find Your Upcoming Appointments
      </h2>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label htmlFor="phone-search" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your phone number to view upcoming appointments
          </label>
          <input
            id="phone-search"
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onKeyPress={handleKeyPress}
            placeholder="(555) 123-4567"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            maxLength={14}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
        
        <div className="flex items-end">
          <button
            onClick={searchAppointments}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </div>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searched && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {appointments.length > 0 
              ? `Found ${appointments.length} upcoming appointment${appointments.length !== 1 ? 's' : ''}`
              : 'No upcoming appointments found'
            }
          </h3>
          
          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 bg-blue-50 border-blue-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900">
                      {appointment.service}
                    </h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Date:</span> {format(parseSelectedDate(appointment.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Time:</span> {formatTime(appointment.time)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Name:</span> {appointment.first_name} {appointment.last_name}
                      </p>
                      {appointment.instagram && (
                        <p className="text-gray-600">
                          <span className="font-medium">Instagram:</span> @{appointment.instagram}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-2">No upcoming appointments found for this phone number.</p>
              <p className="text-sm text-gray-500">
                Make sure you're using the same phone number you used when booking.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
