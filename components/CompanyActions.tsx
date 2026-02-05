'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'

interface CompanyActionsProps {
  companyId: string
  isVerified: boolean
}

export default function CompanyActions({ companyId, isVerified }: CompanyActionsProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const updateVerification = async (verified: boolean) => {
    setLoading(verified ? 'verify' : 'suspend')
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verified }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update company')
      }

      showToast(verified ? 'Company verified successfully' : 'Company suspended successfully', 'success')
      router.refresh()
    } catch (error) {
      console.error('Error updating company:', error)
      showToast(error instanceof Error ? error.message : 'Failed to update company', 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {!isVerified && (
        <button
          onClick={() => updateVerification(true)}
          disabled={loading !== null}
          className="text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Verify Company"
        >
          {loading === 'verify' ? (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
        </button>
      )}
      <button
        onClick={() => updateVerification(false)}
        disabled={loading !== null}
        className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title={isVerified ? 'Unverify Company' : 'Suspend Company'}
      >
        {loading === 'suspend' ? (
          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
      </button>
    </>
  )
}
