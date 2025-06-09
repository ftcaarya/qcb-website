# Queen City Blendz - Calendar-Based Appointment Booking System

A modern appointment booking system with a calendar interface, dynamic time slot management, and real-time updates powered by Supabase.

## 🚀 Features

### Client-Side Booking
- **3-Step Calendar Interface**: Date selection → Time selection → Booking details
- **14-Day Calendar Grid**: Visual date picker with availability indicators
- **Real-time Availability**: Live updates when time slots become unavailable
- **Service Selection**: Multiple services with different durations
- **Mobile Responsive**: Works seamlessly on all devices

### Admin Dashboard
- **Appointment Management**: View, confirm, cancel, and delete appointments
- **Time Slot Management**: Add, edit, disable, and delete individual time slots
- **Bulk Time Slot Generation**: Create multiple slots across date ranges
- **Real-time Updates**: Dashboard updates automatically when changes occur
- **Status Management**: Track appointment status (pending, confirmed, cancelled)

### Technical Features
- **Database-Driven**: Dynamic time slot availability from Supabase
- **Real-time Subscriptions**: Live updates across all connected clients
- **Automated Triggers**: Database functions handle availability updates
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Tailwind CSS with clean, professional design

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **Date Handling**: date-fns
- **Deployment**: Vercel ready

## 📊 Database Schema

The system uses 4 main tables:

1. **`available_timeslots`**: Manages bookable time slots
2. **`appointments`**: Stores customer appointments
3. **`services`**: Defines available services
4. **`business_settings`**: Configurable business parameters

### Key Database Features
- Automated triggers update slot availability when appointments are created/cancelled
- SQL functions for bulk time slot generation
- Real-time subscriptions for live updates
- Proper indexing for performance

## 🔧 Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd qcb-website
npm install
```

### 2. Database Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema in `supabase-schema.sql` in your Supabase SQL editor
3. This will create all tables, triggers, and functions

### 3. Environment Configuration
1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Initial Data Setup
Add some services to get started:
```sql
INSERT INTO services (name, description, duration_minutes, is_active) VALUES
('Basic Haircut', 'Professional haircut and styling', 60, true),
('Color Treatment', 'Hair coloring service', 120, true),
('Wash & Style', 'Hair wash and blow dry', 45, true);
```

### 5. Run the Application
```bash
npm run dev
```

Visit:
- **Main booking page**: http://localhost:3000
- **Admin dashboard**: http://localhost:3000/dashboard

## 📖 Usage Guide

### For Customers
1. **Select Date**: Click on an available date in the calendar
2. **Choose Time**: Pick from available time slots
3. **Book Appointment**: Fill in contact details and service selection
4. **Confirmation**: Receive booking confirmation

### For Admins
1. **View Appointments**: See all bookings with status and details
2. **Manage Status**: Confirm or cancel appointments
3. **Add Time Slots**: Create individual slots or bulk generate
4. **Real-time Updates**: Dashboard updates automatically

## 📁 File Structure

```
src/
├── app/
│   ├── page.tsx                 # Main booking interface
│   ├── dashboard/
│   │   └── page.tsx            # Admin dashboard
│   └── layout.tsx              # App layout
├── components/
│   ├── DateCalendar.tsx        # Calendar grid component
│   ├── TimeSlotSelector.tsx    # Time selection component
│   └── AppointmentForm.tsx     # Final booking form
└── lib/
    ├── supabase.ts             # Database operations
    └── types.ts                # TypeScript definitions
```

## 🔑 Key Components

### DateCalendar.tsx
- 14-day rolling calendar grid
- Availability indicators (available, limited, full)
- Mobile-responsive design
- Real-time availability updates

### TimeSlotSelector.tsx
- Time slot grid for selected date
- Real-time availability checking
- Clean, intuitive interface

### Admin Dashboard
- Tabbed interface (Appointments / Time Slots)
- Bulk operations for time slot management
- Real-time status updates
- Responsive table layouts

## 💾 Database Operations

### Real-time Features
```typescript
// Subscribe to appointment changes
dbOperations.subscribeToAppointments((payload) => {
  // Handle real-time updates
});

// Subscribe to time slot changes
dbOperations.subscribeToTimeSlots((payload) => {
  // Handle availability updates
});
```

### Time Slot Management
```typescript
// Generate bulk time slots
await dbOperations.generateTimeSlots({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  startTime: '09:00',
  endTime: '17:00',
  slotDurationMinutes: 60
});
```

## 🚀 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Environment Variables for Production
```
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

## 🎨 Customization

### Styling
- Modify Tailwind classes in components
- Update `tailwind.config.js` for custom colors/themes
- Component-level styling with CSS modules if needed

### Business Logic
- Adjust calendar range in `DateCalendar.tsx` (currently 14 days)
- Modify time slot durations in admin interface
- Customize appointment form fields in `AppointmentForm.tsx`

### Services
- Add/modify services in Supabase dashboard
- Update pricing information in database
- Customize service descriptions and durations

## 🔧 Troubleshooting

### Common Issues
1. **Database Connection**: Verify Supabase URL and key in `.env.local`
2. **Real-time Updates**: Check Supabase project has realtime enabled
3. **Time Zones**: Ensure consistent timezone handling across client/server
4. **Build Errors**: Run `npm run build` to check for TypeScript errors

### Performance
- Time slots are indexed by date for fast queries
- Real-time subscriptions are optimized for minimal data transfer
- Calendar component uses efficient date calculations

## 📝 License

This project is licensed under the MIT License.

## 💬 Support

For technical support or feature requests, please open an issue in the repository.

---

## 🎯 Project Status

✅ **COMPLETED FEATURES:**
- Calendar-based booking interface with 3-step flow
- Comprehensive Supabase database schema with triggers
- Real-time subscriptions for live updates
- Admin dashboard with time slot management
- Mobile-responsive design
- TypeScript implementation

🔄 **READY FOR TESTING:**
- Full booking flow (requires Supabase connection)
- Admin time slot modifications
- Real-time update synchronization
- Appointment confirmation/cancellation workflows

🚀 **DEPLOYMENT READY:**
- Environment configuration established
- Database schema and functions ready
- Production-ready Next.js build
