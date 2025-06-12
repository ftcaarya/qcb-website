#!/usr/bin/env node

/**
 * Simple database status check
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables manually
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const lines = envContent.split('\n');
    
    let url = '';
    let key = '';
    
    for (const line of lines) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        url = line.split('=')[1].trim();
      }
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        key = line.split('=')[1].trim();
      }
    }
    
    return { url, key };
  } catch (error) {
    console.error('Error reading .env.local:', error.message);
    process.exit(1);
  }
}

async function checkDatabase() {
  const { url, key } = loadEnv();
  
  if (!url || !key) {
    console.error('Missing environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(url, key);
  
  try {
    // Count all 2025 slots
    const { data: all2025, error } = await supabase
      .from('available_timeslots')
      .select('date, time')
      .gte('date', '2025-01-01')
      .lte('date', '2025-12-31')
      .order('date')
      .order('time');
    
    if (error) {
      console.error('Database error:', error.message);
      process.exit(1);
    }
    
    console.log('=== DATABASE STATUS ===');
    console.log(`Total 2025 slots: ${all2025.length}`);
    
    if (all2025.length > 0) {
      // Group by date
      const dateMap = {};
      all2025.forEach(slot => {
        if (!dateMap[slot.date]) {
          dateMap[slot.date] = 0;
        }
        dateMap[slot.date]++;
      });
      
      const dates = Object.keys(dateMap).sort();
      console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
      console.log(`Unique dates: ${dates.length}`);
      
      // Show next few available dates from today
      const today = '2025-06-12';
      const upcomingDates = dates.filter(d => d >= today).slice(0, 10);
      console.log('Next 10 available dates:');
      upcomingDates.forEach(date => {
        console.log(`  ${date}: ${dateMap[date]} slots`);
      });
    }
    
    console.log('=== STATUS: ✅ READY ===');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
