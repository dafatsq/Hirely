'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, MapPin, Calendar, Plus, Edit, Trash2 } from 'lucide-react'
import ExperienceModal from './ExperienceModal'

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

interface ExperienceSectionProps {
  initialExperiences: WorkExperience[]
}

export default function ExperienceSection({ initialExperiences }: ExperienceSectionProps) {
  const supabase = createClient()
  const [experiences, setExperiences] = useState<WorkExperience[]>(initialExperiences)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchExperiences = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('work_experience')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
    
    if (data) setExperiences(data)
  }

  const handleAdd = () => {
    setEditingExperience(null)
    setIsModalOpen(true)
  }

  const handleEdit = (exp: WorkExperience) => {
    setEditingExperience(exp)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return
    
    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('work_experience')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      await fetchExperiences()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete experience')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    })
  }

  return (
    <>
      <div className="card p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-semibold">Work Experience</h3>
          <button
            onClick={handleAdd}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add Experience
          </button>
        </div>

        {experiences.length > 0 ? (
          <div className="space-y-6">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="border-l-2 border-sky-500 pl-4 relative"
              >
                <div className="absolute -left-2 top-1 w-3 h-3 bg-sky-500 rounded-full" />
                
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg">{exp.position}</h4>
                    <p className="text-sky-600 font-medium">{exp.company_name}</p>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(exp)}
                      className="text-slate-400 hover:text-sky-500 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingId === exp.id}
                      className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date!)}
                    </span>
                  </div>
                  {exp.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{exp.location}</span>
                    </div>
                  )}
                </div>

                {exp.description && (
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-4">No work experience added yet</p>
            <button
              onClick={handleAdd}
              className="btn-secondary text-sm"
            >
              Add Your First Experience
            </button>
          </div>
        )}
      </div>

      <ExperienceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingExperience(null)
        }}
        onSave={() => {
          fetchExperiences()
        }}
        experience={editingExperience}
      />
    </>
  )
}
