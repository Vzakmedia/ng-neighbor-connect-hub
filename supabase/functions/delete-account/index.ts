import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Verify the user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { confirmation } = await req.json()
    
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      throw new Error('Invalid confirmation. Please type DELETE_MY_ACCOUNT to confirm.')
    }

    console.log(`Processing account deletion for user: ${user.id}`)

    // Store email for logging before deletion
    const userEmail = user.email

    // Log the deletion action before proceeding
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'account_deletion_initiated',
        resource_type: 'user',
        resource_id: user.id,
        details: {
          email: userEmail,
          timestamp: new Date().toISOString(),
        }
      })

    // Delete user data in order (respecting foreign key constraints)
    // Note: Some tables may have cascading deletes set up
    
    // Delete user's messages
    await supabaseClient
      .from('direct_messages')
      .delete()
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)

    // Delete conversations
    await supabaseClient
      .from('direct_conversations')
      .delete()
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)

    // Delete community posts and related
    await supabaseClient
      .from('post_likes')
      .delete()
      .eq('user_id', user.id)

    await supabaseClient
      .from('post_comments')
      .delete()
      .eq('user_id', user.id)

    await supabaseClient
      .from('community_posts')
      .delete()
      .eq('user_id', user.id)

    // Delete marketplace items
    await supabaseClient
      .from('marketplace_items')
      .delete()
      .eq('user_id', user.id)

    // Delete services
    await supabaseClient
      .from('services')
      .delete()
      .eq('user_id', user.id)

    // Delete emergency contacts
    await supabaseClient
      .from('emergency_contacts')
      .delete()
      .eq('user_id', user.id)

    // Delete emergency contact requests
    await supabaseClient
      .from('emergency_contact_requests')
      .delete()
      .or(`requester_id.eq.${user.id},target_user_id.eq.${user.id}`)

    // Delete user settings
    await supabaseClient
      .from('user_settings')
      .delete()
      .eq('user_id', user.id)

    // Delete messaging preferences
    await supabaseClient
      .from('messaging_preferences')
      .delete()
      .eq('user_id', user.id)

    // Delete notification preferences
    await supabaseClient
      .from('notification_preferences')
      .delete()
      .eq('user_id', user.id)

    // Delete user roles
    await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', user.id)

    // Delete profile
    await supabaseClient
      .from('profiles')
      .delete()
      .eq('user_id', user.id)

    // Finally, delete the auth user
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      throw new Error(`Failed to delete account: ${deleteError.message}`)
    }

    console.log(`Account successfully deleted for user: ${user.id} (${userEmail})`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your account has been permanently deleted.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in delete-account function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
