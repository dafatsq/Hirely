import Link from 'next/link'
import { Facebook, Twitter, Linkedin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function Footer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let role = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role
  }

  return (
    <footer className="px-6 md:px-8 pb-8">
      <div className="card max-w-7xl mx-auto p-8 md:p-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-xl font-bold text-sky-500 mb-4">HireLy</h4>
            <p className="text-slate-600 text-sm">
              Your trusted partner in finding the perfect career opportunity.
            </p>
          </div>

          {/* Dynamic Content based on Role */}
          {role === 'admin' ? (
            <>
              <div>
                <h5 className="font-semibold mb-3">Admin Controls</h5>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><Link href="/admin" className="hover:text-sky-500">Dashboard</Link></li>
                  <li><Link href="/admin/companies" className="hover:text-sky-500">Manage Companies</Link></li>
                  <li><Link href="/admin/jobs" className="hover:text-sky-500">Manage Jobs</Link></li>
                  <li><Link href="/admin/reports" className="hover:text-sky-500">Reports</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-3">System</h5>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><Link href="/profile" className="hover:text-sky-500">My Profile</Link></li>
                </ul>
              </div>
            </>
          ) : role === 'employer' ? (
            <>
              <div>
                <h5 className="font-semibold mb-3">For Employers</h5>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><Link href="/employer/dashboard" className="hover:text-sky-500">Dashboard</Link></li>
                  <li><Link href="/post-job" className="hover:text-sky-500">Post a Job</Link></li>
                  <li><Link href="/employer/jobs" className="hover:text-sky-500">My Jobs</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-3">Company</h5>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><Link href="/profile" className="hover:text-sky-500">Company Profile</Link></li>
                  <li><Link href="/employer/register-company" className="hover:text-sky-500">Company Settings</Link></li>
                </ul>
              </div>
            </>
          ) : (
            /* Job Seeker or Guest */
            <>
              <div>
                <h5 className="font-semibold mb-3">For Job Seekers</h5>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><Link href="/jobs" className="hover:text-sky-500">Browse Jobs</Link></li>
                  {role === 'job_seeker' && (
                    <>
                      <li><Link href="/saved-jobs" className="hover:text-sky-500">Saved Jobs</Link></li>
                      <li><Link href="/applications" className="hover:text-sky-500">Track Applications</Link></li>
                      <li><Link href="/recommendations" className="hover:text-sky-500">Recommendations</Link></li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-3">Tools & Support</h5>
                <ul className="space-y-2 text-sm text-slate-600">
                  {role === 'job_seeker' && (
                    <li><Link href="/profile" className="hover:text-sky-500">Profile</Link></li>
                  )}
                  <li><Link href="/chatbot" className="hover:text-sky-500">Career Assistant</Link></li>
                  {role === 'job_seeker' && (
                    <li><Link href="/rate-company" className="hover:text-sky-500">Rate Companies</Link></li>
                  )}
                </ul>
              </div>
            </>
          )}

          <div>
            <h5 className="font-semibold mb-3">General</h5>
            <ul className="space-y-2 text-sm text-slate-600">
              {!user && (
                <>
                  <li><Link href="/login" className="hover:text-sky-500">Login</Link></li>
                  <li><Link href="/register" className="hover:text-sky-500">Register</Link></li>
                  <li><Link href="/employer/register-company" className="hover:text-sky-500">For Employers</Link></li>
                </>
              )}
              {user && (
                 <li><Link href="/api/auth/logout" className="hover:text-sky-500">Logout</Link></li>
              )}
              <li><Link href="/about" className="hover:text-sky-500">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-sky-500">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-600">© 2025 HireLy. All rights reserved.</p>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-sky-100 flex items-center justify-center transition-colors"
            >
              <Facebook className="w-5 h-5 text-slate-600" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-sky-100 flex items-center justify-center transition-colors"
            >
              <Twitter className="w-5 h-5 text-slate-600" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-sky-100 flex items-center justify-center transition-colors"
            >
              <Linkedin className="w-5 h-5 text-slate-600" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
