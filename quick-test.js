const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://vgwxawwmtdzcegxwvbeh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd3hhd3dtdGR6Y2VneHd2YmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTYxMDQsImV4cCI6MjA2NDczMjEwNH0.1ooVMJZRq3pXFKDmUV2vqeRf0vCGHv0_52VdrH3LJ_g'

const supabase = createClient(supabaseUrl, supabaseKey)

async function quickTest() {
  console.log('🔍 Quick Database Test')
  console.log('====================')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('available_timeslots').select('count')
    
    if (error) {
      if (error.message.includes('relation "available_timeslots" does not exist')) {
        console.log('❌ DATABASE NOT SET UP')
        console.log('')
        console.log('📋 NEXT STEPS:')
        console.log('1. Go to your Supabase project: https://supabase.com/dashboard/projects')
        console.log('2. Open SQL Editor')
        console.log('3. Copy and paste the entire contents of supabase-schema.sql')
        console.log('4. Run the SQL to create tables')
        console.log('5. Add initial services data')
        console.log('')
        console.log('🎯 After database setup, your booking system will be ready!')
      } else {
        console.log('❌ Database Error:', error.message)
      }
    } else {
      console.log('✅ DATABASE CONNECTED!')
      console.log('📊 Available time slots table exists')
      
      // Test services table
      const { data: services, error: serviceError } = await supabase.from('services').select('*')
      if (serviceError) {
        console.log('⚠️  Services table issue:', serviceError.message)
      } else {
        console.log(`✅ Found ${services.length} services`)
        if (services.length === 0) {
          console.log('💡 Add some services using the SQL in initial-services.sql')
        }
      }
      
      console.log('')
      console.log('🎉 Your booking system is ready!')
      console.log('🌐 Visit: http://localhost:3002')
      console.log('⚙️  Admin: http://localhost:3002/dashboard')
    }
  } catch (err) {
    console.log('❌ Connection failed:', err.message)
  }
}

quickTest()
