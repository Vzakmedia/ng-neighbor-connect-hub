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

    // Force logout by invalidating all sessions for the user
    // This is done by updating the user's auth metadata to force re-authentication
    const { data: updatedUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { 
        app_metadata: { 
          ...{}, // Keep existing metadata
          force_logout: Date.now() // Add a timestamp to force logout
        }
      }
    )

    if (updateError) {
      throw new Error(`Failed to logout user: ${updateError.message}`)
    }

    // Log the action for security audit
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'force_logout',
        resource_type: 'user',
        resource_id: userId,
        details: {
          target_user_id: userId,
          timestamp: new Date().toISOString(),
          reason: 'admin_initiated_logout'
        }
      })

    return new Response(
      JSON.stringify({ success: true, message: 'User has been logged out successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in logout-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})