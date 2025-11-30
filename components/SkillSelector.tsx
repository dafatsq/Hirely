'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Search, Loader2 } from 'lucide-react'

interface SkillSelectorProps {
  selectedSkills: string[]
  onSkillsChange: (skills: string[]) => void
  maxSkills?: number
}

export default function SkillSelector({ selectedSkills, onSkillsChange, maxSkills = 10 }: SkillSelectorProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchSkills = async () => {
      if (!query.trim()) {
        setSuggestions([])
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('skills')
          .select('name')
          .ilike('name', `%${query}%`)
          .limit(5)

        if (error) throw error

        // Filter out already selected skills
        const availableSkills = data
          .map(s => s.name)
          .filter(s => !selectedSkills.includes(s))

        setSuggestions(availableSkills)
        setIsOpen(true)
      } catch (error) {
        console.error('Error fetching skills:', error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchSkills, 300)
    return () => clearTimeout(timeoutId)
  }, [query, selectedSkills, supabase])

  const addSkill = (skill: string) => {
    if (selectedSkills.length >= maxSkills) return
    if (!selectedSkills.includes(skill)) {
      onSkillsChange([...selectedSkills, skill])
    }
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
  }

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(selectedSkills.filter(skill => skill !== skillToRemove))
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (query.trim()) {
        // Check if exact match exists in suggestions
        const exactMatch = suggestions.find(s => s.toLowerCase() === query.toLowerCase())
        if (exactMatch) {
          addSkill(exactMatch)
        } else {
          // Try to add new skill to bank
          try {
            // First check if it exists (case insensitive) to avoid duplicates if suggestions didn't catch it
            const { data: existing } = await supabase
              .from('skills')
              .select('name')
              .ilike('name', query.trim())
              .single()
            
            if (existing) {
              addSkill(existing.name)
              return
            }

            // Insert new skill
            const { data, error } = await supabase
              .from('skills')
              .insert({ name: query.trim() })
              .select('name')
              .single()
            
            if (!error && data) {
               addSkill(data.name)
            } else {
               // Fallback
               addSkill(query.trim())
            }
          } catch {
             addSkill(query.trim())
          }
        }
      }
    }
  }

  return (
    <div className="space-y-3" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          className="input pl-10"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search skills (e.g. React, Project Management)..."
          disabled={selectedSkills.length >= maxSkills}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        )}
        
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {suggestions.map((skill) => (
              <button
                key={skill}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between group"
                onClick={() => addSkill(skill)}
              >
                <span>{skill}</span>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-sky-500" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <span
              key={skill}
              className="badge badge-blue flex items-center gap-2 pl-3 pr-2 py-1.5"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="hover:text-red-600 hover:bg-red-50 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      <p className="text-xs text-slate-500">
        {selectedSkills.length}/{maxSkills} skills selected
      </p>
    </div>
  )
}
