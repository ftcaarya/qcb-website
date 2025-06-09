# Real-time Setup Guide

## Enable Real-time in Supabase Dashboard

1. **Go to your Supabase project dashboard**
2. **Navigate to Database → Replication**
3. **Enable real-time for these tables:**
   - `available_timeslots`
   - `appointments`
   - `services`

## Alternative: Enable via SQL

Run this in your Supabase SQL Editor:

```sql
-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE available_timeslots;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
```

## Test Real-time Functionality

After enabling, the admin dashboard will automatically update when:
- New appointments are created
- Time slots are modified
- Appointment statuses change

The calendar interface will also update in real-time across multiple browser windows.
