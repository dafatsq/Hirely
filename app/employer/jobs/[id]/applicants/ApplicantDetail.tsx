"use client"

import { useState } from "react"
import { X, Download, ExternalLink, Calendar, DollarSign, Mail, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

type ScreeningAnswer = {
  id: string
  question: string
  answer: string
}

type ApplicantData = {
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

type ApplicantDetailProps = {
  applicant: ApplicantData
  onClose: () => void
  onStatusChange: (applicationId: string, status: string) => Promise<void>
}

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-blue-100 text-blue-700" },
  { value: "under_review", label: "Under Review", color: "bg-orange-100 text-orange-700" },
  { value: "shortlisted", label: "Shortlisted", color: "bg-purple-100 text-purple-700" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
  { value: "accepted", label: "Accepted", color: "bg-green-100 text-green-700" },
]

export function ApplicantDetail({ applicant, onClose, onStatusChange }: ApplicantDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setIsUpdating(true)
    try {
      await onStatusChange(applicant.id, newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDownloadResume() {
    if (!applicant.resume_url) return
    
    try {
      const supabase = createClient()
      
      // Get signed URL for the resume
      const { data, error } = await supabase
        .storage
        .from('resumes')
        .createSignedUrl(applicant.resume_url, 60) // 60 seconds expiry
      
      if (error) {
        console.error('Error getting resume URL:', error)
        alert('Failed to download resume. Please try again.')
        return
      }
      
      if (data?.signedUrl) {
        // Download the file
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = `resume_${applicant.users?.full_name || 'applicant'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error downloading resume:', error)
      alert('Failed to download resume. Please try again.')
    }
  }

  const currentStatus = statusOptions.find((s) => s.value === applicant.status) || statusOptions[0]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Application Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Applicant Info */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Applicant Information</h3>
              <Link
                href={`/profile/${applicant.users.id}`}
                target="_blank"
                className="btn-outline flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                View Full Profile
              </Link>
            </div>
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {applicant.users?.full_name?.charAt(0) || applicant.users?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-xl font-semibold">
                    {applicant.users?.full_name || "Anonymous"}
                  </h4>
                  <span className={`badge ${currentStatus.color}`}>
                    {currentStatus.label}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {applicant.users?.email || 'No email'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Applied {new Date(applicant.applied_at).toLocaleDateString()}
                  </div>
                  {applicant.expected_salary && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Expected: ${(applicant.expected_salary / 1000).toFixed(0)}k/year
                    </div>
                  )}
                  {applicant.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Available from: {new Date(applicant.start_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Status Management */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Application Status</h3>
            <div className="flex flex-wrap gap-3">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  disabled={isUpdating || applicant.status === status.value}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    applicant.status === status.value
                      ? status.color
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </section>

          {/* Resume & Links */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Documents & Links</h3>
            <div className="space-y-3">
              {applicant.resume_url && (
                <button
                  onClick={handleDownloadResume}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors w-full text-left"
                >
                  <Download className="w-5 h-5 text-sky-600" />
                  <div className="flex-1">
                    <div className="font-medium">Resume/CV</div>
                    <div className="text-sm text-slate-600">Click to download</div>
                  </div>
                </button>
              )}
              {applicant.portfolio_url && (
                <a
                  href={applicant.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 text-sky-600" />
                  <div className="flex-1">
                    <div className="font-medium">Portfolio</div>
                    <div className="text-sm text-slate-600 truncate">
                      {applicant.portfolio_url}
                    </div>
                  </div>
                </a>
              )}
              {applicant.linkedin_url && (
                <a
                  href={applicant.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 text-sky-600" />
                  <div className="flex-1">
                    <div className="font-medium">LinkedIn Profile</div>
                    <div className="text-sm text-slate-600 truncate">
                      {applicant.linkedin_url}
                    </div>
                  </div>
                </a>
              )}
            </div>
          </section>

          {/* Cover Letter */}
          {applicant.cover_letter && (
            <section>
              <h3 className="text-lg font-semibold mb-4">Cover Letter</h3>
              <div className="p-4 bg-slate-50 rounded-xl whitespace-pre-line text-slate-700">
                {applicant.cover_letter}
              </div>
            </section>
          )}

          {/* Screening Answers */}
          {applicant.screening_answers && applicant.screening_answers.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-4">Screening Questions</h3>
              <div className="space-y-4">
                {applicant.screening_answers.map((qa, index) => (
                  <div key={qa.id || index} className="p-4 bg-slate-50 rounded-xl">
                    <div className="font-medium text-slate-900 mb-2">{qa.question}</div>
                    <div className="text-slate-700">{qa.answer}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
