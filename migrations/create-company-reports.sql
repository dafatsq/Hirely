-- ==========================================
-- COMPANY REPORTS SYSTEM
-- Allows job seekers to flag suspicious or abusive companies
-- ==========================================

CREATE TABLE IF NOT EXISTS public.company_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_reports_application_id ON public.company_reports(application_id);
CREATE INDEX IF NOT EXISTS idx_company_reports_company_id ON public.company_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_company_reports_user_id ON public.company_reports(user_id);

ALTER TABLE public.company_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their reports" ON public.company_reports
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports for their applications" ON public.company_reports
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.job_applications
            WHERE id = application_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their reports" ON public.company_reports
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their reports" ON public.company_reports
    FOR DELETE
    USING (auth.uid() = user_id);
