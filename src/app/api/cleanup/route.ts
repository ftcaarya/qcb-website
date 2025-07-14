import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'cleanup-completed',
      daysOld = 1, 
      hoursOld = 2,
      statuses = ['confirmed'],
      adminKey 
    } = body;

    // Simple admin authentication (you should implement proper auth)
    const expectedAdminKey = process.env.ADMIN_CLEANUP_KEY || 'your-secret-key';
    if (adminKey !== expectedAdminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let result;

    switch (action) {
      case 'cleanup-completed':
        result = await dbOperations.cleanupCompletedAppointments(hoursOld);
        break;
      
      case 'cleanup-past':
        result = await dbOperations.cleanupPastAppointments(daysOld);
        break;
      
      case 'cleanup-by-status':
        result = await dbOperations.cleanupPastAppointmentsByStatus(daysOld, statuses);
        break;
      
      case 'stats':
        result = await dbOperations.getAppointmentStats();
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('adminKey');

    // Simple admin authentication
    const expectedAdminKey = process.env.ADMIN_CLEANUP_KEY || 'your-secret-key';
    if (adminKey !== expectedAdminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await dbOperations.getAppointmentStats();
    
    return NextResponse.json({ 
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
