import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await request.json()

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
  }

  try {
    // TODO: Insert into job_applications table
    const applicationData = {
      user_id: user.id,
      job_posting_id: jobId,
      status: 'pending',
      applied_at: new Date().toISOString(),
    }

    // Mock response for now
    return NextResponse.json({
      success: true,
      application: applicationData,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // TODO: Fetch from job_applications table
    const applications = []

    return NextResponse.json({ applications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
