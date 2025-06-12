// Simple test to demonstrate the date parsing fix without external dependencies
console.log('🧪 Testing Date Display Issues\n');

// Test the old way (causing the issue)
const testDate = '2025-06-22'; // Sunday, June 22nd
console.log('Test date string:', testDate);

console.log('\n❌ OLD WAY (incorrect):');
const oldWay = new Date(testDate);
console.log('new Date(testDate):', oldWay.toString());
console.log('Day of week (0=Sun, 6=Sat):', oldWay.getDay());
console.log('Month:', oldWay.getMonth() + 1);
console.log('Date:', oldWay.getDate());

console.log('\n✅ NEW WAY (correct):');
const [year, month, day] = testDate.split('-').map(Number);
const newWay = new Date(year, month - 1, day); // month is 0-indexed
console.log('new Date(year, month-1, day):', newWay.toString());
console.log('Day of week (0=Sun, 6=Sat):', newWay.getDay());
console.log('Month:', newWay.getMonth() + 1);
console.log('Date:', newWay.getDate());

console.log('\n🌍 Timezone info:');
console.log('Current timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Current time:', new Date().toISOString());

console.log('\n📋 Summary:');
console.log('The issue was that new Date("2025-06-22") creates a date at midnight UTC,');
console.log('which when converted to local timezone, becomes the previous day.');
console.log('Using new Date(year, month-1, day) creates a local date without timezone conversion.');

// Test weekday names
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
console.log('\nOld way shows:', weekdays[oldWay.getDay()]);
console.log('New way shows:', weekdays[newWay.getDay()]);
console.log('Expected: Sunday (for 2025-06-22)');
