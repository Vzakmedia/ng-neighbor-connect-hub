import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user making the request
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin permissions
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['super_admin', 'admin'])

    if (roleError || !userRoles || userRoles.length === 0) {
      throw new Error('Insufficient permissions')
    }

    // Get deleted users from auth.users table
    const { data: deletedUsers, error: deletedError } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    if (deletedError) {
      throw new Error(`Failed to fetch users: ${deletedError.message}`)
    }

    // Filter only deleted users
    const filteredDeletedUsers = deletedUsers.users.filter(u => u.deleted_at !== null)

    return new Response(
      JSON.stringify({ 
        success: true, 
        users: filteredDeletedUsers.map(u => ({
          id: u.id,
          email: u.email,
          deleted_at: u.deleted_at,
          created_at: u.created_at
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in get-deleted-users function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})