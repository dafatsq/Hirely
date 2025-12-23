import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Search, Eye, Building } from 'lucide-react'
import StarRatingDisplay from '@/components/StarRatingDisplay'
import CompanyActions from '@/components/CompanyActions'

export const dynamic = 'force-dynamic'

interface SearchParams {
  search?: string
  sort?: string
}

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = createAdminClient()
  const params = await searchParams

  // Build query
  let query = supabase
    .from('companies')
    .select(`
      id,
      name,
      description,
      website,
      location,
      industry,
      average_rating,
      total_ratings,
      verified,
      created_at
    `)

  // Apply search filter
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }

  // Apply sorting
  if (params.sort === 'rating') {
    query = query.order('average_rating', { ascending: false, nullsFirst: false })
  } else if (params.sort === 'reports') {
    // We'll handle this differently since we need to join
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: companies, error } = await query

  // Get report counts for each company
  type Company = {
    id: string
    name: string | null
    description: string | null
    website: string | null
    location: string | null
    industry: string | null
    average_rating: number | null
    total_ratings: number | null
    verified: boolean | null
    created_at: string
  }

  type CompanyWithReports = Company & { report_count: number }

  const companiesWithReports: CompanyWithReports[] = companies ? await Promise.all(
    companies.map(async (company: Company) => {
      const { count } = await supabase
        .from('company_reports')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
      
      return { ...company, report_count: count || 0 }
    })
  ) : []

  // Get stats
  const statsResults = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('verified', true),
    supabase.from('company_reports').select('company_id', { count: 'exact', head: true }),
  ])

  const totalCompanies = statsResults[0].count
  const verifiedCompanies = statsResults[1].count
  const reportedCompanies = statsResults[2].count

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Company Management</h1>
        <p className="text-slate-600 mt-1">Manage and verify companies on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-600">Total Companies</p>
          <p className="text-2xl font-bold text-slate-900">{totalCompanies || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-600">Verified</p>
          <p className="text-2xl font-bold text-green-600">{verifiedCompanies || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-600">With Reports</p>
          <p className="text-2xl font-bold text-red-600">{reportedCompanies || 0}</p>
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
                placeholder="Search companies..."
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sort By
            </label>
            <select name="sort" defaultValue={params.sort || 'newest'} className="input">
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
              <option value="reports">Most Reported</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary">
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Companies Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Reports
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {companiesWithReports && companiesWithReports.length > 0 ? (
                companiesWithReports.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{company.name}</div>
                          {company.industry && (
                            <div className="text-xs text-slate-500">{company.industry}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {company.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {company.average_rating ? (
                        <StarRatingDisplay
                          rating={company.average_rating}
                          totalRatings={company.total_ratings || 0}
                          size="sm"
                        />
                      ) : (
                        <span className="text-sm text-slate-500">No ratings</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.report_count > 0 ? (
                        <span className="badge bg-red-100 text-red-700 text-xs">
                          {company.report_count} {company.report_count === 1 ? 'report' : 'reports'}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.verified ? (
                        <span className="badge badge-green text-xs">
                          Verified
                        </span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-700 text-xs">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/companies/${company.id}`}
                          className="text-sky-600 hover:text-sky-700"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <CompanyActions companyId={company.id} isVerified={company.verified || false} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    {error ? 'Error loading companies' : 'No companies found'}
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
