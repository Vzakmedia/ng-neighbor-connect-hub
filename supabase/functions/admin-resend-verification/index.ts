import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !adminUser) {
      throw new Error('Unauthorized');
    }

    const { action, userId, email } = await req.json();

    if (!action || (!userId && !email)) {
      throw new Error('Missing required parameters');
    }

    let targetUser;
    let recipientEmail;

    // Get user information
    if (userId) {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError || !user) {
        throw new Error('User not found');
      }
      targetUser = user;
      recipientEmail = user.email;
    } else {
      recipientEmail = email;
    }

    if (action === 'resend') {
      // Generate new verification email
      const { error: resendError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: recipientEmail!,
        options: {
          redirectTo: `${req.headers.get('origin') || 'https://neighborlink.ng'}/auth/verify-email`
        }
      });

      if (resendError) {
        console.error('Resend error:', resendError);
        
        // Log failed attempt
        await supabaseAdmin.from('email_audit_logs').insert({
          user_id: targetUser?.id,
          recipient_email: recipientEmail,
          email_type: 'admin_resend',
          action_type: 'failed',
          sent_by_admin_id: adminUser.id,
          error_message: resendError.message,
          metadata: { action: 'resend' }
        });

        throw resendError;
      }

      // Log successful resend
      await supabaseAdmin.from('email_audit_logs').insert({
        user_id: targetUser?.id,
        recipient_email: recipientEmail,
        email_type: 'admin_resend',
        action_type: 'sent',
        sent_by_admin_id: adminUser.id,
        metadata: { action: 'resend' }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification email sent successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'verify') {
      if (!userId) {
        throw new Error('User ID required for manual verification');
      }

      // Manually verify the user's email
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      );

      if (updateError) {
        console.error('Manual verification error:', updateError);
        
        // Log failed attempt
        await supabaseAdmin.from('email_audit_logs').insert({
          user_id: userId,
          recipient_email: recipientEmail!,
          email_type: 'admin_manual_verification',
          action_type: 'failed',
          sent_by_admin_id: adminUser.id,
          error_message: updateError.message,
          metadata: { action: 'manual_verify' }
        });

        throw updateError;
      }

      // Log successful manual verification
      await supabaseAdmin.from('email_audit_logs').insert({
        user_id: userId,
        recipient_email: recipientEmail!,
        email_type: 'admin_manual_verification',
        action_type: 'manually_verified',
        sent_by_admin_id: adminUser.id,
        metadata: { action: 'manual_verify' }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User email verified successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'delete') {
      if (!userId) {
        throw new Error('User ID required for deletion');
      }

      // Delete the user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('User deletion error:', deleteError);
        
        // Log failed attempt
        await supabaseAdmin.from('email_audit_logs').insert({
          user_id: userId,
          recipient_email: recipientEmail!,
          email_type: 'admin_user_deletion',
          action_type: 'failed',
          sent_by_admin_id: adminUser.id,
          error_message: deleteError.message,
          metadata: { action: 'delete' }
        });

        throw deleteError;
      }

      // Log successful deletion
      await supabaseAdmin.from('email_audit_logs').insert({
        user_id: userId,
        recipient_email: recipientEmail!,
        email_type: 'admin_user_deletion',
        action_type: 'deleted',
        sent_by_admin_id: adminUser.id,
        metadata: { action: 'delete' }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User deleted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error in admin-resend-verification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
