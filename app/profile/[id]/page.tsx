import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Mail, MapPin, Phone, Calendar } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch user profile data
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) {
    notFound()
  }

  type ExperienceRecord = {
    id: string
    position: string
    company_name: string
    start_date: string
    end_date: string | null
    description: string | null
    location: string | null
    is_current: boolean | null
  }

  // Fetch work experience for job seekers
  let experiences: ExperienceRecord[] = []
  if (profile.role === 'jobseeker') {
    const { data: expData } = await supabase
      .from('work_experience')
      .select('*')
      .eq('user_id', id)
      .order('start_date', { ascending: false })
    
    experiences = (expData || []) as ExperienceRecord[]
  }

  // Fetch company data if user is an employer
  let company = null
  if (profile.role === 'employer' && profile.company_id) {
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()
    
    company = companyData
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        {/* Profile Header */}
        <div className="card p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {profile.full_name?.charAt(0) || profile.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">
                {profile.full_name || 'Anonymous'}
              </h2>
              <p className="text-lg text-slate-600 mb-4 capitalize">
                {profile.role}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {profile.phone}
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Info for Employers */}
        {profile.role === 'employer' && company && (
          <div className="card p-8 mb-6">
            <h3 className="text-xl font-semibold mb-4">Company</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 mb-1">Company Name</p>
                <p className="font-semibold">{company.name}</p>
              </div>
              {company.description && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">About</p>
                  <p className="text-slate-600">{company.description}</p>
                </div>
              )}
              {company.website && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Website</p>
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* About */}
        {profile.bio && (
          <div className="card p-8 mb-6">
            <h3 className="text-xl font-semibold mb-4">About</h3>
            <p className="text-slate-600">{profile.bio}</p>
          </div>
        )}

        {/* Skills - Only for Job Seekers */}
        {profile.role === 'jobseeker' && profile.skills && profile.skills.length > 0 && (
          <div className="card p-8 mb-6">
            <h3 className="text-xl font-semibold mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string) => (
                <span key={skill} className="badge badge-blue">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience - Only for Job Seekers */}
        {profile.role === 'jobseeker' && experiences.length > 0 && (
          <div className="card p-8">
            <h3 className="text-xl font-semibold mb-6">Work Experience</h3>
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative pl-8 pb-6 border-l-2 border-slate-200 last:border-0">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-sky-500 border-4 border-white" />
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{exp.position}</h4>
                      <p className="text-slate-600">{exp.company_name}</p>
                      {exp.location && (
                        <p className="text-sm text-slate-500">{exp.location}</p>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date) : 'N/A'}
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-slate-600 mt-3 whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for jobseekers with no experience */}
        {profile.role === 'jobseeker' && experiences.length === 0 && (
          <div className="card p-8">
            <h3 className="text-xl font-semibold mb-4">Work Experience</h3>
            <p className="text-slate-500 text-center py-8">
              No work experience added yet.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
