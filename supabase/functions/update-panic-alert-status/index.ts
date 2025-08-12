import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateStatusRequest {
  panic_alert_id: string;
  new_status: 'active' | 'resolved' | 'investigating' | 'false_alarm';
  update_note?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { panic_alert_id, new_status, update_note }: UpdateStatusRequest = await req.json();

    console.log(`Processing status update for panic alert ${panic_alert_id} by user ${user.id}`);

    // Get the panic alert details
    const { data: panicAlert, error: panicAlertError } = await supabase
      .from('panic_alerts')
      .select('*')
      .eq('id', panic_alert_id)
      .single();

    if (panicAlertError || !panicAlert) {
      return new Response(
        JSON.stringify({ error: 'Panic alert not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is the creator or has elevated permissions
    const isCreator = panicAlert.user_id === user.id;
    let isEmergencyContact = false;

    // Determine if user is a moderator/admin/manager
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    let isModerator = (roles || []).some((r: any) => ['moderator', 'super_admin', 'admin', 'manager'].includes(r.role));

    // Fallback to explicit permission checks via RPC
    if (!isModerator) {
      const { data: hasContentMod } = await supabase.rpc('has_staff_permission', {
        _user_id: user.id,
        _permission: 'content_moderation',
        _access_type: 'write'
      });
      if (hasContentMod === true) isModerator = true;
    }
    if (!isModerator) {
      const { data: hasEmergencyMgmt } = await supabase.rpc('has_staff_permission', {
        _user_id: user.id,
        _permission: 'emergency_management',
        _access_type: 'write'
      });
      if (hasEmergencyMgmt === true) isModerator = true;
    }

    // Check if user is an emergency contact
    if (!isCreator && !isModerator) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone, full_name')
        .eq('user_id', user.id)
        .single();

      if (userProfile?.phone) {
        const { data: emergencyContacts } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', panicAlert.user_id)
          .eq('phone_number', userProfile.phone);

        isEmergencyContact = !!(emergencyContacts && emergencyContacts.length > 0);
      }
    }

    // Authorization check
    if (!isCreator && !isEmergencyContact && !isModerator) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only the alert creator, emergency contacts, or moderators can update status' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authorization passed: isCreator=${isCreator}, isEmergencyContact=${isEmergencyContact}, isModerator=${isModerator}`);

    // Update panic alert status
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (new_status === 'resolved') {
      updateData.is_resolved = true;
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
    } else {
      updateData.is_resolved = false;
      updateData.resolved_at = null;
      updateData.resolved_by = null;
    }

    const { error: updateError } = await supabase
      .from('panic_alerts')
      .update(updateData)
      .eq('id', panic_alert_id);

    if (updateError) {
      console.error('Error updating panic alert:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update panic alert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update corresponding safety alert
    const safetyAlertUpdate: any = {
      status: new_status,
      updated_at: new Date().toISOString()
    };

    if (new_status === 'resolved') {
      safetyAlertUpdate.verified_at = new Date().toISOString();
      safetyAlertUpdate.verified_by = user.id;
    }

    const { error: safetyUpdateError } = await supabase
      .from('safety_alerts')
      .update(safetyAlertUpdate)
      .eq('user_id', panicAlert.user_id)
      .eq('severity', 'critical')
      .gte('created_at', new Date(new Date(panicAlert.created_at).getTime() - 1000).toISOString())
      .lte('created_at', new Date(new Date(panicAlert.created_at).getTime() + 1000).toISOString());

    if (safetyUpdateError) {
      console.error('Error updating safety alert:', safetyUpdateError);
      // Don't fail the request if safety alert update fails
    }

    // Add status update note if provided
    if (update_note) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      // Find corresponding safety alert ID
      const { data: safetyAlert } = await supabase
        .from('safety_alerts')
        .select('id')
        .eq('user_id', panicAlert.user_id)
        .eq('severity', 'critical')
        .gte('created_at', new Date(new Date(panicAlert.created_at).getTime() - 1000).toISOString())
        .lte('created_at', new Date(new Date(panicAlert.created_at).getTime() + 1000).toISOString())
        .single();

      if (safetyAlert) {
        await supabase
          .from('alert_responses')
          .insert({
            alert_id: safetyAlert.id,
            user_id: user.id,
            response_type: 'status_update',
            comment: `Status updated to ${new_status.replace('_', ' ')} by ${userProfile?.full_name || 'User'}: ${update_note}`
          });
      }
    }

    // Get updated panic alert data
    const { data: updatedAlert } = await supabase
      .from('panic_alerts')
      .select('*')
      .eq('id', panic_alert_id)
      .single();

    console.log(`Successfully updated panic alert ${panic_alert_id} to status: ${new_status}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        panic_alert: updatedAlert,
        message: `Panic alert status updated to ${new_status.replace('_', ' ')}` 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in update-panic-alert-status function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);