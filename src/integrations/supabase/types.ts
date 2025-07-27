export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
          user_id: string
        }
        Insert: {
          board_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          board_id?: string
          id?: string
          joined_at?: string
          role?: string
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
          created_at: string
          id: string
          last_message_at: string
          updated_at: string
          user1_has_unread: boolean | null
          user1_id: string
          user2_has_unread: boolean | null
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          updated_at?: string
          user1_has_unread?: boolean | null
          user1_id: string
          user2_has_unread?: boolean | null
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
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
          avatar_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_public: boolean | null
          location: string | null
          member_limit: number | null
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          member_limit?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          member_limit?: number | null
          name?: string
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
          category: Database["public"]["Enums"]["item_category"]
          condition: string | null
          created_at: string
          description: string
          id: string
          images: string[] | null
          is_negotiable: boolean | null
          location: string | null
          price: number | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          condition?: string | null
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          is_negotiable?: boolean | null
          location?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          condition?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          is_negotiable?: boolean | null
          location?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
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
      panic_alerts: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_resolved: boolean | null
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
          id?: string
          is_resolved?: boolean | null
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
          id?: string
          is_resolved?: boolean | null
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
        Relationships: []
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
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_emergency_alerts: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          panic_alert_id: string
          radius_km: number | null
          resolved_at: string | null
          situation_type: Database["public"]["Enums"]["emergency_situation_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          panic_alert_id: string
          radius_km?: number | null
          resolved_at?: string | null
          situation_type: Database["public"]["Enums"]["emergency_situation_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          panic_alert_id?: string
          radius_km?: number | null
          resolved_at?: string | null
          situation_type?: Database["public"]["Enums"]["emergency_situation_type"]
          updated_at?: string
          user_id?: string
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
          severity?: Database["public"]["Enums"]["alert_severity"] | null
          status?: Database["public"]["Enums"]["alert_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
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
      services: {
        Row: {
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
          title: string
          total_reviews: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
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
          title: string
          total_reviews?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
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
          title?: string
          total_reviews?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
      generate_board_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_confirmation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
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
      user_allows_direct_messages: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_status: "active" | "resolved" | "investigating" | "false_alarm"
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
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
