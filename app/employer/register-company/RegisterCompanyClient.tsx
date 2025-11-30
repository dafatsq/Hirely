'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Building, Globe, Upload, Search, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

interface Company {
  id: string
  name: string
  description: string
  website: string
  logo_url?: string
}

interface RegisterCompanyClientProps {
  currentCompany: Company | null
}

export default function RegisterCompanyClient({ currentCompany }: RegisterCompanyClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    company_size: '',
    logo_url: ''
  })

  const loadCompanies = useCallback(async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, description, website')
      .order('name')
    
    setCompanies(data || [])
  }, [supabase])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const handleJoinCompany = async (companyId: string) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast('Please log in first', 'info')
        return
      }

      // Update user's company_id
      const { error } = await supabase
        .from('employers')
        .update({ company_id: companyId })
        .eq('user_id', user.id)

      if (error) throw error

      showToast(currentCompany ? 'Company changed successfully!' : 'Successfully joined company!', 'success')
      router.push('/employer/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to join company', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast('Please log in first', 'info')
        return
      }

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.name,
          description: formData.description,
          website: formData.website,
          location: formData.location,
          industry: formData.industry,
          company_size: formData.company_size,
          logo_url: formData.logo_url
        })
        .select()
        .single()

      if (companyError) throw companyError

      // Update user's company_id
      const { error: updateError } = await supabase
        .from('employers')
        .update({ company_id: company.id })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      showToast(currentCompany ? 'Company changed successfully!' : 'Company created successfully!', 'success')
      router.push('/employer/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to create company', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto">
      {/* Current Company Alert */}
      {currentCompany && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Currently with {currentCompany.name}</h3>
              <p className="text-sm text-amber-800">
                Changing your company will transfer all your future job postings to the new company. 
                Your existing job postings will remain with {currentCompany.name}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selection */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            mode === 'create'
              ? 'border-sky-500 bg-sky-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <Building className="w-6 h-6 mx-auto mb-2 text-sky-600" />
          <div className="font-semibold">Create New Company</div>
          <div className="text-sm text-slate-600">Start your own company</div>
        </button>
        <button
          onClick={() => setMode('join')}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            mode === 'join'
              ? 'border-sky-500 bg-sky-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <Search className="w-6 h-6 mx-auto mb-2 text-sky-600" />
          <div className="font-semibold">Join Existing Company</div>
          <div className="text-sm text-slate-600">Join as an employer</div>
        </button>
      </div>

      {mode === 'create' ? (
        <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
              <Building className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {currentCompany ? 'Create & Switch to New Company' : 'Create Your Company'}
              </h1>
              <p className="text-slate-600 text-sm">
                {currentCompany 
                  ? 'Create a new company and switch to it' 
                  : 'Set up your company profile to start posting jobs'}
              </p>
            </div>
          </div>          <form onSubmit={handleCreateCompany} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., TechCorp Indonesia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                className="input min-h-[120px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about your company..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Website <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="url"
                  required
                  className="input pl-10"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Jakarta, Indonesia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="input"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              >
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Construction">Construction</option>
                <option value="Transportation">Transportation</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Media">Media</option>
                <option value="Telecommunications">Telecommunications</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Energy">Energy</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Consulting">Consulting</option>
                <option value="Legal">Legal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Company Size <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="input"
                value={formData.company_size}
                onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
              >
                <option value="">Select Company Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1001-5000">1001-5000 employees</option>
                <option value="5001+">5001+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Company Logo URL (optional)
              </label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="url"
                  className="input pl-10"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading 
                  ? (currentCompany ? 'Switching...' : 'Creating...') 
                  : (currentCompany ? 'Create & Switch Company' : 'Create Company')}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
              <Search className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {currentCompany ? 'Switch to Existing Company' : 'Join Existing Company'}
              </h1>
              <p className="text-slate-600 text-sm">
                {currentCompany 
                  ? 'Search and switch to a different company' 
                  : 'Search and join a company as an employer'}
              </p>
            </div>
          </div>          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Companies List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Building className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No companies found</p>
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <div key={company.id} className="border border-slate-200 rounded-lg p-4 hover:border-sky-500 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{company.name}</h3>
                      <p className="text-sm text-slate-600 mb-2">{company.description}</p>
                      {company.website && (
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          {company.website}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleJoinCompany(company.id)}
                      disabled={loading || currentCompany?.id === company.id}
                      className="btn-primary whitespace-nowrap disabled:opacity-50"
                    >
                      {currentCompany?.id === company.id 
                        ? 'Current Company' 
                        : (currentCompany ? 'Switch to Company' : 'Join Company')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
