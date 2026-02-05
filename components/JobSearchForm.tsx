"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'

export default function JobSearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (location.trim()) params.set('location', location.trim())
    
    const queryString = params.toString()
    router.push(`/jobs${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Job title, keywords, or company"
          className="input pl-12 w-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      </div>
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="City, state, or remote"
          className="input pl-12 w-full"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      </div>
      <button type="submit" className="btn-primary whitespace-nowrap">
        <Search className="w-5 h-5 inline mr-2" />
        Search
      </button>
    </form>
  )
}
