import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditProfileForm from './EditProfileForm'
import ExperienceSection from '@/components/ExperienceSection'

export const metadata: Metadata = {
  title: 'Edit Profile - HireLy',
  description: 'Update your profile information',
}

export default async function EditProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile data
  const { data: profile } = await supabase
    .from('users')
    .select('*, job_seekers(skills)')
    .eq('id', user.id)
    .single()

  // Fetch work experience for job seekers
  let experiences = []
  if (profile?.role === 'jobseeker') {
    const { data: expData } = await supabase
      .from('work_experience')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
    
    experiences = expData || []
  }

  const initialData = {
    fullName: profile?.full_name || user.user_metadata?.full_name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
    skills: profile?.job_seekers?.skills || [],
    role: profile?.role || 'jobseeker',
  }

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Edit Profile</h1>
          <p className="text-slate-600">
            Update your personal information and {initialData.role === 'employer' ? 'professional details' : 'skills'}
          </p>
        </div>

        <div className="card p-6 md:p-8 mb-6">
          <EditProfileForm initialData={initialData} />
        </div>

        {/* Work Experience Section for Job Seekers */}
        {initialData.role === 'jobseeker' && (
          <ExperienceSection initialExperiences={experiences} />
        )}
      </div>
    </section>
  )
}
