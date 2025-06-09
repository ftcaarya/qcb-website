# Deployment Checklist

## Pre-deployment Setup

### 1. Supabase Database Setup
- [ ] Create Supabase project at supabase.com
- [ ] Run the complete SQL schema from `supabase-schema.sql`
- [ ] Verify all tables are created: `available_timeslots`, `appointments`, `services`, `business_settings`
- [ ] Test database functions: `generate_time_slots`, `update_slot_availability`
- [ ] Enable Realtime for tables in Supabase dashboard

### 2. Environment Variables
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Update `NEXT_PUBLIC_SUPABASE_URL` with your project URL
- [ ] Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your anon key
- [ ] Test database connection locally

### 3. Initial Data
- [ ] Add services via SQL or Supabase dashboard:
```sql
INSERT INTO services (name, description, duration_minutes, is_active) VALUES
('Basic Haircut', 'Professional haircut and styling', 60, true),
('Color Treatment', 'Hair coloring service', 120, true),
('Wash & Style', 'Hair wash and blow dry', 45, true);
```
- [ ] Generate initial time slots via admin dashboard

### 4. Local Testing
- [ ] Test booking flow: Date → Time → Appointment form
- [ ] Test admin dashboard: View appointments, manage time slots
- [ ] Test real-time updates: Open two browser windows, make changes
- [ ] Verify mobile responsiveness

## Deployment Steps (Vercel)

### 1. Repository Setup
- [ ] Push code to GitHub repository
- [ ] Verify all files are committed

### 2. Vercel Configuration
- [ ] Create new project in Vercel
- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `.next`

### 3. Environment Variables in Vercel
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deploy and test

### 4. Post-deployment Testing
- [ ] Test booking flow on production URL
- [ ] Test admin dashboard on production URL
- [ ] Verify real-time updates work
- [ ] Test mobile functionality
- [ ] Check database connections

## Security Considerations

### 1. Supabase Security
- [ ] Review Row Level Security (RLS) policies
- [ ] Ensure anon key permissions are appropriate
- [ ] Consider service key for admin operations

### 2. Admin Access
- [ ] Consider authentication for admin dashboard
- [ ] Implement admin-only routes if needed
- [ ] Secure environment variables

### 3. Rate Limiting
- [ ] Monitor API usage in Supabase
- [ ] Consider implementing rate limiting for booking endpoints

## Monitoring & Maintenance

### 1. Performance
- [ ] Monitor Supabase usage and performance
- [ ] Check real-time subscription limits
- [ ] Optimize queries if needed

### 2. Data Management
- [ ] Regular backup of appointment data
- [ ] Clean up old time slots periodically
- [ ] Monitor database storage usage

### 3. User Experience
- [ ] Monitor booking completion rates
- [ ] Test across different devices/browsers
- [ ] Gather user feedback

## Troubleshooting Common Issues

### Database Connection Issues
1. Verify environment variables are set correctly
2. Check Supabase project is active
3. Confirm anon key has correct permissions

### Real-time Not Working
1. Enable Realtime in Supabase dashboard
2. Check subscription code in components
3. Verify network/firewall settings

### Time Zone Issues
1. Ensure consistent timezone handling
2. Consider user timezone detection
3. Test across different time zones

### Build Failures
1. Run `npm run build` locally first
2. Check TypeScript errors
3. Verify all dependencies are installed

## Success Criteria

- [ ] Users can successfully book appointments
- [ ] Admins can manage time slots and appointments
- [ ] Real-time updates work across all connected clients
- [ ] Mobile experience is smooth and responsive
- [ ] Database operations are fast and reliable
- [ ] No critical console errors or warnings
