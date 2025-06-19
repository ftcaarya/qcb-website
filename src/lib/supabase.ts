import { createClient } from '@supabase/supabase-js'
import { TimeSlot, Appointment, Service, BusinessSettings } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Utility function to clean Instagram handle
export const cleanInstagramHandle = (handle?: string): string | undefined => {
  if (!handle) return handle;
  
  // Remove all @ symbols from the beginning and then add exactly one
  const cleaned = handle.replace(/^@+/, '');
  return cleaned ? cleaned : undefined;
}

export interface AppointmentFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  instagram?: string;
}

// Database operations
export const dbOperations = {
  // Get available time slots for a specific date
  async getAvailableTimeSlots(date: string): Promise<TimeSlot[]> {
    const { data, error } = await supabase
      .from('available_timeslots')
      .select('*')
      .eq('date', date)
      .eq('is_available', true)
      .order('time');
    
    if (error) throw error;
    return data || [];
  },

  // Get available dates for the next N days
  async getAvailableDates(days: number = 14): Promise<string[]> {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);
    
    const { data, error } = await supabase
      .from('available_timeslots')
      .select('date')
      .eq('is_available', true)
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);
    
    if (error) throw error;
    
    // Get unique dates
    const uniqueDates = [...new Set(data?.map(slot => slot.date) || [])];
    return uniqueDates.sort();
  },

  // Get all services
  async getServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Create a new appointment
  async createAppointment(appointmentData: AppointmentFormValues): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        first_name: appointmentData.firstName,
        last_name: appointmentData.lastName,
        phone: appointmentData.phone,
        instagram: cleanInstagramHandle(appointmentData.instagram),
        service: appointmentData.service,
        date: appointmentData.date,
        time: appointmentData.time,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all appointments (for admin)
  async getAllAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Update appointment status
  async updateAppointmentStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Update appointment (more general)
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Delete appointment
  async deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Admin: Add/remove time slots
  async addTimeSlot(date: string, time: string): Promise<void> {
    const { error } = await supabase
      .from('available_timeslots')
      .insert({ date, time, is_available: true });
    
    if (error) throw error;
  },

  // Create time slot with more options
  async createTimeSlot(slotData: { date: string; time: string; is_available: boolean }): Promise<void> {
    const { error } = await supabase
      .from('available_timeslots')
      .insert(slotData);
    
    if (error) throw error;
  },

  // Update time slot
  async updateTimeSlot(id: string, updates: Partial<TimeSlot>): Promise<void> {
    const { error } = await supabase
      .from('available_timeslots')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  },

  // Delete time slot
  async deleteTimeSlot(id: string): Promise<void> {
    const { error } = await supabase
      .from('available_timeslots')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async removeTimeSlot(id: string): Promise<void> {
    const { error } = await supabase
      .from('available_timeslots')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Generate multiple time slots
  async generateTimeSlots(config: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
  }): Promise<void> {
    try {
      // Check if we're using placeholder values
      if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
        throw new Error('Supabase configuration uses placeholder values. Please set proper NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
      }

      console.log('🔄 Attempting to generate time slots with database function...');
      
      // Try to use the database function first
      const { error } = await supabase.rpc('generate_time_slots', {
        start_date: config.startDate,
        end_date: config.endDate,
        start_time: config.startTime,
        end_time: config.endTime,
        duration_minutes: config.slotDurationMinutes
      });
      
      if (error) {
        console.log('Database function failed, error:', error.message);
        throw error;
      }
      
      console.log('✅ Time slots generated successfully using database function');
    } catch (error) {
      // If database function doesn't exist, fall back to manual generation
      console.log('🔄 Database function not available, using manual generation...');
      
      const startDate = new Date(config.startDate);
      const endDate = new Date(config.endDate);
      const slots = [];
      
      // Loop through each date
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Parse start and end times
        const [startHour, startMin] = config.startTime.split(':').map(Number);
        const [endHour, endMin] = config.endTime.split(':').map(Number);
        
        // Generate hourly slots (simplified - every hour on the hour)
        for (let hour = startHour; hour < endHour; hour++) {
          const timeStr = `${String(hour).padStart(2, '0')}:00:00`;
          slots.push({
            date: dateStr,
            time: timeStr,
            is_available: true
          });
        }
      }
      
      // Insert in batches to avoid overwhelming the database
      if (slots.length > 0) {
        console.log(`🔄 Inserting ${slots.length} time slots manually...`);
        
        const { error: insertError } = await supabase
          .from('available_timeslots')
          .insert(slots);
        
        if (insertError) {
          console.error('❌ Failed to insert time slots:', insertError);
          throw insertError;
        }
        
        console.log('✅ Time slots inserted successfully using manual generation');
      } else {
        console.log('ℹ️ No time slots to insert');
      }
    }
  },

  // Admin: Get all time slots for management
  async getAllTimeSlots(): Promise<TimeSlot[]> {
    const { data, error } = await supabase
      .from('available_timeslots')
      .select('*')
      .order('date')
      .order('time');
    
    if (error) throw error;
    return data || [];
  },

  // Real-time subscription for time slots
  subscribeToTimeSlots(callback: (payload: any) => void) {
    return supabase
      .channel('timeslots-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'available_timeslots' }, 
        callback
      )
      .subscribe();
  },

  // Real-time subscription for appointments
  subscribeToAppointments(callback: (payload: any) => void) {
    return supabase
      .channel('appointments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments' }, 
        callback
      )
      .subscribe();
  }
};
