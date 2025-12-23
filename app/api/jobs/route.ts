import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')

  try {
    // TODO: Query Supabase with filters and pagination
    // For now, return mock data
    const jobs: unknown[] = []

    return NextResponse.json({
      jobs,
      total: 0,
      page,
      totalPages: 0,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
