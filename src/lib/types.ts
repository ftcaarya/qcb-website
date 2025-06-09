export interface DateInfo {
  date: string;
  displayDate: string;
  availableSlots: string[];
  isToday: boolean;
  isPast: boolean;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  instagram?: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price_cents?: number;
  is_active: boolean;
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  updated_at: string;
}
