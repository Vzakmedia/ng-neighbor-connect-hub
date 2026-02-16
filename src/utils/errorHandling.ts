import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Error types for classification
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  DATABASE = 'database',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  ABORTED = 'aborted',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  timestamp: string;
  userId?: string;
  route?: string;
  stack?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private isDevelopment = process.env.NODE_ENV === 'development';

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Log error to console and handle critical alerts
  async logError(errorInfo: ErrorInfo): Promise<void> {
    try {
      // Console log for monitoring (removed database logging)
      console.error('Error logged:', {
        type: errorInfo.type,
        severity: errorInfo.severity,
        message: errorInfo.message,
        userMessage: errorInfo.userMessage,
        route: errorInfo.route,
        userId: errorInfo.userId,
        timestamp: errorInfo.timestamp
      });

      // Send critical errors to admin
      if (errorInfo.severity === ErrorSeverity.CRITICAL) {
        await this.sendCriticalAlert(errorInfo);
      }

      // Additional console log in development
      if (this.isDevelopment) {
        console.error('Development Error Details:', errorInfo);
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Send critical error alerts to admins - simplified logging only
  private async sendCriticalAlert(errorInfo: ErrorInfo): Promise<void> {
    try {
      // Log critical errors for admin monitoring
      console.error('CRITICAL ERROR ALERT:', {
        type: errorInfo.type,
        severity: errorInfo.severity,
        message: errorInfo.message,
        userMessage: errorInfo.userMessage,
        route: errorInfo.route,
        details: errorInfo.details,
        timestamp: new Date().toISOString()
      });
    } catch (alertError) {
      console.error('Failed to log critical error alert:', alertError);
    }
  }

  // Handle different types of errors
  handleError(error: any, context?: { route?: string; userId?: string }): ErrorInfo {
    const errorInfo = this.classifyError(error, context);

    // Log the error
    this.logError(errorInfo);

    // Show user notification
    this.showUserNotification(errorInfo);

    return errorInfo;
  }

  // Classify errors based on their properties
  public classifyError(error: any, context?: { route?: string; userId?: string }): ErrorInfo {
    const timestamp = new Date().toISOString();
    const baseInfo = {
      timestamp,
      userId: context?.userId,
      route: context?.route,
      stack: this.isDevelopment ? error.stack : undefined
    };

    // Handle AbortError / Signal Aborted
    if (error.name === 'AbortError' ||
      error.message?.includes('Aborted') ||
      error.message?.includes('signal is aborted')) {
      return {
        ...baseInfo,
        type: ErrorType.ABORTED,
        severity: ErrorSeverity.LOW,
        message: error.message || 'Request aborted',
        userMessage: '', // Don't show to user
        code: 'ABORT_001'
      };
    }

    // Network errors (handle before generic status codes)
    if (error.name === 'NetworkError' ||
      error.message?.toLowerCase().includes('fetch') ||
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('connection reset')) {
      return {
        ...baseInfo,
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        message: error.message || 'Network error',
        userMessage: 'We\'re having trouble connecting. Please check your internet and try again.',
        code: 'NET_001'
      };
    }

    // Authentication errors
    const authMessage = error.message?.toLowerCase() || '';
    if (authMessage.includes('invalid login credentials') ||
      authMessage.includes('invalid credentials') ||
      authMessage.includes('password') && authMessage.includes('incorrect')) {
      return {
        ...baseInfo,
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Auth failure',
        userMessage: 'Incorrect email or password. Please try again.',
        code: 'AUTH_001'
      };
    }

    if (authMessage.includes('email not confirmed')) {
      return {
        ...baseInfo,
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Email not confirmed',
        userMessage: 'Please confirm your email address before logging in.',
        code: 'AUTH_003'
      };
    }

    if (authMessage.includes('jwt') ||
      authMessage.includes('session') ||
      authMessage.includes('token') ||
      error.status === 401) {
      return {
        ...baseInfo,
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        message: error.message || 'Authentication failed',
        userMessage: 'Your session has expired. Please sign in again.',
        code: 'AUTH_002'
      };
    }

    // Authorization errors
    if (error.status === 403 ||
      authMessage.includes('permission') ||
      authMessage.includes('unauthorized') ||
      authMessage.includes('policy')) {
      return {
        ...baseInfo,
        type: ErrorType.AUTHORIZATION,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Authorization failed',
        userMessage: 'You don\'t have permission to perform this action.',
        code: 'AUTH_004'
      };
    }

    // Database errors (Postgres codes)
    const dbCode = error.code ? String(error.code) : undefined;
    const dbMessage = error.message?.toLowerCase() || '';

    if (dbCode?.startsWith('23') || dbMessage.includes('duplicate') || dbMessage.includes('constraint')) {
      let userMessage = 'A data error occurred. Please try again.';

      // 23505: Unique violation
      if (dbCode === '23505' || dbMessage.includes('duplicate key')) {
        userMessage = 'This item already exists.';
        // Try to find if it's a profile/username issue
        if (dbMessage.includes('profiles_username_key')) userMessage = 'This username is already taken.';
        if (dbMessage.includes('profiles_email_key')) userMessage = 'This email is already registered.';
      }
      // 23503: Foreign key violation
      else if (dbCode === '23503' || dbMessage.includes('foreign key')) {
        userMessage = 'This action cannot be completed because this item is being used elsewhere.';
      }
      // 23502: Not null violation
      else if (dbCode === '23502') {
        userMessage = 'Some required information is missing.';
      }

      return {
        ...baseInfo,
        type: ErrorType.DATABASE,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Database error',
        userMessage,
        code: dbCode || 'DB_001',
        details: error.details
      };
    }

    // Not found errors
    if (error.status === 404 || error.message?.includes('not found')) {
      return {
        ...baseInfo,
        type: ErrorType.NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: error.message || 'Resource not found',
        userMessage: 'The requested item could not be found.',
        code: 'NF_001'
      };
    }

    // Server errors
    if (error.status >= 500 || error.message?.includes('server')) {
      return {
        ...baseInfo,
        type: ErrorType.SERVER,
        severity: ErrorSeverity.CRITICAL,
        message: error.message || 'Server error',
        userMessage: 'Something went wrong on our end. We\'ve been notified and are working to fix it.',
        code: 'SRV_001'
      };
    }

    // Validation errors
    if (error.name === 'ValidationError' || error.message?.includes('validation') || error.message?.includes('required')) {
      return {
        ...baseInfo,
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.LOW,
        message: error.message || 'Validation error',
        userMessage: error.userMessage || 'Please check your input and try again.',
        code: 'VAL_001',
        details: error.details
      };
    }

    // Unknown errors
    return {
      ...baseInfo,
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: error.message || 'An unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      code: 'UNK_001'
    };
  }

  // Show appropriate user notification
  private showUserNotification(errorInfo: ErrorInfo): void {
    // Don't show notification for aborted requests or low severity non-critical errors
    if (errorInfo.type === ErrorType.ABORTED || !errorInfo.userMessage) {
      return;
    }

    const isError = errorInfo.severity === ErrorSeverity.CRITICAL || errorInfo.severity === ErrorSeverity.HIGH;
    const variant = isError ? 'destructive' : 'default';

    toast({
      title: this.getErrorTitle(errorInfo.type),
      description: errorInfo.userMessage,
      variant,
      duration: errorInfo.severity === ErrorSeverity.CRITICAL ? 10000 : 5000,
    });
  }

  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.AUTHENTICATION:
        return 'Authentication Required';
      case ErrorType.AUTHORIZATION:
        return 'Access Denied';
      case ErrorType.NETWORK:
        return 'Connection Error';
      case ErrorType.DATABASE:
        return 'Data Error';
      case ErrorType.NOT_FOUND:
        return 'Not Found';
      case ErrorType.SERVER:
        return 'Server Error';
      case ErrorType.VALIDATION:
        return 'Invalid Input';
      default:
        return 'Error';
    }
  }
}

// Utility functions
export const errorHandler = ErrorHandler.getInstance();

export const handleApiError = (error: any, context?: { route?: string; userId?: string }) => {
  return errorHandler.handleError(error, context);
};

export const logError = (error: any, context?: { route?: string; userId?: string }) => {
  return errorHandler.handleError(error, context);
};

// Retry wrapper with exponential backoff
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on authentication or validation errors
      const errorInfo = errorHandler.classifyError(error);
      if (errorInfo.type === ErrorType.AUTHENTICATION ||
        errorInfo.type === ErrorType.VALIDATION ||
        errorInfo.type === ErrorType.AUTHORIZATION) {
        break;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Form validation error handler
export const handleValidationErrors = (errors: Record<string, string[]>) => {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');

  toast({
    title: 'Validation Error',
    description: errorMessages,
    variant: 'destructive'
  });
};