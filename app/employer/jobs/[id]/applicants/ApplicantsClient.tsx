"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Filter, Search, Users } from "lucide-react"
import Link from "next/link"
import { ApplicantDetail } from "./ApplicantDetail"

type ScreeningAnswer = {
  id: string
  question: string
  answer: string
}

type Applicant = {
  id: string
  status: string
  cover_letter: string | null
  resume_url: string | null
  portfolio_url: string | null
  linkedin_url: string | null
  expected_salary: number | null
  start_date: string | null
  screening_answers: ScreeningAnswer[]
  applied_at: string
  users: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

const statusConfig = {
  pending: { label: "Pending", color: "badge-blue" },
  under_review: { label: "Under Review", color: "badge-orange" },
  shortlisted: { label: "Shortlisted", color: "badge-purple" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
  accepted: { label: "Accepted", color: "badge-green" },
}

export default function ApplicantsClientPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([])
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [statusUpdateNotification, setStatusUpdateNotification] = useState<{
    show: boolean
    applicantName: string
    newStatus: string
  }>({ show: false, applicantName: "", newStatus: "" })

  const fetchApplicants = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/employer/jobs/${jobId}/applicants`)

      if (!response.ok) {
        throw new Error("Failed to fetch applicants")
      }

      const data = await response.json()
      setApplicants(data.applicants || [])
      setFilteredApplicants(data.applicants || [])
    } catch (error) {
      console.error("Error fetching applicants:", error)
      setApplicants([])
      setFilteredApplicants([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApplicants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  useEffect(() => {
    let filtered = applicants

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.users.full_name?.toLowerCase().includes(query) ||
          app.users.email.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    setFilteredApplicants(filtered)
  }, [searchQuery, statusFilter, applicants])

  async function fetchApplicants() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}/applicants`)
      if (!res.ok) {
        if (res.status === 403) {
          alert("You are not authorized to view these applicants")
          router.push("/")
          return
        }
        throw new Error("Failed to fetch applicants")
      }
      const data = await res.json()
      console.log('Applicants API response:', data) // Debug log
      setApplicants(data.applications || [])
      setFilteredApplicants(data.applications || [])
    } catch (error) {
      console.error("Error fetching applicants:", error)
      alert("Failed to load applicants. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStatusChange(applicationId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}/applicants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status: newStatus }),
      })

      if (!res.ok) {
        throw new Error("Failed to update status")
      }

      // Find applicant name for notification
      const applicant = applicants.find((app) => app.id === applicationId)
      const applicantName = applicant?.users?.full_name || "Applicant"

      // Update local state
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      )

      // Update selected applicant if open
      if (selectedApplicant?.id === applicationId) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus })
      }

      // Show subtle notification
      setStatusUpdateNotification({
        show: true,
        applicantName,
        newStatus: statusConfig[newStatus as keyof typeof statusConfig]?.label || newStatus,
      })

      // Hide notification after 3 seconds
      setTimeout(() => {
        setStatusUpdateNotification({ show: false, applicantName: "", newStatus: "" })
      }, 3000)

      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status. Please try again.")
    }
  }

  const stats = {
    total: applicants.length,
    pending: applicants.filter((a) => a.status === "pending").length,
    under_review: applicants.filter((a) => a.status === "under_review").length,
    shortlisted: applicants.filter((a) => a.status === "shortlisted").length,
    accepted: applicants.filter((a) => a.status === "accepted").length,
  }

  if (isLoading) {
    return (
      <div className="px-6 md:px-8 mb-12">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="animate-pulse">Loading applicants...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Status Update Notification */}
      {statusUpdateNotification.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium">
                {statusUpdateNotification.applicantName}&apos;s status updated to{" "}
                <span className="font-bold">{statusUpdateNotification.newStatus}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="px-6 md:px-8 mb-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link
              href={`/jobs/${jobId}`}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-500 transition-colors font-medium mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Job Details
            </Link>
            <h1 className="text-3xl font-bold mb-2">Job Applicants</h1>
            <p className="text-slate-600">
              Review and manage applications for this position
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="card p-4">
              <div className="text-2xl font-bold text-sky-600 mb-1">{stats.total}</div>
              <div className="text-sm text-slate-600">Total</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.pending}</div>
              <div className="text-sm text-slate-600">Pending</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {stats.under_review}
              </div>
              <div className="text-sm text-slate-600">Reviewing</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.shortlisted}
              </div>
              <div className="text-sm text-slate-600">Shortlisted</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.accepted}</div>
              <div className="text-sm text-slate-600">Accepted</div>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="input pl-12 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  className="input pl-12 pr-4 appearance-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="accepted">Accepted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Applicants List */}
          <div className="space-y-4">
            {filteredApplicants.map((applicant) => (
              <div key={applicant.id} className="card p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start gap-4">
                  <div className="flex items-start gap-3 md:gap-4 flex-1 w-full">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {applicant.users?.full_name?.charAt(0) ||
                        applicant.users?.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-base md:text-lg">
                          {applicant.users?.full_name || "Anonymous"}
                        </h3>
                        <span
                          className={`badge text-xs ${
                            statusConfig[applicant.status as keyof typeof statusConfig]
                              ?.color
                          }`}
                        >
                          {
                            statusConfig[applicant.status as keyof typeof statusConfig]
                              ?.label
                          }
                        </span>
                      </div>
                      <div className="text-xs md:text-sm text-slate-600 space-y-1">
                        <div className="truncate">{applicant.users?.email || 'No email'}</div>
                        <div>
                          Applied{" "}
                          {new Date(applicant.applied_at).toLocaleDateString()}
                        </div>
                        {applicant.expected_salary && applicant.expected_salary > 0 && (
                          <div>
                            Expected: ${(applicant.expected_salary / 1000).toFixed(0)}k/year
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Link
                      href={`/profile/${applicant.users.id}`}
                      className="px-4 py-2 border-2 border-sky-500 text-sky-500 rounded-lg hover:bg-sky-50 transition-colors font-medium text-sm text-center"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => setSelectedApplicant(applicant)}
                      className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredApplicants.length === 0 && !isLoading && (
            <div className="card p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery || statusFilter !== "all"
                  ? "No matching applicants"
                  : "No applicants yet"}
              </h3>
              <p className="text-slate-600">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Applications will appear here when candidates apply"}
              </p>
            </div>
          )}
        </div>
      </section>

      {selectedApplicant && (
        <ApplicantDetail
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  )
}
