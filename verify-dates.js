// Quick verification script to check specific dates
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificDates() {
  const datesToCheck = ['2025-06-14', '2025-06-15', '2025-06-21', '2025-06-22'];
  
  console.log('🔍 Checking specific dates for time slots...\n');
  
  for (const date of datesToCheck) {
    const { data, error } = await supabase
      .from('available_timeslots')
      .select('time, is_available')
      .eq('date', date)
      .order('time');
    
    if (error) {
      console.log(`❌ ${date}: Error - ${error.message}`);
    } else {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      console.log(`📅 ${date} (${dayOfWeek}): ${data.length} time slots available`);
      
      if (data.length > 0) {
        const times = data.map(slot => slot.time.substring(0, 5)).join(', ');
        console.log(`   Times: ${times}`);
      }
    }
  }
  
  console.log('\n✅ Verification complete!');
}

checkSpecificDates();
