import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Briefcase, Users, Eye, Plus, Building } from "lucide-react"

export const metadata: Metadata = {
  title: "Employer Dashboard | HireLy",
  description: "Manage your job postings and applicants",
}

export default async function EmployerDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is actually an employer
  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, employers(company_id)")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "employer") {
    redirect("/jobs")
  }

  // If employer doesn't have a company, redirect to register company
  // @ts-expect-error - Supabase types might not be updated yet
  const companyId = Array.isArray(profile?.employers) ? profile.employers[0]?.company_id : profile?.employers?.company_id
  if (!companyId) {
    redirect("/employer/register-company")
  }

  // Fetch company details
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single()

  const isCompanyVerified = company?.verified === true

  // Fetch employer's job postings
  const { data: jobs } = await supabase
    .from("job_postings")
    .select(
      `
      id,
      title,
      location,
      type,
      status,
      created_at,
      companies!inner (name)
    `
    )
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false })

  // Count applicants for each job
  const jobsWithStats = await Promise.all(
    (jobs || []).map(async (job) => {
      const { count } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("job_posting_id", job.id)

      const { count: pendingCount } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("job_posting_id", job.id)
        .eq("status", "pending")

      return {
        ...job,
        applicants: count || 0,
        pendingApplicants: pendingCount || 0,
      }
    })
  )

  const stats = {
    totalJobs: jobsWithStats.length,
    activeJobs: jobsWithStats.filter((j) => j.status === "open").length,
    totalApplicants: jobsWithStats.reduce((sum, j) => sum + j.applicants, 0),
    pendingReview: jobsWithStats.reduce((sum, j) => sum + j.pendingApplicants, 0),
  }

  const statusConfig = {
    open: { label: "Active", color: "badge-green" },
    draft: { label: "Draft", color: "badge-blue" },
    closed: { label: "Closed", color: "bg-slate-100 text-slate-600" },
    archived: { label: "Archived", color: "bg-slate-100 text-slate-500" },
  }

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-7xl mx-auto">
        {/* Company Info & Verification Status */}
        {company && (
          <div className={`border rounded-lg p-4 mb-6 ${
            isCompanyVerified 
              ? 'bg-sky-50 border-sky-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start gap-3">
              <Building className={`w-5 h-5 flex-shrink-0 ${
                isCompanyVerified ? 'text-sky-600' : 'text-amber-600'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isCompanyVerified ? 'text-sky-900' : 'text-amber-900'
                }`}>
                  Company: <strong>{company.name}</strong>
                </p>
                {!isCompanyVerified && (
                  <div className="mt-2 text-sm text-amber-800">
                    <p className="font-semibold mb-1">⚠️ Company Not Verified</p>
                    <p>Your company is pending admin verification. You cannot post jobs until your company is verified. Please contact support if you have any questions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {profile?.full_name || "Employer"}!
            </h1>
            <p className="text-slate-600">Manage your job postings and review applicants</p>
          </div>
          {isCompanyVerified ? (
            <Link href="/post-job" className="btn-primary">
              <Plus className="w-5 h-5 inline mr-2" />
              Post New Job
            </Link>
          ) : (
            <button disabled className="btn-primary opacity-50 cursor-not-allowed" title="Company must be verified to post jobs">
              <Plus className="w-5 h-5 inline mr-2" />
              Post New Job
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-2xl font-bold text-sky-600">{stats.totalJobs}</div>
            </div>
            <div className="text-sm text-slate-600">Total Job Postings</div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.activeJobs}</div>
            </div>
            <div className="text-sm text-slate-600">Active Postings</div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalApplicants}</div>
            </div>
            <div className="text-sm text-slate-600">Total Applicants</div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingReview}</div>
            </div>
            <div className="text-sm text-slate-600">Pending Review</div>
          </div>
        </div>

        {/* Job Postings */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Your Job Postings</h2>

          {jobsWithStats.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No job postings yet</h3>
              <p className="text-slate-600 mb-6">
                Start hiring by posting your first job opening
              </p>
              <Link href="/post-job" className="btn-primary inline-block">
                Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobsWithStats.map((job) => (
                <div key={job.id} className="border border-slate-200 rounded-xl p-4 sm:p-6 hover:border-sky-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold">{job.title}</h3>
                        <span
                          className={`badge text-xs ${
                            statusConfig[job.status as keyof typeof statusConfig]?.color
                          }`}
                        >
                          {statusConfig[job.status as keyof typeof statusConfig]?.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                          {company?.name || "Your Company"}
                        </span>
                        <span>{job.location || "Remote"}</span>
                        <span className="badge badge-blue text-xs">{job.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100 gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                      <div>
                        <span className="text-slate-500">Total: </span>
                        <span className="font-semibold text-purple-600">{job.applicants}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Pending: </span>
                        <span className="font-semibold text-orange-600">
                          {job.pendingApplicants}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        href={`/employer/jobs/${job.id}/applicants`}
                        className="btn-primary text-xs sm:text-sm w-full sm:w-auto justify-center"
                      >
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                        View Applicants ({job.applicants})
                      </Link>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="btn-secondary text-xs sm:text-sm w-full sm:w-auto justify-center"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                        View Posting
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
