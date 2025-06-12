/**
 * Check what's currently in the database
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
  console.log('🔍 Checking database contents...');
  
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    // Count all slots
    const { data: allSlots, error } = await supabase
      .from('available_timeslots')
      .select('date, time')
      .order('date')
      .order('time');
    
    if (error) throw error;
    
    console.log(`📊 Total time slots in database: ${allSlots.length}`);
    
    if (allSlots.length > 0) {
      // Group by date
      const dateGroups = {};
      allSlots.forEach(slot => {
        if (!dateGroups[slot.date]) {
          dateGroups[slot.date] = 0;
        }
        dateGroups[slot.date]++;
      });
      
      const dates = Object.keys(dateGroups).sort();
      console.log(`📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
      console.log(`📈 Unique dates: ${dates.length}`);
      console.log(`🕐 Slots per day (avg): ${Math.round(allSlots.length / dates.length)}`);
      
      // Show first few dates
      console.log('\n📋 First 5 dates:');
      dates.slice(0, 5).forEach(date => {
        console.log(`  ${date}: ${dateGroups[date]} slots`);
      });
      
      // Check for June 2025 specifically
      const juneSlots = allSlots.filter(slot => slot.date.startsWith('2025-06'));
      console.log(`\n🗓️  June 2025 slots: ${juneSlots.length}`);
      
      // Check for rest of 2025
      const all2025Slots = allSlots.filter(slot => slot.date.startsWith('2025'));
      console.log(`📅 All 2025 slots: ${all2025Slots.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
