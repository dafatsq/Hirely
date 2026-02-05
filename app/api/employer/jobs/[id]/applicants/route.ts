import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIP, rateLimitExceeded } from "@/lib/rate-limit"
import { validateUUID, secureErrorResponse, logSecurityEvent } from "@/lib/security"
import { updateApplicationStatusSchema } from "@/lib/validations"
import { z } from "zod"

interface RouteContext {
  params: Promise<{ id: string }>
}

const patchApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(['pending', 'reviewing', 'accepted', 'rejected']),
})

export async function GET(request: Request, context: RouteContext) {
  // Rate limiting
  const ip = getClientIP(request)
  const rateLimitResult = checkRateLimit(ip, 'default')
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult) as unknown as NextResponse
  }

  const supabase = await createClient()
  const { id } = await context.params

  // Validate UUID
  const uuidError = validateUUID(id)
  if (uuidError) return uuidError

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
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (job.employer_id !== user.id) {
      logSecurityEvent('unauthorized_job_access', { userId: user.id, jobId: id }, 'warn')
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
      return secureErrorResponse("Failed to fetch applications")
    }

    // Fetch user details for each application
    const userIds = applications?.map(app => app.user_id) || []
    
    if (userIds.length === 0) {
      return NextResponse.json({ applicants: [] })
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, avatar_url, job_seekers(skills)")
      .in("id", userIds)

    if (usersError) {
      return secureErrorResponse("Failed to fetch user details")
    }

    // Combine applications with user data
    const applicationsWithUsers = applications?.map(app => {
      const user = users?.find(u => u.id === app.user_id)
      
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

    return NextResponse.json({ applicants: applicationsWithUsers })
  } catch {
    return secureErrorResponse("Internal server error")
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  // Rate limiting
  const ip = getClientIP(request)
  const rateLimitResult = checkRateLimit(ip, 'default')
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult) as unknown as NextResponse
  }

  const supabase = await createClient()
  const { id } = await context.params

  // Validate UUID
  const uuidError = validateUUID(id)
  if (uuidError) return uuidError

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Validate input
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const result = patchApplicationSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      )
    }

    const { applicationId, status } = result.data

    // Verify user is employer for this job
    const { data: job } = await supabase
      .from("job_postings")
      .select("employer_id")
      .eq("id", id)
      .single()

    if (!job || job.employer_id !== user.id) {
      logSecurityEvent('unauthorized_status_update', { userId: user.id, jobId: id }, 'warn')
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update application status
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", applicationId)
      .eq("job_posting_id", id)

    if (updateError) {
      return secureErrorResponse("Failed to update application status")
    }

    logSecurityEvent('application_status_updated', { applicationId, status, updatedBy: user.id }, 'info')
    return NextResponse.json({ success: true })
  } catch {
    return secureErrorResponse("Internal server error")
  }
}
