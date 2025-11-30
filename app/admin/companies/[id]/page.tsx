import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building, Globe, MapPin, Users, Briefcase, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import StarRatingDisplay from '@/components/StarRatingDisplay'

export const dynamic = 'force-dynamic'

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  // Fetch company details
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !company) {
    notFound()
  }

  // Fetch related statistics
  const [jobsResult, reportsResult, employersResult] = await Promise.all([
    supabase
      .from('job_postings')
      .select('id, title, status, created_at')
      .eq('companies.id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('company_reports')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, full_name, email')
      .eq('company_id', id)
      .eq('role', 'employer')
  ])

  const jobs = jobsResult.data || []
  const reports = reportsResult.data || []
  const employers = employersResult.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/companies" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">Company Details</h1>
          <p className="text-slate-600 mt-1">View and manage company information</p>
        </div>
      </div>

      {/* Company Info Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{company.name}</h2>
              <div className="flex items-center gap-2">
                {company.verified ? (
                  <span className="badge badge-green text-sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                ) : (
                  <span className="badge bg-slate-100 text-slate-700 text-sm">
                    <XCircle className="w-3 h-3 mr-1" />
                    Unverified
                  </span>
                )}
                {reports.length > 0 && (
                  <span className="badge bg-red-100 text-red-700 text-sm">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            {company.industry && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Industry</p>
                <p className="text-slate-900">{company.industry}</p>
              </div>
            )}

            {company.company_size && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Company Size</p>
                <p className="text-slate-900">{company.company_size} employees</p>
              </div>
            )}

            {company.location && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-500 mb-1">Location</p>
                  <p className="text-slate-900">{company.location}</p>
                </div>
              </div>
            )}

            {company.website && (
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-500 mb-1">Website</p>
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              </div>
            )}

            {company.description && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Description</p>
                <p className="text-slate-900 text-sm">{company.description}</p>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Statistics</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-slate-600" />
                  <span className="text-2xl font-bold text-slate-900">{jobs.length}</span>
                </div>
                <p className="text-sm text-slate-600">Job Postings</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span className="text-2xl font-bold text-slate-900">{employers.length}</span>
                </div>
                <p className="text-sm text-slate-600">Employers</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-slate-600" />
                  <span className="text-2xl font-bold text-slate-900">{reports.length}</span>
                </div>
                <p className="text-sm text-slate-600">Reports</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                {company.average_rating ? (
                  <StarRatingDisplay
                    rating={company.average_rating}
                    totalRatings={company.total_ratings || 0}
                    size="sm"
                  />
                ) : (
                  <>
                    <span className="text-2xl font-bold text-slate-900">N/A</span>
                    <p className="text-sm text-slate-600 mt-2">No Ratings</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Created</p>
              <p className="text-slate-900">{new Date(company.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employers */}
      {employers.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Employers ({employers.length})</h3>
          <div className="space-y-2">
            {employers.map((employer) => (
              <div key={employer.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium">{employer.full_name}</p>
                  <p className="text-sm text-slate-600">{employer.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Job Postings */}
      {jobs.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Job Postings ({jobs.length})</h3>
            <Link href="/admin/jobs" className="text-sm text-sky-500 hover:underline">
              View All Jobs
            </Link>
          </div>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-slate-600">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge text-xs ${
                  job.status === 'open' ? 'badge-green' : 'bg-slate-100 text-slate-600'
                }`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      {reports.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Reports ({reports.length})</h3>
            <Link href="/admin/reports" className="text-sm text-sky-500 hover:underline">
              View All Reports
            </Link>
          </div>
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report.id} className="p-3 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{report.reason}</span>
                  <span className={`badge text-xs ${
                    report.status === 'open' ? 'badge-orange' :
                    report.status === 'in_progress' ? 'badge-blue' :
                    report.status === 'closed' ? 'badge-green' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {report.status?.replace('_', ' ')}
                  </span>
                </div>
                {report.details && (
                  <p className="text-sm text-slate-600">{report.details}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  Reported {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
