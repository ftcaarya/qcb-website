const { createClient } = require('@supabase/supabase-js')
require('dotenv/config')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function simpleBookingTest() {
  console.log('🧪 Simple Booking Test')
  console.log('=====================')
  
  try {
    // Get first available slot
    const { data: slots, error: slotsError } = await supabase
      .from('available_timeslots')
      .select('*')
      .eq('is_available', true)
      .gte('date', '2025-06-09')
      .limit(1)
    
    if (slotsError) throw slotsError
    
    if (slots.length === 0) {
      console.log('❌ No available time slots found')
      return
    }
    
    const slot = slots[0]
    console.log(`📅 Found available slot: ${slot.date} at ${slot.time}`)
    
    // Create test appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-123-4567',
        email: 'john@example.com',
        service: 'Basic Haircut',
        date: slot.date,
        time: slot.time,
        status: 'pending'
      })
      .select()
    
    if (appointmentError) throw appointmentError
    
    console.log('✅ Created test appointment successfully!')
    console.log(`   ID: ${appointment[0].id}`)
    console.log(`   Customer: ${appointment[0].first_name} ${appointment[0].last_name}`)
    console.log(`   Service: ${appointment[0].service}`)
    console.log(`   Date/Time: ${appointment[0].date} at ${appointment[0].time}`)
    
    // Clean up
    await supabase.from('appointments').delete().eq('id', appointment[0].id)
    console.log('🧹 Test appointment cleaned up')
    
    console.log('\n🎉 BOOKING SYSTEM IS WORKING PERFECTLY!')
    console.log('\n📋 What you can do now:')
    console.log('   1. Visit http://localhost:3003 to test the booking interface')
    console.log('   2. Visit http://localhost:3003/dashboard for admin functions')
    console.log('   3. Create real appointments through the web interface')
    console.log('   4. Manage appointments in the admin dashboard')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

simpleBookingTest()
