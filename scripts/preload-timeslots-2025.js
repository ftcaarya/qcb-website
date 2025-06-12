/**
 * Preload Time Slots for 2025
 * This script generates and inserts all time slots for the year 2025
 * Run with: node scripts/preload-timeslots-2025.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const CONFIG = {
  // Business hours (9 AM to 5 PM)
  startTime: '09:00:00',
  endTime: '17:00:00',
  
  // Hour-long appointment slots
  slotDurationMinutes: 60,
  
  // Days of the week (0 = Sunday, 1 = Monday, ... 6 = Saturday)
  // Now includes all days including weekends
  workingDays: [0, 1, 2, 3, 4, 5, 6],
  
  // Holidays to skip (format: 'YYYY-MM-DD')
  holidays: [
    '2025-01-01', // New Year's Day
    '2025-01-20', // MLK Day
    '2025-02-17', // Presidents Day
    '2025-05-26', // Memorial Day
    '2025-07-04', // Independence Day
    '2025-09-01', // Labor Day
    '2025-10-13', // Columbus Day
    '2025-11-11', // Veterans Day
    '2025-11-27', // Thanksgiving
    '2025-11-28', // Day after Thanksgiving
    '2025-12-25', // Christmas
    '2025-12-31', // New Year's Eve
  ]
};

async function main() {
  console.log('🚀 Starting time slot preload for 2025...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration in .env.local');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  
  if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    console.error('❌ Supabase configuration contains placeholder values');
    console.error('Please update .env.local with your actual Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('✅ Supabase client initialized');
  
  // Test connection
  try {
    const { data, error } = await supabase.from('available_timeslots').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
  
  // Generate all time slots for 2025
  const timeSlots = generateYearTimeSlots(2025);
  console.log(`📅 Generated ${timeSlots.length} time slots for 2025`);
  
  // Clear existing 2025 data (optional - comment out if you want to keep existing data)
  console.log('🧹 Clearing existing 2025 time slots...');
  const { error: deleteError } = await supabase
    .from('available_timeslots')
    .delete()
    .gte('date', '2025-01-01')
    .lte('date', '2025-12-31');
  
  if (deleteError) {
    console.error('❌ Failed to clear existing data:', deleteError.message);
    process.exit(1);
  }
  
  // Insert in batches to avoid overwhelming the database
  const batchSize = 100;
  let insertedCount = 0;
  
  console.log('📥 Inserting time slots in batches...');
  
  for (let i = 0; i < timeSlots.length; i += batchSize) {
    const batch = timeSlots.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('available_timeslots')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Failed to insert batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      console.error('Error details:', error);
      process.exit(1);
    }
    
    insertedCount += batch.length;
    const progress = Math.round((insertedCount / timeSlots.length) * 100);
    console.log(`📈 Progress: ${insertedCount}/${timeSlots.length} (${progress}%)`);
  }
  
  console.log('🎉 Successfully preloaded all time slots for 2025!');
  console.log(`📊 Total slots created: ${insertedCount}`);
  
  // Verify the data
  const { data: verifyData, error: verifyError } = await supabase
    .from('available_timeslots')
    .select('count')
    .gte('date', '2025-01-01')
    .lte('date', '2025-12-31');
  
  if (!verifyError && verifyData) {
    console.log(`✅ Verification: Found ${verifyData.length} time slots in database for 2025`);
  }
}

function generateYearTimeSlots(year) {
  const slots = [];
  const startDate = new Date(year, 0, 1); // January 1st
  const endDate = new Date(year, 11, 31); // December 31st
  
  // Parse start and end times
  const [startHour] = CONFIG.startTime.split(':').map(Number);
  const [endHour] = CONFIG.endTime.split(':').map(Number);
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    
    // Skip holidays only (weekends now included)
    if (CONFIG.holidays.includes(dateStr)) {
      continue;
    }
    
    // Generate hourly slots for this date
    for (let hour = startHour; hour < endHour; hour++) {
      const timeStr = `${String(hour).padStart(2, '0')}:00:00`;
      
      slots.push({
        date: dateStr,
        time: timeStr,
        is_available: true
      });
    }
  }
  
  return slots;
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
