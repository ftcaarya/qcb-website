import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/supabase';

/**
 * Automated Cleanup API Route
 * 
 * This endpoint is designed to be called by external cron services like:
 * - Vercel Cron Jobs
 * - GitHub Actions (scheduled)
 * - External cron services (cron-job.org, etc.)
 * 
 * Security: Uses a secret key to prevent unauthorized cleanup
 */

interface CleanupConfig {
  enabled: boolean;
  completedAppointments: {
    enabled: boolean;
    hoursOld: number;
  };
  pastAppointments: {
    enabled: boolean;
    daysOld: number;
  };
  statusBasedCleanup: {
    enabled: boolean;
    daysOld: number;
    statuses: string[];
  };
}

const DEFAULT_CONFIG: CleanupConfig = {
  enabled: true,
  completedAppointments: {
    enabled: true,
    hoursOld: 2, // Clean up appointments 2 hours after they're completed
  },
  pastAppointments: {
    enabled: false, // Disabled by default - use completed appointments instead
    daysOld: 1,
  },
  statusBasedCleanup: {
    enabled: false, // Disabled by default
    daysOld: 7,
    statuses: ['cancelled'],
  },
};

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || process.env.ADMIN_CLEANUP_KEY;
    
    if (!expectedToken) {
      return NextResponse.json({ 
        error: 'Server configuration error: No cleanup secret configured' 
      }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get custom config from request body (optional)
    let config = DEFAULT_CONFIG;
    try {
      const body = await request.json();
      if (body.config) {
        config = { ...DEFAULT_CONFIG, ...body.config };
      }
    } catch {
      // Use default config if no body or invalid JSON
    }

    if (!config.enabled) {
      return NextResponse.json({ 
        message: 'Cleanup is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const results = {
      completedAppointments: { deletedCount: 0, executed: false },
      pastAppointments: { deletedCount: 0, executed: false },
      statusBasedCleanup: { deletedCount: 0, executed: false },
    };

    // Get initial stats
    const initialStats = await dbOperations.getAppointmentStats();

    // 1. Clean up completed appointments
    if (config.completedAppointments.enabled) {
      console.log(`Cleaning up completed appointments older than ${config.completedAppointments.hoursOld} hours`);
      const result = await dbOperations.cleanupCompletedAppointments(config.completedAppointments.hoursOld);
      results.completedAppointments = { ...result, executed: true };
    }

    // 2. Clean up past appointments (if enabled)
    if (config.pastAppointments.enabled) {
      console.log(`Cleaning up past appointments older than ${config.pastAppointments.daysOld} days`);
      const result = await dbOperations.cleanupPastAppointments(config.pastAppointments.daysOld);
      results.pastAppointments = { ...result, executed: true };
    }

    // 3. Status-based cleanup (if enabled)
    if (config.statusBasedCleanup.enabled) {
      console.log(`Cleaning up appointments with statuses [${config.statusBasedCleanup.statuses.join(', ')}] older than ${config.statusBasedCleanup.daysOld} days`);
      const result = await dbOperations.cleanupPastAppointmentsByStatus(
        config.statusBasedCleanup.daysOld, 
        config.statusBasedCleanup.statuses as any
      );
      results.statusBasedCleanup = { ...result, executed: true };
    }

    // Get final stats
    const finalStats = await dbOperations.getAppointmentStats();

    const totalDeleted = results.completedAppointments.deletedCount + 
                        results.pastAppointments.deletedCount + 
                        results.statusBasedCleanup.deletedCount;

    console.log(`Automatic cleanup completed: ${totalDeleted} appointments deleted`);

    return NextResponse.json({
      success: true,
      message: `Automatic cleanup completed: ${totalDeleted} appointments deleted`,
      timestamp: new Date().toISOString(),
      config,
      results,
      stats: {
        before: initialStats,
        after: finalStats,
        totalDeleted
      }
    });

  } catch (error) {
    console.error('Automatic cleanup error:', error);
    return NextResponse.json({
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for checking cleanup status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    const expectedToken = process.env.CRON_SECRET || process.env.ADMIN_CLEANUP_KEY;
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await dbOperations.getAppointmentStats();
    
    return NextResponse.json({
      success: true,
      stats,
      config: DEFAULT_CONFIG,
      timestamp: new Date().toISOString(),
      message: 'Cleanup service is running'
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
