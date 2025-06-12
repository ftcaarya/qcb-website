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

async function testCorrectTable() {
  console.log('=== TESTING CORRECT TABLE: available_timeslots ===\n');
  
  const today = new Date();
  console.log('Today:', today.toISOString().split('T')[0]);
  
  // Check next 7 days
  console.log('Next 7 days availability:');
  for (let i = 1; i <= 7; i++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() + i);
    const dateStr = testDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('available_timeslots')
      .select('*')
      .eq('date', dateStr)
      .eq('is_available', true);
    
    const status = data?.length > 0 ? '✅ Available' : '❌ No slots';
    console.log(`   ${dateStr}: ${data?.length || 0} slots - ${status}`);
  }
  
  // Check total slots in database
  const { data: allSlots } = await supabase
    .from('available_timeslots')
    .select('date, time, is_available')
    .order('date')
    .order('time');
    
  console.log('\nTotal time slots in database:', allSlots?.length || 0);
  
  if (allSlots && allSlots.length > 0) {
    const availableSlots = allSlots.filter(slot => slot.is_available);
    console.log('Available slots:', availableSlots.length);
    console.log('Sample available slots:');
    availableSlots.slice(0, 5).forEach(slot => {
      console.log(`   ${slot.date} at ${slot.time}`);
    });
  }
}

testCorrectTable().catch(console.error);
