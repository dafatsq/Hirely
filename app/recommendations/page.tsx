import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, MapPin, Clock, DollarSign } from 'lucide-react'
import SaveJobButton from '@/components/SaveJobButton'

export default async function RecommendationsPage() {
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
    .select('role, job_seekers(skills)')
    .eq('id', user.id)
    .single()
  
  if (profile?.role === 'employer') {
    redirect('/employer/dashboard')
  }

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  // Fetch user's skills
  // @ts-expect-error - Supabase types might not be updated yet
  const userSkills = profile?.job_seekers?.skills || []

  // Fetch all open jobs
  const { data: allJobs } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      description,
      location,
      type,
      salary_min,
      salary_max,
      skills,
      created_at,
      companies!inner (name, description)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  // Fetch saved jobs
  const { data: savedJobs } = await supabase
    .from('saved_jobs')
    .select('job_posting_id')
    .eq('user_id', user.id)

  const savedJobIds = new Set(savedJobs?.map(j => j.job_posting_id) || [])

  // Calculate match score and sort
  const recommendations = allJobs?.map(job => {
    const jobSkills = job.skills || []
    const matchingSkills = userSkills.filter((skill: string) => 
      jobSkills.some((jSkill: string) => jSkill.toLowerCase() === skill.toLowerCase())
    )
    
    // Calculate match score (0-100)
    let matchScore = 0
    if (jobSkills.length > 0) {
      // Score based on how many of the job's required skills the user has
      matchScore = Math.round((matchingSkills.length / jobSkills.length) * 100)
    } else {
      // If job has no specific skills, give a base score
      matchScore = 50
    }

    // Boost score for users with no skills to show them some variety
    if (userSkills.length === 0) {
      matchScore = 70 
    }

    const companyData = Array.isArray(job.companies) ? job.companies[0] : job.companies
    return {
      ...job,
      company: (companyData as { name: string } | undefined)?.name || 'Company',
      matchScore,
      matchingSkills,
      isSaved: savedJobIds.has(job.id)
    }
  }).sort((a, b) => b.matchScore - a.matchScore) || []

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Recommended Jobs</h1>
          <p className="text-slate-600">
            {userSkills.length > 0 
              ? `Jobs matched to your ${userSkills.length} skill${userSkills.length > 1 ? 's' : ''}`
              : 'Latest job openings - add skills to your profile for better matches'
            }
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="card p-12 text-center">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No jobs available</h3>
            <p className="text-slate-600">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((job) => (
              <div key={job.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-xl font-bold hover:text-sky-500 transition-colors"
                      >
                        {job.title}
                      </Link>
                      {job.matchScore >= 70 && (
                        <span className="badge bg-green-100 text-green-700 text-xs">
                          {job.matchScore}% Match
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 font-medium mb-3">{job.company}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </div>
                      {(job.salary_min || job.salary_max) && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {job.salary_min && job.salary_max
                            ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
                            : job.salary_min
                            ? `From $${(job.salary_min / 1000).toFixed(0)}k`
                            : `Up to $${(job.salary_max / 1000).toFixed(0)}k`
                          }
                        </div>
                      )}
                    </div>

                    {job.matchingSkills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-500 mb-2">Matching skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.matchingSkills.map((skill: string) => (
                            <span
                              key={skill}
                              className="badge bg-sky-100 text-sky-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>
                  
                  <SaveJobButton jobId={job.id} />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-500">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="btn-primary text-sm"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {userSkills.length === 0 && recommendations.length > 0 && (
          <div className="card p-6 mt-6 bg-sky-50 border-sky-200">
            <p className="text-sm text-slate-700">
              💡 <strong>Tip:</strong> Add skills to your profile to get personalized job recommendations.{' '}
              <Link href="/profile/edit" className="text-sky-600 hover:underline font-medium">
                Update Profile
              </Link>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
