import { Metadata } from 'next'
import Link from 'next/link'
import { Briefcase, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SaveJobButton from '@/components/SaveJobButton'
import JobSearchForm from '@/components/JobSearchForm'
import JobFilters from '@/components/JobFilters'
import StarRatingDisplay from '@/components/StarRatingDisplay'

export const metadata: Metadata = {
  title: 'Find Jobs - HireLy',
  description: 'Browse thousands of job opportunities from verified companies',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const JOBS_PER_PAGE = 20

type FilterParams = {
  type?: string[]
  minSalary?: number
  daysAgo?: number
}

async function getJobs(page: number = 1, query?: string, location?: string, filters?: FilterParams) {
  const supabase = await createClient()

  const normalizedPage = Math.max(1, page)
  const from = (normalizedPage - 1) * JOBS_PER_PAGE
  const to = from + JOBS_PER_PAGE - 1

  let queryBuilder = supabase
    .from('job_postings')
    .select(
      `
        id,
        title,
        description,
        location,
        type,
        salary_min,
        salary_max,
        skills,
        status,
        created_at,
        companies!inner (name, average_rating, total_ratings)
      `,
      { count: 'exact' }
    )
    .eq('status', 'open')

  // Search by job title, description, or company name
  if (query) {
    const sanitizedQuery = query.replace(/,/g, ' ').trim()
    if (sanitizedQuery) {
      // First find companies matching the query to include them in the OR filter
      // This is a workaround because PostgREST doesn't support top-level OR with foreign tables easily
      const { data: matchingCompanies } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', `%${sanitizedQuery}%`)
        .limit(50)

      const companyIds = matchingCompanies?.map(c => c.id) || []
      
      let orCondition = `title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`
      
      if (companyIds.length > 0) {
        orCondition += `,company_id.in.(${companyIds.join(',')})`
      }

      // Add skills search using the computed column
      orCondition += `,skills_text.ilike.%${sanitizedQuery}%`
      
      queryBuilder = queryBuilder.or(orCondition)
    }
  }

  // Filter by location
  if (location) {
    queryBuilder = queryBuilder.ilike('location', `%${location}%`)
  }

  // Apply additional filters
  if (filters?.type && filters.type.length > 0) {
    queryBuilder = queryBuilder.in('type', filters.type)
  }

  if (filters?.minSalary) {
    queryBuilder = queryBuilder.gte('salary_max', filters.minSalary)
  }

  if (filters?.daysAgo) {
    const date = new Date()
    date.setDate(date.getDate() - filters.daysAgo)
    queryBuilder = queryBuilder.gte('created_at', date.toISOString())
  }

  const { data: jobs, error, count } = await queryBuilder
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching jobs:', error)
    return { jobs: [], total: 0, totalPages: 0 }
  }

  const total = count ?? 0
  const totalPages = total > 0 ? Math.ceil(total / JOBS_PER_PAGE) : 0

  console.log('[jobs] page', normalizedPage, 'items', jobs?.length || 0, 'of', total, 'query:', query, 'location:', location)

  return {
    jobs: jobs || [],
    total,
    totalPages,
  }
}

type Props = {
  searchParams: Promise<{ 
    page?: string; 
    q?: string; 
    location?: string;
    type?: string;
    min_salary?: string;
    days_ago?: string;
  }>
}

export default async function JobsPage({ searchParams }: Props) {
  const supabase = await createClient()
  
  // Check if user is employer - redirect to employer dashboard
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role === 'employer') {
      redirect('/employer/dashboard')
    }
  }
  
  const params = await searchParams
  const requestedPage = Number(params.page) || 1
  const safePage = Math.max(1, requestedPage)
  const query = params.q
  const location = params.location
  
  const filters: FilterParams = {
    type: params.type?.split(','),
    minSalary: params.min_salary ? Number(params.min_salary) : undefined,
    daysAgo: params.days_ago ? Number(params.days_ago) : undefined,
  }

  let { jobs, total, totalPages } = await getJobs(safePage, query, location, filters)
  const currentPage = totalPages > 0 ? Math.min(safePage, totalPages) : 1

  if (currentPage !== safePage) {
    const fallback = await getJobs(currentPage, query, location, filters)
    jobs = fallback.jobs
    total = fallback.total
    totalPages = fallback.totalPages
  }

  // Build query params for pagination links
  const buildPageUrl = (page: number) => {
    const urlParams = new URLSearchParams()
    if (query) urlParams.set('q', query)
    if (location) urlParams.set('location', location)
    if (params.type) urlParams.set('type', params.type)
    if (params.min_salary) urlParams.set('min_salary', params.min_salary)
    if (params.days_ago) urlParams.set('days_ago', params.days_ago)
    urlParams.set('page', page.toString())
    return `/jobs?${urlParams.toString()}`
  }

  return (
    <>
      {/* Search & Filter Section */}
      <section className="px-6 md:px-8 mb-8">
        <div className="card max-w-7xl mx-auto p-6">
          <JobSearchForm />
        </div>
      </section>

      {/* Jobs Listing */}
      <section className="px-6 md:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{total} Jobs Found</h1>
            <JobFilters />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="job-card p-6">
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
                      <p className="text-slate-600 text-sm">
                        {Array.isArray(job.companies) 
                          ? job.companies[0]?.name || 'Company'
                          : (job.companies as { name: string } | undefined)?.name || 'Company'
                        }
                      </p>
                      {/* @ts-expect-error - Supabase join types */}
                      {job.companies?.average_rating > 0 && (
                        <div className="mt-1">
                          <StarRatingDisplay 
                            // @ts-expect-error - Supabase join types
                            rating={job.companies.average_rating} 
                            // @ts-expect-error - Supabase join types
                            totalRatings={job.companies.total_ratings} 
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <SaveJobButton jobId={job.id} />
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge badge-blue">{job.type}</span>
                  {job.skills?.slice(0, 3).map((skill: string) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location || 'Not specified'}
                  </span>
                  <span className="font-semibold text-sky-600">
                    {job.salary_min && job.salary_max
                      ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
                      : 'Competitive'}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Posted {Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </span>
                    <Link href={`/jobs/${job.id}`} className="text-sm text-sky-500 hover:underline">
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Link
                href={buildPageUrl(currentPage - 1)}
                className={`px-4 py-2 rounded-lg border border-slate-200 transition-colors ${
                  currentPage <= 1
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : 'hover:bg-slate-50'
                }`}
              >
                Previous
              </Link>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Link
                    key={pageNum}
                    href={buildPageUrl(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-sky-500 text-white'
                        : 'border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              })}
              
              <Link
                href={buildPageUrl(currentPage + 1)}
                className={`px-4 py-2 rounded-lg border border-slate-200 transition-colors ${
                  currentPage >= totalPages
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : 'hover:bg-slate-50'
                }`}
              >
                Next
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
