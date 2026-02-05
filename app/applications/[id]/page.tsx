import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import StarRatingDisplay from '@/components/StarRatingDisplay'
import { Building, MapPin, Clock, Briefcase, Star, Flag, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('job_applications')
    .select(`
      id,
      user_id,
      status,
      applied_at,
      cover_letter,
      notes,
      resume_url,
      job_postings!inner (
        id,
        title,
        description,
        location,
        type,
        salary_min,
        salary_max,
        companies!inner (id, name, average_rating, total_ratings)
      )
    `)
    .eq('id', id)

  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  const { data: application, error } = await query.single()

  if (error || !application) {
    notFound()
  }

  type CompanyRecord = {
    id: string
    name: string | null
    average_rating: number | null
    total_ratings: number | null
  } | null

  type JobPostingRecord = {
    id: string
    title: string | null
    description: string | null
    location: string | null
    type: string | null
    salary_min: number | null
    salary_max: number | null
    companies: CompanyRecord | CompanyRecord[]
  }

  const rawJob = Array.isArray(application.job_postings)
    ? application.job_postings[0]
    : application.job_postings

  const job = (rawJob || null) as JobPostingRecord | null

  const company = job?.companies
    ? (Array.isArray(job.companies) ? job.companies[0] : job.companies)
    : null

  const isOwner = application.user_id === user.id

  let existingReport: {
    id: string
    status: string | null
    reason: string | null
    updated_at: string | null
  } | null = null
  if (isOwner) {
    const { data } = await supabase
      .from('company_reports')
      .select('id, status, reason, updated_at')
      .eq('application_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    existingReport = data
  }

  const canRate = isOwner

  // Generate a short-lived signed URL so owners/admins can open private resumes
  let resumeLink: string | null = null
  if (application.resume_url && (isOwner || isAdmin)) {
    try {
      const adminSupabase = createAdminClient()
      const { data: adminSignedUrl, error: adminError } = await adminSupabase.storage
        .from('resumes')
        .createSignedUrl(application.resume_url, 600)

      if (adminSignedUrl?.signedUrl) {
        resumeLink = adminSignedUrl.signedUrl
      } else if (adminError) {
        console.error('Failed to create resume download URL', adminError)
      }
    } catch (adminError) {
      console.error('Failed to create resume download URL', adminError)
    }
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'badge-blue' },
    under_review: { label: 'Under Review', color: 'badge-orange' },
    shortlisted: { label: 'Shortlisted', color: 'badge-purple' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
    accepted: { label: 'Accepted', color: 'badge-green' },
  }

  const statusBadge = statusConfig[application.status] || {
    label: application.status,
    color: 'badge-blue',
  }

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card p-8">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-sky-100 flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-sky-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{job?.title || 'Job'}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {company?.name || 'Company'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job?.location || 'Not specified'}
                  </span>
                </div>
                {company?.average_rating ? (
                  <div className="mt-2">
                    <StarRatingDisplay
                      rating={company.average_rating}
                      totalRatings={company.total_ratings || 0}
                      size="sm"
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <span className={`badge ${statusBadge.color}`}>{statusBadge.label}</span>
              <div className="text-sm text-slate-500 mt-2 flex items-center gap-1 justify-end">
                <Clock className="w-4 h-4" />
                Applied{' '}
                {Math.floor(
                  (Date.now() - new Date(application.applied_at).getTime()) / (1000 * 60 * 60 * 24)
                )}{' '}
                days ago
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {job?.type && <span className="badge badge-blue">{job.type}</span>}
            {job?.salary_min && job.salary_max ? (
              <span className="badge badge-green">
                {`$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`}
              </span>
            ) : (
              <span className="badge badge-green">Competitive salary</span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {isOwner && canRate && (
              <Link
                href={`/rate-company/${application.id}`}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Star className="w-4 h-4" />
                Rate Company
              </Link>
            )}
            {isOwner && (
              <Link
                href={`/report-company/${application.id}`}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Flag className="w-4 h-4" />
                {existingReport ? 'Update Report' : 'Report Company'}
              </Link>
            )}
          </div>

          {existingReport && (
            <div className="mt-4 text-sm text-slate-600 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <p className="font-semibold">Report status: {existingReport.status}</p>
              <p>Reason: {existingReport.reason}</p>
              <p>
                Last updated:{' '}
                {existingReport.updated_at
                  ? new Date(existingReport.updated_at).toLocaleString()
                  : 'Just now'}
              </p>
            </div>
          )}
        </div>

        <div className="card p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Job Description</h2>
            <p className="text-slate-600 whitespace-pre-line">
              {job?.description || 'No description provided.'}
            </p>
          </div>

          {application.cover_letter && (
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Your Cover Letter
              </h3>
              <p className="text-slate-600 whitespace-pre-line">{application.cover_letter}</p>
            </div>
          )}

          {application.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <p className="text-slate-600 whitespace-pre-line">{application.notes}</p>
            </div>
          )}

          {resumeLink && (
            <div>
              <a
                href={resumeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:underline"
              >
                View submitted resume
              </a>
            </div>
          )}

          <div>
            <Link href="/applications" className="btn-secondary">
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
