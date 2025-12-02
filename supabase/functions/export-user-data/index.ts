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

    console.log(`Exporting data for user: ${user.id}`)

    // Collect all user data
    const userData: Record<string, any> = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      email: user.email,
    }

    // Profile data
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    userData.profile = profile

    // User settings
    const { data: settings } = await supabaseClient
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
    userData.settings = settings

    // Messaging preferences
    const { data: messagingPrefs } = await supabaseClient
      .from('messaging_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
    userData.messagingPreferences = messagingPrefs

    // Community posts
    const { data: posts } = await supabaseClient
      .from('community_posts')
      .select('id, content, post_type, created_at, location')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    userData.communityPosts = posts

    // Marketplace items
    const { data: items } = await supabaseClient
      .from('marketplace_items')
      .select('id, title, description, price, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    userData.marketplaceItems = items

    // Services
    const { data: services } = await supabaseClient
      .from('services')
      .select('id, title, description, price, category, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    userData.services = services

    // Emergency contacts (outgoing)
    const { data: emergencyContacts } = await supabaseClient
      .from('emergency_contacts')
      .select('id, contact_name, contact_phone, relationship, created_at')
      .eq('user_id', user.id)
    userData.emergencyContacts = emergencyContacts

    // Activity logs (user's own)
    const { data: activityLogs } = await supabaseClient
      .from('activity_logs')
      .select('action_type, resource_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    userData.activityLogs = activityLogs

    // Message count (not content for privacy)
    const { count: messagesSent } = await supabaseClient
      .from('direct_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
    userData.messagesSentCount = messagesSent

    const { count: messagesReceived } = await supabaseClient
      .from('direct_messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
    userData.messagesReceivedCount = messagesReceived

    // Log the export action
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'data_export',
        resource_type: 'user_data',
        resource_id: user.id,
        details: {
          timestamp: new Date().toISOString(),
        }
      })

    console.log(`Data export completed for user: ${user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        data: userData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in export-user-data function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
