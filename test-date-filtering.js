const { createClient } = require('@supabase/supabase-js');

// Using your actual Supabase credentials
const supabaseUrl = 'https://vgwxawwmtdzcegxwvbeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd3hhd3dtdGR6Y2VneHd2YmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTYxMDQsImV4cCI6MjA2NDczMjEwNH0.1ooVMJZRq3pXFKDmUV2vqeRf0vCGHv0_52VdrH3LJ_g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDateFiltering() {
  console.log('Testing date filtering...\n');
  
  // Get today's date in YYYY-MM-DD format (using local timezone)
  const today = new Date();
  const todayString = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
  
  console.log('Today\'s date (local):', todayString);
  console.log('Current date object:', today.toString());
  console.log('---\n');
  
  try {
    // Fetch ALL appointments first (to see what's in the database)
    console.log('1. ALL appointments in database:');
    const { data: allAppointments, error: allError } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (allError) throw allError;

    if (allAppointments && allAppointments.length > 0) {
      allAppointments.forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.date} ${apt.time} - ${apt.first_name} ${apt.last_name} (${apt.status})`);
      });
    } else {
      console.log('   No appointments found in database');
    }
    
    console.log('\n---\n');
    
    // Fetch appointments from today onwards only (filtered)
    console.log('2. Appointments from TODAY onwards (filtered):');
    const { data: filteredAppointments, error: filteredError } = await supabase
      .from('appointments')
      .select('*')
      .gte('date', todayString) // Only get appointments from today onwards
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (filteredError) throw filteredError;
    
    if (filteredAppointments && filteredAppointments.length > 0) {
      filteredAppointments.forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.date} ${apt.time} - ${apt.first_name} ${apt.last_name} (${apt.status})`);
      });
    } else {
      console.log('   No appointments found from today onwards');
    }
    
    console.log('\n---\n');
    console.log(`Filter result: ${allAppointments?.length || 0} total → ${filteredAppointments?.length || 0} filtered`);
    
    // Check if any June 15th appointments are still showing
    const june15Appointments = filteredAppointments?.filter(apt => apt.date === '2025-06-15') || [];
    if (june15Appointments.length > 0) {
      console.log('\n⚠️  WARNING: Found June 15th appointments in filtered results:');
      june15Appointments.forEach(apt => {
        console.log(`   - ${apt.date} ${apt.time} - ${apt.first_name} ${apt.last_name}`);
      });
    } else {
      console.log('\n✅ SUCCESS: No June 15th appointments in filtered results');
    }
    
  } catch (error) {
    console.error('Error testing date filtering:', error);
  }
}

testDateFiltering();
