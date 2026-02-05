"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, Check } from 'lucide-react'

const JOB_TYPES = [
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Internship', value: 'internship' }
]
const DATE_RANGES = [
  { label: 'Any time', value: '' },
  { label: 'Past 24 hours', value: '1' },
  { label: 'Past week', value: '7' },
  { label: 'Past month', value: '30' },
]

export default function JobFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [minSalary, setMinSalary] = useState('')
  const [datePosted, setDatePosted] = useState('')

  // Initialize from URL params
  useEffect(() => {
    const types = searchParams.get('type')?.split(',') || []
    setSelectedTypes(types)
    setMinSalary(searchParams.get('min_salary') || '')
    setDatePosted(searchParams.get('days_ago') || '')
  }, [searchParams])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTypeChange = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update types
    if (selectedTypes.length > 0) {
      params.set('type', selectedTypes.join(','))
    } else {
      params.delete('type')
    }

    // Update salary
    if (minSalary) {
      params.set('min_salary', minSalary)
    } else {
      params.delete('min_salary')
    }

    // Update date posted
    if (datePosted) {
      params.set('days_ago', datePosted)
    } else {
      params.delete('days_ago')
    }

    // Reset page to 1 when filtering
    params.set('page', '1')

    router.push(`/jobs?${params.toString()}`)
    setIsOpen(false)
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setMinSalary('')
    setDatePosted('')
    
    const params = new URLSearchParams(searchParams.toString())
    params.delete('type')
    params.delete('min_salary')
    params.delete('days_ago')
    params.set('page', '1')
    
    router.push(`/jobs?${params.toString()}`)
    setIsOpen(false)
  }

  const activeFiltersCount = [
    selectedTypes.length > 0,
    !!minSalary,
    !!datePosted
  ].filter(Boolean).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`btn-secondary flex items-center gap-2 ${isOpen || activeFiltersCount > 0 ? 'bg-sky-500/15 border-sky-500' : ''}`}
      >
        <Filter className="w-5 h-5" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="bg-sky-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 z-50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Filters</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Job Type */}
            <div>
              <h4 className="font-medium mb-3 text-slate-900">Job Type</h4>
              <div className="space-y-2">
                {JOB_TYPES.map(type => (
                  <label key={type.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      selectedTypes.includes(type.value) 
                        ? 'bg-sky-500 border-sky-500 text-white' 
                        : 'border-slate-300 group-hover:border-sky-500'
                    }`}>
                      {selectedTypes.includes(type.value) && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => handleTypeChange(type.value)}
                    />
                    <span className="text-slate-600">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Salary */}
            <div>
              <h4 className="font-medium mb-3 text-slate-900">Minimum Salary</h4>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  className="input pl-8 py-2 text-sm"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                />
              </div>
            </div>

            {/* Date Posted */}
            <div>
              <h4 className="font-medium mb-3 text-slate-900">Date Posted</h4>
              <div className="space-y-2">
                {DATE_RANGES.map(range => (
                  <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      datePosted === range.value
                        ? 'border-sky-500' 
                        : 'border-slate-300 group-hover:border-sky-500'
                    }`}>
                      {datePosted === range.value && <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                    </div>
                    <input 
                      type="radio" 
                      name="datePosted"
                      className="hidden"
                      checked={datePosted === range.value}
                      onChange={() => setDatePosted(range.value)}
                    />
                    <span className="text-slate-600">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={clearFilters}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                Clear
              </button>
              <button 
                onClick={applyFilters}
                className="flex-1 px-4 py-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors font-medium text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
