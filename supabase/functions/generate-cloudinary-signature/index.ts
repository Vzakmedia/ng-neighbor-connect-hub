import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Cloudinary signature generation started');
    
    // Check environment variables
    const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY');
    const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET');
    
    if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary credentials');
      throw new Error('Cloudinary credentials not configured');
    }

    // Get JWT from authorization header (already validated by Supabase since verify_jwt=true)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Decode JWT to get user ID (JWT is already verified by Supabase when verify_jwt=true)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;
    
    if (!userId) {
      console.error('No user ID in JWT');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', userId);

    const { folder = 'uploads', resource_type = 'auto' } = await req.json();

    // Generate timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Create signature string
    const signatureString = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    
    // Generate SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Generated signature successfully for user:', userId, 'folder:', folder);

    return new Response(
      JSON.stringify({
        signature,
        timestamp,
        api_key: CLOUDINARY_API_KEY,
        folder
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating signature:', error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate signature' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
