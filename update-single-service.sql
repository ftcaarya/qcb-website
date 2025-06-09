-- Queen City Blendz Database Schema - Single Service Version
-- Run this in your Supabase SQL Editor to update services

-- Clear existing services and add the single haircut service
DELETE FROM services;

-- Insert single service: Haircuts for $15
INSERT INTO services (name, description, duration_minutes, price_cents, is_active) VALUES
('Haircut', 'Professional haircut service', 60, 1500, true);

-- Update business settings for single service
UPDATE business_settings 
SET setting_value = '60'
WHERE setting_key = 'appointment_duration';
