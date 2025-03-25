'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Define available time slots
const DEFAULT_TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', 
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

interface AvailableDates {
  [date: string]: string[];
}

interface DateInfo {
  date: string;
  dayName: string;
  dayNumber: number;
  month: string;
}

interface Appointment {
  id: string;
  firstName: string;
  lastName: string;
  instagram?: string;
  phone?: string;
  service: string;
  date: string;
  time: string;
  formattedDate?: string;
}

export default function AdminPanel() {
  const [availableSlots, setAvailableSlots] = useState<AvailableDates>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState<DateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customHour, setCustomHour] = useState('10');
  const [customMinute, setCustomMinute] = useState('00');
  const [customAmPm, setCustomAmPm] = useState('AM');
  const [isEditing, setIsEditing] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Function to refresh appointments from localStorage
  const refreshAppointments = () => {
    const storedAppointments = JSON.parse(localStorage.getItem('qcb-appointments') || '[]');
    setAppointments(storedAppointments);
  };

  // Function to handle editing an appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditing(true);
  };

  // Function to cancel an appointment
  const handleCancelAppointment = (appointmentId: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      // Get appointments from localStorage
      const storedAppointments = JSON.parse(localStorage.getItem('qcb-appointments') || '[]');
      
      // Filter out the cancelled appointment
      const updatedAppointments = storedAppointments.filter(
        (appointment: Appointment) => appointment.id !== appointmentId
      );
      
      // Save updated appointments back to localStorage
      localStorage.setItem('qcb-appointments', JSON.stringify(updatedAppointments));
      
      // Update state
      setAppointments(updatedAppointments);
      
      alert("Appointment cancelled successfully.");
    }
  };

  // Function to save edited appointment
  const handleSaveEdit = (updatedAppointment: Appointment) => {
    // Get appointments from localStorage
    const storedAppointments = JSON.parse(localStorage.getItem('qcb-appointments') || '[]');
    
    // Find and update the appointment
    const updatedAppointments = storedAppointments.map((appointment: Appointment) => 
      appointment.id === updatedAppointment.id ? updatedAppointment : appointment
    );
    
    // Save updated appointments back to localStorage
    localStorage.setItem('qcb-appointments', JSON.stringify(updatedAppointments));
    
    // Update state
    setAppointments(updatedAppointments);
    setIsEditing(false);
    setEditingAppointment(null);
    
    alert("Appointment updated successfully.");
  };

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
    }
    return dates;
  };

  // Initialize available slots for each date
  const initializeAvailableSlots = (): AvailableDates => {
    const slots: AvailableDates = {};
    const dates = getNextTwoWeeks();
    
    dates.forEach(date => {
      slots[date.date] = [...DEFAULT_TIME_SLOTS];
    });
    
    return slots;
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch time slots from API
        const response = await fetch('/api/timeslots');
        if (response.ok) {
          const data = await response.json();
          if (Object.keys(data).length > 0) {
            setAvailableSlots(data);
          } else {
            // If no data, initialize with default slots
            setAvailableSlots(initializeAvailableSlots());
          }
        } else {
          // If API fails, initialize with default slots
          setAvailableSlots(initializeAvailableSlots());
        }
        
        // Generate available dates
        const dates = getNextTwoWeeks();
        setAvailableDates(dates);
        
        // Load real appointments from localStorage
        refreshAppointments();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setIsLoading(false);
        // Show error message to user
        alert('Failed to load time slots. Please try refreshing the page.');
      }
    };
    
    initializeData();
    
    // Set up interval to check for new appointments every 10 seconds
    const appointmentCheckInterval = setInterval(refreshAppointments, 10000);
    
    // Clean up interval on component unmount
    return () => clearInterval(appointmentCheckInterval);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTimeSlotAvailability = (date: string, timeSlot: string) => {
    setAvailableSlots(prev => {
      const updatedSlots = { ...prev };
      
      if (updatedSlots[date].includes(timeSlot)) {
        // Remove the time slot if it exists
        updatedSlots[date] = updatedSlots[date].filter(slot => slot !== timeSlot);
      } else {
        // Add the time slot if it doesn't exist
        updatedSlots[date] = [...updatedSlots[date], timeSlot].sort((a, b) => {
          return new Date(`1970/01/01 ${a}`).getTime() - new Date(`1970/01/01 ${b}`).getTime();
        });
      }
      
      return updatedSlots;
    });
  };

  const addCustomTimeSlot = () => {
    if (selectedDate) {
      const formattedTime = `${customHour}:${customMinute} ${customAmPm}`;
      
      setAvailableSlots(prev => {
        const updatedSlots = { ...prev };
        
        if (!updatedSlots[selectedDate].includes(formattedTime)) {
          updatedSlots[selectedDate] = [...updatedSlots[selectedDate], formattedTime].sort((a, b) => {
            return new Date(`1970/01/01 ${a}`).getTime() - new Date(`1970/01/01 ${b}`).getTime();
          });
        }
        
        return updatedSlots;
      });
    }
  };

  const removeAllTimeSlots = (date: string) => {
    setAvailableSlots(prev => {
      const updatedSlots = { ...prev };
      updatedSlots[date] = [];
      return updatedSlots;
    });
  };

  const addAllDefaultTimeSlots = (date: string) => {
    setAvailableSlots(prev => {
      const updatedSlots = { ...prev };
      updatedSlots[date] = [...DEFAULT_TIME_SLOTS];
      return updatedSlots;
    });
  };

  const copyTimeSlotsToAllDates = () => {
    if (selectedDate) {
      const selectedSlots = availableSlots[selectedDate];
      
      setAvailableSlots(prev => {
        const updatedSlots = { ...prev };
        
        availableDates.forEach(date => {
          if (date.date !== selectedDate) {
            updatedSlots[date.date] = [...selectedSlots];
          }
        });
        
        return updatedSlots;
      });
    }
  };

  // Save time slots to backend (in a real app)
  const saveTimeSlots = async () => {
    try {
      const response = await fetch('/api/timeslots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(availableSlots),
      });
      
      if (response.ok) {
        alert('Time slots saved successfully!');
      } else {
        throw new Error('Failed to save time slots');
      }
    } catch (error) {
      console.error('Error saving time slots:', error);
      alert('Failed to save time slots. Please try again.');
    }
  };

  const filterAppointmentsByDate = (date: string) => {
    return appointments.filter(appointment => appointment.date === date);
  };

  // Render the appointment editor modal
  const renderAppointmentEditor = () => {
    if (!editingAppointment) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-display font-semibold italic text-purple-900 mb-4">Edit Appointment</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={editingAppointment.firstName}
                  onChange={(e) => setEditingAppointment({
                    ...editingAppointment,
                    firstName: e.target.value
                  })}
                  className="w-full px-4 py-2 border rounded-md text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={editingAppointment.lastName}
                  onChange={(e) => setEditingAppointment({
                    ...editingAppointment,
                    lastName: e.target.value
                  })}
                  className="w-full px-4 py-2 border rounded-md text-gray-900"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">
                {editingAppointment.instagram ? 'Instagram' : 'Phone'}
              </label>
              <input
                type={editingAppointment.instagram ? 'text' : 'tel'}
                value={editingAppointment.instagram || editingAppointment.phone || ''}
                onChange={(e) => {
                  if (editingAppointment.instagram) {
                    setEditingAppointment({
                      ...editingAppointment,
                      instagram: e.target.value
                    });
                  } else {
                    setEditingAppointment({
                      ...editingAppointment,
                      phone: e.target.value
                    });
                  }
                }}
                className="w-full px-4 py-2 border rounded-md text-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Time</label>
              <select
                value={editingAppointment.time}
                onChange={(e) => setEditingAppointment({
                  ...editingAppointment,
                  time: e.target.value
                })}
                className="w-full px-4 py-2 border rounded-md text-gray-900"
              >
                {availableSlots[editingAppointment.date]?.map((timeSlot) => (
                  <option key={timeSlot} value={timeSlot}>{timeSlot}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingAppointment(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveEdit(editingAppointment)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Appointment Editor Modal */}
      {isEditing && renderAppointmentEditor()}
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold italic text-purple-900 tracking-tight">Haircut Appointments Dashboard</h1>
          <div className="flex space-x-4">
            <button 
              onClick={refreshAppointments}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Check for new appointments"
            >
              Refresh Appointments
            </button>
            <button 
              onClick={saveTimeSlots}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md hover:from-green-700 hover:to-green-800 transition-colors"
            >
              Save All Changes
            </button>
            <Link href="/" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors">
              View Booking Page
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-display font-semibold italic text-purple-900 mb-4 tracking-tight">Manage Available Time Slots</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date Selection */}
            <div>
              <h3 className="text-lg font-display font-medium italic text-purple-800 mb-4 tracking-tight">Select Date</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableDates.map((date) => (
                  <button
                    key={date.date}
                    onClick={() => setSelectedDate(date.date)}
                    className={`p-3 rounded-lg border transition-colors text-center ${
                      selectedDate === date.date
                        ? 'bg-purple-100 border-purple-500 text-purple-800 font-medium'
                        : 'hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium">{date.dayName}</div>
                    <div className="text-xl font-bold">{date.dayNumber}</div>
                    <div className="text-xs text-purple-600">{date.month}</div>
                    <div className="mt-1 text-xs font-medium text-indigo-600">
                      {availableSlots[date.date]?.length || 0} slots
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots Management */}
            {selectedDate && (
              <div>
                <h3 className="text-lg font-display font-medium italic text-purple-800 mb-4 tracking-tight">
                  Manage Time Slots for {(() => {
                    // Parse the date and create a new Date object
                    const [year, month, day] = selectedDate.split('-').map(num => parseInt(num));
                    const formattedDate = new Date(year, month - 1, day);
                    return formattedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric'
                    });
                  })()}
                </h3>
                
                {/* Quick actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => removeAllTimeSlots(selectedDate)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded border border-red-300 text-sm hover:bg-red-200"
                  >
                    Remove All
                  </button>
                  <button
                    onClick={() => addAllDefaultTimeSlots(selectedDate)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded border border-green-300 text-sm hover:bg-green-200"
                  >
                    Add Default Slots
                  </button>
                  <button
                    onClick={copyTimeSlotsToAllDates}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded border border-purple-300 text-sm hover:bg-purple-200"
                  >
                    Copy to All Dates
                  </button>
                </div>
                
                {/* Custom time slot creator */}
                <div className="mb-6 p-4 border rounded-md bg-purple-50">
                  <h4 className="text-md font-display font-medium italic text-purple-800 mb-3 tracking-tight">Add Custom Time Slot</h4>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Hour</label>
                      <select 
                        value={customHour}
                        onChange={(e) => setCustomHour(e.target.value)}
                        className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                          <option key={hour} value={hour}>{hour}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Minute</label>
                      <select 
                        value={customMinute}
                        onChange={(e) => setCustomMinute(e.target.value)}
                        className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                      >
                        {['00', '15', '30', '45'].map(min => (
                          <option key={min} value={min}>{min}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">AM/PM</label>
                      <select 
                        value={customAmPm}
                        onChange={(e) => setCustomAmPm(e.target.value)}
                        className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                    <button
                      onClick={addCustomTimeSlot}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded hover:from-purple-700 hover:to-indigo-700"
                    >
                      Add Time
                    </button>
                  </div>
                </div>
                
                {/* Display current time slots */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {availableSlots[selectedDate]?.length > 0 ? (
                    availableSlots[selectedDate].map((time) => (
                      <button
                        key={time}
                        onClick={() => toggleTimeSlotAvailability(selectedDate, time)}
                        className="p-3 rounded-lg border border-purple-500 bg-purple-100 text-purple-800 font-medium text-center relative hover:bg-purple-200"
                      >
                        {time}
                        <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white rounded-full text-xs hover:bg-red-700">
                          ×
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-700 col-span-full">No time slots available for this date.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-display font-semibold italic text-purple-900 mb-4 tracking-tight">Upcoming Appointments</h2>
          
          {selectedDate ? (
            <>
              <h3 className="text-lg font-display font-medium italic text-purple-800 mb-4 tracking-tight">
                Appointments for {(() => {
                  // Parse the date and create a new Date object
                  const [year, month, day] = selectedDate.split('-').map(num => parseInt(num));
                  const formattedDate = new Date(year, month - 1, day);
                  return formattedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric'
                  });
                })()}
              </h3>
              
              {filterAppointmentsByDate(selectedDate).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterAppointmentsByDate(selectedDate).map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{appointment.firstName} {appointment.lastName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Haircut - $15</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{appointment.time}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {appointment.instagram ? (
                              <div className="text-indigo-600">{appointment.instagram}</div>
                            ) : (
                              <div>{appointment.phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button className="text-indigo-600 hover:text-indigo-800 mr-3" onClick={() => handleEditAppointment(appointment)}>Edit</button>
                            <button className="text-red-600 hover:text-red-800" onClick={() => handleCancelAppointment(appointment.id)}>Cancel</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-700 font-medium p-4 bg-gray-50 rounded-md border border-gray-200">No appointments for this date.</p>
              )}
            </>
          ) : (
            <p className="text-gray-700 font-medium p-4 bg-gray-50 rounded-md border border-gray-200">Select a date to view appointments.</p>
          )}
        </div>
      </div>
    </main>
  );
} 