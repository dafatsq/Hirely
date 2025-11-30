import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Flag, Building, Briefcase } from 'lucide-react'

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

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/reports', icon: Flag, label: 'Reports' },
    { href: '/admin/companies', icon: Building, label: 'Companies' },
    { href: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">HireLy Management</p>
        </div>
        
        <nav className="px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors mb-1"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-slate-200">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
          >
            ← Back to Main Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
