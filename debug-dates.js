const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDates() {
  console.log('🔍 Debugging Date Issues\n');
  
  console.log('Current date and time:', new Date().toISOString());
  console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Check what's in the database for the next 14 days
  const today = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(today.getDate() + 14);
  
  const startDate = today.toISOString().split('T')[0];
  const endDate = twoWeeksFromNow.toISOString().split('T')[0];
  
  console.log(`\nChecking dates from ${startDate} to ${endDate}\n`);
  
  // Get all time slots in this range
  const { data: slots, error } = await supabase
    .from('available_timeslots')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  
  if (error) {
    console.error('Error fetching time slots:', error);
    return;
  }
  
  console.log(`Found ${slots.length} time slots in database:\n`);
  
  // Group by date
  const slotsByDate = {};
  slots.forEach(slot => {
    if (!slotsByDate[slot.date]) {
      slotsByDate[slot.date] = [];
    }
    slotsByDate[slot.date].push(slot);
  });
  
  // Show what dates have slots
  for (let i = 0; i < 14; i++) {
    const checkDate = new Date();
    checkDate.setDate(today.getDate() + i);
    const dateString = checkDate.toISOString().split('T')[0];
    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const availableSlots = slotsByDate[dateString]?.filter(slot => slot.is_available) || [];
    const totalSlots = slotsByDate[dateString]?.length || 0;
    
    console.log(`${dayName} ${dateString}: ${availableSlots.length} available / ${totalSlots} total slots`);
    
    if (totalSlots === 0) {
      console.log('  ❌ NO SLOTS FOUND - This is why the date appears disabled');
    } else if (availableSlots.length === 0) {
      console.log('  ⚠️  All slots are unavailable');
    } else {
      console.log(`  ✅ Available times: ${availableSlots.map(s => s.time).join(', ')}`);
    }
  }
  
  console.log('\n🔧 To fix disabled dates, you need to:');
  console.log('1. Add time slots for those dates in the admin panel');
  console.log('2. Or run the bulk time slot generation feature');
  console.log('3. Check that time slots have is_available = true');
}

debugDates().catch(console.error);
