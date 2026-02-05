import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bookmark, Building, MapPin, Trash2, Briefcase } from 'lucide-react'
import StarRatingDisplay from '@/components/StarRatingDisplay'

export default async function SavedJobsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is employer - redirect to employer dashboard
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  if (profile?.role === 'employer') {
    redirect('/employer/dashboard')
  }

  // Fetch actual saved jobs from Supabase
  const { data: savedJobs } = await supabase
    .from('saved_jobs')
    .select(`
      id,
      saved_at,
      job_postings!inner (
        id,
        title,
        location,
        type,
        salary_min,
        salary_max,
        skills,
        companies!inner (name, average_rating, total_ratings)
      )
    `)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  type SavedJobRecord = {
    id: string
    saved_at: string
    job_postings: {
      id: string
      title: string | null
      location: string | null
      type: string | null
      salary_min: number | null
      salary_max: number | null
      skills: string[] | null
      companies: {
        name: string | null
        average_rating: number | null
        total_ratings: number | null
      } | null
    } | null
  }

  const savedJobsData = (savedJobs as SavedJobRecord[] | null)?.map(saved => {
    const job = saved.job_postings
    const company = job?.companies

    return {
      id: job?.id,
      title: job?.title || 'Job',
      company: company?.name || 'Company',
      location: job?.location || 'Not specified',
      type: job?.type || 'full-time',
      salary_min: job?.salary_min,
      salary_max: job?.salary_max,
      skills: job?.skills || [],
      savedAt: saved.saved_at,
      rating: company?.average_rating || 0,
      totalRatings: company?.total_ratings || 0,
    }
  }) || []

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Saved Jobs</h1>
            <p className="text-slate-600">Jobs you&apos;ve bookmarked for later</p>
          </div>
          <Link href="/jobs" className="btn-primary">
            Browse Jobs
          </Link>
        </div>

        {savedJobsData.length > 0 ? (
          <div className="space-y-4">
            {savedJobsData.map((job) => (
              <div key={job.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-sky-600" />
                    </div>
                    <div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-semibold text-lg hover:text-sky-500 transition-colors"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                      </div>
                      {job.rating > 0 && (
                        <div className="mt-1">
                          <StarRatingDisplay
                            rating={job.rating}
                            totalRatings={job.totalRatings}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge badge-blue">{job.type}</span>
                  {job.skills.slice(0, 3).map((skill: string) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="font-semibold text-sky-600">
                    {job.salary_min && job.salary_max
                      ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
                      : 'Competitive'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">
                      Saved{' '}
                      {Math.floor(
                        (Date.now() - new Date(job.savedAt).getTime()) / (1000 * 60 * 60 * 24)
                      )}{' '}
                      days ago
                    </span>
                    <Link href={`/jobs/${job.id}`} className="btn-primary text-sm py-2">
                      View Job
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Bookmark className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No saved jobs yet</h3>
            <p className="text-slate-600 mb-6">
              Save jobs you&apos;re interested in to review them later
            </p>
            <Link href="/jobs" className="btn-primary inline-block">
              Browse Jobs
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
