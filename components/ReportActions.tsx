'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'

interface ReportActionsProps {
  reportId: string
  currentStatus: string
}

export default function ReportActions({ reportId, currentStatus }: ReportActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const { showToast } = useToast()

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus)
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      showToast('Report status updated successfully', 'success')
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Error updating report status:', error)
      showToast(error instanceof Error ? error.message : 'Failed to update status', 'error')
    } finally {
      setLoading(null)
    }
  }

  // Show different actions based on status
  const isClosed = currentStatus === 'closed' || currentStatus === 'rejected'

  return (
    <>
      {isClosed ? (
        // Show reopen button for closed/rejected reports
        <button
          onClick={() => updateStatus('open')}
          disabled={loading !== null}
          className="text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Reopen Report"
        >
          {loading === 'open' ? (
            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
        </button>
      ) : (
        // Show action buttons for open/in_progress reports
        <>
          {currentStatus === 'open' && (
            <button
              onClick={() => updateStatus('in_progress')}
              disabled={loading !== null}
              className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mark In Progress"
            >
              {loading === 'in_progress' ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={() => updateStatus('closed')}
            disabled={loading !== null}
            className="text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Close/Resolve"
          >
            {loading === 'closed' ? (
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => updateStatus('rejected')}
            disabled={loading !== null}
            className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reject"
          >
            {loading === 'rejected' ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </button>
        </>
      )}
    </>
  )
}
