export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface OptimisticMessage {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  status: MessageStatus;
  is_read: boolean;
  attachments?: any[];
  optimistic?: boolean; // Flag to indicate optimistic message
  delivered_at?: string | null;
  read_at?: string | null;
}
