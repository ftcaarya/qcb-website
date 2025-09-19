# Manual Cleanup Setup (Vercel Free Plan)

Since Vercel's free plan has limitations on cron jobs, here are alternative ways to keep your database clean:

## 🔧 **Setup Options**

### **Option 1: Use Admin Dashboard (Recommended)**
1. Go to your `/admin` page
2. Scroll to "Appointment Cleanup Manager"
3. Enter your admin key
4. Click "Clean Completed" to remove old appointments
5. **Do this weekly or as needed**

### **Option 2: External Cron Service (Free)**

**Step 1: Set up Environment Variables**
Add to your Vercel environment variables:
```
CRON_SECRET=your-secure-secret-here
```

**Step 2: Use cron-job.org (Free)**
1. Sign up at https://cron-job.org (free)
2. Create a new cron job:
   - **URL:** `https://your-domain.vercel.app/api/auto-cleanup`
   - **Schedule:** Every 6 hours (`0 */6 * * *`)
   - **HTTP Method:** POST
   - **Headers:** `Authorization: Bearer your-cron-secret`

**Step 3: Test the Setup**
```bash
curl -X POST https://your-domain.vercel.app/api/auto-cleanup \
  -H "Authorization: Bearer your-cron-secret"
```

### **Option 3: GitHub Actions (Free)**

Create `.github/workflows/cleanup.yml`:
```yaml
name: Cleanup Old Appointments

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

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
- `SITE_URL`: Your Vercel app URL
- `CRON_SECRET`: Your cleanup secret

### **Option 4: Manual Command (When Needed)**

Run this occasionally to clean up:
```bash
node scripts/cleanup-appointments.js --type=completed
```

## 🏆 **Recommended Approach**

**For most users:** Use **Option 1** (Admin Dashboard) - simple and effective!

**For automation:** Use **Option 2** (cron-job.org) - free external service

## 📊 **How Often to Clean**

- **Weekly:** Use admin dashboard to clean completed appointments
- **Monthly:** Clean old cancelled appointments
- **As needed:** Check the stats and clean if you see too many past appointments

## 🔍 **Check if Cleanup is Needed**

Visit `/admin` and look at the stats:
- If "Past" appointments > 50, it's time to clean
- If "Total" appointments > 200, definitely clean

## ⚠️ **Important Notes**

- The cleanup API endpoints are still available
- All manual cleanup tools still work
- You just won't have automatic Vercel cron jobs
- External services can still trigger cleanup automatically

This approach works great for small-medium volume booking systems!