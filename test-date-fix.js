// Test the date parsing issue
const { format } = require('date-fns');

console.log('🧪 Testing Date Display Issues\n');

// Test the old way (causing the issue)
const testDate = '2025-06-22'; // Sunday, June 22nd
console.log('Test date string:', testDate);

console.log('\n❌ OLD WAY (incorrect):');
const oldWay = new Date(testDate);
console.log('new Date(testDate):', oldWay);
console.log('Day shown:', format(oldWay, 'EEEE, MMMM d'));
console.log('Issue: This shows the day before due to timezone conversion');

console.log('\n✅ NEW WAY (correct):');
const [year, month, day] = testDate.split('-').map(Number);
const newWay = new Date(year, month - 1, day); // month is 0-indexed
console.log('new Date(year, month-1, day):', newWay);
console.log('Day shown:', format(newWay, 'EEEE, MMMM d'));
console.log('✅ This correctly shows the selected date');

console.log('\n🌍 Timezone info:');
console.log('Current timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Current time:', new Date().toISOString());

console.log('\n📋 Summary:');
console.log('The issue was that new Date("2025-06-22") creates a date at midnight UTC,');
console.log('which when converted to local timezone (America/New_York), becomes the previous day.');
console.log('Using new Date(year, month-1, day) creates a local date without timezone conversion.');
