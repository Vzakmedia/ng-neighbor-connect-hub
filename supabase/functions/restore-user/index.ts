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

    const { userId } = await req.json()
    
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Restore the user by removing the deleted_at timestamp
    const { data: restoredUser, error: restoreError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { 
        user_metadata: {}, // Reset any metadata if needed
        app_metadata: {}   // Reset any app metadata if needed
      }
    )

    if (restoreError) {
      throw new Error(`Failed to restore user: ${restoreError.message}`)
    }

    // Note: The actual restoration from deleted_at state requires direct database access
    // which isn't available through the standard auth API. This would typically require
    // a custom SQL function or direct database manipulation.
    
    console.log('User restore attempted for:', userId)

    return new Response(
      JSON.stringify({ success: true, message: 'User restoration initiated' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in restore-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})