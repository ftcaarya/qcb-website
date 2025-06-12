import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { dbOperations } from '@/lib/supabase';
import { TimeSlot } from '@/lib/types';

interface TimeSlotSelectorProps {
  selectedDate: string;
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
}

export default function TimeSlotSelector({ selectedDate, onTimeSelect, selectedTime }: TimeSlotSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate]);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const slots = await dbOperations.getAvailableTimeSlots(selectedDate);
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDate) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Please select a date first</p>
      </div>
    );
  }

  // Helper function to parse date correctly without timezone issues
  const parseSelectedDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in JavaScript Date
  };

  if (loading) {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available Times for {format(parseSelectedDate(selectedDate), 'EEEE, MMMM d')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg p-3 h-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available Times for {format(parseSelectedDate(selectedDate), 'EEEE, MMMM d')}
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No available time slots for this date</div>
          <p className="text-sm text-gray-400">Please select a different date</p>
        </div>
      </div>
    );
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Available Times for {format(parseSelectedDate(selectedDate), 'EEEE, MMMM d')}
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {timeSlots.map((slot) => {
          const isSelected = selectedTime === slot.time;
          
          return (
            <button
              key={slot.id}
              onClick={() => onTimeSelect(slot.time)}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 text-center font-medium
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              {formatTime(slot.time)}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>💡 All appointments are approximately 1 hour</p>
      </div>
    </div>
  );
}
