'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, Send, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ChatbotPage() {
  const router = useRouter()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Array<{
    id: number
    text: string
    isBot: boolean
    timestamp: Date
  }>>([])
  const [input, setInput] = useState('')
  const [initialized, setInitialized] = useState(false)

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      router.push('/admin')
      return
    }

    setUserRole(profile?.role || null)
    setLoading(false)
  }

  const initializeChat = async () => {
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'INIT',
          conversationHistory: []
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([{
          id: Date.now(),
          text: data.response,
          isBot: true,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error)
    }
  }

  useEffect(() => {
    checkUserRole()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Send initial greeting once user role is loaded
    if (userRole && !initialized) {
      initializeChat()
      setInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, initialized])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const userMessage = {
      id: messages.length + 1,
      text: input,
      isBot: false,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          userRole: userRole,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.isBot ? 'assistant' : 'user',
            content: m.text
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const botResponse = {
        id: messages.length + 2,
        text: data.response,
        isBot: true,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = {
        id: messages.length + 2,
        text: 'Sorry, I encountered an error. Please try again.',
        isBot: true,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <section className="px-6 md:px-8 mb-12">
        <div className="max-w-4xl mx-auto">
          <div className="card p-12 text-center">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="px-6 md:px-8 mb-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">HireLy Assistant</h1>
          <p className="text-slate-600">
            Get instant help navigating HireLy and understanding how to use all features
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-sky-800">
            <p className="font-medium mb-1">About HireLy Assistant</p>
            <p>I can help you understand how to use HireLy features, navigate the platform, and answer questions about job searching{userRole === 'employer' ? ', posting jobs, and managing your company' : ' and applications'}.</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          {/* Chat Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isBot ? '' : 'flex-row-reverse'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isBot
                      ? 'bg-gradient-to-br from-sky-500 to-indigo-500'
                      : 'bg-slate-200'
                  }`}
                >
                  {message.isBot ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-sm font-medium">You</span>
                  )}
                </div>
                <div
                  className={`max-w-[75%] p-4 rounded-2xl ${
                    message.isBot
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-sky-500 text-white'
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-slate-100 p-4 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about using HireLy..."
                className="input flex-1"
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
