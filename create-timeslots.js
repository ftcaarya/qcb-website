const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingTimeSlots() {
  console.log('🛠️  Creating Missing Time Slots\n');
  
  const today = new Date();
  
  // Define the time slots we want to create (9 AM to 5 PM, every hour)
  const timeSlots = [
    '09:00:00',
    '10:00:00', 
    '11:00:00',
    '12:00:00',
    '13:00:00',
    '14:00:00',
    '15:00:00',
    '16:00:00',
    '17:00:00'
  ];
  
  console.log('Time slots to create:', timeSlots.join(', '));
  
  // Create slots for the next 14 days
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log(`\nProcessing ${dayName} ${dateString}:`);
    
    // Check what slots already exist for this date
    const { data: existingSlots, error: fetchError } = await supabase
      .from('available_timeslots')
      .select('time')
      .eq('date', dateString);
    
    if (fetchError) {
      console.error(`  Error fetching existing slots: ${fetchError.message}`);
      continue;
    }
    
    const existingTimes = existingSlots.map(slot => slot.time);
    console.log(`  Existing slots: ${existingTimes.length > 0 ? existingTimes.join(', ') : 'none'}`);
    
    // Create missing slots
    const slotsToCreate = [];
    for (const time of timeSlots) {
      if (!existingTimes.includes(time)) {
        slotsToCreate.push({
          date: dateString,
          time: time,
          is_available: true
        });
      }
    }
    
    if (slotsToCreate.length > 0) {
      console.log(`  Creating ${slotsToCreate.length} new slots...`);
      
      const { error: insertError } = await supabase
        .from('available_timeslots')
        .insert(slotsToCreate);
      
      if (insertError) {
        console.error(`  Error creating slots: ${insertError.message}`);
      } else {
        console.log(`  ✅ Successfully created ${slotsToCreate.length} time slots`);
      }
    } else {
      console.log('  ✅ All time slots already exist');
    }
  }
  
  console.log('\n🎉 Time slot creation complete!');
  console.log('Now refresh your booking page to see the newly available dates.');
}

createMissingTimeSlots().catch(console.error);
