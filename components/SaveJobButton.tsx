'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

interface SaveJobButtonProps {
  jobId: string
  size?: 'sm' | 'md'
}

export default function SaveJobButton({ jobId, size = 'md' }: SaveJobButtonProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    checkSavedStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  const checkSavedStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_posting_id', jobId)
        .single()

      setIsSaved(!!data)
    } catch {
      // Not saved or error
      setIsSaved(false)
    }
  }

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast('Please log in to save jobs', 'info')
        return
      }

      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_posting_id', jobId)

        if (error) throw error
        setIsSaved(false)
        showToast('Job removed from saved jobs', 'success')
        router.refresh()
      } else {
        // Save
        const { error } = await supabase
          .from('saved_jobs')
          .insert({
            user_id: user.id,
            job_posting_id: jobId
          })

        if (error) throw error
        setIsSaved(true)
        showToast('Job saved successfully', 'success')
        router.refresh()
      }
    } catch (error) {
      console.error('Error toggling save:', error)
      showToast(error instanceof Error ? error.message : 'Failed to save job', 'error')
    } finally {
      setLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const buttonSize = size === 'sm' ? 'p-1.5' : 'p-2'

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`${buttonSize} hover:bg-slate-100 rounded-lg transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={isSaved ? 'Remove from saved jobs' : 'Save job'}
    >
      <Bookmark
        className={`${iconSize} ${
          isSaved ? 'fill-sky-500 text-sky-500' : 'text-slate-400'
        }`}
      />
    </button>
  )
}
