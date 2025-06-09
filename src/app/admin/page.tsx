'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface DateInfo {
  date: string;
  dayName: string;
  dayNumber: number;
  month: string;
}

interface Appointment {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  instagram?: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  created_at: string;
}

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  is_available: boolean;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
}

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  todayAppointments: number;
  weekRevenue: number;
}

export default function AdminPanel() {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState<DateInfo[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    todayAppointments: 0,
    weekRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isManagingTimeSlots, setIsManagingTimeSlots] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [isCreatingTimeSlot, setIsCreatingTimeSlot] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState({ time: '', date: selectedDate });
  
  // Generate dates for the next 14 days
  const getNextTwoWeeks = (): DateInfo[] => {
    const dates: DateInfo[] = [];
    
    for (let i = 0; i < 14; i++) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      currentDate.setDate(currentDate.getDate() + i);
      
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

  // Fetch all data from database
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Fetch time slots for next 14 days
      const today = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(today.getDate() + 14);

      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from('available_timeslots')
        .select('*')
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', twoWeeksFromNow.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (timeSlotsError) throw timeSlotsError;

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      // Calculate stats
      const totalAppointments = appointmentsData?.length || 0;
      const pendingAppointments = appointmentsData?.filter(apt => apt.status === 'pending').length || 0;
      const confirmedAppointments = appointmentsData?.filter(apt => apt.status === 'confirmed').length || 0;
      const todayAppointments = appointmentsData?.filter(apt => apt.date === today.toISOString().split('T')[0]).length || 0;
      
      // Calculate week revenue (confirmed appointments only)
      const weekStart = new Date();
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date();
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekRevenue = appointmentsData
        ?.filter(apt => {
          const aptDate = new Date(apt.date);
          return apt.status === 'confirmed' && aptDate >= weekStart && aptDate <= weekEnd;
        })
        .reduce((total, apt) => {
          const service = servicesData?.find(s => s.name === apt.service);
          return total + (service?.price_cents || 1500); // Default to $15 for haircut
        }, 0) || 0;

      setAppointments(appointmentsData || []);
      setTimeSlots(timeSlotsData || []);
      setServices(servicesData || []);
      setStats({
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        todayAppointments,
        weekRevenue
      });

      // Generate available dates
      const dates = getNextTwoWeeks();
      setAvailableDates(dates);

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // Refresh data
      await fetchData();
      alert(`Appointment ${status} successfully!`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
    }
  };

  // Delete appointment
  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      // Refresh data
      await fetchData();
      alert('Appointment deleted successfully!');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment. Please try again.');
    }
  };

  // Toggle time slot availability
  const toggleTimeSlotAvailability = async (timeSlotId: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('available_timeslots')
        .update({ is_available: !currentAvailability })
        .eq('id', timeSlotId);

      if (error) throw error;

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error updating time slot:', error);
      alert('Failed to update time slot. Please try again.');
    }
  };

  // Handle editing an appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditing(true);
  };

  // Save edited appointment
  const handleSaveEdit = async (updatedAppointment: Appointment) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          first_name: updatedAppointment.first_name,
          last_name: updatedAppointment.last_name,
          phone: updatedAppointment.phone,
          email: updatedAppointment.email,
          instagram: updatedAppointment.instagram,
          time: updatedAppointment.time,
          notes: updatedAppointment.notes
        })
        .eq('id', updatedAppointment.id);

      if (error) throw error;

      setIsEditing(false);
      setEditingAppointment(null);
      
      // Refresh data
      await fetchData();
      alert("Appointment updated successfully!");
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
    }
  };

  // Create new time slot
  const createTimeSlot = async (date: string, time: string) => {
    try {
      // Check if time slot already exists
      const existingSlot = timeSlots.find(slot => slot.date === date && slot.time === time);
      if (existingSlot) {
        alert('Time slot already exists for this date and time.');
        return;
      }

      const { error } = await supabase
        .from('available_timeslots')
        .insert({
          date: date,
          time: time,
          is_available: true
        });

      if (error) throw error;

      setIsCreatingTimeSlot(false);
      setNewTimeSlot({ time: '', date: selectedDate });
      
      // Refresh data
      await fetchData();
      alert('Time slot created successfully!');
    } catch (error) {
      console.error('Error creating time slot:', error);
      alert('Failed to create time slot. Please try again.');
    }
  };

  // Update time slot
  const updateTimeSlot = async (timeSlotId: string, newTime: string) => {
    try {
      // Check if new time conflicts with existing slots
      const existingSlot = timeSlots.find(slot => 
        slot.date === editingTimeSlot?.date && 
        slot.time === newTime && 
        slot.id !== timeSlotId
      );
      
      if (existingSlot) {
        alert('Another time slot already exists at this time.');
        return;
      }

      const { error } = await supabase
        .from('available_timeslots')
        .update({ time: newTime })
        .eq('id', timeSlotId);

      if (error) throw error;

      setEditingTimeSlot(null);
      
      // Refresh data
      await fetchData();
      alert('Time slot updated successfully!');
    } catch (error) {
      console.error('Error updating time slot:', error);
      alert('Failed to update time slot. Please try again.');
    }
  };

  // Delete time slot
  const deleteTimeSlot = async (timeSlotId: string, time: string) => {
    // Check if there are any appointments for this time slot
    const hasAppointments = appointments.some(
      apt => apt.date === selectedDate && apt.time === time && apt.status !== 'cancelled'
    );

    if (hasAppointments) {
      alert('Cannot delete time slot with existing appointments. Please cancel or reschedule the appointment first.');
      return;
    }

    if (!confirm("Are you sure you want to delete this time slot?")) return;

    try {
      const { error } = await supabase
        .from('available_timeslots')
        .delete()
        .eq('id', timeSlotId);

      if (error) throw error;

      // Refresh data
      await fetchData();
      alert('Time slot deleted successfully!');
    } catch (error) {
      console.error('Error deleting time slot:', error);
      alert('Failed to delete time slot. Please try again.');
    }
  };

  // Generate time options for creating/editing slots
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const filterAppointmentsByDate = (date: string) => {
    return appointments.filter(appointment => appointment.date === date);
  };

  const getTimeSlotsForDate = (date: string) => {
    return timeSlots.filter(slot => slot.date === date);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Update newTimeSlot date when selectedDate changes
  useEffect(() => {
    setNewTimeSlot({ time: '', date: selectedDate });
  }, [selectedDate]);

  // Render the appointment editor modal
  const renderAppointmentEditor = () => {
    if (!editingAppointment) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-display font-semibold italic text-purple-900 mb-4">Edit Appointment</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={editingAppointment.first_name}
                  onChange={(e) => setEditingAppointment({
                    ...editingAppointment,
                    first_name: e.target.value
                  })}
                  className="w-full px-4 py-2 border rounded-md text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={editingAppointment.last_name}
                  onChange={(e) => setEditingAppointment({
                    ...editingAppointment,
                    last_name: e.target.value
                  })}
                  className="w-full px-4 py-2 border rounded-md text-gray-900"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={editingAppointment.phone}
                onChange={(e) => setEditingAppointment({
                  ...editingAppointment,
                  phone: e.target.value
                })}
                className="w-full px-4 py-2 border rounded-md text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Email (Optional)</label>
              <input
                type="email"
                value={editingAppointment.email || ''}
                onChange={(e) => setEditingAppointment({
                  ...editingAppointment,
                  email: e.target.value
                })}
                className="w-full px-4 py-2 border rounded-md text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Instagram (Optional)</label>
              <input
                type="text"
                value={editingAppointment.instagram || ''}
                onChange={(e) => setEditingAppointment({
                  ...editingAppointment,
                  instagram: e.target.value
                })}
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
                {getTimeSlotsForDate(editingAppointment.date)
                  .filter(slot => slot.is_available)
                  .map((slot) => (
                    <option key={slot.time} value={slot.time}>
                      {formatTime(slot.time)}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={editingAppointment.notes || ''}
                onChange={(e) => setEditingAppointment({
                  ...editingAppointment,
                  notes: e.target.value
                })}
                rows={3}
                className="w-full px-4 py-2 border rounded-md text-gray-900"
              />
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
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold italic text-purple-900 tracking-tight">
            Queen City Blendz Admin Dashboard
          </h1>
          <div className="flex space-x-4">
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Refresh all data"
            >
              🔄 Refresh
            </button>
            <Link 
              href="/" 
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors"
            >
              📅 View Booking Page
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Appointments</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalAppointments}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingAppointments}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Confirmed</h3>
            <p className="text-3xl font-bold text-green-600">{stats.confirmedAppointments}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Today</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.todayAppointments}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Week Revenue</h3>
            <p className="text-3xl font-bold text-indigo-600">{formatCurrency(stats.weekRevenue)}</p>
          </div>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-display font-semibold italic text-purple-900 mb-4 tracking-tight">
            Select Date to Manage
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
            {availableDates.map((date) => {
              const dayAppointments = filterAppointmentsByDate(date.date);
              const dayTimeSlots = getTimeSlotsForDate(date.date);
              const availableSlots = dayTimeSlots.filter(slot => slot.is_available).length;
              
              return (
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
                  <div className="mt-1 text-xs">
                    <div className="text-green-600 font-medium">{dayAppointments.length} apt</div>
                    <div className="text-blue-600">{availableSlots} slots</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Appointments for Selected Date */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-display font-semibold italic text-purple-900 mb-4 tracking-tight">
                Appointments for {(() => {
                  const [year, month, day] = selectedDate.split('-').map(num => parseInt(num));
                  const formattedDate = new Date(year, month - 1, day);
                  return formattedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric'
                  });
                })()}
              </h2>
              
              {filterAppointmentsByDate(selectedDate).length > 0 ? (
                <div className="space-y-4">
                  {filterAppointmentsByDate(selectedDate).map((appointment) => {
                    const service = services.find(s => s.name === appointment.service);
                    const statusColors = {
                      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                      confirmed: 'bg-green-100 text-green-800 border-green-300',
                      cancelled: 'bg-red-100 text-red-800 border-red-300'
                    };
                    
                    return (
                      <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {appointment.first_name} {appointment.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formatTime(appointment.time)} - {appointment.service}
                            </p>
                            <p className="text-sm text-green-600 font-medium">
                              {formatCurrency(service?.price_cents || 1500)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[appointment.status]}`}>
                            {appointment.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          <p>📞 {appointment.phone}</p>
                          {appointment.email && <p>📧 {appointment.email}</p>}
                          {appointment.instagram && <p>📱 @{appointment.instagram}</p>}
                          {appointment.notes && (
                            <p className="mt-2 p-2 bg-gray-50 rounded">
                              <strong>Notes:</strong> {appointment.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {appointment.status === 'pending' && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              ✓ Confirm
                            </button>
                          )}
                          {appointment.status !== 'cancelled' && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              ✗ Cancel
                            </button>
                          )}
                          <button
                            onClick={() => handleEditAppointment(appointment)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deleteAppointment(appointment.id)}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-700 font-medium p-4 bg-gray-50 rounded-md border border-gray-200">
                  No appointments for this date.
                </p>
              )}
            </div>

            {/* Time Slots for Selected Date */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-display font-semibold italic text-purple-900 tracking-tight">
                  Time Slots Management
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCreatingTimeSlot(true)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ➕ Add Slot
                  </button>
                  <button
                    onClick={() => setIsManagingTimeSlots(!isManagingTimeSlots)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      isManagingTimeSlots 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isManagingTimeSlots ? '✕ Exit Edit Mode' : '⚙️ Edit Mode'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {getTimeSlotsForDate(selectedDate).map((slot) => {
                  const hasAppointment = appointments.some(
                    apt => apt.date === selectedDate && apt.time === slot.time && apt.status !== 'cancelled'
                  );
                  
                  return (
                    <div key={slot.id} className="relative">
                      <button
                        onClick={() => !hasAppointment && !isManagingTimeSlots && toggleTimeSlotAvailability(slot.id, slot.is_available)}
                        disabled={hasAppointment && !isManagingTimeSlots}
                        className={`w-full p-3 rounded-lg border text-center font-medium text-sm transition-colors ${
                          hasAppointment
                            ? 'bg-red-100 border-red-300 text-red-700 cursor-not-allowed'
                            : slot.is_available
                            ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={
                          hasAppointment
                            ? 'Time slot has appointment'
                            : slot.is_available
                            ? 'Available - Click to disable'
                            : 'Disabled - Click to enable'
                        }
                      >
                        {formatTime(slot.time)}
                        <div className="text-xs mt-1">
                          {hasAppointment ? '📅 Booked' : slot.is_available ? '✅ Available' : '❌ Disabled'}
                        </div>
                      </button>
                      
                      {isManagingTimeSlots && (
                        <div className="absolute -top-2 -right-2 flex gap-1">
                          <button
                            onClick={() => setEditingTimeSlot(slot)}
                            className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs hover:bg-blue-700 flex items-center justify-center"
                            title="Edit time slot"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteTimeSlot(slot.id, slot.time)}
                            className="w-6 h-6 bg-red-600 text-white rounded-full text-xs hover:bg-red-700 flex items-center justify-center"
                            title="Delete time slot"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>• <span className="text-green-600">Green</span>: Available slots</p>
                <p>• <span className="text-gray-600">Gray</span>: Disabled slots</p>
                <p>• <span className="text-red-600">Red</span>: Booked slots</p>
                <p className="mt-2 font-medium">
                  {isManagingTimeSlots 
                    ? 'Edit Mode: Use ✏️ to edit or 🗑️ to delete time slots'
                    : 'Click available or disabled slots to toggle availability'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {!selectedDate && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-display font-semibold italic text-purple-900 mb-4 tracking-tight">
              All Upcoming Appointments
            </h2>
            
            {appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.slice(0, 50).map((appointment) => {
                      const service = services.find(s => s.name === appointment.service);
                      const statusColors = {
                        pending: 'bg-yellow-100 text-yellow-800',
                        confirmed: 'bg-green-100 text-green-800',
                        cancelled: 'bg-red-100 text-red-800'
                      };
                      
                      return (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(appointment.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(appointment.time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.first_name} {appointment.last_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {appointment.service} - {formatCurrency(service?.price_cents || 1500)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[appointment.status]}`}>
                              {appointment.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{appointment.phone}</div>
                            {appointment.instagram && <div className="text-indigo-600">@{appointment.instagram}</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-700 font-medium p-4 bg-gray-50 rounded-md border border-gray-200">
                No appointments found.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Appointment Editor Modal */}
      {isEditing && editingAppointment && renderAppointmentEditor()}

      {/* Time Slot Creation Modal */}
      {isCreatingTimeSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-display font-semibold italic text-purple-900 mb-4">
              Create New Time Slot
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  readOnly
                  className="w-full px-4 py-2 border rounded-md bg-gray-100 text-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Time</label>
                <select
                  value={newTimeSlot.time}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, time: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md text-gray-900"
                >
                  <option value="">Select a time</option>
                  {generateTimeOptions()
                    .filter(time => !timeSlots.some(slot => slot.date === selectedDate && slot.time === time))
                    .map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => createTimeSlot(selectedDate, newTimeSlot.time)}
                disabled={!newTimeSlot.time}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Time Slot
              </button>
              <button
                onClick={() => {
                  setIsCreatingTimeSlot(false);
                  setNewTimeSlot({ time: '', date: selectedDate });
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Slot Edit Modal */}
      {editingTimeSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-display font-semibold italic text-purple-900 mb-4">
              Edit Time Slot
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={editingTimeSlot.date}
                  readOnly
                  className="w-full px-4 py-2 border rounded-md bg-gray-100 text-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Current Time</label>
                <input
                  type="text"
                  value={formatTime(editingTimeSlot.time)}
                  readOnly
                  className="w-full px-4 py-2 border rounded-md bg-gray-100 text-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">New Time</label>
                <select
                  value={editingTimeSlot.time}
                  onChange={(e) => setEditingTimeSlot({ ...editingTimeSlot, time: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md text-gray-900"
                >
                  {generateTimeOptions().map((time) => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => updateTimeSlot(editingTimeSlot.id, editingTimeSlot.time)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Time Slot
              </button>
              <button
                onClick={() => setEditingTimeSlot(null)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}