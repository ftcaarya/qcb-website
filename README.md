# Queen City Blendz Booking System

A modern appointment booking system for Queen City Blendz hair cutting and nail services.

## Features

- 📅 Interactive calendar-based appointment booking
- ⏰ Customizable time slots managed by admin
- 📱 Mobile-friendly responsive design
- 📨 Email notifications for new appointments
- 👨‍💼 Admin dashboard for managing bookings and availability

## Repository Structure & Deployment

This project is set up to support deployment with separate domains for client and admin sites using Vercel's branch-based deployments.

### Branches

- `main` - The primary branch containing the client-facing booking site
- `admin` - The admin branch containing both client site and admin functionality

### Vercel Deployment

1. Push your code to GitHub in a new repository
2. Connect your repository to Vercel
3. Set up the following deployments:

#### Client Site (main branch)
- Branch: `main`
- Production Domain: `your-domain.com` or `booking.queencityblendz.com`
- Build Command: `npm run build`
- Output Directory: `.next`

#### Admin Site (admin branch)
- Branch: `admin`
- Production Domain: `admin.your-domain.com` or `admin.queencityblendz.com`
- Build Command: `npm run build`
- Output Directory: `.next`

### Environment Variables

In Vercel, set up the following environment variables for both deployments:
- `PYTHON_PATH` - Path to Python executable (if required)

## Local Development

### Prerequisites

- Node.js 16+
- Python 3.6+

### Setup

1. Clone the repository
```
git clone https://github.com/yourusername/qcb-website.git
cd qcb-website
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm run dev
```

4. To use a different port (if 3000 is occupied)
```
npm run dev -- -p 3001
```

## Branch Management

### Creating the admin branch

```bash
# Start from main branch
git checkout main

# Create and switch to admin branch
git checkout -b admin

# Push the admin branch to remote
git push -u origin admin
```

### Working on branches

```bash
# Switch to main branch (client site)
git checkout main

# Make changes for client site
# ... edit files ...
git add .
git commit -m "Update client site"
git push origin main

# Switch to admin branch
git checkout admin

# Make changes for admin site
# ... edit files ...
git add .
git commit -m "Update admin site"
git push origin admin
```

### Syncing changes from main to admin

To update the admin branch with changes from main:

```bash
git checkout admin
git merge main
# Resolve any conflicts
git push origin admin
```

## Project Structure

- `/src/app/page.tsx` - Client-facing booking page
- `/src/app/admin/page.tsx` - Admin dashboard (only accessible via admin deployment)
- `/src/app/api/signup/route.ts` - API endpoint for booking appointments
- `/src/app/api/timeslots/route.ts` - API endpoint for managing available time slots
- `/booking_manager.py` - Python script for handling booking storage and email notifications

## Note on Security

The admin dashboard is protected by using a separate branch and domain. For additional security, consider implementing:

1. Authentication for the admin dashboard
2. API route protection
3. Environment variables for sensitive information
