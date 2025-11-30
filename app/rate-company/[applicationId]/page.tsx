import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RateCompanyClient from './RateCompanyClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface PageProps {
  params: Promise<{ applicationId: string }>
}

export default async function RateCompanyPage({ params }: PageProps) {
  const supabase = await createClient()
  const { applicationId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is employer
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'employer') {
    redirect('/employer/dashboard')
  }

  // Fetch application details
  const { data: application, error: appError } = await supabase
    .from('job_applications')
    .select(`
      id,
      status,
      user_id,
      job_postings!inner (
        id,
        title,
        company_id,
        companies!inner (
          id,
          name
        )
      )
    `)
    .eq('id', applicationId)
    .eq('user_id', user.id)
    .single()

  if (appError || !application) {
    redirect('/applications')
  }

  // Check if application is accepted
  if (application.status !== 'accepted') {
    redirect('/applications')
  }

  // @ts-expect-error - Supabase nested select typing
  const companyId = application.job_postings?.companies?.id
  // @ts-expect-error - Supabase nested select typing
  const companyName = application.job_postings?.companies?.name || 'Company'
  // @ts-expect-error - Supabase nested select typing
  const jobTitle = application.job_postings?.title || 'Job'

  // Check if rating already exists
  const { data: existingRating } = await supabase
    .from('company_ratings')
    .select('*')
    .eq('application_id', applicationId)
    .single()

  return (
    <RateCompanyClient
      applicationId={applicationId}
      companyId={companyId}
      companyName={companyName}
      jobTitle={jobTitle}
      existingRating={existingRating}
    />
  )
}
