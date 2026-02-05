'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface MobileMenuProps {
  isLoggedIn: boolean
  userFullName?: string
}

export function MobileMenu({ isLoggedIn, userFullName }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    async function fetchUserRole() {
      if (!isLoggedIn) return
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const metaRole =
          profile?.role ||
          (user.app_metadata as { role?: string })?.role ||
          (user.user_metadata as { role?: string })?.role ||
          null
        setUserRole(metaRole)
      }
    }
    
    fetchUserRole()
  }, [isLoggedIn])

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const jobSeekerLinks = [
    { href: '/', label: 'Home' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/saved-jobs', label: 'Saved Jobs' },
    { href: '/applications', label: 'Applications' },
    { href: isLoggedIn ? '/recommendations' : '/profile', label: isLoggedIn ? 'Recommendations' : 'Profile' },
  ]

  const employerLinks = [
    { href: '/', label: 'Home' },
    { href: '/employer/dashboard', label: 'Dashboard' },
    { href: '/post-job', label: 'Post Job' },
    { href: '/profile', label: 'Profile' },
  ]

  const adminLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/reports', label: 'Reports' },
    { href: '/admin/companies', label: 'Companies' },
    { href: '/admin/jobs', label: 'Jobs' },
  ]

  const navLinks = userRole === 'admin' 
    ? adminLinks 
    : userRole === 'employer' 
    ? employerLinks 
    : jobSeekerLinks

  return (
    <>
      {/* Burger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-slate-700" />
        ) : (
          <Menu className="w-6 h-6 text-slate-700" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-72 bg-white shadow-xl z-50 md:hidden overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <Link 
                  href="/" 
                  className="text-2xl font-bold text-sky-500"
                  onClick={() => setIsOpen(false)}
                >
                  HireLy
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-700" />
                </button>
              </div>

              {/* User Info */}
              {isLoggedIn && userFullName && (
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 hover:bg-slate-50 p-3 rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                      {userFullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{userFullName}</div>
                      <div className="text-sm text-slate-500 capitalize">{userRole || 'User'}</div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="space-y-2 mb-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-lg font-medium transition-colors",
                      pathname === link.href
                        ? "bg-sky-50 text-sky-600"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Auth Buttons */}
              {!isLoggedIn && (
                <div className="space-y-3 pt-6 border-t border-slate-200">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary w-full justify-center"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="btn-primary w-full justify-center"
                  >
                    Create Account
                  </Link>
                </div>
              )}

              {/* Logout */}
              {isLoggedIn && (
                <div className="pt-6 border-t border-slate-200">
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
