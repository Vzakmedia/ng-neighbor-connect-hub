// Common type definitions used across the application

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalBaseProps extends BaseComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface LoadingState {
  loading: boolean;
  error?: string | null;
}

export interface AsyncOperationResult<T = any> {
  data?: T;
  loading: boolean;
  error?: string | null;
}

export interface ToastMessage {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export interface UserBasic {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'file';
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export type AsyncCallback<T = void> = () => Promise<T>;
export type AsyncCallbackWithArgs<T = void, U = any> = (args: U) => Promise<T>;