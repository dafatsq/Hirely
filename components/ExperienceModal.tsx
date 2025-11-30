'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Briefcase, MapPin, Calendar } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

interface WorkExperience {
  id: string
  company_name: string
  position: string
  location: string
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string
}

interface ExperienceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  experience?: WorkExperience | null
}

export default function ExperienceModal({ isOpen, onClose, onSave, experience }: ExperienceModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    company_name: experience?.company_name || '',
    position: experience?.position || '',
    location: experience?.location || '',
    start_date: experience?.start_date || '',
    end_date: experience?.end_date || '',
    is_current: experience?.is_current || false,
    description: experience?.description || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const dataToSave = {
        ...formData,
        end_date: formData.is_current ? null : formData.end_date,
        user_id: user.id,
      }

      if (experience?.id) {
        // Update existing
        const { error } = await supabase
          .from('work_experience')
          .update(dataToSave)
          .eq('id', experience.id)
        
        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('work_experience')
          .insert(dataToSave)
        
        if (error) throw error
      }

      showToast('Experience saved successfully', 'success')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to save experience', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {experience ? 'Edit Experience' : 'Add Experience'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Position */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Position <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                className="input pl-10"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Software Engineer"
              />
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Tech Corp Inc."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                className="input pl-10"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                required
                className="input pl-10"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
          </div>

          {/* Current Position Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_current"
              className="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-sky-500"
              checked={formData.is_current}
              onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
            />
            <label htmlFor="is_current" className="text-sm font-medium">
              I currently work here
            </label>
          </div>

          {/* End Date */}
          {!formData.is_current && (
            <div>
              <label className="block text-sm font-medium mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  required={!formData.is_current}
                  className="input pl-10"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              className="input min-h-[120px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your responsibilities, achievements, and key projects..."
              maxLength={1000}
            />
            <div className="text-sm text-slate-500 text-right mt-1">
              {formData.description.length} / 1000
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Saving...' : 'Save Experience'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
