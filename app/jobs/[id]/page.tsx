import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Briefcase, DollarSign, Clock, Building, Users, Share2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import SaveJobButton from '@/components/SaveJobButton'
import StarRatingDisplay from '@/components/StarRatingDisplay'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  // TODO: Fetch actual job data
  return {
    title: `Job ${id} - HireLy`,
    description: 'View job details and apply',
  }
}

// Force dynamic rendering to show updated ratings immediately
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { createClient } from '@/lib/supabase/server'

async function getJob(id: string) {
  const supabase = await createClient()
  
  const { data: job, error } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      description,
      requirements,
      location,
      type,
      salary_min,
      salary_max,
      skills,
      status,
      created_at,
      companies!inner (name, logo_url, average_rating, total_ratings)
    `)
    .eq('id', id)
    .single()

  if (error || !job) {
    return null
  }

  // Count applicants
  const { count: applicants } = await supabase
    .from('job_applications')
    .select('*', { count: 'exact', head: true })
    .eq('job_posting_id', id)

  return {
    ...job,
    applicants: applicants || 0,
    // @ts-expect-error - Supabase join types
    company: job.companies?.name || 'Company',
    // @ts-expect-error - Supabase join types
    logo: job.companies?.logo_url,
    // @ts-expect-error - Supabase join types
    rating: job.companies?.average_rating || 0,
    // @ts-expect-error - Supabase join types
    totalRatings: job.companies?.total_ratings || 0,
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  // Check user role
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userRole = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role
  }

  const canApply = userRole === 'jobseeker'

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-5xl mx-auto">
        {/* Job Header */}
        <div className="card p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-8 h-8 text-sky-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <div className="flex items-center gap-4 text-slate-600 mb-2">
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location || 'Not specified'}
                  </span>
                </div>
                {job.rating > 0 && (
                  <StarRatingDisplay 
                    rating={job.rating} 
                    totalRatings={job.totalRatings} 
                    size="sm"
                  />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <SaveJobButton jobId={job.id} />
              <button className="p-3 hover:bg-slate-100 rounded-lg transition-colors">
                <Share2 className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="badge badge-blue">{job.type}</span>
            {job.skills?.map((skill: string) => (
              <span key={skill} className="badge badge-green">
                {skill}
              </span>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Salary</div>
                <div className="font-semibold">
                  {job.salary_min && job.salary_max
                    ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
                    : 'Competitive'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Posted</div>
                <div className="font-semibold">
                  {Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Applicants</div>
                <div className="font-semibold">{job.applicants} candidates</div>
              </div>
            </div>
          </div>

          {canApply ? (
            <Link href={`/jobs/${job.id}/apply`} className="btn-primary w-full block text-center">
              Apply Now
            </Link>
          ) : (
            <div className="text-center p-4 bg-slate-50 rounded-lg text-slate-600">
              {!user ? 'Please log in as a job seeker to apply' : 
               userRole === 'admin' ? 'Admins cannot apply to jobs' :
               userRole === 'employer' ? 'Employers cannot apply to jobs' :
               'Only job seekers can apply to jobs'}
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="card p-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4">Job Description</h2>
            <p className="text-slate-600 mb-6 whitespace-pre-line">{job.description}</p>

            <h3 className="text-xl font-semibold mb-3">Requirements</h3>
            <p className="text-slate-600 whitespace-pre-line">{job.requirements || 'No specific requirements listed.'}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
