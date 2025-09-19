'use client';

import { useEffect, useState } from 'react';
import { dbOperations } from '@/lib/supabase';
import { Appointment, TimeSlot } from '@/lib/types';
import { format, addDays, startOfDay } from 'date-fns';

// Force this page to be dynamic to avoid SSG issues with Supabase
export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'timeslots'>('appointments');
  const [error, setError] = useState('');

  // New time slot form
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  // Bulk time slot generation
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkStartTime, setBulkStartTime] = useState('09:00');
  const [bulkEndTime, setBulkEndTime] = useState('17:00');
  const [bulkSlotDuration, setBulkSlotDuration] = useState(60);
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);

  useEffect(() => {
    fetchData();
    // Subscribe to real-time updates
    const appointmentsSubscription = dbOperations.subscribeToAppointments(() => {
      fetchAppointments();
    });
    
    const timeSlotsSubscription = dbOperations.subscribeToTimeSlots(() => {
      fetchTimeSlots();
    });

    return () => {
      appointmentsSubscription.unsubscribe();
      timeSlotsSubscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchAppointments(), fetchTimeSlots()]);
    setIsLoading(false);
  };

  const fetchAppointments = async () => {
    try {
      const data = await dbOperations.getAllAppointments();
      setAppointments(data);
    } catch (err) {
      setError('Failed to fetch appointments');
      console.error(err);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const data = await dbOperations.getAllTimeSlots();
      setTimeSlots(data);
    } catch (err) {
      setError('Failed to fetch time slots');
      console.error(err);
    }
  };

  const updateAppointment = async (id: string, status: Appointment['status']) => {
    try {
      await dbOperations.updateAppointment(id, { status });
      fetchAppointments();
    } catch (err) {
      setError('Failed to update appointment');
      console.error(err);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      await dbOperations.deleteAppointment(id);
      fetchAppointments();
    } catch (err) {
      setError('Failed to delete appointment');
      console.error(err);
    }
  };

  const addTimeSlot = async () => {
    if (!newSlotDate || !newSlotTime) {
      setError('Please fill in both date and time');
      return;
    }

    setIsAddingSlot(true);
    try {
      await dbOperations.createTimeSlot({
        date: newSlotDate,
        time: newSlotTime,
        is_available: true
      });
      setNewSlotDate('');
      setNewSlotTime('');
      fetchTimeSlots();
    } catch (err) {
      setError('Failed to add time slot');
      console.error(err);
    } finally {
      setIsAddingSlot(false);
    }
  };

  const toggleTimeSlotAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await dbOperations.updateTimeSlot(id, { is_available: isAvailable });
      fetchTimeSlots();
    } catch (err) {
      setError('Failed to update time slot');
      console.error(err);
    }
  };

  const deleteTimeSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return;

    try {
      await dbOperations.deleteTimeSlot(id);
      fetchTimeSlots();
    } catch (err) {
      setError('Failed to delete time slot');
      console.error(err);
    }
  };

  const generateBulkTimeSlots = async () => {
    if (!bulkStartDate || !bulkEndDate || !bulkStartTime || !bulkEndTime) {
      setError('Please fill in all bulk generation fields');
      return;
    }

    setIsGeneratingSlots(true);
    try {
      await dbOperations.generateTimeSlots({
        startDate: bulkStartDate,
        endDate: bulkEndDate,
        startTime: bulkStartTime,
        endTime: bulkEndTime,
        slotDurationMinutes: bulkSlotDuration
      });
      fetchTimeSlots();
      setBulkStartDate('');
      setBulkEndDate('');
    } catch (err) {
      setError('Failed to generate time slots');
      console.error(err);
    } finally {
      setIsGeneratingSlots(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'appointments'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('timeslots')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'timeslots'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Time Slots
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {activeTab === 'appointments' ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Appointments</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">
                              {appointment.first_name} {appointment.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.service}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(appointment.date), 'MMM dd, yyyy')} at {appointment.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{appointment.email || 'N/A'}</div>
                          <div>{appointment.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {appointment.status === 'confirmed' && (
                              <button
                                onClick={() => updateAppointment(appointment.id, 'cancelled')}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() => deleteAppointment(appointment.id)}
                              className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {appointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No appointments found
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add Single Time Slot */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Add Single Time Slot</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newSlotDate}
                      onChange={(e) => setNewSlotDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addTimeSlot}
                      disabled={isAddingSlot}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingSlot ? 'Adding...' : 'Add Time Slot'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Time Slot Generation */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Generate Multiple Time Slots</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={bulkStartDate}
                      onChange={(e) => setBulkStartDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={bulkEndDate}
                      onChange={(e) => setBulkEndDate(e.target.value)}
                      min={bulkStartDate || format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slot Duration (minutes)
                    </label>
                    <select
                      value={bulkSlotDuration}
                      onChange={(e) => setBulkSlotDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={bulkStartTime}
                      onChange={(e) => setBulkStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={bulkEndTime}
                      onChange={(e) => setBulkEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={generateBulkTimeSlots}
                      disabled={isGeneratingSlots}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingSlots ? 'Generating...' : 'Generate Slots'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Slots List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Time Slots</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Booked By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeSlots
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((slot) => (
                        <tr key={slot.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(slot.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {slot.time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              slot.is_available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {slot.is_available ? 'Available' : 'Booked'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {!slot.is_available ? 'Booked' : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleTimeSlotAvailability(slot.id, !slot.is_available)}
                                className={`px-3 py-1 rounded transition-colors ${
                                  slot.is_available
                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                              >
                                {slot.is_available ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={() => deleteTimeSlot(slot.id)}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {timeSlots.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No time slots found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
