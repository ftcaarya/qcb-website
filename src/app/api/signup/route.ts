import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Cooldown tracking with in-memory storage
// In a production environment, use Redis or a database for persistence across instances
const ipCooldowns = new Map<string, number>();
const COOLDOWN_PERIOD_MS = 10 * 60 * 1000; // 10 minutes cooldown

export async function POST(request: Request) {
  try {
    // Get the IP address from the request
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown-ip';
    
    // Check if this IP is in cooldown
    const lastBookingTime = ipCooldowns.get(ip);
    const currentTime = Date.now();
    
    if (lastBookingTime && (currentTime - lastBookingTime < COOLDOWN_PERIOD_MS)) {
      // Calculate remaining cooldown time in minutes and seconds
      const remainingMs = COOLDOWN_PERIOD_MS - (currentTime - lastBookingTime);
      const remainingMinutes = Math.floor(remainingMs / 60000);
      const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
      
      return NextResponse.json({ 
        error: 'Rate limit exceeded', 
        message: `Please wait ${remainingMinutes} minutes and ${remainingSeconds} seconds before making another booking.`,
        remainingMs
      }, { status: 429 });
    }
    
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

    // Record successful booking time for this IP
    ipCooldowns.set(ip, currentTime);
    
    // Set up automatic cleanup of old cooldown entries
    setTimeout(() => {
      ipCooldowns.delete(ip);
    }, COOLDOWN_PERIOD_MS);

    return NextResponse.json({ 
      success: true, 
      booking_id: result.booking_id 
    });
  } catch (error) {
    console.error('Error processing signup:', error);
    return NextResponse.json({ error: 'Failed to process signup' }, { status: 500 });
  }
} 