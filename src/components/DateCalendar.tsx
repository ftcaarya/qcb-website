import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, isToday, isPast } from 'date-fns';
import { dbOperations } from '@/lib/supabase';

interface DateCalendarProps {
  onDateSelect: (date: string) => void;
  selectedDate?: string;
  refreshTrigger?: boolean; // Add refresh trigger
}

export default function DateCalendar({ onDateSelect, selectedDate, refreshTrigger }: DateCalendarProps) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableDates();
  }, [refreshTrigger]); // Add refreshTrigger as dependency

  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      const dates = await dbOperations.getAvailableDates(14);
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error fetching available dates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate next 14 days
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');
      const hasAvailableSlots = availableDates.includes(dateString);
      
      dates.push({
        date: dateString,
        displayDate: date,
        hasAvailableSlots,
        isToday: isToday(date),
        isPast: isPast(date) && !isToday(date),
      });
    }
    
    return dates;
  };

  const dateOptions = generateDateOptions();

  if (loading) {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Date</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 14 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg p-4 h-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Date</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {dateOptions.map((dateOption) => {
          const isSelected = selectedDate === dateOption.date;
          const isDisabled = !dateOption.hasAvailableSlots || dateOption.isPast;
          
          return (
            <button
              key={dateOption.date}
              onClick={() => !isDisabled && onDateSelect(dateOption.date)}
              disabled={isDisabled}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200 text-center min-h-[80px] flex flex-col justify-center
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                }
                ${dateOption.isToday ? 'ring-2 ring-blue-200' : ''}
              `}
            >
              {dateOption.isToday && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
              
              <div className="text-xs font-medium mb-1">
                {format(dateOption.displayDate, 'EEE')}
              </div>
              
              <div className="text-lg font-bold">
                {format(dateOption.displayDate, 'd')}
              </div>
              
              <div className="text-xs">
                {format(dateOption.displayDate, 'MMM')}
              </div>
              
              {dateOption.hasAvailableSlots && !isDisabled && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
