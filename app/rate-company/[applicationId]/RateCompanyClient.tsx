'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Star, Building, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'

interface RateCompanyClientProps {
  applicationId: string
  companyId: string
  companyName: string
  jobTitle: string
  existingRating?: {
    id: string
    rating: number
    review: string
    work_life_balance: number
    salary_benefits: number
    job_security: number
    management: number
    culture: number
  } | null
}

export default function RateCompanyClient({
  applicationId,
  companyId,
  companyName,
  jobTitle,
  existingRating,
}: RateCompanyClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    rating: existingRating?.rating || 0,
    review: existingRating?.review || '',
    work_life_balance: existingRating?.work_life_balance || 0,
    salary_benefits: existingRating?.salary_benefits || 0,
    job_security: existingRating?.job_security || 0,
    management: existingRating?.management || 0,
    culture: existingRating?.culture || 0,
  })

  const categories = [
    { key: 'work_life_balance', label: 'Work-Life Balance' },
    { key: 'salary_benefits', label: 'Salary & Benefits' },
    { key: 'job_security', label: 'Job Security' },
    { key: 'management', label: 'Management' },
    { key: 'culture', label: 'Company Culture' },
  ]

  // Function to manually update company rating (workaround for trigger issues)
  const updateCompanyRating = async (companyId: string) => {
    try {
      const response = await fetch('/api/update-company-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Error updating company rating:', error)
      } else {
        const result = await response.json()
        console.log('Company rating updated:', result)
      }
    } catch (error) {
      console.error('Error updating company rating:', error)
      // Don't throw - this is a background update
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.rating === 0) {
      showToast('Please provide an overall rating', 'error')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast('Please log in first', 'info')
        return
      }

      const ratingData = {
        company_id: companyId,
        user_id: user.id,
        application_id: applicationId,
        rating: formData.rating,
        review: formData.review,
        work_life_balance: formData.work_life_balance || null,
        salary_benefits: formData.salary_benefits || null,
        job_security: formData.job_security || null,
        management: formData.management || null,
        culture: formData.culture || null,
      }

      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('company_ratings')
          .update(ratingData)
          .eq('id', existingRating.id)

        if (error) throw error
        
        // Manually update company rating (workaround for trigger not firing)
        console.log('Updating company rating for company:', companyId)
        await updateCompanyRating(companyId)
        
        showToast('Rating updated successfully!', 'success')
      } else {
        // Create new rating
        const { error } = await supabase
          .from('company_ratings')
          .insert(ratingData)

        if (error) throw error
        
        // Manually update company rating (workaround for trigger not firing)
        console.log('Updating company rating for company:', companyId)
        await updateCompanyRating(companyId)
        
        showToast('Thank you for your rating!', 'success')
      }

      // Refresh applications view with cache-busting query param
      router.refresh()
      router.push(`/applications?refresh=${Date.now()}`)
    } catch (error) {
      console.error('Error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to submit rating', 'error')
    } finally {
      setLoading(false)
    }
  }

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number
    onChange: (val: number) => void
    label: string
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
        <span className="text-sm text-slate-600 ml-2 self-center">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  )

  return (
    <div className="px-6 md:px-8 mb-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-500 transition-colors font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Applications
        </Link>

        <div className="card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-sky-100 flex items-center justify-center">
              <Building className="w-8 h-8 text-sky-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {existingRating ? 'Update Your Rating' : 'Rate Your Experience'}
              </h1>
              <p className="text-slate-600">{companyName} - {jobTitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Overall Rating */}
            <div className="pb-6 border-b border-slate-200">
              <StarRating
                label="Overall Rating *"
                value={formData.rating}
                onChange={(val) => setFormData({ ...formData, rating: val })}
              />
            </div>

            {/* Category Ratings */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Rate Specific Aspects (Optional)</h3>
              {categories.map((category) => (
                <StarRating
                  key={category.key}
                  label={category.label}
                  value={formData[category.key as keyof typeof formData] as number}
                  onChange={(val) =>
                    setFormData({ ...formData, [category.key]: val })
                  }
                />
              ))}
            </div>

            {/* Review */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Review (Optional)
              </label>
              <textarea
                className="input min-h-[150px]"
                value={formData.review}
                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                placeholder="Share your experience working at this company..."
                maxLength={1000}
              />
              <div className="text-sm text-slate-500 text-right mt-1">
                {formData.review.length} / 1000
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.rating === 0}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
