import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Clean the phone number - remove non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
    }

    // Search for appointments with this phone number
    const appointments = await dbOperations.getAppointmentsByPhone(cleanPhone);
    
    return NextResponse.json({ 
      success: true,
      appointments,
      count: appointments.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search appointments error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
