'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, MapPin, Phone } from 'lucide-react'
import SkillSelector from '@/components/SkillSelector'
import { useToast } from '@/components/ToastProvider'

interface EditProfileFormProps {
  initialData: {
    fullName: string
    phone: string
    location: string
    bio: string
    skills: string[]
    role: string
  }
}

export default function EditProfileForm({ initialData }: EditProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: initialData.fullName,
    phone: initialData.phone,
    location: initialData.location,
    bio: initialData.bio,
  })
  
  const [skills, setSkills] = useState<string[]>(initialData.skills)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast('Please log in first', 'info')
        return
      }

      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
        })
        .eq('id', user.id)

      if (userError) throw userError

      // Update skills if job seeker
      if (!isEmployer) {
        const { error: skillsError } = await supabase
          .from('job_seekers')
          .update({
            skills: skills,
          })
          .eq('user_id', user.id)
        
        if (skillsError) throw skillsError
      }

      showToast('Profile updated successfully!', 'success')
      router.push('/profile')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to update profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const isEmployer = initialData.role === 'employer'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            required
            className="input pl-10"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="tel"
            className="input pl-10"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Location <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            required
            className="input pl-10"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="New York, NY"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {isEmployer ? 'About You' : 'Professional Summary'}
        </label>
        <textarea
          className="input min-h-[120px]"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder={
            isEmployer
              ? "Tell us about your role and what you're looking for in candidates..."
              : "Write a brief summary of your professional background, experience, and career goals..."
          }
          maxLength={500}
        />
        <div className="text-sm text-slate-500 text-right mt-1">
          {formData.bio.length} / 500
        </div>
      </div>

      {/* Skills - Only for Job Seekers */}
      {!isEmployer && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Skills
          </label>
          <SkillSelector
            selectedSkills={skills}
            onSkillsChange={setSkills}
            maxSkills={15}
          />
          <p className="text-sm text-slate-500 mt-2">
            Add skills to help employers find you
          </p>
        </div>
      )}

      {/* Submit Buttons */}
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
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
