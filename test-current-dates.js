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

async function testCurrentDates() {
  console.log('=== TESTING CURRENT DATE AVAILABILITY ===\n');
  
  const today = new Date();
  console.log('Today:', today.toISOString().split('T')[0]);
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() + i);
    const dateStr = testDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('date', dateStr)
      .eq('is_available', true);
    
    const status = data?.length > 0 ? '✅ Available' : '❌ No slots';
    console.log(`${dateStr}: ${data?.length || 0} slots - ${status}`);
  }
  
  // Check if any time slots exist at all
  const { data: allSlots } = await supabase
    .from('time_slots')
    .select('date, time, is_available')
    .limit(10);
    
  console.log('\nSample time slots in database:', allSlots?.length || 0);
  if (allSlots && allSlots.length > 0) {
    console.log('First few slots:', allSlots.slice(0, 3));
  }
}

testCurrentDates().catch(console.error);
