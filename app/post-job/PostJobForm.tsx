'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, DollarSign } from 'lucide-react'
import SkillSelector from '@/components/SkillSelector'

interface PostJobFormProps {
  companyId: string
  userId: string
}

export default function PostJobForm({ companyId, userId }: PostJobFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    type: 'full-time',
    salary_min: '',
    salary_max: '',
    description: '',
    requirements: '',
    skills: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'open') => {
    e.preventDefault()
    setErrors({})
    const newErrors: Record<string, string> = {}
    
    // Input Validation
    if (formData.title.length < 5) {
      newErrors.title = 'Job title must be at least 5 characters long'
    }

    if (formData.salary_min && formData.salary_max) {
      if (parseInt(formData.salary_min) > parseInt(formData.salary_max)) {
        newErrors.salary = 'Minimum salary cannot be greater than maximum salary'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('job_postings')
        .insert({
          company_id: companyId,
          employer_id: userId,
          title: formData.title,
          location: formData.location,
          type: formData.type,
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
          description: formData.description,
          requirements: formData.requirements,
          skills: formData.skills,
          status: status,
        })

      if (error) throw error

      alert(status === 'draft' ? 'Job saved as draft!' : 'Job posted successfully!')
      router.push('/employer/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6">
      {/* Job Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Job Title <span className="text-red-500">*</span>
        </label>
        {errors.title && <p className="text-red-500 text-sm mb-2">{errors.title}</p>}
        <div className="relative">
          <input
            id="title"
            type="text"
            placeholder="e.g. Senior Software Engineer"
            className="input pl-12"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium mb-2">
          Location <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="location"
            type="text"
            placeholder="e.g. Jakarta, Indonesia or Remote"
            className="input pl-12"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Job Type */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Employment Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['full-time', 'part-time', 'contract', 'internship'].map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value={type}
                checked={formData.type === type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
              <span className="text-sm capitalize">{type.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Salary Range */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="salaryMin" className="block text-sm font-medium mb-2">
            Minimum Salary ($/year)
          </label>
          {errors.salary && <p className="text-red-500 text-sm mb-2">{errors.salary}</p>}
          <div className="relative">
            <input
              id="salaryMin"
              type="number"
              placeholder="50000"
              className="input pl-12"
              value={formData.salary_min}
              onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
            />
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>
        <div>
          <label htmlFor="salaryMax" className="block text-sm font-medium mb-2">
            Maximum Salary ($/year)
          </label>
          <div className="relative">
            <input
              id="salaryMax"
              type="number"
              placeholder="80000"
              className="input pl-12"
              value={formData.salary_max}
              onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
            />
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          rows={6}
          placeholder="Describe the role, responsibilities, and what you're looking for..."
          className="input resize-none"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Requirements */}
      <div>
        <label htmlFor="requirements" className="block text-sm font-medium mb-2">
          Requirements <span className="text-red-500">*</span>
        </label>
        <textarea
          id="requirements"
          rows={4}
          placeholder="List the required skills, experience, and qualifications..."
          className="input resize-none"
          required
          value={formData.requirements}
          onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
        />
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Required Skills
        </label>
        <SkillSelector
          selectedSkills={formData.skills}
          onSkillsChange={(skills) => setFormData({ ...formData, skills })}
          maxSkills={10}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'draft')}
          disabled={loading}
          className="btn-secondary flex-1"
        >
          {loading ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'open')}
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? 'Publishing...' : 'Publish Job'}
        </button>
      </div>
    </form>
  )
}
