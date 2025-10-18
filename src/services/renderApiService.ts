import { supabase } from '@/integrations/supabase/client';

const RENDER_API_URL = import.meta.env.VITE_RENDER_API_URL || 'http://localhost:3000';

interface PaymentResponse {
  url: string;
  sessionId: string;
}

interface AdCampaignPaymentRequest {
  campaignId: string;
  totalAmount: number;
  currency?: string;
  campaignName: string;
  duration: number;
}

interface BusinessPromotionPaymentRequest {
  businessId: string;
  promotionType: string;
  duration: number;
  amount: number;
  currency?: string;
  description?: string;
}

export class RenderApiService {
  /**
   * Get authentication token from Supabase
   */
  private static async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Make authenticated API request to Render service
   */
  private static async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${RENDER_API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create payment session for ad campaign
   */
  static async createAdCampaignPayment(
    request: AdCampaignPaymentRequest
  ): Promise<PaymentResponse> {
    return this.makeRequest<PaymentResponse>(
      '/api/payments/ad-campaign',
      'POST',
      request
    );
  }

  /**
   * Create payment session for business promotion
   */
  static async createBusinessPromotionPayment(
    request: BusinessPromotionPaymentRequest
  ): Promise<PaymentResponse> {
    return this.makeRequest<PaymentResponse>(
      '/api/payments/business-promotion',
      'POST',
      request
    );
  }

  /**
   * Check API health
   */
  static async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${RENDER_API_URL}/health`);
      return response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Render API is unavailable');
    }
  }
}
