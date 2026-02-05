import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ApplyForm } from "./ApplyForm"
import type { ScreeningQuestion } from "./types"

interface PageProps {
  params: Promise<{ id: string }>
}

interface JobSummary {
  id: string
  title: string
  location: string | null
  type: string | null
  salaryMin: number | null
  salaryMax: number | null
  companyName: string
  companyLogo: string | null
  skills: string[]
}

type CompanyInfo = {
  name: string | null
  logo_url: string | null
} | null

interface JobRow {
  id: string
  title: string
  location: string | null
  type: string | null
  salary_min: number | null
  salary_max: number | null
  skills: string[] | null
  companies: CompanyInfo | CompanyInfo[]
}

export const dynamic = "force-dynamic"

async function getJobForApply(id: string): Promise<JobSummary | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("job_postings")
    .select(
      `id, title, location, type, salary_min, salary_max, skills, companies!inner (name, logo_url)`
    )
    .eq("id", id)
    .single()

  if (error || !data) {
    return null
  }

  const job = data as JobRow
  const company = job.companies
    ? (Array.isArray(job.companies) ? job.companies[0] : job.companies)
    : null

  return {
    id: job.id,
    title: job.title,
    location: job.location,
    type: job.type,
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    companyName: company?.name ?? "Company",
    companyLogo: company?.logo_url ?? null,
    skills: Array.isArray(job.skills) ? job.skills : [],
  }
}

function buildScreeningQuestions(job: JobSummary): ScreeningQuestion[] {
  const [primarySkill, secondarySkill] = job.skills
  return [
    {
      id: "experience",
      question: `How many years of experience do you have working as a ${job.title}?`,
      required: true,
    },
    {
      id: "project",
      question: primarySkill
        ? `Describe a recent project where you used ${primarySkill}.`
        : "Describe a recent project that showcases your impact.",
      required: true,
    },
    {
      id: "collaboration",
      question: secondarySkill
        ? `How do you collaborate with teammates when tackling ${secondarySkill}-related work?`
        : "How do you collaborate with cross-functional teammates to deliver results?",
      required: true,
    },
  ]
}

function formatSalaryRange(min: number | null, max: number | null) {
  if (min && max) {
    return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k per year`
  }
  if (min) {
    return `$${(min / 1000).toFixed(0)}k+ per year`
  }
  if (max) {
    return `$${(max / 1000).toFixed(0)}k per year`
  }
  return "Salary info not provided"
}

function getCompanyInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "H"
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const job = await getJobForApply(id)

  if (!job) {
    return {
      title: "Apply for Job | HireLy",
      description: "Submit your application on HireLy.",
    }
  }

  return {
    title: `Apply for ${job.title} | HireLy`,
    description: `Send your application for the ${job.title} role at ${job.companyName}.`,
  }
}

export default async function ApplyJobPage({ params }: PageProps) {
  const { id } = await params
  const job = await getJobForApply(id)

  if (!job) {
    notFound()
  }

  const screeningQuestions = buildScreeningQuestions(job)

  return (
    <section className="px-6 md:px-8 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-500 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Job Details
          </Link>
        </div>

        <article className="card p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-2xl font-bold">
              {getCompanyInitial(job.companyName)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              <p className="text-slate-600">{job.companyName}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {job.location && <span className="badge badge-blue">{job.location}</span>}
            {job.type && <span className="badge badge-blue">{job.type}</span>}
            <span className="badge badge-blue">{formatSalaryRange(job.salaryMin, job.salaryMax)}</span>
          </div>
        </article>

        <ApplyForm
          jobId={job.id}
          jobTitle={job.title}
          companyName={job.companyName}
          screeningQuestions={screeningQuestions}
        />
      </div>
    </section>
  )
}
