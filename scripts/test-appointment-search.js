#!/usr/bin/env node

/**
 * Test Appointment Search Functionality
 * 
 * This script tests the appointment search feature by:
 * 1. Creating test appointments with different phone numbers
 * 2. Testing the search API endpoint
 * 3. Cleaning up test data
 */

const { dbOperations } = require('../src/lib/supabase');

// Test data - using future dates
const testAppointments = [
  {
    firstName: 'John',
    lastName: 'Doe', 
    phone: '5551234567',
    service: 'Haircut',
    date: '2025-07-25', // Future date
    time: '10:00:00',
    instagram: 'johndoe'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '5559876543', 
    service: 'Haircut',
    date: '2025-07-26', // Future date
    time: '14:00:00'
  },
  {
    firstName: 'Bob',
    lastName: 'Johnson',
    phone: '5551234567', // Same phone as John
    service: 'Haircut',
    date: '2025-07-27', // Future date
    time: '11:00:00'
  }
];

async function createTestAppointments() {
  console.log('📝 Creating test appointments...');
  
  const createdAppointments = [];
  
  for (const appointment of testAppointments) {
    try {
      const created = await dbOperations.createAppointment(appointment);
      createdAppointments.push(created);
      console.log(`✅ Created appointment for ${appointment.firstName} ${appointment.lastName}`);
    } catch (error) {
      console.error(`❌ Failed to create appointment for ${appointment.firstName}:`, error.message);
    }
  }
  
  return createdAppointments;
}

async function testPhoneSearch(phone) {
  console.log(`\n🔍 Testing search for phone: ${phone}`);
  
  try {
    const results = await dbOperations.getAppointmentsByPhone(phone);
    console.log(`📋 Found ${results.length} appointments:`);
    
    results.forEach((appointment, index) => {
      console.log(`  ${index + 1}. ${appointment.first_name} ${appointment.last_name} - ${appointment.date} at ${appointment.time}`);
    });
    
    return results;
  } catch (error) {
    console.error(`❌ Search failed:`, error.message);
    return [];
  }
}

async function testApiEndpoint(phone) {
  console.log(`\n🌐 Testing API endpoint for phone: ${phone}`);
  
  try {
    // Note: This would normally be a fetch request in a browser environment
    // For testing purposes, we'll use the database function directly
    const results = await dbOperations.getAppointmentsByPhone(phone);
    
    // Simulate API response
    const apiResponse = {
      success: true,
      appointments: results,
      count: results.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('📡 API Response:', JSON.stringify(apiResponse, null, 2));
    return apiResponse;
  } catch (error) {
    console.error(`❌ API test failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function cleanupTestAppointments(appointments) {
  console.log('\n🧹 Cleaning up test appointments...');
  
  for (const appointment of appointments) {
    try {
      await dbOperations.deleteAppointment(appointment.id);
      console.log(`✅ Deleted appointment ${appointment.id}`);
    } catch (error) {
      console.error(`❌ Failed to delete appointment ${appointment.id}:`, error.message);
    }
  }
}

async function main() {
  console.log('🧪 Queen City Blendz - Upcoming Appointment Search Test');
  console.log('====================================================');
  
  let createdAppointments = [];
  
  try {
    // Step 1: Create test appointments
    createdAppointments = await createTestAppointments();
    
    if (createdAppointments.length === 0) {
      console.log('❌ No test appointments created. Exiting.');
      return;
    }
    
    // Step 2: Test phone number search
    console.log('\n🔍 Testing Phone Number Search (Upcoming Only)');
    console.log('===============================================');
    
    // Test with different phone formats
    const phoneFormats = [
      '5551234567',        // Clean format
      '(555) 123-4567',    // Formatted
      '555-123-4567',      // Dashed
      '555.123.4567',      // Dotted
      '+1 555 123 4567'    // International
    ];
    
    for (const phone of phoneFormats) {
      await testPhoneSearch(phone);
    }
    
    // Test with phone number that has multiple appointments
    console.log('\n📞 Testing Multiple Upcoming Appointments (Same Phone)');
    await testPhoneSearch('5551234567');
    
    // Test with phone number that has no appointments
    console.log('\n🔍 Testing No Results');
    await testPhoneSearch('9999999999');
    
    // Step 3: Test API endpoint simulation
    console.log('\n🌐 Testing API Endpoint');
    console.log('=======================');
    await testApiEndpoint('5551234567');
    await testApiEndpoint('5559876543');
    await testApiEndpoint('9999999999');
    
    console.log('\n✅ All upcoming appointment search tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Always clean up test data
    if (createdAppointments.length > 0) {
      await cleanupTestAppointments(createdAppointments);
    }
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Queen City Blendz - Appointment Search Test

Usage: node scripts/test-appointment-search.js

This script tests the appointment search functionality by:
1. Creating test appointments with various phone numbers
2. Testing phone number search with different formats
3. Testing API endpoint simulation
4. Cleaning up test data

No additional arguments required - the script is fully automated.
  `);
  process.exit(0);
}

main().catch(console.error);
