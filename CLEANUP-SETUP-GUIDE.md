# Automated Appointment Cleanup Setup Guide

This guide shows you how to set up automated cleanup of past appointments to keep your database clean and performant.

## Overview

The cleanup system provides three main cleanup strategies:

1. **Completed Appointments** (Recommended): Removes appointments that are 2+ hours past their scheduled time
2. **Past Appointments**: Removes all appointments from previous days
3. **Status-based Cleanup**: Removes appointments with specific statuses (e.g., cancelled) after a certain period

## Manual Cleanup

### Using the Admin Dashboard
1. Go to `/admin` in your browser
2. Scroll down to the "Appointment Cleanup Manager" section
3. Enter your admin key
4. Click "Refresh Stats" to see current appointment statistics
5. Use the cleanup buttons as needed:
   - **Clean Completed**: Safest option, removes finished appointments
   - **Clean Past**: More aggressive, removes all past appointments
   - **Clean Cancelled**: Removes old cancelled appointments

### Using the Command Line Script
```bash
# Show current statistics
node scripts/cleanup-appointments.js --stats

# Clean completed appointments (default)
node scripts/cleanup-appointments.js

# Clean completed appointments older than 4 hours
node scripts/cleanup-appointments.js --type=completed --hours=4

# Clean past appointments older than 7 days
node scripts/cleanup-appointments.js --type=past --days=7

# Clean cancelled appointments older than 3 days
node scripts/cleanup-appointments.js --type=status --statuses=cancelled --days=3

# Dry run to see what would be deleted
node scripts/cleanup-appointments.js --dry-run --type=completed
```

### Using the API Endpoints

#### Manual Cleanup API
```bash
# Clean completed appointments
curl -X POST http://localhost:3000/api/cleanup \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup-completed", "hoursOld": 2, "adminKey": "your-admin-key"}'

# Get appointment statistics
curl "http://localhost:3000/api/cleanup?adminKey=your-admin-key"
```

#### Automated Cleanup API (for cron jobs)
```bash
# Run automated cleanup
curl -X POST http://localhost:3000/api/auto-cleanup \
  -H "Authorization: Bearer your-cron-secret"

# Check cleanup status
curl "http://localhost:3000/api/auto-cleanup?token=your-cron-secret"
```

## Automated Cleanup Setup

### Environment Variables
Add these to your `.env.local` file:

```env
# Admin key for manual cleanup operations
ADMIN_CLEANUP_KEY=your-secure-admin-key-here

# Secret for automated cron cleanup (can be the same as admin key)
CRON_SECRET=your-secure-cron-secret-here
```

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

1. Create `vercel.json` in your project root:
```json
{
  "crons": [
    {
      "path": "/api/auto-cleanup",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

2. Add the cron secret to your Vercel environment variables:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `CRON_SECRET` with your secret value

3. Deploy your project - Vercel will automatically set up the cron job

### Option 2: External Cron Service (cron-job.org, etc.)

1. Sign up for a cron service like cron-job.org
2. Create a new cron job with:
   - URL: `https://your-domain.com/api/auto-cleanup`
   - Schedule: Every 6 hours (or as desired)
   - HTTP Method: POST
   - Headers: `Authorization: Bearer your-cron-secret`

### Option 3: GitHub Actions (for any hosting)

Create `.github/workflows/cleanup.yml`:
```yaml
name: Cleanup Old Appointments

on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch: # Allow manual triggering

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Appointments
        run: |
          curl -X POST ${{ secrets.SITE_URL }}/api/auto-cleanup \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add these secrets to your GitHub repository:
- `SITE_URL`: Your deployed site URL
- `CRON_SECRET`: Your cron secret

### Option 4: Server Cron Job (for VPS/dedicated hosting)

Add to your server's crontab:
```bash
# Edit crontab
crontab -e

# Add this line (runs every 6 hours)
0 */6 * * * curl -X POST https://your-domain.com/api/auto-cleanup -H "Authorization: Bearer your-cron-secret" > /dev/null 2>&1
```

## Recommended Cleanup Schedule

- **Every 6 hours**: Clean completed appointments (removes appointments 2+ hours after completion)
- **Daily**: Clean old cancelled appointments (removes cancelled appointments older than 7 days)
- **Weekly**: Manual review and cleanup if needed

## Monitoring

### Check Cleanup Status
```bash
# Via API
curl "https://your-domain.com/api/auto-cleanup?token=your-cron-secret"

# Via command line
node scripts/cleanup-appointments.js --stats
```

### Admin Dashboard
- Use the cleanup manager in the admin dashboard to monitor appointment statistics
- Check the "Past" appointments count to see how many old appointments need cleaning

## Customizing Cleanup Behavior

You can customize the cleanup behavior by modifying the configuration in `/src/app/api/auto-cleanup/route.ts`:

```typescript
const DEFAULT_CONFIG: CleanupConfig = {
  enabled: true,
  completedAppointments: {
    enabled: true,
    hoursOld: 2, // Change this to adjust when to clean completed appointments
  },
  pastAppointments: {
    enabled: false, // Enable if you want to clean all past appointments
    daysOld: 1,
  },
  statusBasedCleanup: {
    enabled: false, // Enable to clean specific statuses
    daysOld: 7,
    statuses: ['cancelled'],
  },
};
```

## Security Considerations

1. **Keep your admin/cron secrets secure** - don't commit them to version control
2. **Use HTTPS** for all API calls
3. **Consider IP whitelisting** for cron job endpoints if using external services
4. **Monitor cleanup logs** to detect any issues

## Troubleshooting

### Common Issues

1. **"Unauthorized" error**: Check that your admin key or cron secret is correct
2. **No appointments deleted**: Verify there are actually old appointments to clean
3. **Cron job not running**: Check your cron service logs and verify the schedule

### Debug Steps

1. Check current appointment statistics:
   ```bash
   node scripts/cleanup-appointments.js --stats
   ```

2. Test manual cleanup:
   ```bash
   node scripts/cleanup-appointments.js --dry-run
   ```

3. Check API endpoint manually:
   ```bash
   curl "https://your-domain.com/api/auto-cleanup?token=your-cron-secret"
   ```

4. Review server/application logs for any error messages

## Benefits of Regular Cleanup

- **Improved Performance**: Smaller database = faster queries
- **Reduced Storage Costs**: Less data to store and backup
- **Better User Experience**: Admin dashboard loads faster
- **Compliance**: Helps with data retention policies
- **Maintenance**: Easier to manage and troubleshoot

Start with the recommended setup (every 6 hours cleaning completed appointments) and adjust based on your specific needs!
