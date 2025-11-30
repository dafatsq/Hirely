"use client"

import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, UploadCloud, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { ScreeningQuestion } from "./types"
import { useToast } from "@/components/ToastProvider"

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

type ApplyFormProps = {
  jobId: string
  jobTitle: string
  companyName: string
  screeningQuestions: ScreeningQuestion[]
}

type ScreeningAnswers = Record<string, string>

export function ApplyForm({ jobId, jobTitle, companyName, screeningQuestions }: ApplyFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [portfolio, setPortfolio] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [expectedSalary, setExpectedSalary] = useState("")
  const [startDate, setStartDate] = useState("")
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [answers, setAnswers] = useState<ScreeningAnswers>(() =>
    screeningQuestions.reduce<ScreeningAnswers>((acc, question) => {
      acc[question.id] = ""
      return acc
    }, {})
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validation functions
  const validateUrl = (url: string) => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateLinkedin = (url: string) => {
    if (!url) return true
    return url.includes('linkedin.com/')
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    handleFile(file)
  }

  function handleFile(file?: File) {
    if (!file) return

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      showToast("Please upload a PDF, DOC, or DOCX file.", 'error')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast("File size must be less than 10MB.", 'error')
      return
    }

    setUploadedFile(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    handleFile(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    const newErrors: Record<string, string> = {}

    // Validate Required Fields
    if (!uploadedFile) newErrors.resume = "Please upload your resume"
    if (!startDate) newErrors.startDate = "Please select a start date"
    if (!consent) newErrors.consent = "You must agree to the privacy policy"
    
    // Validate Screening Questions
    screeningQuestions.forEach(q => {
      if (q.required && !answers[q.id]?.trim()) {
        newErrors[`question_${q.id}`] = "This answer is required"
      }
    })

    // Validate URLs
    if (portfolio && !validateUrl(portfolio)) {
      newErrors.portfolio = "Please enter a valid Portfolio URL (e.g., https://example.com)"
    }

    if (linkedin && !validateLinkedin(linkedin)) {
      newErrors.linkedin = "Please enter a valid LinkedIn profile URL"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Scroll to top error
      const firstError = document.querySelector('.text-red-500')
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        showToast("Please log in to submit an application.", 'info')
        router.push("/login")
        return
      }

      let resumeUrl = null

      // Upload resume
      if (uploadedFile) {
        const fileName = `${user.id}/${Date.now()}_${uploadedFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(fileName, uploadedFile, {
            cacheControl: "3600",
            upsert: false,
          })

      if (uploadError) {
        console.error("Resume upload failed:", uploadError)
        showToast(`Failed to upload resume: ${uploadError.message}. Please try again.`, 'error')
        setIsSubmitting(false)
        return
      }        resumeUrl = uploadData.path
      }

      // Insert application into database
      const { error: insertError } = await supabase.from("job_applications").insert({
        user_id: user.id,
        job_posting_id: jobId,
        status: "pending",
        cover_letter: coverLetter || null,
        resume_url: resumeUrl,
        portfolio_url: portfolio || null,
        linkedin_url: linkedin || null,
        expected_salary: expectedSalary ? parseInt(expectedSalary) : null,
        start_date: startDate,
        screening_answers: screeningQuestions.map((question) => ({
          id: question.id,
          question: question.question,
          answer: answers[question.id] ?? "",
        })),
      })

      if (insertError) {
        console.error("Application insert failed:", insertError)
        showToast(`Failed to submit application: ${insertError.message}. Please try again or contact support.`, 'error')
        setIsSubmitting(false)
        return
      }

      showToast("Application submitted successfully! The hiring team will reach out if you're a fit.", 'success')
      router.push(`/jobs/${jobId}`)
      router.refresh()
    } catch (error) {
      console.error("Application submission error:", error)
      showToast("An error occurred. Please try again.", 'error')
      setIsSubmitting(false)
    }
  }

  const fileInfo = uploadedFile
    ? `${uploadedFile.name} • ${formatFileSize(uploadedFile.size)}`
    : "PDF, DOC, or DOCX up to 10MB"

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Resume / CV</h2>
        <p className="text-sm text-slate-600 mb-6">Upload your resume or select from a previously uploaded file.</p>

        <div className="space-y-4">
          {errors.resume && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errors.resume}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="sr-only"
            onChange={handleFileChange}
          />

          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-sky-400 bg-sky-50/60"
                : uploadedFile
                  ? "border-green-300 bg-green-50/70"
                  : "border-slate-200 bg-white"
            }`}
            onClick={openFilePicker}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <UploadCloud className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="font-medium text-slate-700 mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-slate-500">{fileInfo}</p>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl text-left">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                <p className="text-sm text-slate-600">{formatFileSize(uploadedFile.size)}</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setUploadedFile(null)}
              >
                <X className="w-5 h-5" />
                <span className="sr-only">Remove file</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Cover Letter (Optional)</h2>
        <p className="text-sm text-slate-600 mb-4">Tell the employer why you&apos;re a great fit for this role.</p>
        <textarea
          className="input min-h-[180px] resize-none"
          placeholder={`Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} role at ${companyName}...`}
          value={coverLetter}
          onChange={(event) => setCoverLetter(event.target.value)}
          maxLength={2000}
        />
        <div className="flex justify-between items-center mt-2 text-sm text-slate-500">
          <span>Write a compelling cover letter to stand out.</span>
          <span>{coverLetter.length} / 2000</span>
        </div>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Screening Questions</h2>
        <p className="text-sm text-slate-600 mb-6">Provide concise answers to help the hiring team evaluate your fit.</p>
        <div className="space-y-6">
          {screeningQuestions.map((question) => (
            <div key={question.id}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {errors[`question_${question.id}`] && (
                <p className="text-red-500 text-sm mb-2">{errors[`question_${question.id}`]}</p>
              )}
              <textarea
                className="input min-h-[120px] resize-none"
                placeholder="Type your answer here..."
                required={question.required}
                value={answers[question.id]}
                onChange={(event) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Additional Information</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Portfolio URL (Optional)</label>
            {errors.portfolio && <p className="text-red-500 text-sm mb-2">{errors.portfolio}</p>}
            <input
              type="text"
              className="input"
              placeholder="https://yourportfolio.com"
              value={portfolio}
              onChange={(event) => setPortfolio(event.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn Profile (Optional)</label>
            {errors.linkedin && <p className="text-red-500 text-sm mb-2">{errors.linkedin}</p>}
            <input
              type="text"
              className="input"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedin}
              onChange={(event) => setLinkedin(event.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Expected Salary (Optional, USD per year)</label>
            <input
              type="text"
              inputMode="numeric"
              className="input"
              placeholder="145000"
              value={expectedSalary}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, '')
                setExpectedSalary(value)
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Earliest Start Date <span className="text-red-500">*</span>
            </label>
            {errors.startDate && <p className="text-red-500 text-sm mb-2">{errors.startDate}</p>}
            <input
              type="date"
              className="input"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card p-6 md:p-8">
        {errors.consent && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {errors.consent}
          </div>
        )}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 w-5 h-5 text-sky-500 border-slate-300 rounded"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span className="text-sm text-slate-700">
            I confirm the provided information is accurate and consent to HireLy sharing my application with the employer. I agree to the
            <a href="/privacy" className="text-sky-500 hover:underline ml-1">
              Privacy Policy
            </a>
            .
          </span>
        </label>
      </section>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
