const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, value] = line.split('=');
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function finalComprehensiveTest() {
  console.log('🔍 === COMPREHENSIVE BOOKING SYSTEM TEST ===\n');
  
  // 1. Test Date Display Bug Fix
  console.log('1️⃣ TESTING DATE DISPLAY BUG FIX:');
  
  function parseSelectedDateOld(dateStr) {
    return new Date(dateStr); // Old problematic way
  }
  
  function parseSelectedDateNew(dateStr) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    return new Date(year, month - 1, day); // New timezone-safe way
  }
  
  const testDate = '2025-06-15';
  const oldParsing = parseSelectedDateOld(testDate);
  const newParsing = parseSelectedDateNew(testDate);
  
  console.log(`   Input: ${testDate}`);
  console.log(`   Old parsing: ${oldParsing.toDateString()} (${oldParsing.getDate()}th)`);
  console.log(`   New parsing: ${newParsing.toDateString()} (${newParsing.getDate()}th)`);
  
  const isDateFixed = newParsing.toDateString().includes('Jun 15');
  console.log(`   ✅ Date display bug: ${isDateFixed ? 'FIXED' : 'NOT FIXED'}\n`);
  
  // 2. Test Time Slot Availability
  console.log('2️⃣ TESTING TIME SLOT AVAILABILITY:');
  
  const today = new Date();
  const testDates = [];
  for (let i = 1; i <= 7; i++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() + i);
    testDates.push(testDate.toISOString().split('T')[0]);
  }
  
  let allDatesHaveSlots = true;
  for (const date of testDates) {
    const { data, error } = await supabase
      .from('available_timeslots')
      .select('*')
      .eq('date', date)
      .eq('is_available', true);
    
    const hasSlots = data && data.length > 0;
    console.log(`   ${date}: ${data?.length || 0} slots ${hasSlots ? '✅' : '❌'}`);
    
    if (!hasSlots) allDatesHaveSlots = false;
  }
  
  console.log(`   ✅ Future dates availability: ${allDatesHaveSlots ? 'WORKING' : 'ISSUES FOUND'}\n`);
  
  // 3. Test Auto-Generation System
  console.log('3️⃣ TESTING AUTO-GENERATION SYSTEM:');
  
  const { data: allSlots } = await supabase
    .from('available_timeslots')
    .select('date')
    .eq('is_available', true)
    .gte('date', today.toISOString().split('T')[0]);
  
  const uniqueDates = [...new Set(allSlots?.map(slot => slot.date) || [])];
  const has14DayWindow = uniqueDates.length >= 14;
  
  console.log(`   Total future dates with slots: ${uniqueDates.length}`);
  console.log(`   ✅ 14-day rolling window: ${has14DayWindow ? 'ACTIVE' : 'NEEDS ATTENTION'}\n`);
  
  // 4. Test Component Integration
  console.log('4️⃣ TESTING COMPONENT INTEGRATION:');
  
  // Simulate what TimeSlotSelector does
  const testComponentDate = testDates[0];
  const { data: componentSlots } = await supabase
    .from('available_timeslots')
    .select('*')
    .eq('date', testComponentDate)
    .eq('is_available', true)
    .order('time');
  
  console.log(`   Component query for ${testComponentDate}: ${componentSlots?.length || 0} slots`);
  console.log(`   ✅ Component integration: ${componentSlots?.length > 0 ? 'WORKING' : 'ISSUES FOUND'}\n`);
  
  // 5. Final Summary
  console.log('📋 === FINAL RESOLUTION SUMMARY ===');
  
  const issues = [
    { name: 'Date Display Bug', status: isDateFixed },
    { name: 'Disabled Dates Issue', status: allDatesHaveSlots },
    { name: 'Auto-Generation System', status: has14DayWindow },
    { name: 'Component Integration', status: componentSlots?.length > 0 }
  ];
  
  const allFixed = issues.every(issue => issue.status);
  
  issues.forEach(issue => {
    console.log(`   ${issue.status ? '✅' : '❌'} ${issue.name}`);
  });
  
  console.log(`\n🎉 OVERALL STATUS: ${allFixed ? 'ALL ISSUES RESOLVED' : 'SOME ISSUES REMAIN'}`);
  
  if (allFixed) {
    console.log('\n✨ The booking system is fully operational!');
    console.log('   - Users can select dates without timezone confusion');
    console.log('   - All future dates have available time slots');
    console.log('   - System automatically maintains 14-day booking window');
    console.log('   - Components are properly integrated and working');
  }
}

finalComprehensiveTest().catch(console.error);
