'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function NavLinks() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function fetchUserRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setIsLoggedIn(true)
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
  }, [])

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
    <div className="hidden md:flex gap-6 text-sm font-medium">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "transition-colors",
            pathname === link.href
              ? "text-sky-500"
              : "text-slate-700 hover:text-sky-500"
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}
