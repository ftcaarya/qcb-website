// Auto Time Slot Generator
// This component ensures time slots are automatically created for the rolling 14-day window

import { useEffect } from 'react';
import { dbOperations } from '@/lib/supabase';

interface AutoTimeSlotGeneratorProps {
  onComplete?: () => void;
}

export default function AutoTimeSlotGenerator({ onComplete }: AutoTimeSlotGeneratorProps) {
  useEffect(() => {
    const ensureTimeSlots = async () => {
      try {
        // Check if Supabase is properly configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
          console.warn('⚠️ Supabase not configured - skipping auto time slot generation');
          console.log('To fix this, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
          onComplete?.();
          return;
        }

        // Get the current 14-day window
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 14);

        console.log('🔄 Generating time slots from', today.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);

        // Generate time slots for any missing dates in the window
        await dbOperations.generateTimeSlots({
          startDate: today.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 60
        });

        console.log('✅ Auto time slot generation completed');
        onComplete?.();
      } catch (error) {
        console.error('❌ Auto time slot generation failed:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        // Don't throw - allow the app to continue functioning
        onComplete?.();
      }
    };

    ensureTimeSlots();
  }, [onComplete]);

  return null; // This is a utility component with no UI
}
