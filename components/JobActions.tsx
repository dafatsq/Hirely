'use client'

import { useState } from 'react'
import { XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface JobActionsProps {
  jobId: string
}

export default function JobActions({ jobId }: JobActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete job')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting job:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-2"
      title="Remove Job"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <XCircle className="w-5 h-5" />
      )}
    </button>
  )
}
