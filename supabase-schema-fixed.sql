-- Queen City Blendz Database Schema - FIXED VERSION
-- Run this in your Supabase SQL Editor

-- Create tables first
CREATE TABLE IF NOT EXISTS available_timeslots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, time)
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  instagram TEXT,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price_cents INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
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

-- Simple function to generate time slots (FIXED VERSION)
CREATE OR REPLACE FUNCTION generate_timeslots_for_date(target_date DATE)
RETURNS VOID AS $$
DECLARE
  hour_num INTEGER;
BEGIN
  -- Generate time slots from 9 AM to 5 PM (9, 10, 11, 12, 13, 14, 15, 16)
  FOR hour_num IN 9..16 LOOP
    INSERT INTO available_timeslots (date, time, is_available)
    VALUES (target_date, (hour_num || ':00:00')::TIME, true)
    ON CONFLICT (date, time) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate initial time slots for next 14 days
DO $$
DECLARE
  current_date DATE := CURRENT_DATE;
  i INTEGER;
BEGIN
  FOR i IN 0..13 LOOP
    PERFORM generate_timeslots_for_date(current_date + i);
  END LOOP;
END $$;

-- Trigger function for automatic timeslot management
CREATE OR REPLACE FUNCTION update_timeslot_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE available_timeslots 
    SET is_available = false 
    WHERE date = NEW.date AND time = NEW.time;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE available_timeslots 
      SET is_available = true 
      WHERE date = OLD.date AND time = OLD.time;
    ELSIF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE available_timeslots 
      SET is_available = false 
      WHERE date = NEW.date AND time = NEW.time;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE available_timeslots 
    SET is_available = true 
    WHERE date = OLD.date AND time = OLD.time;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER appointment_timeslot_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_timeslot_availability();

-- Enable RLS (Row Level Security)
ALTER TABLE available_timeslots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access
CREATE POLICY "Public can view available timeslots" ON available_timeslots
  FOR SELECT USING (true);

CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view business settings" ON business_settings
  FOR SELECT USING (true);

CREATE POLICY "Public can create appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- Admin policies (allowing all operations for now)
CREATE POLICY "Admin can manage timeslots" ON available_timeslots
  FOR ALL USING (true);

CREATE POLICY "Admin can manage appointments" ON appointments
  FOR ALL USING (true);

CREATE POLICY "Admin can manage services" ON services
  FOR ALL USING (true);

CREATE POLICY "Admin can manage settings" ON business_settings
  FOR ALL USING (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE available_timeslots;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE business_settings;
