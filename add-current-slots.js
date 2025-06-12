// Quick time slot generator for immediate availability
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

async function addCurrentWeekSlots() {
  const slots = [];
  const today = new Date('2025-06-12'); // Current date
  
  // Add slots for the next 14 days (including weekends)
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Add slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      const timeStr = `${String(hour).padStart(2, '0')}:00:00`;
      
      slots.push({
        date: dateStr,
        time: timeStr,
        is_available: true
      });
    }
  }
  
  console.log(`Generated ${slots.length} slots for the next 14 days`);
  
  // Delete existing slots for this period first
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 14);
  const endDateStr = endDate.toISOString().split('T')[0];
  
  await supabase
    .from('available_timeslots')
    .delete()
    .gte('date', startDate)
    .lte('date', endDateStr);
  
  console.log('Cleared existing slots for this period');
  
  // Insert new slots
  const { error } = await supabase
    .from('available_timeslots')
    .insert(slots);
  
  if (error) {
    console.error('Error inserting slots:', error.message);
    return false;
  }
  
  console.log(`✅ Successfully added ${slots.length} time slots!`);
  return true;
}

// Execute
addCurrentWeekSlots()
  .then(success => {
    if (success) {
      console.log('🎉 Time slots are ready for booking!');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
