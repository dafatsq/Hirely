import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Building, MapPin, Clock, Eye, Star } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function ApplicationsPage() {
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
  
  if (profile?.role === 'employer') {
    redirect('/employer/dashboard')
  }

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  const { data: applications } = await supabase
    .from('job_applications')
    .select(`
      id,
      status,
      applied_at,
      job_postings!inner (
        id,
        title,
        location,
        company_id,
        companies!inner (id, name)
      )
    `)
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })

  // Get application IDs that have been rated
  const applicationIds = applications?.map(app => app.id) || []
  const { data: ratings } = await supabase
    .from('company_ratings')
    .select('application_id')
    .in('application_id', applicationIds)

  const ratedApplicationIds = new Set(ratings?.map(r => r.application_id) || [])

  type CompanyRecord = { id: string; name: string | null } | null

  type JobPostingRecord = {
    id: string
    title: string | null
    location: string | null
    company_id: string | null
    companies: CompanyRecord | CompanyRecord[]
  }

  const applicationsData = (applications || []).map(app => {
    const rawJobPosting = Array.isArray(app.job_postings)
      ? app.job_postings[0]
      : app.job_postings

    const jobPosting = (rawJobPosting || null) as JobPostingRecord | null

    const companyInfo = jobPosting?.companies
      ? (Array.isArray(jobPosting.companies) ? jobPosting.companies[0] : jobPosting.companies)
      : null

    return {
      id: app.id,
      jobId: jobPosting?.id,
      jobTitle: jobPosting?.title || 'Job',
      company: companyInfo?.name || 'Company',
      companyId: jobPosting?.company_id,
      location: jobPosting?.location || 'Not specified',
      status: app.status as 'pending' | 'under_review' | 'shortlisted' | 'rejected' | 'accepted',
      appliedAt: app.applied_at,
      hasRating: ratedApplicationIds.has(app.id),
    }
  })

  const statusConfig = {
    pending: { label: 'Pending', color: 'badge-blue' },
    under_review: { label: 'Under Review', color: 'badge-orange' },
    shortlisted: { label: 'Shortlisted', color: 'badge-purple' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
    accepted: { label: 'Accepted', color: 'badge-green' },
  }

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Applications</h1>
            <p className="text-slate-600">Track all your job applications in one place</p>
          </div>
          <Link href="/jobs" className="btn-primary">
            Browse Jobs
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="text-2xl font-bold text-sky-600 mb-1">
              {applicationsData.length}
            </div>
            <div className="text-sm text-slate-600">Total Applications</div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {applicationsData.filter((a) => a.status === 'under_review').length}
            </div>
            <div className="text-sm text-slate-600">Under Review</div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {applicationsData.filter((a) => a.status === 'shortlisted').length}
            </div>
            <div className="text-sm text-slate-600">Shortlisted</div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {applicationsData.filter((a) => a.status === 'accepted').length}
            </div>
            <div className="text-sm text-slate-600">Accepted</div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applicationsData.map((app) => (
            <div key={app.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-sky-600" />
                  </div>
                  <div>
                    <Link
                      href={app.jobId ? `/jobs/${app.jobId}` : '#'}
                      className="font-semibold text-lg hover:text-sky-500 transition-colors"
                    >
                      {app.jobTitle}
                    </Link>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {app.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {app.location}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`badge ${statusConfig[app.status].color}`}>
                  {statusConfig[app.status].label}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  Applied{' '}
                  {Math.floor(
                    (Date.now() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
                  )}{' '}
                  days ago
                </div>
                <div className="flex items-center gap-2">
                  {app.status === 'accepted' && (
                    <Link
                      href={`/rate-company/${app.id}`}
                      className="text-sm px-4 py-2 rounded-lg font-medium transition-colors bg-yellow-100 text-yellow-700 hover:bg-yellow-200 flex items-center gap-1"
                    >
                      <Star className="w-4 h-4" />
                      {app.hasRating ? 'Update Rating' : 'Rate Company'}
                    </Link>
                  )}
                  <Link
                    href={`/applications/${app.id}`}
                    className="text-sm text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {applicationsData.length === 0 && (
          <div className="card p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
            <p className="text-slate-600 mb-6">Start applying to jobs to see them here</p>
            <Link href="/jobs" className="btn-primary inline-block">
              Browse Jobs
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
