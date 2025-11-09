import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateKeyRequest {
  company_name: string;
  company_domain?: string;
  billing_email: string;
  technical_contact_email: string;
  industry?: string;
  company_size?: string;
  website?: string;
  request_id?: string;
  key_name: string;
  environment: 'production' | 'development' | 'staging';
  permissions: string[];
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  expires_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user has admin role
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin']);

    if (roleError || !userRoles || userRoles.length === 0) {
      console.error('User is not an admin', { userId: user.id, error: roleError });
      throw new Error('Unauthorized: Admin access required');
    }

    // Parse request body
    const requestData: GenerateKeyRequest = await req.json();
    console.log('Generating API key for:', requestData.company_name);

    // Validate required fields
    if (!requestData.company_name || !requestData.billing_email || !requestData.technical_contact_email) {
      throw new Error('Missing required fields: company_name, billing_email, technical_contact_email');
    }

    if (!requestData.key_name || !requestData.environment || !requestData.permissions) {
      throw new Error('Missing required fields: key_name, environment, permissions');
    }

    // Step 1: Create or find company
    let company_id: string;
    
    const { data: existingCompany, error: findCompanyError } = await supabaseClient
      .from('companies')
      .select('id')
      .eq('name', requestData.company_name)
      .maybeSingle();

    if (existingCompany) {
      company_id = existingCompany.id;
      console.log('Found existing company:', company_id);
    } else {
      const { data: newCompany, error: createCompanyError } = await supabaseClient
        .from('companies')
        .insert({
          name: requestData.company_name,
          domain: requestData.company_domain,
          billing_email: requestData.billing_email,
          technical_contact_email: requestData.technical_contact_email,
          industry: requestData.industry,
          size: requestData.company_size,
          website: requestData.website,
          is_active: true,
          plan_type: 'free',
        })
        .select('id')
        .single();

      if (createCompanyError) {
        console.error('Error creating company:', createCompanyError);
        throw new Error(`Failed to create company: ${createCompanyError.message}`);
      }

      company_id = newCompany.id;
      console.log('Created new company:', company_id);
    }

    // Step 2: Generate cryptographically secure API key
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const keySecret = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const fullKey = `nlk_${requestData.environment}_${keySecret}`;
    console.log('Generated API key with prefix:', fullKey.substring(0, 20) + '...');

    // Step 3: Hash the key using SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(fullKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Step 4: Store hashed key in database
    const { data: apiKey, error: createKeyError } = await supabaseClient
      .from('enterprise_api_keys')
      .insert({
        key_name: requestData.key_name,
        key_prefix: fullKey.substring(0, 20),
        key_hash: keyHash,
        company_id: company_id,
        request_id: requestData.request_id || null,
        created_by: user.id,
        permissions: requestData.permissions,
        rate_limit_per_hour: requestData.rate_limit_per_hour || 1000,
        rate_limit_per_day: requestData.rate_limit_per_day || 10000,
        environment: requestData.environment,
        is_active: true,
        expires_at: requestData.expires_at || null,
      })
      .select()
      .single();

    if (createKeyError) {
      console.error('Error creating API key:', createKeyError);
      throw new Error(`Failed to create API key: ${createKeyError.message}`);
    }

    console.log('Successfully created API key:', apiKey.id);

    // Step 5: Update the API access request if request_id is provided
    if (requestData.request_id) {
      const { error: updateRequestError } = await supabaseClient
        .from('api_access_requests')
        .update({
          status: 'resolved',
          company_id: company_id,
          api_key_id: apiKey.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', requestData.request_id);

      if (updateRequestError) {
        console.error('Error updating API request:', updateRequestError);
        // Don't throw - the key was created successfully
      } else {
        console.log('Updated API access request:', requestData.request_id);
      }
    }

    // Step 6: Log the generation event
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'api_key_generated',
        resource_type: 'enterprise_api_key',
        resource_id: apiKey.id,
        details: {
          company_name: requestData.company_name,
          key_name: requestData.key_name,
          environment: requestData.environment,
          permissions: requestData.permissions,
        },
      });

    // Return the full key ONLY ONCE (never retrievable again)
    return new Response(
      JSON.stringify({
        success: true,
        api_key: fullKey, // ⚠️ This is the ONLY time the full key is shown
        key_id: apiKey.id,
        key_prefix: apiKey.key_prefix,
        company_id: company_id,
        message: 'API key generated successfully. Save this key now - it will never be shown again!',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-enterprise-api-key:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Unauthorized') ? 401 : 400,
      }
    );
  }
});
