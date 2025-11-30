'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, Send } from 'lucide-react'

const REASONS = [
  'Fraudulent activity',
  'Harassment or discrimination',
  'Requesting payment for employment',
  'Inappropriate behavior',
  'Other',
]

interface ReportCompanyClientProps {
  applicationId: string
  companyId: string
  companyName: string
  jobTitle: string
  existingReport: {
    id: string
    reason: string
    details: string | null
    status: string
    updated_at?: string | null
  } | null
}

export default function ReportCompanyClient({
  applicationId,
  companyId,
  companyName,
  jobTitle,
  existingReport,
}: ReportCompanyClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    reason: existingReport?.reason || '',
    details: existingReport?.details || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.reason) {
      alert('Please select a reason for the report')
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert('Please log in first')
        return
      }

      const payload = {
        application_id: applicationId,
        company_id: companyId,
        user_id: user.id,
        reason: formData.reason,
        details: formData.details,
        status: existingReport?.status || 'open',
        updated_at: new Date().toISOString(),
      }

      if (existingReport) {
        const { error } = await supabase
          .from('company_reports')
          .update(payload)
          .eq('id', existingReport.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('company_reports').insert(payload)
        if (error) throw error
      }

      alert('Report submitted. Our team will review it shortly.')
      router.refresh()
      router.push(`/applications/${applicationId}?refresh=${Date.now()}`)
    } catch (error) {
      console.error('Error submitting report:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-8">
      <div className="flex items-center gap-2 text-slate-600 mb-6">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <p>
          Please include as much detail as possible. We will never share your identity with the
          employer without your permission.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Reason *</label>
          <select
            className="input"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
          >
            <option value="">Select a reason</option>
            {REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Details (optional)</label>
          <textarea
            className="input min-h-[160px]"
            placeholder={`Describe what happened with ${companyName} during the ${jobTitle} application.`}
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            maxLength={2000}
          />
          <p className="text-xs text-slate-500 text-right mt-1">{formData.details.length} / 2000</p>
        </div>

        {existingReport && (
          <div className="text-sm text-slate-600 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
            <p className="font-semibold mb-1">You already submitted a report</p>
            <p>Updating will overwrite the previous information.</p>
            <p className="text-xs mt-1">
              Last updated:{' '}
              {existingReport.updated_at
                ? new Date(existingReport.updated_at).toLocaleString()
                : 'Just now'}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={() => router.back()}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Submitting...' : existingReport ? 'Update Report' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  )
}
