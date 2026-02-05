# HireLy - Job Board Platform

A modern job board platform built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment**: Vercel
- **Icons**: Lucide React

## Features

- 🔍 **Job Search & Discovery** - Browse and search jobs with filters
- 👤 **User Authentication** - Secure login/register with Supabase Auth
- 📝 **Job Applications** - Apply to jobs and track application status
- 🔖 **Saved Jobs** - Bookmark jobs for later
- 👔 **User Profiles** - Manage professional profile, experience, and skills
- 🤖 **Career Assistant** - AI-powered chatbot for career guidance
- ⭐ **Company Reviews** - Rate and review companies
- 🚨 **Fraud Reporting** - Report suspicious job postings
- ✅ **Company Verification** - Verified company badges
- 📊 **Recommendations** - Personalized job recommendations

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd "Hirely Webapp"
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local`:

```bash
copy .env.example .env.local
```

Update the values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the database migrations (see `supabase/migrations/` folder)
3. Enable Row Level Security (RLS) policies
4. Configure authentication providers in Supabase Dashboard

Key tables to create:
- `users` - User profiles and metadata
- `companies` - Company information
- `job_postings` - Job listings
- `job_applications` - Application tracking
- `saved_jobs` - Bookmarked jobs
- `reviews` - Company reviews
- `fraud_reports` - Reported fraudulent postings
- `recommendations` - Job recommendations
- `chat_sessions` & `chat_messages` - Chatbot data
- `notifications` - User notifications

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login, register)
│   ├── api/               # API routes
│   ├── jobs/              # Job listing and details
│   ├── profile/           # User profile
│   ├── applications/      # Application tracking
│   ├── saved-jobs/        # Saved jobs
│   ├── chatbot/           # Career assistant
│   └── ...
├── components/            # Reusable React components
│   ├── navigation.tsx
│   ├── footer.tsx
│   └── ...
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase client setup
│   └── utils.ts
├── public/               # Static assets
└── ...
```

## Key Pages

- `/` - Homepage with job search
- `/jobs` - Job listings (SSG with ISR)
- `/jobs/[id]` - Job details (SSG with ISR)
- `/login` - Login page
- `/register` - Registration page
- `/profile` - User profile (protected)
- `/applications` - Application tracker (protected)
- `/saved-jobs` - Saved jobs (protected)
- `/chatbot` - Career assistant
- `/post-job` - Post a job (employer only)
- `/rate-company` - Rate companies
- `/report-fraud` - Report fraudulent jobs
- `/verification` - Company verification

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

Vercel will automatically:
- Build and deploy on every push
- Create preview deployments for PRs
- Enable ISR for optimal performance

### Environment Variables

Set these in Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` (for scheduled tasks)

## Features to Implement

The following are marked with `TODO` comments in the code:

1. **Database Integration**: Replace mock data with actual Supabase queries
2. **File Uploads**: Resume uploads via Supabase Storage
3. **Email Notifications**: Integrate Resend or similar service
4. **Search**: Implement PostgreSQL full-text search
5. **Recommendations**: Build recommendation algorithm
6. **Chatbot**: Implement rule-based or AI chatbot
7. **Admin Dashboard**: Add company verification workflow

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
