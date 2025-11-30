const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}

// Split by line endings (handle both \r\n and \n)
const lines = envContent.split(/\r?\n/)
lines.forEach(line => {
  // Skip empty lines and comments
  if (!line.trim() || line.trim().startsWith('#')) return
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyAdminPolicies() {
  try {
    console.log('Applying admin access policies...')

    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-admin-policies.sql'),
      'utf-8'
    )

    // Split by semicolons and execute each statement
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
      
      if (error) {
        console.error('Error executing statement:', error)
        console.log('Statement:', statement.substring(0, 100) + '...')
      } else {
        console.log('✓ Policy applied')
      }
    }

    console.log('\n✅ Admin policies applied successfully!')
    console.log('Admins can now access all data in the admin panel.')

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

applyAdminPolicies()
