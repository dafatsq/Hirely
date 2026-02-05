import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ApplicantsClientPage from "./ApplicantsClient"

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Job Applicants | HireLy",
  description: "Review and manage job applications",
}

export default async function ApplicantsPage({ params }: PageProps) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verify user is the employer for this job
  const { data: job } = await supabase
    .from("job_postings")
    .select("id, employer_id, title")
    .eq("id", id)
    .single()

  if (!job || job.employer_id !== user.id) {
    redirect("/")
  }

  return <ApplicantsClientPage />
}
