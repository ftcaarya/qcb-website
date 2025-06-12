/**
 * Preload ALL time slots for 2025
 * This will create time slots for the entire year
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=');
      }
    }
  });
  
  return env;
}

async function main() {
  console.log('🚀 Starting FULL YEAR 2025 time slot preload...');
  
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test connection first
  console.log('Testing database connection...');
  try {
    const { error } = await supabase.from('available_timeslots').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }
  
  // Generate all slots for 2025
  const allSlots = generateFullYear2025();
  console.log(`📅 Generated ${allSlots.length} time slots for ALL of 2025`);
  
  // Clear existing 2025 data
  console.log('🧹 Clearing existing 2025 time slots...');
  const { error: deleteError } = await supabase
    .from('available_timeslots')
    .delete()
    .gte('date', '2025-01-01')
    .lte('date', '2025-12-31');
  
  if (deleteError) {
    console.error('❌ Failed to clear existing data:', deleteError.message);
    return;
  }
  
  console.log('✅ Existing 2025 data cleared');
  
  // Insert in batches
  const batchSize = 200;
  let totalInserted = 0;
  
  console.log(`📥 Inserting ${allSlots.length} slots in batches of ${batchSize}...`);
  
  for (let i = 0; i < allSlots.length; i += batchSize) {
    const batch = allSlots.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(allSlots.length / batchSize);
    
    try {
      const { error } = await supabase
        .from('available_timeslots')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Batch ${batchNumber} failed:`, error.message);
        return;
      }
      
      totalInserted += batch.length;
      const progress = Math.round((totalInserted / allSlots.length) * 100);
      console.log(`📈 Batch ${batchNumber}/${totalBatches} complete - ${totalInserted}/${allSlots.length} (${progress}%)`);
      
    } catch (error) {
      console.error(`💥 Batch ${batchNumber} error:`, error);
      return;
    }
  }
  
  console.log('🎉 Successfully preloaded ALL time slots for 2025!');
  console.log(`📊 Total slots created: ${totalInserted}`);
  
  // Final verification
  const { data: verifyData } = await supabase
    .from('available_timeslots')
    .select('count')
    .gte('date', '2025-01-01')
    .lte('date', '2025-12-31');
  
  console.log(`✅ Final verification: ${verifyData?.length || 0} slots found in database for 2025`);
  
  // Show some statistics
  const { data: statsData } = await supabase
    .from('available_timeslots')
    .select('date')
    .gte('date', '2025-01-01')
    .lte('date', '2025-12-31');
  
  if (statsData) {
    const uniqueDates = [...new Set(statsData.map(s => s.date))];
    console.log(`📈 Statistics: ${uniqueDates.length} unique dates with appointments available`);
  }
}

function generateFullYear2025() {
  const slots = [];
  
  // Configuration
  const workingDays = [0, 1, 2, 3, 4, 5, 6]; // All days: Sunday through Saturday
  const startHour = 9; // 9 AM
  const endHour = 17;  // 5 PM (exclusive)
  
  // Major holidays to skip
  const holidays = [
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
  ];
  
  // Generate for each month
  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(2025, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(2025, month - 1, day);
      const dayOfWeek = date.getDay();
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip holidays only (weekends are now included)
      if (holidays.includes(dateStr)) {
        continue;
      }
      
      // Generate hourly slots
      for (let hour = startHour; hour < endHour; hour++) {
        const timeStr = `${String(hour).padStart(2, '0')}:00:00`;
        
        slots.push({
          date: dateStr,
          time: timeStr,
          is_available: true
        });
      }
    }
  }
  
  return slots;
}

main().catch(console.error);
