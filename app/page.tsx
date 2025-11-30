import Link from 'next/link'
import { Search, MapPin, Briefcase, Users, TrendingUp, Shield, Building, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  let userRole = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    userRole = profile?.role
  }

  if (userRole === 'admin') {
    redirect('/admin')
  }
  
  const isEmployer = userRole === 'employer'

  // Fetch recent jobs for non-employers
  type CompanyRecord = { name: string | null } | null
  type JobPostingRow = {
    id: string
    title: string | null
    location: string | null
    type: string | null
    salary_min: number | null
    salary_max: number | null
    skills: string[] | null
    companies: CompanyRecord | CompanyRecord[]
  }
  type RecentJob = Omit<JobPostingRow, 'companies'> & { companies: CompanyRecord }

  let recentJobs: RecentJob[] = []
  if (!isEmployer) {
    const { data } = await supabase
      .from('job_postings')
      .select(`
        id, 
        title, 
        location, 
        type, 
        salary_min, 
        salary_max, 
        skills,
        companies!inner (name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6)

    const rows = (data || []) as JobPostingRow[]
    recentJobs = rows.map((job) => ({
      ...job,
      companies: job.companies
        ? (Array.isArray(job.companies) ? job.companies[0] : job.companies)
        : null,
    }))
  }

  return (
    <>
      {/* Hero Section */}
      <section className="px-6 md:px-8 mb-12">
        <div className="card max-w-7xl mx-auto p-8 md:p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
            {isEmployer ? 'Find the Perfect Talent' : 'Find Your Dream Job Today'}
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            {isEmployer 
              ? 'Post jobs, manage applications, and hire top talent for your company.'
              : 'Discover thousands of job opportunities with all the information you need. It&apos;s your future.'
            }
          </p>

          {/* Search Bar / CTA */}
          {isEmployer ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/post-job" className="btn-primary">
                <Plus className="w-5 h-5 inline mr-2" />
                Post a New Job
              </Link>
              <Link href="/employer/dashboard" className="btn-secondary">
                <Building className="w-5 h-5 inline mr-2" />
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-3 max-w-4xl mx-auto mb-8">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    className="input pl-12"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="City, state, or remote"
                    className="input pl-12"
                  />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <Link href="/jobs" className="btn-primary whitespace-nowrap">
                  Search Jobs
                </Link>
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-sm text-slate-600">Popular:</span>
                <Link href="/jobs?category=Technology" className="text-sm text-sky-500 hover:underline">
                  Technology
                </Link>
                <span className="text-slate-300">•</span>
                <Link href="/jobs?category=Marketing" className="text-sm text-sky-500 hover:underline">
                  Marketing
                </Link>
                <span className="text-slate-300">•</span>
                <Link href="/jobs?category=Design" className="text-sm text-sky-500 hover:underline">
                  Design
                </Link>
                <span className="text-slate-300">•</span>
                <Link href="/jobs?category=Sales" className="text-sm text-sky-500 hover:underline">
                  Sales
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Stats Section - Only for non-employers */}
      {!isEmployer && (
        <section className="px-6 md:px-8 mb-12">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white p-8 shadow-[0_10px_30px_rgba(14,165,233,0.3)]">
              <Briefcase className="w-12 h-12 mb-4" />
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-sky-100">Active Job Listings</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white p-8 shadow-[0_10px_30px_rgba(14,165,233,0.3)]">
              <Users className="w-12 h-12 mb-4" />
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-sky-100">Registered Users</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white p-8 shadow-[0_10px_30px_rgba(14,165,233,0.3)]">
              <TrendingUp className="w-12 h-12 mb-4" />
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-sky-100">Companies Hiring</div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Jobs Section - Only for non-employers */}
      {!isEmployer && (
        <section className="px-6 md:px-8 mb-12">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold mb-6">Recently Added Jobs</h3>
            {recentJobs.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentJobs.map((job) => (
                    <Link href={`/jobs/${job.id}`} key={job.id} className="job-card p-6 block">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-sky-600" />
                        </div>
                        <span className="badge badge-blue">{job.type || 'Full-time'}</span>
                      </div>
                      <h4 className="font-semibold text-lg mb-2">{job.title}</h4>
                      <p className="text-slate-600 text-sm mb-4">{job.companies?.name || 'Company'}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills?.slice(0, 3).map((skill: string, idx: number) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{job.location}</span>
                        {job.salary_min && job.salary_max && (
                          <span className="font-semibold text-sky-600">
                            ${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link href="/jobs" className="btn-primary inline-block">
                    View All Jobs
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12 card">
                <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No jobs available yet. Check back soon!</p>
                <Link href="/jobs" className="btn-secondary inline-block">
                  Browse All Jobs
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="px-6 md:px-8 mb-12">
        <div className="card max-w-7xl mx-auto p-8 md:p-12">
          <h3 className="text-3xl font-bold text-center mb-12">
            {isEmployer ? 'Why Hire with HireLy?' : 'Why Choose HireLy?'}
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {isEmployer ? (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-sky-600" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Quality Candidates</h4>
                  <p className="text-slate-600 text-sm">
                    Access to thousands of qualified job seekers actively looking for opportunities.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-sky-600" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Easy Management</h4>
                  <p className="text-slate-600 text-sm">
                    Streamlined dashboard to manage job postings and review applications efficiently.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-sky-600" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Verified Platform</h4>
                  <p className="text-slate-600 text-sm">
                    Our verification process ensures quality interactions between employers and candidates.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-sky-600" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Verified Companies</h4>
                  <p className="text-slate-600 text-sm">
                    All companies are verified to protect you from fraud and scams.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-sky-600" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Smart Recommendations</h4>
                  <p className="text-slate-600 text-sm">
                    Get personalized job recommendations based on your profile and preferences.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-sky-600" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Career Support</h4>
                  <p className="text-slate-600 text-sm">
                    Access our AI career assistant and get help with your job search journey.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
