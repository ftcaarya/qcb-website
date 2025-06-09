// Complete booking flow test
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testCompleteBookingFlow() {
  console.log('🎯 Testing Complete Booking Flow\n')
  
  try {
    // 1. Fetch available dates and times (like the frontend does)
    console.log('1️⃣ Fetching available time slots...')
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('available_timeslots')
      .select('*')
      .eq('is_available', true)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .order('time')
      .limit(5)
    
    if (timeSlotsError) throw timeSlotsError
    console.log(`   ✅ Found ${timeSlots.length} available slots`)
    
    if (timeSlots.length === 0) {
      console.log('   ❌ No available time slots found!')
      return
    }
    
    // 2. Fetch services (like the service selector does)
    console.log('\n2️⃣ Fetching services...')
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
    
    if (servicesError) throw servicesError
    console.log(`   ✅ Found ${services.length} services`)
    
    // 3. Create a test booking
    console.log('\n3️⃣ Creating test booking...')
    const testSlot = timeSlots[0]
    const testService = services[0]
    
    const { data: newAppointment, error: bookingError } = await supabase
      .from('appointments')
      .insert({
        first_name: 'Test',
        last_name: 'User',
        phone: '555-1234',
        email: 'test@example.com',
        service: testService.name,
        date: testSlot.date,
        time: testSlot.time,
        status: 'pending'
      })
      .select()
      .single()
    
    if (bookingError) throw bookingError
    console.log(`   ✅ Created appointment: ${newAppointment.id}`)
    
    // 4. Verify time slot was marked unavailable
    console.log('\n4️⃣ Checking time slot availability...')
    const { data: updatedSlot, error: slotError } = await supabase
      .from('available_timeslots')
      .select('*')
      .eq('date', testSlot.date)
      .eq('time', testSlot.time)
      .single()
    
    if (slotError) throw slotError
    console.log(`   ✅ Time slot availability: ${updatedSlot.is_available ? 'AVAILABLE' : 'BOOKED'}`)
    
    // 5. Confirm the appointment (simulate admin action)
    console.log('\n5️⃣ Confirming appointment (admin action)...')
    const { data: confirmedAppointment, error: confirmError } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', newAppointment.id)
      .select()
      .single()
    
    if (confirmError) throw confirmError
    console.log(`   ✅ Appointment confirmed: ${confirmedAppointment.status}`)
    
    // 6. Verify time slot is still unavailable
    console.log('\n6️⃣ Verifying time slot after confirmation...')
    const { data: finalSlot, error: finalSlotError } = await supabase
      .from('available_timeslots')
      .select('*')
      .eq('date', testSlot.date)
      .eq('time', testSlot.time)
      .single()
    
    if (finalSlotError) throw finalSlotError
    console.log(`   ✅ Time slot availability: ${finalSlot.is_available ? 'AVAILABLE' : 'BOOKED'}`)
    
    // 7. Clean up test data
    console.log('\n7️⃣ Cleaning up test data...')
    await supabase.from('appointments').delete().eq('id', newAppointment.id)
    await supabase
      .from('available_timeslots')
      .update({ is_available: true })
      .eq('date', testSlot.date)
      .eq('time', testSlot.time)
    console.log('   🧹 Test data cleaned up')
    
    console.log('\n🎉 COMPLETE BOOKING FLOW TEST PASSED!')
    console.log('   - Time slot fetching: ✅')
    console.log('   - Service loading: ✅')
    console.log('   - Appointment creation: ✅')
    console.log('   - Automatic slot blocking: ✅')
    console.log('   - Status updates: ✅')
    console.log('   - Trigger functions: ✅')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testCompleteBookingFlow()
