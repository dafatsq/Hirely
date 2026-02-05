import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const derivedRole =
    profile?.role ||
    (user.app_metadata as { role?: string })?.role ||
    (user.user_metadata as { role?: string })?.role ||
    null

  if (derivedRole !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
