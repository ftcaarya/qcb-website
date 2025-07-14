#!/usr/bin/env node

/**
 * Appointment Cleanup Script
 * 
 * This script cleans up old appointments from the database.
 * Can be run manually or scheduled via cron job.
 * 
 * Usage:
 * node scripts/cleanup-appointments.js [options]
 * 
 * Options:
 * --type=completed|past|status    Type of cleanup (default: completed)
 * --hours=N                       Hours old for completed appointments (default: 2)
 * --days=N                        Days old for past appointments (default: 1)
 * --statuses=status1,status2      Comma-separated statuses for status cleanup
 * --dry-run                       Show what would be deleted without actually deleting
 * --stats                         Show appointment statistics
 */

const { dbOperations } = require('../src/lib/supabase');

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key] = value || true;
    }
  });

  const {
    type = 'completed',
    hours = '2',
    days = '1',
    statuses = 'confirmed',
    'dry-run': dryRun = false,
    stats = false
  } = options;

  console.log('🧹 Queen City Blendz - Appointment Cleanup Script');
  console.log('================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Cleanup Type: ${type}`);
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No appointments will be deleted');
  }
  
  console.log();

  try {
    // Show current stats
    if (stats || dryRun) {
      console.log('📊 Current Appointment Statistics:');
      const currentStats = await dbOperations.getAppointmentStats();
      console.log(`  Total appointments: ${currentStats.total}`);
      console.log(`  Pending: ${currentStats.pending}`);
      console.log(`  Confirmed: ${currentStats.confirmed}`);
      console.log(`  Cancelled: ${currentStats.cancelled}`);
      console.log(`  Past appointments: ${currentStats.pastAppointments}`);
      console.log();
      
      if (stats) {
        process.exit(0);
      }
    }

    if (dryRun) {
      console.log('⚠️  In dry-run mode, we cannot show exact deletion count without actually running the query.');
      console.log('   Run without --dry-run to perform actual cleanup.');
      process.exit(0);
    }

    let result;
    
    switch (type) {
      case 'completed':
        console.log(`🕒 Cleaning up completed appointments older than ${hours} hours...`);
        result = await dbOperations.cleanupCompletedAppointments(parseInt(hours));
        break;
      
      case 'past':
        console.log(`📅 Cleaning up past appointments older than ${days} days...`);
        result = await dbOperations.cleanupPastAppointments(parseInt(days));
        break;
      
      case 'status':
        const statusArray = statuses.split(',').map(s => s.trim());
        console.log(`🏷️  Cleaning up appointments with status [${statusArray.join(', ')}] older than ${days} days...`);
        result = await dbOperations.cleanupPastAppointmentsByStatus(parseInt(days), statusArray);
        break;
      
      default:
        console.error('❌ Invalid cleanup type. Use: completed, past, or status');
        process.exit(1);
    }

    console.log(`✅ Cleanup completed successfully!`);
    console.log(`   Deleted ${result.deletedCount} appointment(s)`);
    
    // Show updated stats
    console.log();
    console.log('📊 Updated Appointment Statistics:');
    const updatedStats = await dbOperations.getAppointmentStats();
    console.log(`  Total appointments: ${updatedStats.total}`);
    console.log(`  Pending: ${updatedStats.pending}`);
    console.log(`  Confirmed: ${updatedStats.confirmed}`);
    console.log(`  Cancelled: ${updatedStats.cancelled}`);
    console.log(`  Past appointments: ${updatedStats.pastAppointments}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Queen City Blendz - Appointment Cleanup Script

Usage: node scripts/cleanup-appointments.js [options]

Options:
  --type=completed|past|status    Type of cleanup (default: completed)
  --hours=N                       Hours old for completed appointments (default: 2)
  --days=N                        Days old for past appointments (default: 1)
  --statuses=status1,status2      Comma-separated statuses for status cleanup (default: confirmed)
  --dry-run                       Show what would be deleted without actually deleting
  --stats                         Show appointment statistics only
  --help, -h                      Show this help message

Examples:
  node scripts/cleanup-appointments.js
  node scripts/cleanup-appointments.js --type=completed --hours=4
  node scripts/cleanup-appointments.js --type=past --days=7
  node scripts/cleanup-appointments.js --type=status --statuses=confirmed,cancelled --days=3
  node scripts/cleanup-appointments.js --dry-run --stats
  node scripts/cleanup-appointments.js --stats
  `);
  process.exit(0);
}

main().catch(console.error);
