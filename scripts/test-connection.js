/**
 * Test Supabase connection and preload time slots
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
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
  console.log('🚀 Testing Supabase connection...');
  
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'undefined');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test connection
  console.log('Testing database connection...');
  try {
    const { data, error } = await supabase.from('available_timeslots').select('*').limit(5);
    
    if (error) {
      console.error('❌ Connection failed:', error);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('Current time slots:', data?.length || 0, 'found');
    
    // Generate time slots for June 2025 (current month)
    const slots = generateMonthSlots('2025-06');
    console.log(`📅 Generated ${slots.length} slots for June 2025`);
    
    if (slots.length > 0) {
      console.log('📥 Inserting time slots...');
      
      // Delete existing June 2025 slots first
      await supabase
        .from('available_timeslots')
        .delete()
        .gte('date', '2025-06-01')
        .lte('date', '2025-06-30');
      
      // Insert new slots
      const { data: insertData, error: insertError } = await supabase
        .from('available_timeslots')
        .insert(slots);
      
      if (insertError) {
        console.error('❌ Insert failed:', insertError);
        return;
      }
      
      console.log('✅ Time slots inserted successfully!');
      
      // Verify
      const { data: verifyData } = await supabase
        .from('available_timeslots')
        .select('*')
        .gte('date', '2025-06-01')
        .lte('date', '2025-06-30');
      
      console.log(`🔍 Verification: ${verifyData?.length || 0} slots in database for June 2025`);
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

function generateMonthSlots(yearMonth) {
  const slots = [];
  const [year, month] = yearMonth.split('-');
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Working days (now includes all days including weekends)
  const workingDays = [0, 1, 2, 3, 4, 5, 6];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    
    // Include all days (no weekend filtering)
    // if (!workingDays.includes(dayOfWeek)) {
    //   continue;
    // }
    
    // Generate slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
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

main().catch(console.error);
