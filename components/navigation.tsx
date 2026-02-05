import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavLinks } from './nav-links'
import { MobileMenu } from './MobileMenu'

export async function Navigation() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profileData = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    
    profileData = {
      fullName: profile?.full_name || user.user_metadata?.full_name || 'User',
      email: user.email || '',
    }
  }

  return (
    <nav className="p-6 md:p-8">
      <div className="card max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-sky-500">
              HireLy
            </Link>
            <NavLinks />
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/profile" className="hidden md:flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium">{profileData?.fullName}</div>
                    <div className="text-xs text-slate-500">{profileData?.email}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {profileData?.fullName.charAt(0)}
                  </div>
                </Link>
                <MobileMenu isLoggedIn={true} userFullName={profileData?.fullName} />
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary hidden md:block">
                  Login
                </Link>
                <Link href="/register" className="btn-primary hidden md:block">
                  Create Account
                </Link>
                <MobileMenu isLoggedIn={false} />
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
