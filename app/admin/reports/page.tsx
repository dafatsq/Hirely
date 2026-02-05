// Admin Reports Page - Company fraud reports management
import { createAdminClient } from '@/lib/supabase/admin'
import ReportActions from '@/components/ReportActions'

export const dynamic = 'force-dynamic'

type CompanyRecord = { id: string; name: string | null } | null
type ApplicationRecord = { 
  id: string; 
  job_postings: { id: string; title: string | null } | null 
} | null

type Report = {
  id: string
  reason: string
  details: string | null
  status: string | null
  created_at: string
  updated_at: string
  user_id: string
  company_id: string
  application_id: string | null
  companies: CompanyRecord | CompanyRecord[]
  job_applications: ApplicationRecord | ApplicationRecord[]
}

interface SearchParams {
  status?: string
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = createAdminClient()
  const params = await searchParams

  // Build query
  let query = supabase
    .from('company_reports')
    .select(`
      id,
      reason,
      details,
      status,
      created_at,
      updated_at,
      user_id,
      company_id,
      application_id,
      companies (id, name),
      job_applications (
        id,
        job_postings (
          id,
          title
        )
      )
    `)
    .order('created_at', { ascending: false })

  // Apply status filter
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  const { data: reports, error } = await query

  const typedReports = (reports || []) as Report[]

  // Get counts by status
  const [
    { count: pendingCount },
    { count: reviewingCount },
    { count: resolvedCount },
    { count: dismissedCount },
  ] = await Promise.all([
    supabase.from('company_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('company_reports').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('company_reports').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase.from('company_reports').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Company Reports</h1>
        <p className="text-slate-600 mt-1">Review and manage fraud reports submitted by users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-600">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{pendingCount || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-600">Under Review</p>
          <p className="text-2xl font-bold text-blue-600">{reviewingCount || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-600">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{resolvedCount || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-600">Dismissed</p>
          <p className="text-2xl font-bold text-slate-600">{dismissedCount || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <form className="flex gap-4">
          <div className="w-64">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select name="status" defaultValue={params.status || 'all'} className="input">
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary">
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Reports Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Reported By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {typedReports && typedReports.length > 0 ? (
                // Explicitly type the report parameter to avoid TypeScript inference issues
                typedReports.map((report: Report) => {
                  type CompanyRecordLocal = { id: string; name: string | null } | null
                  type ApplicationRecordLocal = { 
                    id: string; 
                    job_postings: { id: string; title: string | null } | null 
                  } | null

                  const company = Array.isArray(report.companies) ? report.companies[0] : report.companies as CompanyRecordLocal
                  const application = Array.isArray(report.job_applications) 
                    ? report.job_applications[0] 
                    : report.job_applications as ApplicationRecordLocal
                  
                  const jobPosting = application?.job_postings 
                    ? (Array.isArray(application.job_postings) ? application.job_postings[0] : application.job_postings)
                    : null

                  return (
                    <tr key={report.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{company?.name || 'Unknown'}</div>
                        {jobPosting && (
                          <div className="text-xs text-slate-500 mt-1">
                            Job: {jobPosting.title}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{report.reason}</div>
                        {report.details && (
                          <div className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                            {report.details}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-500">User ID: {report.user_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge text-xs ${
                          report.status === 'open' ? 'badge-orange' :
                          report.status === 'in_progress' ? 'badge-blue' :
                          report.status === 'closed' ? 'badge-green' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {report.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ReportActions reportId={report.id} currentStatus={report.status || 'open'} />
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    {error ? 'Error loading reports' : 'No reports found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
