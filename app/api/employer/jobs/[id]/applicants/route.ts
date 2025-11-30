import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify user is employer for this job posting
    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .select("id, employer_id, title")
      .eq("id", id)
      .single()

    if (jobError || !job) {
      console.error('Job not found:', id, jobError)
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    console.log('Job found:', job)
    console.log('Current user:', user.id)
    console.log('Job employer:', job.employer_id)

    if (job.employer_id !== user.id) {
      console.error('Forbidden: User is not the employer for this job')
      return NextResponse.json(
        { error: "Forbidden - You are not the employer for this job" },
        { status: 403 }
      )
    }

    // Fetch applications with user details
    const { data: applications, error } = await supabase
      .from("job_applications")
      .select(
        `
        id,
        status,
        cover_letter,
        resume_url,
        portfolio_url,
        linkedin_url,
        expected_salary,
        start_date,
        screening_answers,
        applied_at,
        user_id
      `
      )
      .eq("job_posting_id", id)
      .order("applied_at", { ascending: false })

    if (error) {
      console.error("Error fetching applications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch user details for each application
    const userIds = applications?.map(app => app.user_id) || []
    
    if (userIds.length === 0) {
      return NextResponse.json({ applications: [] })
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, avatar_url, job_seekers(skills)")
      .in("id", userIds)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    console.log('Fetched users:', users)
    console.log('User IDs from applications:', userIds)

    // Combine applications with user data
    const applicationsWithUsers = applications?.map(app => {
      const user = users?.find(u => u.id === app.user_id)
      console.log(`Matching user for ${app.user_id}:`, user)
      
      // Flatten skills
      const skills = Array.isArray(user?.job_seekers) ? user.job_seekers[0]?.skills : []
      
      return {
        ...app,
        users: user ? {
          ...user,
          skills
        } : { 
          id: app.user_id, 
          full_name: null, 
          email: 'Unknown', 
          avatar_url: null,
          skills: []
        }
      }
    }) || []

    console.log('Applications with users (final):', JSON.stringify(applicationsWithUsers, null, 2))

    return NextResponse.json({ applications: applicationsWithUsers })
  } catch (error) {
    console.error("Error fetching applicants:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { applicationId, status } = await request.json()

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: "Application ID and status are required" },
        { status: 400 }
      )
    }

    // Verify user is employer for this job
    const { data: job } = await supabase
      .from("job_postings")
      .select("employer_id")
      .eq("id", id)
      .single()

    if (!job || job.employer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update application status
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", applicationId)
      .eq("job_posting_id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating application status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
