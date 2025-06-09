-- Queen City Blendz Database Schema
-- Run this in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
-- Create tables

-- 1. Available Time Slots table
CREATE TABLE IF NOT EXISTS available_timeslots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, time)
);

-- 2. Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  instagram TEXT,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price_cents INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Business Settings table
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_available_timeslots_date ON available_timeslots(date);
CREATE INDEX IF NOT EXISTS idx_available_timeslots_date_time ON available_timeslots(date, time);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Insert default services
INSERT INTO services (name, description, duration_minutes, price_cents, is_active) VALUES
('Basic Haircut', 'Classic cut and style', 60, 3500, true),
('Premium Haircut & Styling', 'Cut, wash, and premium styling', 90, 5500, true),
('Beard Trim', 'Professional beard trimming and shaping', 30, 2000, true),
('Hair Wash & Style', 'Wash and styling only', 45, 2500, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default business settings
INSERT INTO business_settings (setting_key, setting_value) VALUES
('operating_hours', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"closed": true}}'),
('appointment_duration', '60'),
('booking_advance_days', '14'),
('time_slot_interval', '60')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to automatically generate time slots for the next 14 days
CREATE OR REPLACE FUNCTION generate_timeslots_for_date(target_date DATE)
RETURNS VOID AS $$
DECLARE
  time_slot TIME;
  day_name TEXT;
  start_time TIMESTAMP := target_date + TIME '09:00:00';
  end_time TIMESTAMP := target_date + TIME '17:00:00';
  current_time TIMESTAMP;
BEGIN
  -- Get day of week
  day_name := LOWER(TO_CHAR(target_date, 'Day'));
  day_name := TRIM(day_name);
  
  -- Skip Sundays (optional - remove this IF block if you want Sunday slots)
  IF day_name = 'sunday' THEN
    RETURN;
  END IF;
  
  -- Generate hourly time slots from 9 AM to 5 PM
  current_time := start_time;
  WHILE current_time < end_time LOOP
    time_slot := current_time::TIME;
    
    INSERT INTO available_timeslots (date, time, is_available)
    VALUES (target_date, time_slot, true)
    ON CONFLICT (date, time) DO NOTHING;
    
    current_time := current_time + INTERVAL '1 hour';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate timeslots for the next 14 days
DO $$
DECLARE
  current_date DATE := CURRENT_DATE;
  i INTEGER;
BEGIN
  FOR i IN 0..13 LOOP
    PERFORM generate_timeslots_for_date(current_date + i);
  END LOOP;
END $$;

-- Function to update timeslot availability when appointment is booked
CREATE OR REPLACE FUNCTION update_timeslot_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    -- Mark timeslot as unavailable when appointment is confirmed
    UPDATE available_timeslots 
    SET is_available = false 
    WHERE date = NEW.date AND time = NEW.time;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      -- Mark timeslot as available when appointment is cancelled/changed
      UPDATE available_timeslots 
      SET is_available = true 
      WHERE date = OLD.date AND time = OLD.time;
    ELSIF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      -- Mark timeslot as unavailable when appointment is confirmed
      UPDATE available_timeslots 
      SET is_available = false 
      WHERE date = NEW.date AND time = NEW.time;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    -- Mark timeslot as available when confirmed appointment is deleted
    UPDATE available_timeslots 
    SET is_available = true 
    WHERE date = OLD.date AND time = OLD.time;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER appointment_timeslot_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_timeslot_availability();

-- Enable RLS
ALTER TABLE available_timeslots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access (read-only for timeslots and services)
CREATE POLICY "Public can view available timeslots" ON available_timeslots
  FOR SELECT USING (true);

CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view business settings" ON business_settings
  FOR SELECT USING (true);

-- RLS Policies for appointments (public can insert, but not read others)
CREATE POLICY "Public can create appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- Admin policies (you'll need to set up authentication for full admin access)
-- For now, allowing all operations - you should restrict this in production
CREATE POLICY "Admin can manage timeslots" ON available_timeslots
  FOR ALL USING (true);

CREATE POLICY "Admin can manage appointments" ON appointments
  FOR ALL USING (true);

CREATE POLICY "Admin can manage services" ON services
  FOR ALL USING (true);

CREATE POLICY "Admin can manage settings" ON business_settings
  FOR ALL USING (true);
