import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mail, MapPin, Phone, LogOut, Building } from 'lucide-react'
import ExperienceSection from '@/components/ExperienceSection'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile data from Supabase
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const derivedRole =
    profile?.role ||
    (user.app_metadata as { role?: string })?.role ||
    (user.user_metadata as { role?: string })?.role ||
    'jobseeker'

  // Fetch role-specific data based on user role
  let jobSeekerData = null
  let employerData = null

  if (derivedRole === 'jobseeker') {
    const { data } = await supabase
      .from('job_seekers')
      .select('skills')
      .eq('user_id', user.id)
      .single()
    jobSeekerData = data
  } else if (derivedRole === 'employer') {
    const { data } = await supabase
      .from('employers')
      .select('company_id')
      .eq('user_id', user.id)
      .single()
    employerData = data
  }

  // Fetch company data if user is an employer
  let company = null
  const companyId = employerData?.company_id
  if (derivedRole === 'employer' && companyId) {
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()
    
    company = companyData
  }

  // Fetch work experience for job seekers
  let experiences = []
  if (derivedRole === 'jobseeker') {
    const { data: expData } = await supabase
      .from('work_experience')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
    
    experiences = expData || []
  }

  const profileData = {
    fullName: profile?.full_name || user.user_metadata?.full_name || 'User',
    email: user.email || '',
    phone: profile?.phone || 'Not provided',
    location: profile?.location || 'Not specified',
    role: derivedRole,
    bio: profile?.bio || 'No bio provided yet.',
    skills: jobSeekerData?.skills || [],
    company: company,
  }

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="btn-secondary text-sm">
              <LogOut className="w-4 h-4 inline mr-2" />
              Logout
            </button>
          </form>
        </div>

        {/* Profile Header */}
        <div className="card p-4 sm:p-6 md:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
              {profileData.fullName.charAt(0)}
            </div>
            <div className="flex-1 text-center sm:text-left w-full">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">{profileData.fullName}</h2>
              <p className="text-base sm:text-lg text-slate-600 mb-3 sm:mb-4 capitalize">{profileData.role}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm text-slate-600">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{profileData.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  {profileData.phone}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {profileData.location}
                </div>
                {profileData.role === 'employer' && profileData.company && (
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Building className="w-4 h-4 flex-shrink-0" />
                    {profileData.company.name}
                  </div>
                )}
              </div>
            </div>
            <Link href="/profile/edit" className="btn-primary text-sm w-full sm:w-auto">
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Company Info for Employers */}
        {profileData.role === 'employer' && profileData.company && (
          <div className="card p-4 sm:p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <Building className="w-5 h-5 text-sky-600" />
                Company Information
              </h3>
              <Link href="/employer/register-company" className="text-sm text-sky-500 hover:underline">
                Change Company
              </Link>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 mb-1">Company Name</p>
                <p className="font-semibold">{profileData.company.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Verification Status</p>
                {profileData.company.verified ? (
                  <span className="badge badge-green text-sm">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="badge bg-amber-100 text-amber-700 text-sm">
                    ⏳ Pending Verification
                  </span>
                )}
              </div>
              {profileData.company.description && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-600">{profileData.company.description}</p>
                </div>
              )}
              {profileData.company.website && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Website</p>
                  <a 
                    href={profileData.company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-sky-500 hover:underline"
                  >
                    {profileData.company.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show message for employers without company */}
        {profileData.role === 'employer' && !profileData.company && (
          <div className="card p-4 sm:p-6 md:p-8 mb-6 bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">No Company Registered</h3>
                <p className="text-sm text-amber-800 mb-3">
                  You need to create or join a company before you can post jobs.
                </p>
                <Link href="/employer/register-company" className="btn-primary text-sm inline-block">
                  Register/Join Company
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* About */}
        <div className="card p-4 sm:p-6 md:p-8 mb-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">About</h3>
          <p className="text-sm sm:text-base text-slate-600">{profileData.bio}</p>
        </div>

        {/* Skills - Only for Job Seekers */}
        {profileData.role === 'jobseeker' && (
          <div className="card p-4 sm:p-6 md:p-8 mb-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Skills</h3>
            {profileData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill: string) => (
                  <span key={skill} className="badge badge-blue text-xs sm:text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs sm:text-sm">No skills added yet. Update your profile to add skills.</p>
            )}
          </div>
        )}

        {/* Work Experience - Only for Job Seekers */}
        {profileData.role === 'jobseeker' && (
          <ExperienceSection initialExperiences={experiences} />
        )}
      </div>
    </section>
  )
}
