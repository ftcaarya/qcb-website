const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, value] = line.split('=');
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTables() {
  console.log('=== CHECKING AVAILABLE TABLES ===\n');
  
  // Test time_slots table
  console.log('Testing time_slots table:');
  try {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ time_slots error:', error.message);
    } else {
      console.log('✅ time_slots table exists');
    }
  } catch (e) {
    console.log('❌ time_slots exception:', e.message);
  }
  
  // Test available_timeslots table
  console.log('\nTesting available_timeslots table:');
  try {
    const { data, error } = await supabase
      .from('available_timeslots')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ available_timeslots error:', error.message);
    } else {
      console.log('✅ available_timeslots table exists');
    }
  } catch (e) {
    console.log('❌ available_timeslots exception:', e.message);
  }
}

checkTables().catch(console.error);
