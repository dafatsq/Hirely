# 🚀 HireLy Quick Reference

## 📦 Installation

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

## 🌐 URLs

| Page | URL | Type |
|------|-----|------|
| Home | `/` | Public (SSG) |
| Jobs | `/jobs` | Public (ISR) |
| Job Detail | `/jobs/[id]` | Public (SSG) |
| Login | `/login` | Public |
| Register | `/register` | Public |
| Profile | `/profile` | Protected |
| Applications | `/applications` | Protected |
| Saved Jobs | `/saved-jobs` | Protected |
| Chatbot | `/chatbot` | Public |
| Recommendations | `/recommendations` | Protected |
| Post Job | `/post-job` | Protected (Employer) |

## 🔐 Environment Variables

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=random-secret
```

### Optional
```env
RESEND_API_KEY=re_xxx
OPENAI_API_KEY=sk-xxx
```

## 🛠️ Commands

```bash
npm run dev    # Start dev server (http://localhost:3000)
npm run build  # Build for production
npm start      # Run production build
npm run lint   # Run ESLint
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with nav/footer |
| `app/page.tsx` | Homepage |
| `components/navigation.tsx` | Navigation bar |
| `components/footer.tsx` | Footer |
| `lib/supabase/server.ts` | Server Supabase client |
| `lib/supabase/client.ts` | Browser Supabase client |
| `middleware.ts` | Auth protection |
| `app/globals.css` | Global styles |

## 🔗 API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs` | GET | Search jobs |
| `/api/applications` | GET, POST | Manage applications |
| `/api/saved-jobs` | POST, DELETE | Save/unsave jobs |
| `/api/auth/logout` | POST | Sign out |
| `/api/cron/refresh-recommendations` | GET | Update recommendations |

## 🎨 Design Tokens

```css
Background: #e9f3ff
Primary: #0ea5e9 (sky-500)
Radius: 20px
Font: Inter
Gradients: radial-gradient (sky/indigo)
```

## 📊 Database Tables

Core tables to create in Supabase:
- `users` - User profiles
- `companies` - Company info
- `job_postings` - Job listings
- `job_applications` - Applications
- `saved_jobs` - Bookmarks
- `reviews` - Company reviews
- `fraud_reports` - Reports
- `recommendations` - Job matches
- `chat_sessions` - Chatbot
- `chat_messages` - Messages
- `notifications` - Alerts

## 🚀 Deploy to Vercel

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial Next.js migration"
git push origin main

# 2. Import in Vercel
# - Go to vercel.com
# - Import repository
# - Add environment variables
# - Deploy!
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| TypeScript errors | Run `npm install` |
| Supabase errors | Check `.env.local` credentials |
| Auth not working | Verify middleware and RLS policies |
| Build fails | Check for TODO comments, add mock returns |
| Port 3000 in use | Use `npm run dev -- -p 3001` |

## 📚 Documentation

- **README.md** - Project overview
- **SETUP_GUIDE.md** - Complete setup
- **MIGRATION_CHECKLIST.md** - Implementation roadmap
- **MIGRATION_SUMMARY.md** - What was done

## 🔥 Hot Tips

1. Use `'use client'` for interactive components
2. Server components can't use hooks
3. Middleware runs on all routes (check config)
4. ISR revalidates every 3600s (1 hour)
5. Protected routes redirect to `/login`
6. RLS policies must match middleware logic

## 📞 Support

- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tailwind: https://tailwindcss.com/docs

---

**Quick Start**: `npm install && npm run dev` 🚀
