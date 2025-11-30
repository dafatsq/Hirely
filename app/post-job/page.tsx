import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PostJobForm from './PostJobForm'

export default async function PostJobPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is employer and has a registered company
  const { data: profile } = await supabase
    .from('users')
    .select('role, employers(company_id)')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'employer') {
    redirect('/jobs')
  }

  // If employer doesn't have a company, redirect to register company
  // @ts-expect-error - Supabase types might not be updated yet
  const companyId = Array.isArray(profile?.employers) ? profile.employers[0]?.company_id : profile?.employers?.company_id
  if (!companyId) {
    redirect('/employer/register-company')
  }

  // Check if company is verified
  const { data: company } = await supabase
    .from('companies')
    .select('name, verified')
    .eq('id', companyId)
    .single()

  // If company is not verified, redirect to dashboard with message
  if (!company?.verified) {
    redirect('/employer/dashboard')
  }

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Post a New Job</h1>
          <p className="text-slate-600">
            Fill out the form below to post your job listing
          </p>
        </div>

        <div className="card p-8">
          <PostJobForm companyId={companyId} userId={user.id} />
        </div>
      </div>
    </section>
  )
}
