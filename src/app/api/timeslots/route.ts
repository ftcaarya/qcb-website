import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const TIME_SLOTS_FILE = path.join(process.cwd(), 'timeslots.json');

// Helper function to read time slots file
async function readTimeSlots() {
  try {
    const data = await fs.readFile(TIME_SLOTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    // If file doesn't exist, return empty object
    return {};
  }
}

// Helper function to write time slots file
async function writeTimeSlots(data: Record<string, string[]>) {
  try {
    await fs.writeFile(TIME_SLOTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing time slots file:', err);
    return false;
  }
}

// GET handler to retrieve time slots
export async function GET() {
  try {
    const timeSlots = await readTimeSlots();
    return NextResponse.json(timeSlots);
  } catch (err) {
    console.error('Error getting time slots:', err);
    return NextResponse.json({ error: 'Failed to get time slots' }, { status: 500 });
  }
}

// POST handler to save time slots
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate data
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    // Write time slots to file
    const success = await writeTimeSlots(data);
    
    if (!success) {
      throw new Error('Failed to write time slots');
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error saving time slots:', err);
    return NextResponse.json({ error: 'Failed to save time slots' }, { status: 500 });
  }
} 