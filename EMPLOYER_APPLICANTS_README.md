# Employer Applicants Feature

## What Was Built

Full employer applicant management system allowing employers to view, review, and manage job applications.

## Files Created/Modified

### Database Migration
- `migrations/extend-job-applications.sql` - Adds columns for portfolio, LinkedIn, salary, start date, screening answers; creates RLS policies for employer access; sets up resume storage bucket

### Application Form (Job Seeker Side)
- `app/jobs/[id]/apply/ApplyForm.tsx` - Updated to upload resumes to Supabase Storage and persist full application data

### Employer Dashboard
- `app/employer/jobs/[id]/applicants/page.tsx` - Server component that verifies employer ownership
- `app/employer/jobs/[id]/applicants/ApplicantsClient.tsx` - Client component with search, filters, and applicant list
- `app/employer/jobs/[id]/applicants/ApplicantDetail.tsx` - Modal showing full application details with status management

### API Routes
- `app/api/employer/jobs/[id]/applicants/route.ts` - GET to fetch applicants, PATCH to update status

## Setup Instructions

### 1. Run Database Migration

Open Supabase SQL Editor and run:
```sql
-- Copy and paste contents of migrations/extend-job-applications.sql
```

This will:
- Add new columns to `job_applications` table
- Create RLS policies for employer access
- Set up resume storage bucket with proper permissions

### 2. Test the Flow

**As a Job Seeker:**
1. Navigate to any job posting
2. Click "Apply Now"
3. Fill out the application form
4. Upload resume
5. Answer screening questions
6. Submit application

**As an Employer:**
1. Navigate to `/employer/jobs/{job_id}/applicants`
2. View all applicants
3. Use search/filter to narrow down
4. Click "View Details" on any applicant
5. Review resume, cover letter, screening answers
6. Download resume
7. Change application status

## Key Features

### Job Seeker Features
- ✅ Resume upload to Supabase Storage
- ✅ Cover letter text input
- ✅ Portfolio and LinkedIn URLs
- ✅ Expected salary input
- ✅ Start date selection
- ✅ Dynamic screening questions
- ✅ Form validation
- ✅ Duplicate application prevention

### Employer Features
- ✅ View all applicants for owned jobs
- ✅ Search by name/email
- ✅ Filter by application status
- ✅ Stats dashboard (total, pending, reviewing, shortlisted, accepted)
- ✅ View full application details
- ✅ Download applicant resumes
- ✅ Update application status
- ✅ Access control (only job owner can view)

## Security

- ✅ Row Level Security on `job_applications`
- ✅ Employers can only view applications for jobs they posted
- ✅ Resume storage bucket restricts access:
  - Job seekers can upload/view their own resumes
  - Employers can view resumes of applicants to their jobs
- ✅ Server-side verification of job ownership
- ✅ Protected API routes

## Status Workflow

Applications can be in one of 5 states:
1. **Pending** - Initial state after submission
2. **Under Review** - Employer is reviewing
3. **Shortlisted** - Candidate moved to next round
4. **Rejected** - Application declined
5. **Accepted** - Candidate hired

## Next Steps (Optional Enhancements)

- Add email notifications when status changes
- Bulk status updates
- Export applicants to CSV
- Applicant notes/comments
- Interview scheduling
- Candidate comparison view
- Resume parsing/extraction
- Application analytics

## Notes

- Resumes are stored in Supabase Storage at `resumes/{user_id}/{timestamp}_{filename}`
- Screening answers stored as JSONB array
- All timestamps in UTC
- Status changes trigger `updated_at` timestamp
