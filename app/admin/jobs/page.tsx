import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Search, Eye, MapPin, Briefcase, DollarSign } from 'lucide-react'
import JobActions from '@/components/JobActions'

export const dynamic = 'force-dynamic'

type CompanyRecord = {
  id: string
  name: string | null
  verified: boolean | null
} | null

type Job = {
  id: string
  title: string
  description: string | null
  location: string | null
  type: string | null
  salary_min: number | null
  salary_max: number | null
  status: string
  created_at: string
  employer_id: string
  companies: CompanyRecord | CompanyRecord[]
}

interface SearchParams {
  status?: string
  search?: string
}

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = createAdminClient()
  const params = await searchParams

  console.log('Admin Jobs Page - Starting data fetch')

  // Build query
  let query = supabase
    .from('job_postings')
    .select(`
      id,
      title,
      description,
      location,
      type,
      salary_min,
      salary_max,
      status,
      created_at,
      employer_id,
      companies (id, name, verified)
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.ilike('title', `%${params.search}%`)
  }

  console.log('Executing jobs query...')
  const { data: jobs, error } = await query
  console.log('Jobs query result:', { jobsCount: jobs?.length, error })

  const typedJobs = (jobs || []) as Job[]

  // Get stats
  console.log('Fetching stats...')
  const [
    { count: totalJobs },
    { count: activeJobs },
    { count: closedJobs },
    { count: draftJobs },
  ] = await Promise.all([
    supabase.from('job_postings').select('*', { count: 'exact', head: true }),
    supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
  ])
  console.log('Stats:', { totalJobs, activeJobs, closedJobs, draftJobs })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Job Postings</h1>
        <p className="text-slate-600 mt-1">Review and moderate all job postings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-600">Total Jobs</p>
          <p className="text-2xl font-bold text-slate-900">{totalJobs || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeJobs || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-600">Closed</p>
          <p className="text-2xl font-bold text-slate-600">{closedJobs || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-600">Drafts</p>
          <p className="text-2xl font-bold text-orange-600">{draftJobs || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="Search job titles..."
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select name="status" defaultValue={params.status || 'all'} className="input">
              <option value="all">All Statuses</option>
              <option value="open">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary">
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {typedJobs && typedJobs.length > 0 ? (
          typedJobs.map((job) => {
            type CompanyRecord = { id: string; name: string | null; verified: boolean | null } | null
            
            const company = Array.isArray(job.companies) ? job.companies[0] : job.companies as CompanyRecord

            return (
              <div key={job.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-sky-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mt-1">
                          <span className="font-medium">{company?.name || 'Unknown Company'}</span>
                          {company?.verified && (
                            <span className="badge badge-green text-xs">Verified</span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location || 'Remote'}
                          </span>
                          {job.salary_min && job.salary_max && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k
                            </span>
                          )}
                        </div>
                        
                        {job.description && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                            {job.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          {job.type && (
                            <span className="badge badge-blue text-xs">{job.type}</span>
                          )}
                          <span className={`badge text-xs ${
                            job.status === 'open' ? 'badge-green' :
                            job.status === 'closed' ? 'bg-slate-100 text-slate-700' : 'badge-orange'
                          }`}>
                            {job.status === 'open' ? 'Active' : job.status}
                          </span>
                          <span className="text-xs text-slate-500">
                            Posted {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-2">
                          Employer ID: {job.employer_id}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <JobActions jobId={job.id} />
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="card p-12 text-center">
            <p className="text-slate-500">
              {error ? 'Error loading jobs' : 'No jobs found'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
