import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ReportCompanyClient from './ReportCompanyClient'
import { Building, MapPin, ArrowLeftCircle } from 'lucide-react'
import StarRatingDisplay from '@/components/StarRatingDisplay'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface PageProps {
  params: Promise<{ applicationId: string }>
}

export default async function ReportCompanyPage({ params }: PageProps) {
  const supabase = await createClient()
  const { applicationId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: application, error } = await supabase
    .from('job_applications')
    .select(`
      id,
      status,
      job_postings!inner (
        id,
        title,
        companies!inner (id, name, average_rating, total_ratings),
        location
      )
    `)
    .eq('id', applicationId)
    .eq('user_id', user.id)
    .single()

  if (error || !application) {
    redirect('/applications')
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
    location: string | null
    companies: CompanyRecord | CompanyRecord[]
  }

  const rawJob = Array.isArray(application.job_postings)
    ? application.job_postings[0]
    : application.job_postings

  const job = (rawJob || null) as JobPostingRecord | null

  const company = job?.companies
    ? (Array.isArray(job.companies) ? job.companies[0] : job.companies)
    : null

  if (!job || !company?.id) {
    redirect('/applications')
  }

  const { data: existingReport } = await supabase
    .from('company_reports')
    .select('*')
    .eq('application_id', applicationId)
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href={`/applications/${applicationId}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-500 transition-colors font-medium"
        >
          <ArrowLeftCircle className="w-5 h-5" />
          Back to application details
        </Link>

        <div className="card p-8">
          <div className="flex gap-4 items-start">
            <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center">
              <Building className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Reporting</p>
              <h1 className="text-2xl font-bold">{company?.name || 'Company'}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
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
              <p className="text-sm text-slate-500 mt-2">Position: {job?.title || 'Job'}</p>
            </div>
          </div>
        </div>

        <ReportCompanyClient
          applicationId={applicationId}
          companyId={company.id}
          companyName={company.name || 'Company'}
          jobTitle={job.title || 'Job'}
          existingReport={existingReport}
        />
      </div>
    </section>
  )
}
