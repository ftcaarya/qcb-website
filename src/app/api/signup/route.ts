import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, phone, service, date, time } = data;

    // Format the data for the Python script
    const bookingData = JSON.stringify({
      name,
      email,
      phone,
      service,
      date,
      time
    });

    // Execute the Python script to add the booking
    const pythonScript = `
import sys
import json
sys.path.append('${process.cwd()}')
from booking_manager import BookingManager

# Parse the booking data
booking_data = json.loads('${bookingData.replace(/'/g, "\\'")}')

# Initialize the booking manager and add the booking
manager = BookingManager()
success, booking_id = manager.add_booking(booking_data)

# Output the result for Node.js to capture
print(json.dumps({
  'success': success,
  'booking_id': booking_id
}))
`;

    const { stdout } = await execAsync(`python3 -c "${pythonScript}"`);
    const result = JSON.parse(stdout.trim());

    if (!result.success) {
      throw new Error('Failed to add booking');
    }

    return NextResponse.json({ 
      success: true, 
      booking_id: result.booking_id 
    });
  } catch (error) {
    console.error('Error processing signup:', error);
    return NextResponse.json({ error: 'Failed to process signup' }, { status: 500 });
  }
} 