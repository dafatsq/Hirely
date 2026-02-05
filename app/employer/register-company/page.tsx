import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RegisterCompanyClient from './RegisterCompanyClient'

export const metadata: Metadata = {
  title: 'Register Company - HireLy',
  description: 'Register your company to start posting jobs',
}

export default async function RegisterCompanyPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check user role
  const { data: profile } = await supabase
    .from('users')
    .select('role, employers(company_id)')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'employer') {
    redirect('/')
  }

  // Fetch current company if exists
  let currentCompany = null
  // @ts-expect-error Profile type may have complex structure
  const companyId = Array.isArray(profile?.employers) ? profile.employers[0]?.company_id : profile?.employers?.company_id
  if (companyId) {
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()
    
    currentCompany = companyData
  }

  return (
    <div className="px-6 md:px-8 py-12">
      <RegisterCompanyClient currentCompany={currentCompany} />
    </div>
  )
}
