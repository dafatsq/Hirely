import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Briefcase, Building, Flag, TrendingUp, UserCheck } from 'lucide-react'

type RecentUser = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
}

type CompanyRelation = {
  name: string | null
} | null

type RecentReport = {
  id: string
  reason: string | null
  status: string | null
  created_at: string
  companies: CompanyRelation | CompanyRelation[] | null
}

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = createAdminClient()


  // Fetch statistics
  const [
    { count: totalUsers },
    { count: totalJobs },
    { count: totalCompanies },
    { count: totalApplications },
    { count: pendingReports },
    { count: activeJobs },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('job_postings').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('job_applications').select('*', { count: 'exact', head: true }),
    supabase.from('company_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  // Fetch recent users
  const { data: recentUsers } = await supabase
    .from('users')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch recent reports
  const { data: recentReports } = await supabase
    .from('company_reports')
    .select(`
      id,
      reason,
      status,
      created_at,
      companies (name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const resolvedRecentUsers: RecentUser[] = recentUsers ?? []
  const resolvedRecentReports: RecentReport[] = recentReports ?? []

  const resolveCompanyName = (companies: RecentReport['companies']) => {
    if (!companies) return 'Unknown Company'
    if (Array.isArray(companies)) {
      return companies[0]?.name || 'Unknown Company'
    }
    return companies?.name || 'Unknown Company'
  }

  const stats = [
    {
      label: 'Total Users',
      value: totalUsers || 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Active Jobs',
      value: activeJobs || 0,
      icon: Briefcase,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Companies',
      value: totalCompanies || 0,
      icon: Building,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Total Applications',
      value: totalApplications || 0,
      icon: UserCheck,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Pending Reports',
      value: pendingReports || 0,
      icon: Flag,
      color: 'bg-red-100 text-red-600',
    },
    {
      label: 'Total Jobs',
      value: totalJobs || 0,
      icon: TrendingUp,
      color: 'bg-cyan-100 text-cyan-600',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of platform statistics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Users</h2>
          <div className="space-y-3">
            {resolvedRecentUsers.length > 0 ? (
              resolvedRecentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900">{user.full_name}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                  <span className="badge badge-blue text-xs">{user.role}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No recent users</p>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Reports</h2>
          <div className="space-y-3">
            {resolvedRecentReports.length > 0 ? (
              resolvedRecentReports.map((report) => (
                <div key={report.id} className="py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{resolveCompanyName(report.companies)}</p>
                      <p className="text-sm text-slate-600">{report.reason}</p>
                    </div>
                    <span className={`badge text-xs ${
                      report.status === 'open' ? 'badge-orange' :
                      report.status === 'closed' ? 'badge-green' : 'badge-blue'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No recent reports</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
