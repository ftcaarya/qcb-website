// Test Supabase database connection
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vgwxawwmtdzcegxwvbeh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd3hhd3dtdGR6Y2VneHd2YmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTYxMDQsImV4cCI6MjA2NDczMjEwNH0.1ooVMJZRq3pXFKDmUV2vqeRf0vCGHv0_52VdrH3LJ_g'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  
  try {
    // Test 1: Check if we can connect to Supabase
    const { data, error } = await supabase.from('available_timeslots').select('count', { count: 'exact' })
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      
      // Check if tables exist
      if (error.message.includes('relation "available_timeslots" does not exist')) {
        console.log('📋 Database tables not found. You need to run the SQL schema.')
        console.log('📋 Go to your Supabase project > SQL Editor > Run the contents of supabase-schema.sql')
      }
    } else {
      console.log('✅ Database connection successful!')
      console.log('📊 Available time slots table found with', data.length, 'records')
      
      // Test 2: Check other tables
      const tables = ['appointments', 'services', 'business_settings']
      for (const table of tables) {
        try {
          const { data: tableData, error: tableError } = await supabase.from(table).select('count', { count: 'exact' })
          if (tableError) {
            console.log(`❌ Table '${table}' not found or accessible`)
          } else {
            console.log(`✅ Table '${table}' found`)
          }
        } catch (err) {
          console.log(`❌ Error checking table '${table}':`, err.message)
        }
      }
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
  }
}

testConnection()
