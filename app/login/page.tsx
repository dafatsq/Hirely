'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

const isDevelopment = process.env.NODE_ENV === 'development'

const DEMO_ACCOUNTS = [
  { email: 'admin@hirely.com', password: 'Admin123', role: 'Administrator', description: 'Full platform management' },
  { email: 'employer@hirely.com', password: 'Employer123', role: 'Employer', description: 'Post jobs & manage applications' },
  { email: 'jobseeker@hirely.com', password: 'Jobseeker123', role: 'Job Seeker', description: 'Browse jobs & manage profile' },
]

export default function LoginPage() {
  const router = useRouter()
  
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/profile')
      }
    }
    checkUser()
  }, [router])
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/profile')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to login'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-md mx-auto">
        <div className="card p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
          <p className="text-slate-600 text-center mb-8">
            Login to your HireLy account
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end text-sm">
              <Link href="/forgot-password" className="text-sky-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {isDevelopment && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 text-center px-2 py-1 bg-slate-50 rounded-md inline-block mx-auto w-full">
                Demo Access (Dev Only)
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email)
                      setPassword(account.password)
                    }}
                    className="text-xs flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="text-left">
                      <p className="font-medium text-slate-700">{account.role}</p>
                      <p className="text-slate-500">{account.description}</p>
                    </div>
                    <span className="text-blue-600 font-medium group-hover:underline">Quick login →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-sky-500 hover:underline font-medium">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
