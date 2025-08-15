export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ad_interactions: {
        Row: {
          campaign_id: string
          created_at: string
          device_type: string | null
          id: string
          interaction_type: string
          ip_address: unknown | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
          user_location: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          device_type?: string | null
          id?: string
          interaction_type: string
          ip_address?: unknown | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_location?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          device_type?: string | null
          id?: string
          interaction_type?: string
          ip_address?: unknown | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_interactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "advertisement_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_pricing_tiers: {
        Row: {
          ad_type: string
          base_price_per_day: number
          click_rate_multiplier: number | null
          created_at: string
          features: Json | null
          geographic_scope: string
          id: string
          impressions_included: number | null
          is_active: boolean | null
          max_duration_days: number | null
          name: string
          priority_level: number | null
          updated_at: string
        }
        Insert: {
          ad_type: string
          base_price_per_day: number
          click_rate_multiplier?: number | null
          created_at?: string
          features?: Json | null
          geographic_scope: string
          id?: string
          impressions_included?: number | null
          is_active?: boolean | null
          max_duration_days?: number | null
          name: string
          priority_level?: number | null
          updated_at?: string
        }
        Update: {
          ad_type?: string
          base_price_per_day?: number
          click_rate_multiplier?: number | null
          created_at?: string
          features?: Json | null
          geographic_scope?: string
          id?: string
          impressions_included?: number | null
          is_active?: boolean | null
          max_duration_days?: number | null
          name?: string
          priority_level?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_action_logs: {
        Row: {
          action_details: Json
          action_type: string
          admin_user_id: string
          confirmation_method: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          requires_confirmation: boolean
          target_resource_id: string | null
          target_resource_type: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_details?: Json
          action_type: string
          admin_user_id: string
          confirmation_method?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          requires_confirmation?: boolean
          target_resource_id?: string | null
          target_resource_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_details?: Json
          action_type?: string
          admin_user_id?: string
          confirmation_method?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          requires_confirmation?: boolean
          target_resource_id?: string | null
          target_resource_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      advertisement_campaigns: {
        Row: {
          ad_call_to_action: string | null
          ad_description: string | null
          ad_images: Json | null
          ad_title: string | null
          ad_url: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          business_id: string | null
          campaign_name: string
          campaign_type: string
          community_post_id: string | null
          created_at: string
          daily_budget: number
          end_date: string
          event_id: string | null
          id: string
          marketplace_item_id: string | null
          payment_amount: number | null
          payment_completed_at: string | null
          payment_status: string | null
          pricing_tier_id: string
          rejection_reason: string | null
          service_id: string | null
          start_date: string
          status: string
          stripe_session_id: string | null
          target_cities: string[] | null
          target_coordinates: Json | null
          target_geographic_scope: string
          target_states: string[] | null
          total_budget: number
          total_clicks: number | null
          total_impressions: number | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_call_to_action?: string | null
          ad_description?: string | null
          ad_images?: Json | null
          ad_title?: string | null
          ad_url?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string | null
          campaign_name: string
          campaign_type: string
          community_post_id?: string | null
          created_at?: string
          daily_budget: number
          end_date: string
          event_id?: string | null
          id?: string
          marketplace_item_id?: string | null
          payment_amount?: number | null
          payment_completed_at?: string | null
          payment_status?: string | null
          pricing_tier_id: string
          rejection_reason?: string | null
          service_id?: string | null
          start_date: string
          status?: string
          stripe_session_id?: string | null
          target_cities?: string[] | null
          target_coordinates?: Json | null
          target_geographic_scope: string
          target_states?: string[] | null
          total_budget: number
          total_clicks?: number | null
          total_impressions?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_call_to_action?: string | null
          ad_description?: string | null
          ad_images?: Json | null
          ad_title?: string | null
          ad_url?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string | null
          campaign_name?: string
          campaign_type?: string
          community_post_id?: string | null
          created_at?: string
          daily_budget?: number
          end_date?: string
          event_id?: string | null
          id?: string
          marketplace_item_id?: string | null
          payment_amount?: number | null
          payment_completed_at?: string | null
          payment_status?: string | null
          pricing_tier_id?: string
          rejection_reason?: string | null
          service_id?: string | null
          start_date?: string
          status?: string
          stripe_session_id?: string | null
          target_cities?: string[] | null
          target_coordinates?: Json | null
          target_geographic_scope?: string
          target_states?: string[] | null
          total_budget?: number
          total_clicks?: number | null
          total_impressions?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisement_campaigns_community_post_id_fkey"
            columns: ["community_post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertisement_campaigns_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertisement_campaigns_pricing_tier_id_fkey"
            columns: ["pricing_tier_id"]
            isOneToOne: false
            referencedRelation: "ad_pricing_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertisement_campaigns_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_analytics: {
        Row: {
          alert_id: string
          id: string
          location: string | null
          metadata: Json | null
          metric_type: string
          metric_value: number | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          alert_id: string
          id?: string
          location?: string | null
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          alert_id?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      alert_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
          updated_at: string | null
        }
        Insert: {
          cache_data: Json
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      alert_notifications: {
        Row: {
          alert_id: string | null
          content: string | null
          id: string
          is_read: boolean | null
          notification_type: string
          panic_alert_id: string | null
          read_at: string | null
          recipient_id: string
          request_id: string | null
          sender_name: string | null
          sender_phone: string | null
          sent_at: string | null
        }
        Insert: {
          alert_id?: string | null
          content?: string | null
          id?: string
          is_read?: boolean | null
          notification_type: string
          panic_alert_id?: string | null
          read_at?: string | null
          recipient_id: string
          request_id?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sent_at?: string | null
        }
        Update: {
          alert_id?: string | null
          content?: string | null
          id?: string
          is_read?: boolean | null
          notification_type?: string
          panic_alert_id?: string | null
          read_at?: string | null
          recipient_id?: string
          request_id?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "safety_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_notifications_panic_alert_id_fkey"
            columns: ["panic_alert_id"]
            isOneToOne: false
            referencedRelation: "panic_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_contact_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_queue: {
        Row: {
          alert_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          max_retries: number | null
          metadata: Json | null
          priority: number
          processing_started_at: string | null
          retry_count: number | null
          status: string
        }
        Insert: {
          alert_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: number
          processing_started_at?: string | null
          retry_count?: number | null
          status?: string
        }
        Update: {
          alert_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: number
          processing_started_at?: string | null
          retry_count?: number | null
          status?: string
        }
        Relationships: []
      }
      alert_responses: {
        Row: {
          alert_id: string
          comment: string | null
          created_at: string
          id: string
          response_type: string
          user_id: string
        }
        Insert: {
          alert_id: string
          comment?: string | null
          created_at?: string
          id?: string
          response_type: string
          user_id: string
        }
        Update: {
          alert_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          response_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_responses_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "safety_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_targeting_rules: {
        Row: {
          alert_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          rule_criteria: Json
          rule_type: string
        }
        Insert: {
          alert_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rule_criteria: Json
          rule_type: string
        }
        Update: {
          alert_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rule_criteria?: Json
          rule_type?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          event_action: string
          event_category: string
          event_data: Json | null
          event_label: string | null
          event_type: string
          id: string
          location: string | null
          os: string | null
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_action: string
          event_category: string
          event_data?: Json | null
          event_label?: string | null
          event_type: string
          id?: string
          location?: string | null
          os?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_action?: string
          event_category?: string
          event_data?: Json | null
          event_label?: string | null
          event_type?: string
          id?: string
          location?: string | null
          os?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_reports: {
        Row: {
          completed_at: string | null
          created_at: string
          date_range_end: string
          date_range_start: string
          download_count: number | null
          file_url: string | null
          generated_by: string
          id: string
          report_config: Json
          report_name: string
          report_type: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date_range_end: string
          date_range_start: string
          download_count?: number | null
          file_url?: string | null
          generated_by: string
          id?: string
          report_config?: Json
          report_name: string
          report_type: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          download_count?: number | null
          file_url?: string | null
          generated_by?: string
          id?: string
          report_config?: Json
          report_name?: string
          report_type?: string
          status?: string
        }
        Relationships: []
      }
      app_configuration: {
        Row: {
          config_key: string
          config_type: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          config_key: string
          config_type: string
          config_value: Json
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          config_key?: string
          config_type?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          automation_id: string
          executed_at: string
          execution_details: Json | null
          execution_status: string
          id: string
          processing_time_ms: number | null
        }
        Insert: {
          automation_id: string
          executed_at?: string
          execution_details?: Json | null
          execution_status: string
          id?: string
          processing_time_ms?: number | null
        }
        Update: {
          automation_id?: string
          executed_at?: string
          execution_details?: Json | null
          execution_status?: string
          id?: string
          processing_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "platform_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      board_invite_codes: {
        Row: {
          board_id: string
          code: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          used_count: number | null
        }
        Insert: {
          board_id: string
          code: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          used_count?: number | null
        }
        Update: {
          board_id?: string
          code?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "board_invite_codes_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "discussion_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_join_requests: {
        Row: {
          board_id: string
          created_at: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      board_members: {
        Row: {
          board_id: string
          id: string
          joined_at: string
          role: string
          status: string | null
          user_id: string
        }
        Insert: {
          board_id: string
          id?: string
          joined_at?: string
          role?: string
          status?: string | null
          user_id: string
        }
        Update: {
          board_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_members_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "discussion_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      board_post_read_status: {
        Row: {
          created_at: string
          id: string
          post_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      board_posts: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          board_id: string
          content: string
          created_at: string
          id: string
          image_urls: string[] | null
          is_pinned: boolean | null
          post_type: string | null
          reply_to_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          board_id: string
          content: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          is_pinned?: boolean | null
          post_type?: string | null
          reply_to_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          board_id?: string
          content?: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          is_pinned?: boolean | null
          post_type?: string | null
          reply_to_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_posts_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "discussion_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_posts_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_license: string | null
          business_name: string
          category: string
          city: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          operating_hours: Json | null
          phone: string | null
          physical_address: string | null
          rating: number | null
          state: string | null
          tax_id_number: string | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          verification_documents: Json | null
          verification_status: string | null
          website_url: string | null
        }
        Insert: {
          business_license?: string | null
          business_name: string
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          operating_hours?: Json | null
          phone?: string | null
          physical_address?: string | null
          rating?: number | null
          state?: string | null
          tax_id_number?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          verification_documents?: Json | null
          verification_status?: string | null
          website_url?: string | null
        }
        Update: {
          business_license?: string | null
          business_name?: string
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          operating_hours?: Json | null
          phone?: string | null
          physical_address?: string | null
          rating?: number | null
          state?: string | null
          tax_id_number?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          verification_documents?: Json | null
          verification_status?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          call_status: string
          call_type: string
          caller_id: string
          conversation_id: string
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          id: string
          receiver_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          call_status?: string
          call_type: string
          caller_id: string
          conversation_id: string
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          receiver_id: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          call_status?: string
          call_type?: string
          caller_id?: string
          conversation_id?: string
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          receiver_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_signaling: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: Json
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: Json
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: Json
          sender_id?: string
        }
        Relationships: []
      }
      call_signals: {
        Row: {
          call_id: string
          call_type: string
          created_at: string
          data: Json | null
          from_user_id: string
          id: string
          to_user_id: string
          type: string
        }
        Insert: {
          call_id: string
          call_type: string
          created_at?: string
          data?: Json | null
          from_user_id: string
          id?: string
          to_user_id: string
          type: string
        }
        Update: {
          call_id?: string
          call_type?: string
          created_at?: string
          data?: Json | null
          from_user_id?: string
          id?: string
          to_user_id?: string
          type?: string
        }
        Relationships: []
      }
      chat_message_likes: {
        Row: {
          created_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          is_pinned: boolean | null
          message_type: string | null
          reply_to_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          is_pinned?: boolean | null
          message_type?: string | null
          reply_to_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          is_pinned?: boolean | null
          message_type?: string | null
          reply_to_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          file_urls: Json | null
          id: string
          image_urls: string[] | null
          location: string | null
          post_type: string
          rsvp_enabled: boolean | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_urls?: Json | null
          id?: string
          image_urls?: string[] | null
          location?: string | null
          post_type: string
          rsvp_enabled?: boolean | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_urls?: Json | null
          id?: string
          image_urls?: string[] | null
          location?: string | null
          post_type?: string
          rsvp_enabled?: boolean | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_info: {
        Row: {
          content: string | null
          data: Json | null
          id: string
          section: string
          title: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          content?: string | null
          data?: Json | null
          id?: string
          section: string
          title?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          content?: string | null
          data?: Json | null
          id?: string
          section?: string
          title?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      contact_invitation_codes: {
        Row: {
          code: string
          contact_request_id: string
          created_at: string
          expires_at: string
          id: string
          used: boolean | null
        }
        Insert: {
          code: string
          contact_request_id: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean | null
        }
        Update: {
          code?: string
          contact_request_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_invitation_codes_contact_request_id_fkey"
            columns: ["contact_request_id"]
            isOneToOne: false
            referencedRelation: "emergency_contact_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      content_analytics: {
        Row: {
          clicks: number | null
          comments: number | null
          content_id: string
          content_type: string
          created_at: string
          date: string
          engagement_rate: number | null
          id: string
          impressions: number | null
          likes: number | null
          reach: number | null
          shares: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          content_id: string
          content_type: string
          created_at?: string
          date?: string
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          reach?: number | null
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          date?: string
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          reach?: number | null
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          item_id: string | null
          last_message_at: string | null
          seller_id: string
          service_id: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          item_id?: string | null
          last_message_at?: string | null
          seller_id: string
          service_id?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          item_id?: string | null
          last_message_at?: string | null
          seller_id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_conversations: {
        Row: {
          conversation_type: string | null
          created_at: string
          id: string
          last_message_at: string
          marketplace_item_id: string | null
          marketplace_service_id: string | null
          request_status: string | null
          requested_at: string | null
          responded_at: string | null
          updated_at: string
          user1_has_unread: boolean | null
          user1_id: string
          user2_has_unread: boolean | null
          user2_id: string
        }
        Insert: {
          conversation_type?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          marketplace_item_id?: string | null
          marketplace_service_id?: string | null
          request_status?: string | null
          requested_at?: string | null
          responded_at?: string | null
          updated_at?: string
          user1_has_unread?: boolean | null
          user1_id: string
          user2_has_unread?: boolean | null
          user2_id: string
        }
        Update: {
          conversation_type?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          marketplace_item_id?: string | null
          marketplace_service_id?: string | null
          request_status?: string | null
          requested_at?: string | null
          responded_at?: string | null
          updated_at?: string
          user1_has_unread?: boolean | null
          user1_id?: string
          user2_has_unread?: boolean | null
          user2_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          recipient_id: string
          sender_id: string
          status: Database["public"]["Enums"]["direct_message_status"] | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          recipient_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["direct_message_status"] | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          recipient_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["direct_message_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      discussion_boards: {
        Row: {
          auto_approve_members: boolean | null
          avatar_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_public: boolean | null
          location: string | null
          location_scope: string | null
          member_limit: number | null
          name: string
          requires_approval: boolean | null
          updated_at: string
        }
        Insert: {
          auto_approve_members?: boolean | null
          avatar_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          location_scope?: string | null
          member_limit?: number | null
          name: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          auto_approve_members?: boolean | null
          avatar_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          location_scope?: string | null
          member_limit?: number | null
          name?: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      dismissed_alerts: {
        Row: {
          alert_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          alert_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_automation_rules: {
        Row: {
          actions: Json
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          priority: number | null
          rule_name: string
          rule_type: string
          trigger_conditions: Json
          updated_at: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name: string
          rule_type: string
          trigger_conditions?: Json
          updated_at?: string
        }
        Update: {
          actions?: Json
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name?: string
          rule_type?: string
          trigger_conditions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      emergency_contact_requests: {
        Row: {
          created_at: string
          id: string
          notification_sent: boolean | null
          recipient_id: string | null
          recipient_phone: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_sent?: boolean | null
          recipient_id?: string | null
          recipient_phone: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_sent?: boolean | null
          recipient_id?: string | null
          recipient_phone?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          can_alert_public: boolean | null
          can_receive_location: boolean | null
          confirm_code: string | null
          contact_name: string
          created_at: string
          email: string | null
          id: string
          is_confirmed: boolean | null
          is_primary: boolean | null
          is_primary_contact: boolean | null
          notification_enabled: boolean | null
          phone_number: string
          preferred_methods:
            | Database["public"]["Enums"]["contact_method"][]
            | null
          profile_name: string | null
          relationship: string | null
          search_query: string | null
          search_type: string | null
          user_id: string
        }
        Insert: {
          can_alert_public?: boolean | null
          can_receive_location?: boolean | null
          confirm_code?: string | null
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          is_confirmed?: boolean | null
          is_primary?: boolean | null
          is_primary_contact?: boolean | null
          notification_enabled?: boolean | null
          phone_number: string
          preferred_methods?:
            | Database["public"]["Enums"]["contact_method"][]
            | null
          profile_name?: string | null
          relationship?: string | null
          search_query?: string | null
          search_type?: string | null
          user_id: string
        }
        Update: {
          can_alert_public?: boolean | null
          can_receive_location?: boolean | null
          confirm_code?: string | null
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          is_confirmed?: boolean | null
          is_primary?: boolean | null
          is_primary_contact?: boolean | null
          notification_enabled?: boolean | null
          phone_number?: string
          preferred_methods?:
            | Database["public"]["Enums"]["contact_method"][]
            | null
          profile_name?: string | null
          relationship?: string | null
          search_query?: string | null
          search_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergency_escalation_log: {
        Row: {
          action_taken: string | null
          alert_id: string
          escalation_level: number
          escalation_type: string
          id: string
          metadata: Json | null
          success: boolean | null
          triggered_at: string
          triggered_by: string | null
        }
        Insert: {
          action_taken?: string | null
          alert_id: string
          escalation_level?: number
          escalation_type: string
          id?: string
          metadata?: Json | null
          success?: boolean | null
          triggered_at?: string
          triggered_by?: string | null
        }
        Update: {
          action_taken?: string | null
          alert_id?: string
          escalation_level?: number
          escalation_type?: string
          id?: string
          metadata?: Json | null
          success?: boolean | null
          triggered_at?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      emergency_preferences: {
        Row: {
          auto_alert_contacts: boolean | null
          auto_alert_public: boolean | null
          countdown_duration: number | null
          created_at: string
          default_situation_type:
            | Database["public"]["Enums"]["emergency_situation_type"]
            | null
          id: string
          share_location_with_contacts: boolean | null
          share_location_with_public: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_alert_contacts?: boolean | null
          auto_alert_public?: boolean | null
          countdown_duration?: number | null
          created_at?: string
          default_situation_type?:
            | Database["public"]["Enums"]["emergency_situation_type"]
            | null
          id?: string
          share_location_with_contacts?: boolean | null
          share_location_with_public?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_alert_contacts?: boolean | null
          auto_alert_public?: boolean | null
          countdown_duration?: number | null
          created_at?: string
          default_situation_type?:
            | Database["public"]["Enums"]["emergency_situation_type"]
            | null
          id?: string
          share_location_with_contacts?: boolean | null
          share_location_with_public?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          email_address: string | null
          event_id: string
          full_name: string | null
          id: string
          message: string | null
          phone_number: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_address?: string | null
          event_id: string
          full_name?: string | null
          id?: string
          message?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_address?: string | null
          event_id?: string
          full_name?: string | null
          id?: string
          message?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          content: string | null
          created_at: string
          end_date: string | null
          event_date: string | null
          file_urls: Json | null
          id: string
          image_urls: string[] | null
          is_public: boolean | null
          location: string | null
          max_attendees: number | null
          price: number | null
          rsvp_enabled: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          end_date?: string | null
          event_date?: string | null
          file_urls?: Json | null
          id?: string
          image_urls?: string[] | null
          is_public?: boolean | null
          location?: string | null
          max_attendees?: number | null
          price?: number | null
          rsvp_enabled?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          end_date?: string | null
          event_date?: string | null
          file_urls?: Json | null
          id?: string
          image_urls?: string[] | null
          is_public?: boolean | null
          location?: string | null
          max_attendees?: number | null
          price?: number | null
          rsvp_enabled?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          benefits: string | null
          created_at: string
          created_by: string
          department: string
          description: string
          id: string
          is_active: boolean | null
          location: string
          remote: boolean | null
          requirements: string | null
          salary_range: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          benefits?: string | null
          created_at?: string
          created_by: string
          department: string
          description: string
          id?: string
          is_active?: boolean | null
          location: string
          remote?: boolean | null
          requirements?: string | null
          salary_range?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          benefits?: string | null
          created_at?: string
          created_by?: string
          department?: string
          description?: string
          id?: string
          is_active?: boolean | null
          location?: string
          remote?: boolean | null
          requirements?: string | null
          salary_range?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_comments: {
        Row: {
          comment_text: string
          commenter_id: string
          created_at: string
          id: string
          is_flagged: boolean | null
          item_id: string
          parent_comment_id: string | null
          updated_at: string
        }
        Insert: {
          comment_text: string
          commenter_id: string
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          item_id: string
          parent_comment_id?: string | null
          updated_at?: string
        }
        Update: {
          comment_text?: string
          commenter_id?: string
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          item_id?: string
          parent_comment_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_inquiries: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          inquiry_type: string
          item_id: string
          message: string
          offer_amount: number | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          inquiry_type?: string
          item_id: string
          message: string
          offer_amount?: number | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          inquiry_type?: string
          item_id?: string
          message?: string
          offer_amount?: number | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_item_likes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_item_likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          category: Database["public"]["Enums"]["item_category"]
          condition: string | null
          created_at: string
          description: string
          id: string
          images: string[] | null
          is_negotiable: boolean | null
          location: string | null
          price: number | null
          rating: number | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string
          total_reviews: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category: Database["public"]["Enums"]["item_category"]
          condition?: string | null
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          is_negotiable?: boolean | null
          location?: string | null
          price?: number | null
          rating?: number | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title: string
          total_reviews?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          condition?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          is_negotiable?: boolean | null
          location?: string | null
          price?: number | null
          rating?: number | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          created_at: string
          id: string
          is_flagged: boolean | null
          is_verified: boolean | null
          item_id: string
          rating: number
          review_text: string | null
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          item_id: string
          rating: number
          review_text?: string | null
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          item_id?: string
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_preferences: {
        Row: {
          allow_messages: boolean | null
          created_at: string
          show_online_status: boolean | null
          show_read_receipts: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_messages?: boolean | null
          created_at?: string
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_messages?: boolean | null
          created_at?: string
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          channel: string
          created_at: string | null
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          max_retries: number | null
          notification_id: string
          provider: string | null
          provider_id: string | null
          retry_count: number | null
          sent_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          max_retries?: number | null
          notification_id: string
          provider?: string | null
          provider_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          max_retries?: number | null
          notification_id?: string
          provider?: string | null
          provider_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_log: {
        Row: {
          alert_id: string
          created_at: string | null
          delivered_at: string | null
          delivery_channel: string
          delivery_status: string
          failure_reason: string | null
          id: string
          retry_count: number | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_channel: string
          delivery_status?: string
          failure_reason?: string | null
          id?: string
          retry_count?: number | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_channel?: string
          delivery_status?: string
          failure_reason?: string | null
          id?: string
          retry_count?: number | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_escalations: {
        Row: {
          alert_id: string
          attempts: number
          created_at: string
          due_at: string
          id: string
          last_error: string | null
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          alert_id: string
          attempts?: number
          created_at?: string
          due_at: string
          id?: string
          last_error?: string | null
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          attempts?: number
          created_at?: string
          due_at?: string
          id?: string
          last_error?: string | null
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_metrics: {
        Row: {
          avg_delivery_time_ms: number | null
          channel: string
          created_at: string | null
          date: string
          hour: number
          id: string
          priority: string
          total_delivered: number | null
          total_failed: number | null
          total_read: number | null
          total_sent: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          avg_delivery_time_ms?: number | null
          channel: string
          created_at?: string | null
          date?: string
          hour?: number
          id?: string
          priority: string
          total_delivered?: number | null
          total_failed?: number | null
          total_read?: number | null
          total_sent?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          avg_delivery_time_ms?: number | null
          channel?: string
          created_at?: string | null
          date?: string
          hour?: number
          id?: string
          priority?: string
          total_delivered?: number | null
          total_failed?: number | null
          total_read?: number | null
          total_sent?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          categories: Json | null
          created_at: string | null
          email_digest: boolean | null
          email_digest_frequency: string | null
          email_enabled: boolean | null
          escalate_if_unread_minutes: number
          escalate_min_severity: string
          id: string
          in_app_enabled: boolean | null
          priority_filter: string | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categories?: Json | null
          created_at?: string | null
          email_digest?: boolean | null
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          escalate_if_unread_minutes?: number
          escalate_min_severity?: string
          id?: string
          in_app_enabled?: boolean | null
          priority_filter?: string | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categories?: Json | null
          created_at?: string | null
          email_digest?: boolean | null
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          escalate_if_unread_minutes?: number
          escalate_min_severity?: string
          id?: string
          in_app_enabled?: boolean | null
          priority_filter?: string | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          created_at: string | null
          default_channels: string[] | null
          default_priority: string | null
          email_template: string | null
          id: string
          is_active: boolean | null
          name: string
          push_template: Json | null
          sms_template: string | null
          title_template: string
          type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_template: string
          created_at?: string | null
          default_channels?: string[] | null
          default_priority?: string | null
          email_template?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          push_template?: Json | null
          sms_template?: string | null
          title_template: string
          type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_template?: string
          created_at?: string | null
          default_channels?: string[] | null
          default_priority?: string | null
          email_template?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          push_template?: Json | null
          sms_template?: string | null
          title_template?: string
          type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          channels: string[] | null
          created_at: string | null
          data: Json | null
          delivered_at: string | null
          expires_at: string | null
          id: string
          priority: string
          read_at: string | null
          scheduled_for: string | null
          source_id: string | null
          source_type: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          channels?: string[] | null
          created_at?: string | null
          data?: Json | null
          delivered_at?: string | null
          expires_at?: string | null
          id?: string
          priority?: string
          read_at?: string | null
          scheduled_for?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          channels?: string[] | null
          created_at?: string | null
          data?: Json | null
          delivered_at?: string | null
          expires_at?: string | null
          id?: string
          priority?: string
          read_at?: string | null
          scheduled_for?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      panic_alerts: {
        Row: {
          address: string | null
          created_at: string
          escalation_count: number | null
          id: string
          is_resolved: boolean | null
          last_escalated_at: string | null
          latitude: number
          longitude: number
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          situation_type:
            | Database["public"]["Enums"]["emergency_situation_type"]
            | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          escalation_count?: number | null
          id?: string
          is_resolved?: boolean | null
          last_escalated_at?: string | null
          latitude: number
          longitude: number
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          situation_type?:
            | Database["public"]["Enums"]["emergency_situation_type"]
            | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          escalation_count?: number | null
          id?: string
          is_resolved?: boolean | null
          last_escalated_at?: string | null
          latitude?: number
          longitude?: number
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          situation_type?:
            | Database["public"]["Enums"]["emergency_situation_type"]
            | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_panic_alerts_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      panic_button_rate_limit: {
        Row: {
          created_at: string
          id: string
          last_panic_at: string
          panic_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_panic_at?: string
          panic_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_panic_at?: string
          panic_count?: number
          user_id?: string
        }
        Relationships: []
      }
      platform_automations: {
        Row: {
          actions: Json
          automation_type: string
          created_at: string
          created_by: string
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean
          last_executed_at: string | null
          name: string
          trigger_conditions: Json | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          automation_type: string
          created_at?: string
          created_by: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name: string
          trigger_conditions?: Json | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          automation_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name?: string
          trigger_conditions?: Json | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_read_status: {
        Row: {
          created_at: string
          id: string
          post_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      press_releases: {
        Row: {
          category: string
          content: string | null
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          is_published: boolean | null
          link: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          created_by: string
          date: string
          description: string
          id?: string
          is_published?: boolean | null
          link?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          id?: string
          is_published?: boolean | null
          link?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          neighborhood: string | null
          phone: string | null
          staff_id: number
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          neighborhood?: string | null
          phone?: string | null
          staff_id?: number
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          neighborhood?: string | null
          phone?: string | null
          staff_id?: number
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promoted_posts: {
        Row: {
          campaign_id: string
          cost_per_click: number | null
          created_at: string
          daily_budget: number
          id: string
          images: string[] | null
          is_active: boolean | null
          post_content: Json
          post_id: string | null
          post_type: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          cost_per_click?: number | null
          created_at?: string
          daily_budget: number
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          post_content: Json
          post_id?: string | null
          post_type: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          cost_per_click?: number | null
          created_at?: string
          daily_budget?: number
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          post_content?: Json
          post_id?: string | null
          post_type?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoted_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotion_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_analytics: {
        Row: {
          click_through_rate: number | null
          clicks: number | null
          conversion_rate: number | null
          conversions: number | null
          cost_per_conversion: number | null
          created_at: string
          date: string
          id: string
          impressions: number | null
          promoted_post_id: string
          spend: number | null
          updated_at: string
        }
        Insert: {
          click_through_rate?: number | null
          clicks?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          promoted_post_id: string
          spend?: number | null
          updated_at?: string
        }
        Update: {
          click_through_rate?: number | null
          clicks?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          promoted_post_id?: string
          spend?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_analytics_promoted_post_id_fkey"
            columns: ["promoted_post_id"]
            isOneToOne: false
            referencedRelation: "promoted_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_campaigns: {
        Row: {
          budget: number
          created_at: string
          description: string | null
          end_date: string
          id: string
          images: string[] | null
          payment_amount: number | null
          payment_completed_at: string | null
          payment_session_id: string | null
          payment_status: string | null
          spent_amount: number | null
          start_date: string
          status: string
          target_audience: Json | null
          target_demographics: Json | null
          target_locations: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget: number
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          images?: string[] | null
          payment_amount?: number | null
          payment_completed_at?: string | null
          payment_session_id?: string | null
          payment_status?: string | null
          spent_amount?: number | null
          start_date: string
          status?: string
          target_audience?: Json | null
          target_demographics?: Json | null
          target_locations?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          images?: string[] | null
          payment_amount?: number | null
          payment_completed_at?: string | null
          payment_session_id?: string | null
          payment_status?: string | null
          spent_amount?: number | null
          start_date?: string
          status?: string
          target_audience?: Json | null
          target_demographics?: Json | null
          target_locations?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotion_impressions: {
        Row: {
          created_at: string
          id: string
          impression_type: string | null
          promoted_post_id: string
          user_demographics: Json | null
          user_id: string | null
          user_location: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          impression_type?: string | null
          promoted_post_id: string
          user_demographics?: Json | null
          user_id?: string | null
          user_location?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          impression_type?: string | null
          promoted_post_id?: string
          user_demographics?: Json | null
          user_id?: string | null
          user_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_impressions_promoted_post_id_fkey"
            columns: ["promoted_post_id"]
            isOneToOne: false
            referencedRelation: "promoted_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          budget: number
          contact_info: string | null
          created_at: string
          description: string | null
          duration_days: number
          end_date: string | null
          id: string
          images: string[] | null
          item_id: string
          item_type: string
          promotion_type: string
          start_date: string | null
          status: string
          target_audience: string
          title: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          budget: number
          contact_info?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          end_date?: string | null
          id?: string
          images?: string[] | null
          item_id: string
          item_type: string
          promotion_type?: string
          start_date?: string | null
          status?: string
          target_audience?: string
          title: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          budget?: number
          contact_info?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          end_date?: string | null
          id?: string
          images?: string[] | null
          item_id?: string
          item_type?: string
          promotion_type?: string
          start_date?: string | null
          status?: string
          target_audience?: string
          title?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      public_emergency_alerts: {
        Row: {
          address: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          panic_alert_id: string | null
          radius_km: number | null
          situation_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          panic_alert_id?: string | null
          radius_km?: number | null
          situation_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          panic_alert_id?: string | null
          radius_km?: number | null
          situation_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_emergency_alerts_panic_alert_id_fkey"
            columns: ["panic_alert_id"]
            isOneToOne: false
            referencedRelation: "panic_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          is_verified: boolean | null
          neighborhood: string | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          is_verified?: boolean | null
          neighborhood?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          is_verified?: boolean | null
          neighborhood?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      revenue_analytics: {
        Row: {
          amount: number
          average_transaction: number | null
          created_at: string
          date: string
          id: string
          net_revenue: number | null
          recurring_revenue: number | null
          refunds: number | null
          revenue_source: string
          transaction_count: number | null
          updated_at: string
        }
        Insert: {
          amount?: number
          average_transaction?: number | null
          created_at?: string
          date?: string
          id?: string
          net_revenue?: number | null
          recurring_revenue?: number | null
          refunds?: number | null
          revenue_source: string
          transaction_count?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          average_transaction?: number | null
          created_at?: string
          date?: string
          id?: string
          net_revenue?: number | null
          recurring_revenue?: number | null
          refunds?: number | null
          revenue_source?: string
          transaction_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      review_reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          service_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          service_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_alerts: {
        Row: {
          address: string | null
          alert_type: Database["public"]["Enums"]["safety_alert_type"]
          created_at: string
          description: string
          id: string
          images: string[] | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          priority_level: number | null
          severity: Database["public"]["Enums"]["alert_severity"] | null
          status: Database["public"]["Enums"]["alert_status"] | null
          title: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          alert_type: Database["public"]["Enums"]["safety_alert_type"]
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          priority_level?: number | null
          severity?: Database["public"]["Enums"]["alert_severity"] | null
          status?: Database["public"]["Enums"]["alert_status"] | null
          title: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          alert_type?: Database["public"]["Enums"]["safety_alert_type"]
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          priority_level?: number | null
          severity?: Database["public"]["Enums"]["alert_severity"] | null
          status?: Database["public"]["Enums"]["alert_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_safety_alerts_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      safety_center_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_availability: {
        Row: {
          created_at: string
          current_bookings: number | null
          date: string
          end_time: string
          id: string
          is_available: boolean
          max_bookings: number | null
          service_id: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_bookings?: number | null
          date: string
          end_time: string
          id?: string
          is_available?: boolean
          max_bookings?: number | null
          service_id: string
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_bookings?: number | null
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean
          max_bookings?: number | null
          service_id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_availability_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          booking_date: string
          client_id: string
          created_at: string
          duration: number | null
          id: string
          message: string | null
          provider_id: string
          service_id: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          booking_date: string
          client_id: string
          created_at?: string
          duration?: number | null
          id?: string
          message?: string | null
          provider_id: string
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          booking_date?: string
          client_id?: string
          created_at?: string
          duration?: number | null
          id?: string
          message?: string | null
          provider_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_comments: {
        Row: {
          comment_text: string
          commenter_id: string
          created_at: string
          id: string
          is_flagged: boolean | null
          parent_comment_id: string | null
          service_id: string
          updated_at: string
        }
        Insert: {
          comment_text: string
          commenter_id: string
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          parent_comment_id?: string | null
          service_id: string
          updated_at?: string
        }
        Update: {
          comment_text?: string
          commenter_id?: string
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          parent_comment_id?: string | null
          service_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_likes: {
        Row: {
          created_at: string
          id: string
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_likes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reviews: {
        Row: {
          created_at: string
          id: string
          is_flagged: boolean | null
          is_verified: boolean | null
          rating: number
          review_text: string | null
          reviewer_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          rating: number
          review_text?: string | null
          reviewer_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_weekly_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          max_bookings: number | null
          service_id: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          max_bookings?: number | null
          service_id: string
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          max_bookings?: number | null
          service_id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_weekly_availability_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          description: string
          id: string
          images: string[] | null
          is_active: boolean | null
          location: string | null
          price_max: number | null
          price_min: number | null
          price_type: string | null
          rating: number | null
          rejection_reason: string | null
          title: string
          total_reviews: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location?: string | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string | null
          rating?: number | null
          rejection_reason?: string | null
          title: string
          total_reviews?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location?: string | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string | null
          rating?: number | null
          rejection_reason?: string | null
          title?: string
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sponsored_content: {
        Row: {
          boost_level: number
          boost_type: string
          budget: number
          content_id: string
          content_type: string
          created_at: string
          daily_budget: number | null
          end_date: string
          id: string
          images: string[] | null
          performance_metrics: Json | null
          promotion_id: string | null
          start_date: string
          status: string
          target_audience: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          boost_level?: number
          boost_type?: string
          budget?: number
          content_id: string
          content_type: string
          created_at?: string
          daily_budget?: number | null
          end_date: string
          id?: string
          images?: string[] | null
          performance_metrics?: Json | null
          promotion_id?: string | null
          start_date?: string
          status?: string
          target_audience?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          boost_level?: number
          boost_type?: string
          budget?: number
          content_id?: string
          content_type?: string
          created_at?: string
          daily_budget?: number | null
          end_date?: string
          id?: string
          images?: string[] | null
          performance_metrics?: Json | null
          promotion_id?: string | null
          start_date?: string
          status?: string
          target_audience?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_content_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_code: string
          role: string
          status: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_code?: string
          role: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_code?: string
          role?: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      staff_permissions: {
        Row: {
          can_delete: boolean | null
          can_read: boolean | null
          can_write: boolean | null
          created_at: string | null
          id: string
          permission_description: string | null
          permission_name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          id?: string
          permission_description?: string | null
          permission_name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          id?: string
          permission_description?: string | null
          permission_name?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      super_admin_security: {
        Row: {
          allowed_ip_addresses: string[]
          created_at: string
          failed_security_attempts: number
          id: string
          is_locked: boolean
          last_failed_attempt: string | null
          last_security_check: string | null
          locked_until: string | null
          max_session_duration_hours: number
          reauth_interval_minutes: number
          require_periodic_reauth: boolean
          require_session_confirmation: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_ip_addresses?: string[]
          created_at?: string
          failed_security_attempts?: number
          id?: string
          is_locked?: boolean
          last_failed_attempt?: string | null
          last_security_check?: string | null
          locked_until?: string | null
          max_session_duration_hours?: number
          reauth_interval_minutes?: number
          require_periodic_reauth?: boolean
          require_session_confirmation?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_ip_addresses?: string[]
          created_at?: string
          failed_security_attempts?: number
          id?: string
          is_locked?: boolean
          last_failed_attempt?: string | null
          last_security_check?: string | null
          locked_until?: string | null
          max_session_duration_hours?: number
          reauth_interval_minutes?: number
          require_periodic_reauth?: boolean
          require_session_confirmation?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_email_inbox: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          body_html: string | null
          body_text: string | null
          from_email: string
          id: string
          is_read: boolean | null
          is_replied: boolean | null
          labels: string[] | null
          message_id: string | null
          metadata: Json | null
          processed_at: string | null
          received_at: string
          subject: string
          thread_id: string | null
          ticket_id: string | null
          to_email: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          from_email: string
          id?: string
          is_read?: boolean | null
          is_replied?: boolean | null
          labels?: string[] | null
          message_id?: string | null
          metadata?: Json | null
          processed_at?: string | null
          received_at?: string
          subject: string
          thread_id?: string | null
          ticket_id?: string | null
          to_email: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          from_email?: string
          id?: string
          is_read?: boolean | null
          is_replied?: boolean | null
          labels?: string[] | null
          message_id?: string | null
          metadata?: Json | null
          processed_at?: string | null
          received_at?: string
          subject?: string
          thread_id?: string | null
          ticket_id?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_email_inbox_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_responses: {
        Row: {
          attachments: Json | null
          created_at: string
          email_message_id: string | null
          id: string
          is_internal_note: boolean | null
          is_staff_response: boolean | null
          response_text: string
          response_type: string | null
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          email_message_id?: string | null
          id?: string
          is_internal_note?: boolean | null
          is_staff_response?: boolean | null
          response_text: string
          response_type?: string | null
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          email_message_id?: string | null
          id?: string
          is_internal_note?: boolean | null
          is_staff_response?: boolean | null
          response_text?: string
          response_type?: string | null
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          last_response_at: string | null
          metadata: Json | null
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          tags: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          last_response_at?: string | null
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          last_response_at?: string | null
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_performance: {
        Row: {
          additional_data: Json | null
          created_at: string
          id: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
          timestamp: string
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string
          id?: string
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          timestamp?: string
        }
        Update: {
          additional_data?: Json | null
          created_at?: string
          id?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          timestamp?: string
        }
        Relationships: []
      }
      two_fa_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attempt_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          success: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attempt_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_2fa: {
        Row: {
          backup_codes: string[]
          created_at: string
          enabled_at: string | null
          id: string
          is_enabled: boolean
          last_used_at: string | null
          secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[]
          created_at?: string
          enabled_at?: string | null
          id?: string
          is_enabled?: boolean
          last_used_at?: string | null
          secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[]
          created_at?: string
          enabled_at?: string | null
          id?: string
          is_enabled?: boolean
          last_used_at?: string | null
          secret?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_2fa_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attempt_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          success: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attempt_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_2fa_backup_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_used: boolean
          used_at: string | null
          user_2fa_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_used?: boolean
          used_at?: string | null
          user_2fa_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_used?: boolean
          used_at?: string | null
          user_2fa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_2fa_backup_codes_user_2fa_id_fkey"
            columns: ["user_2fa_id"]
            isOneToOne: false
            referencedRelation: "user_2fa"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          comments_made: number | null
          created_at: string
          date: string
          emergency_alerts: number | null
          events_attended: number | null
          id: string
          marketplace_purchases: number | null
          marketplace_views: number | null
          messages_sent: number | null
          page_views: number | null
          posts_created: number | null
          posts_liked: number | null
          posts_shared: number | null
          services_booked: number | null
          sessions_count: number | null
          time_spent_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_made?: number | null
          created_at?: string
          date?: string
          emergency_alerts?: number | null
          events_attended?: number | null
          id?: string
          marketplace_purchases?: number | null
          marketplace_views?: number | null
          messages_sent?: number | null
          page_views?: number | null
          posts_created?: number | null
          posts_liked?: number | null
          posts_shared?: number | null
          services_booked?: number | null
          sessions_count?: number | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_made?: number | null
          created_at?: string
          date?: string
          emergency_alerts?: number | null
          events_attended?: number | null
          id?: string
          marketplace_purchases?: number | null
          marketplace_views?: number | null
          messages_sent?: number | null
          page_views?: number | null
          posts_created?: number | null
          posts_liked?: number | null
          posts_shared?: number | null
          services_booked?: number | null
          sessions_count?: number | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          analytics_accepted: boolean
          background_location_accepted: boolean
          business_verification_accepted: boolean
          camera_access_accepted: boolean
          communication_accepted: boolean
          consent_given_at: string
          consent_version: string | null
          content_moderation_accepted: boolean
          content_processing_accepted: boolean
          crash_reporting_accepted: boolean
          created_at: string
          cross_platform_sync_accepted: boolean
          data_processing_accepted: boolean
          device_storage_accepted: boolean
          emergency_contacts_accepted: boolean
          external_apis_accepted: boolean
          external_integrations_accepted: boolean
          file_access_accepted: boolean
          google_services_accepted: boolean
          id: string
          ip_address: unknown | null
          location_history_accepted: boolean
          location_sharing_accepted: boolean
          marketplace_transactions_accepted: boolean
          microphone_access_accepted: boolean
          payment_processing_accepted: boolean
          precise_location_accepted: boolean
          privacy_accepted: boolean
          push_notifications_accepted: boolean
          recommendations_accepted: boolean
          terms_accepted: boolean
          updated_at: string
          user_agent: string | null
          user_id: string
          voice_video_calls_accepted: boolean
        }
        Insert: {
          analytics_accepted?: boolean
          background_location_accepted?: boolean
          business_verification_accepted?: boolean
          camera_access_accepted?: boolean
          communication_accepted?: boolean
          consent_given_at?: string
          consent_version?: string | null
          content_moderation_accepted?: boolean
          content_processing_accepted?: boolean
          crash_reporting_accepted?: boolean
          created_at?: string
          cross_platform_sync_accepted?: boolean
          data_processing_accepted?: boolean
          device_storage_accepted?: boolean
          emergency_contacts_accepted?: boolean
          external_apis_accepted?: boolean
          external_integrations_accepted?: boolean
          file_access_accepted?: boolean
          google_services_accepted?: boolean
          id?: string
          ip_address?: unknown | null
          location_history_accepted?: boolean
          location_sharing_accepted?: boolean
          marketplace_transactions_accepted?: boolean
          microphone_access_accepted?: boolean
          payment_processing_accepted?: boolean
          precise_location_accepted?: boolean
          privacy_accepted?: boolean
          push_notifications_accepted?: boolean
          recommendations_accepted?: boolean
          terms_accepted?: boolean
          updated_at?: string
          user_agent?: string | null
          user_id: string
          voice_video_calls_accepted?: boolean
        }
        Update: {
          analytics_accepted?: boolean
          background_location_accepted?: boolean
          business_verification_accepted?: boolean
          camera_access_accepted?: boolean
          communication_accepted?: boolean
          consent_given_at?: string
          consent_version?: string | null
          content_moderation_accepted?: boolean
          content_processing_accepted?: boolean
          crash_reporting_accepted?: boolean
          created_at?: string
          cross_platform_sync_accepted?: boolean
          data_processing_accepted?: boolean
          device_storage_accepted?: boolean
          emergency_contacts_accepted?: boolean
          external_apis_accepted?: boolean
          external_integrations_accepted?: boolean
          file_access_accepted?: boolean
          google_services_accepted?: boolean
          id?: string
          ip_address?: unknown | null
          location_history_accepted?: boolean
          location_sharing_accepted?: boolean
          marketplace_transactions_accepted?: boolean
          microphone_access_accepted?: boolean
          payment_processing_accepted?: boolean
          precise_location_accepted?: boolean
          privacy_accepted?: boolean
          push_notifications_accepted?: boolean
          recommendations_accepted?: boolean
          terms_accepted?: boolean
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          voice_video_calls_accepted?: boolean
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          app_version: string | null
          created_at: string | null
          device_token: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          os_version: string | null
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          device_token: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          os_version?: string | null
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          device_token?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          os_version?: string | null
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_preferences: {
        Row: {
          business_card_permanently_dismissed: boolean | null
          business_creation_reminders: boolean | null
          created_at: string
          id: string
          last_business_card_shown_at: string | null
          profile_completion_dismissed: boolean | null
          profile_completion_reminders: boolean | null
          tutorial_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_card_permanently_dismissed?: boolean | null
          business_creation_reminders?: boolean | null
          created_at?: string
          id?: string
          last_business_card_shown_at?: string | null
          profile_completion_dismissed?: boolean | null
          profile_completion_reminders?: boolean | null
          tutorial_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_card_permanently_dismissed?: boolean | null
          business_creation_reminders?: boolean | null
          created_at?: string
          id?: string
          last_business_card_shown_at?: string | null
          profile_completion_dismissed?: boolean | null
          profile_completion_reminders?: boolean | null
          tutorial_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          audio_settings: Json | null
          created_at: string
          id: string
          messaging_preferences: Json | null
          notification_settings: Json | null
          privacy_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_settings?: Json | null
          created_at?: string
          id?: string
          messaging_preferences?: Json | null
          notification_settings?: Json | null
          privacy_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_settings?: Json | null
          created_at?: string
          id?: string
          messaging_preferences?: Json | null
          notification_settings?: Json | null
          privacy_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_businesses: {
        Row: {
          business_name: string | null
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string | null
          is_verified: boolean | null
          logo_url: string | null
          operating_hours: Json | null
          phone: string | null
          physical_address: string | null
          rating: number | null
          state: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          business_name?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          operating_hours?: Json | null
          phone?: string | null
          physical_address?: string | null
          rating?: number | null
          state?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          business_name?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          operating_hours?: Json | null
          phone?: string | null
          physical_address?: string | null
          rating?: number | null
          state?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_staff_invitation: {
        Args:
          | { _invitation_code: string; _user_id: string }
          | { invitation_code: string; user_email: string }
        Returns: boolean
      }
      approve_marketplace_item: {
        Args: {
          _approval_status: string
          _item_id: string
          _rejection_reason?: string
        }
        Returns: boolean
      }
      approve_service: {
        Args: {
          _approval_status: string
          _rejection_reason?: string
          _service_id: string
        }
        Returns: boolean
      }
      bulk_moderate_content: {
        Args: {
          action_type: string
          content_ids: string[]
          content_type: string
          rejection_reason?: string
        }
        Returns: {
          error_count: number
          errors: Json
          processed_count: number
          success_count: number
        }[]
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      can_moderate_board_posts: {
        Args: { board_id: string; user_id: string }
        Returns: boolean
      }
      check_super_admin_security: {
        Args: { _ip_address?: unknown; _user_id: string }
        Returns: Json
      }
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_call_signals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      confirm_emergency_contact_request: {
        Args: { _accept?: boolean; _request_id: string }
        Returns: Json
      }
      create_conversation_with_request_check: {
        Args: {
          conversation_type?: string
          marketplace_item_id?: string
          marketplace_service_id?: string
          recipient_id: string
          sender_id: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          _body: string
          _channels?: string[]
          _data?: Json
          _priority?: string
          _scheduled_for?: string
          _source_id?: string
          _source_type?: string
          _title: string
          _type?: string
          _user_id: string
        }
        Returns: string
      }
      create_staff_invitation: {
        Args:
          | {
              _email: string
              _invited_by: string
              _role: Database["public"]["Enums"]["app_role"]
            }
          | { invitation_email: string; invitation_role: string }
        Returns: string
      }
      delete_conversation: {
        Args: { conversation_id: string }
        Returns: boolean
      }
      delete_messages: {
        Args: { message_ids: string[] }
        Returns: boolean
      }
      enqueue_alert: {
        Args: { _alert_id: string; _priority?: number }
        Returns: string
      }
      generate_board_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_confirmation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_advertisements: {
        Args: {
          content_limit?: number
          user_city?: string
          user_location?: string
          user_state?: string
        }
        Returns: {
          ad_call_to_action: string
          ad_description: string
          ad_images: Json
          ad_title: string
          ad_url: string
          business_data: Json
          campaign_id: string
          campaign_type: string
          community_post_data: Json
          daily_budget: number
          event_data: Json
          marketplace_data: Json
          priority_level: number
          service_data: Json
        }[]
      }
      get_active_promoted_content: {
        Args: { content_limit?: number; user_location?: string }
        Returns: {
          campaign_id: string
          cost_per_click: number
          post_content: Json
          post_type: string
          priority: number
          promoted_post_id: string
        }[]
      }
      get_admin_user_stats: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          active_users_this_week: number
          active_users_today: number
          banned_users: number
          new_users_this_month: number
          new_users_this_week: number
          new_users_today: number
          pending_verification: number
          total_users: number
          user_growth_rate: number
          verified_users: number
        }[]
      }
      get_analytics_summary: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          active_users: number
          avg_session_time: number
          new_users: number
          total_engagement: number
          total_posts: number
          total_revenue: number
          total_users: number
        }[]
      }
      get_business_verification_queue: {
        Args: Record<PropertyKey, never>
        Returns: {
          business_id: string
          business_license: string
          business_name: string
          category: string
          created_at: string
          email: string
          phone: string
          priority_score: number
          tax_id_number: string
          user_id: string
          verification_documents: Json
          verification_status: string
        }[]
      }
      get_cached_alerts: {
        Args: { _cache_key: string }
        Returns: Json
      }
      get_comment_likes: {
        Args: { _comment_ids: string[] }
        Returns: {
          comment_id: string
          liked_by_user: boolean
          likes_count: number
        }[]
      }
      get_content_moderation_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          flagged_content_by_type: Json
          pending_advertisements: number
          pending_businesses: number
          pending_marketplace_items: number
          pending_posts: number
          pending_reports: number
          pending_services: number
          resolved_reports_today: number
          total_reports: number
        }[]
      }
      get_emergency_alerts_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_alerts: number
          alerts_by_type: Json
          recent_critical_alerts: Json
          resolved_alerts_today: number
          response_time_avg_minutes: number
          total_panic_alerts: number
          unresolved_panic_alerts: number
        }[]
      }
      get_event_rsvp_counts: {
        Args: { _event_id: string }
        Returns: {
          going: number
          interested: number
          not_going: number
        }[]
      }
      get_flagged_content_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_profile_by_staff_id: {
        Args: { target_staff_id: number }
        Returns: {
          city: string
          created_at: string
          email: string
          full_name: string
          is_verified: boolean
          neighborhood: string
          phone: string
          staff_id: number
          state: string
          user_id: string
        }[]
      }
      get_profile_for_moderation: {
        Args: { target_user_id: string }
        Returns: {
          city: string
          created_at: string
          email: string
          full_name: string
          is_verified: boolean
          state: string
          user_id: string
        }[]
      }
      get_profiles_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          city: string
          created_at: string
          has_address: boolean
          has_email: boolean
          has_name: boolean
          has_phone: boolean
          is_verified: boolean
          state: string
          updated_at: string
          user_id: string
        }[]
      }
      get_public_business_info: {
        Args: { business_id: string }
        Returns: {
          business_name: string
          category: string
          city: string
          description: string
          email: string
          id: string
          is_verified: boolean
          logo_url: string
          phone: string
          rating: number
          state: string
          total_reviews: number
          website_url: string
        }[]
      }
      get_public_profile_info: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          city: string
          full_name: string
          is_verified: boolean
          state: string
          user_id: string
        }[]
      }
      get_public_safety_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string
          alert_type: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          severity: string
          status: string
        }[]
      }
      get_revenue_breakdown: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          ad_campaign_revenue: number
          average_transaction_value: number
          promotion_revenue: number
          revenue_by_day: Json
          service_booking_revenue: number
          top_revenue_sources: Json
          total_revenue: number
          transaction_count: number
        }[]
      }
      get_sponsored_content_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_staff_management_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_staff_today: number
          pending_invitations: number
          recent_staff_activities: Json
          staff_by_role: Json
          top_staff_performers: Json
          total_staff: number
        }[]
      }
      get_system_health_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_sessions: number
          api_requests_last_hour: number
          database_connections: number
          emergency_alerts_active: number
          error_rate_last_hour: number
          messages_last_hour: number
          posts_last_hour: number
          system_status: string
          total_storage_used_mb: number
        }[]
      }
      get_top_content_by_engagement: {
        Args: {
          content_type_filter?: string
          end_date?: string
          limit_count?: number
          start_date?: string
        }
        Returns: {
          content_id: string
          content_type: string
          engagement_score: number
          total_comments: number
          total_likes: number
          total_shares: number
          total_views: number
        }[]
      }
      get_unread_community_posts_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_unread_messages_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_unread_notifications_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_notifications: {
        Args: {
          _limit?: number
          _offset?: number
          _status?: string
          _type?: string
          _user_id: string
        }
        Returns: {
          body: string
          created_at: string
          data: Json
          delivery_status: Json
          id: string
          priority: string
          read_at: string
          status: string
          title: string
          type: string
        }[]
      }
      get_user_staff_role: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_users_who_listed_my_phone: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
        }[]
      }
      handle_message_request: {
        Args: { action: string; conversation_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_staff_permission: {
        Args: { _access_type?: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      is_board_admin: {
        Args: { board_id: string; user_id: string }
        Returns: boolean
      }
      is_board_creator: {
        Args: { board_id: string; user_id: string }
        Returns: boolean
      }
      is_board_member: {
        Args: { board_id: string; user_id: string }
        Returns: boolean
      }
      is_profile_complete: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      log_2fa_attempt: {
        Args: {
          _attempt_type: string
          _ip_address?: unknown
          _success: boolean
          _user_agent?: string
          _user_id: string
        }
        Returns: undefined
      }
      log_ad_interaction: {
        Args: {
          _campaign_id: string
          _device_type?: string
          _interaction_type: string
          _ip_address?: unknown
          _referrer?: string
          _user_agent?: string
          _user_id?: string
          _user_location?: string
        }
        Returns: undefined
      }
      log_promotion_impression: {
        Args: {
          _impression_type?: string
          _promoted_post_id: string
          _user_id?: string
          _user_location?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          _action_type: string
          _details?: Json
          _resource_id?: string
          _resource_type: string
          _risk_level?: string
        }
        Returns: undefined
      }
      log_staff_activity: {
        Args: {
          _action_type: string
          _details?: Json
          _resource_id?: string
          _resource_type: string
        }
        Returns: undefined
      }
      mark_all_community_posts_as_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_all_notifications_as_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_board_post_as_read: {
        Args: { target_post_id: string }
        Returns: undefined
      }
      mark_community_post_as_read: {
        Args: { target_post_id: string }
        Returns: undefined
      }
      mark_direct_messages_as_read: {
        Args: { conversation_id: string; current_user_id: string }
        Returns: undefined
      }
      mark_message_as_read: {
        Args: { message_id: string }
        Returns: boolean
      }
      mark_messages_as_delivered: {
        Args: { recipient_user_id: string; sender_user_id: string }
        Returns: undefined
      }
      mark_notification_delivered: {
        Args: {
          _channel: string
          _notification_id: string
          _provider?: string
          _provider_id?: string
        }
        Returns: boolean
      }
      mark_notification_read: {
        Args: { _notification_id: string; _user_id: string }
        Returns: boolean
      }
      process_alert_queue: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      register_user_device: {
        Args:
          | {
              _app_version?: string
              _device_token: string
              _os_version?: string
              _platform: string
              _user_id: string
            }
          | {
              apns_token: string
              device_model: string
              fcm_token: string
              platform: string
            }
        Returns: string
      }
      set_alert_cache: {
        Args: { _cache_data: Json; _cache_key: string; _ttl_seconds?: number }
        Returns: undefined
      }
      soft_delete_messages: {
        Args: { message_ids: string[] }
        Returns: boolean
      }
      track_alert_metric: {
        Args: {
          _alert_id: string
          _location?: string
          _metadata?: Json
          _metric_type: string
          _user_id?: string
        }
        Returns: undefined
      }
      track_user_activity: {
        Args: {
          _activity_data?: Json
          _activity_type: string
          _user_id: string
        }
        Returns: undefined
      }
      update_super_admin_security_check: {
        Args: { _user_id: string }
        Returns: undefined
      }
      user_allows_direct_messages: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      user_has_business: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      validate_content_input: {
        Args: { content_text: string; max_length?: number }
        Returns: boolean
      }
      verify_backup_code: {
        Args: { _backup_code: string; _user_id: string }
        Returns: boolean
      }
      verify_totp_code: {
        Args: { _totp_code: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_status: "active" | "resolved" | "investigating" | "false_alarm"
      app_role:
        | "admin"
        | "user"
        | "super_admin"
        | "moderator"
        | "manager"
        | "support"
        | "staff"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      contact_method: "in_app" | "sms" | "whatsapp" | "phone_call"
      direct_message_status: "sent" | "delivered" | "read"
      emergency_situation_type:
        | "medical_emergency"
        | "fire"
        | "break_in"
        | "assault"
        | "accident"
        | "natural_disaster"
        | "suspicious_activity"
        | "domestic_violence"
        | "other"
        | "kidnapping"
        | "violence"
      item_category:
        | "electronics"
        | "furniture"
        | "clothing"
        | "books"
        | "vehicles"
        | "appliances"
        | "toys"
        | "sports"
        | "tools"
        | "other"
      listing_status: "active" | "sold" | "pending" | "cancelled"
      safety_alert_type:
        | "break_in"
        | "theft"
        | "accident"
        | "suspicious_activity"
        | "harassment"
        | "fire"
        | "flood"
        | "power_outage"
        | "road_closure"
        | "other"
      service_category:
        | "home_repair"
        | "tutoring"
        | "pet_sitting"
        | "cleaning"
        | "gardening"
        | "tech_support"
        | "cooking"
        | "transport"
        | "fitness"
        | "beauty"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["low", "medium", "high", "critical"],
      alert_status: ["active", "resolved", "investigating", "false_alarm"],
      app_role: [
        "admin",
        "user",
        "super_admin",
        "moderator",
        "manager",
        "support",
        "staff",
      ],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      contact_method: ["in_app", "sms", "whatsapp", "phone_call"],
      direct_message_status: ["sent", "delivered", "read"],
      emergency_situation_type: [
        "medical_emergency",
        "fire",
        "break_in",
        "assault",
        "accident",
        "natural_disaster",
        "suspicious_activity",
        "domestic_violence",
        "other",
        "kidnapping",
        "violence",
      ],
      item_category: [
        "electronics",
        "furniture",
        "clothing",
        "books",
        "vehicles",
        "appliances",
        "toys",
        "sports",
        "tools",
        "other",
      ],
      listing_status: ["active", "sold", "pending", "cancelled"],
      safety_alert_type: [
        "break_in",
        "theft",
        "accident",
        "suspicious_activity",
        "harassment",
        "fire",
        "flood",
        "power_outage",
        "road_closure",
        "other",
      ],
      service_category: [
        "home_repair",
        "tutoring",
        "pet_sitting",
        "cleaning",
        "gardening",
        "tech_support",
        "cooking",
        "transport",
        "fitness",
        "beauty",
        "other",
      ],
    },
  },
} as const
