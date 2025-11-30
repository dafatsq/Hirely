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

console.log('Loaded env vars:', Object.keys(envVars))

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedAdmin() {
  try {
    console.log('Creating admin user...')

    // Try to create auth user, or get existing
    let userId
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@hirely.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'System Administrator'
      }
    })

    if (authError) {
      if (authError.code === 'email_exists') {
        console.log('Auth user already exists, looking up user ID...')
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(u => u.email === 'admin@hirely.com')
        if (existingUser) {
          userId = existingUser.id
          console.log('Found existing auth user:', userId)
        } else {
          console.error('Could not find existing user')
          process.exit(1)
        }
      } else {
        console.error('Auth error:', authError)
        process.exit(1)
      }
    } else {
      userId = authData.user.id
      console.log('Auth user created:', userId)
    }

    // Create user record
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: 'admin@hirely.com',
        full_name: 'System Administrator',
        role: 'admin',
        created_at: new Date().toISOString()
      })

    if (userError) {
      console.error('User table error:', userError)
      process.exit(1)
    }

    // Create admin record
    const { error: adminError } = await supabase
      .from('admins')
      .upsert({
        user_id: userId
      })

    if (adminError) {
      console.error('Admin table error:', adminError)
      process.exit(1)
    }

    console.log('✅ Admin account created successfully!')
    console.log('Email: admin@hirely.com')
    console.log('Password: admin123')
    console.log('\nPlease change the password after first login.')

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

seedAdmin()
