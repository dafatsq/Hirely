import { createClient } from '@supabase/supabase-js'

let adminClient: ReturnType<typeof createClient> | null = null

export function createAdminClient() {
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Creating admin client...')
    console.log('URL exists:', !!supabaseUrl)
    console.log('Service key exists:', !!serviceKey)

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase admin credentials')
    }

    adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    console.log('Admin client created successfully')
  }

  return adminClient
}
