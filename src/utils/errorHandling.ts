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

  // Log error to database and external services
  async logError(errorInfo: ErrorInfo): Promise<void> {
    try {
      // Log to database
      await supabase
        .from('error_logs')
        .insert({
          error_type: errorInfo.type,
          severity: errorInfo.severity,
          message: errorInfo.message,
          user_message: errorInfo.userMessage,
          error_code: errorInfo.code,
          details: errorInfo.details,
          user_id: errorInfo.userId,
          route: errorInfo.route,
          stack_trace: errorInfo.stack,
          timestamp: errorInfo.timestamp
        });

      // Send critical errors to admin
      if (errorInfo.severity === ErrorSeverity.CRITICAL) {
        await this.sendCriticalAlert(errorInfo);
      }

      // Console log in development
      if (this.isDevelopment) {
        console.error('Error logged:', errorInfo);
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

    // Authentication errors
    if (error.message?.includes('JWT') || error.message?.includes('session') || error.status === 401) {
      return {
        ...baseInfo,
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        message: error.message || 'Authentication failed',
        userMessage: 'Your session has expired. Please log in again.',
        code: 'AUTH_001'
      };
    }

    // Authorization errors
    if (error.status === 403 || error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      return {
        ...baseInfo,
        type: ErrorType.AUTHORIZATION,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Authorization failed',
        userMessage: 'You don\'t have permission to perform this action.',
        code: 'AUTH_002'
      };
    }

    // Network errors
    if (error.name === 'NetworkError' || error.message?.includes('fetch') || error.message?.includes('network')) {
      return {
        ...baseInfo,
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        message: error.message || 'Network error',
        userMessage: 'Connection error. Please check your internet connection and try again.',
        code: 'NET_001'
      };
    }

    // Database errors
    if (error.code?.startsWith('23') || error.message?.includes('duplicate') || error.message?.includes('constraint')) {
      let userMessage = 'A database error occurred. Please try again.';
      
      if (error.message?.includes('duplicate')) {
        userMessage = 'This record already exists.';
      } else if (error.message?.includes('foreign key')) {
        userMessage = 'Cannot complete this action due to related data.';
      }

      return {
        ...baseInfo,
        type: ErrorType.DATABASE,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Database error',
        userMessage,
        code: 'DB_001',
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
    const variant = errorInfo.severity === ErrorSeverity.CRITICAL || errorInfo.severity === ErrorSeverity.HIGH 
      ? 'destructive' 
      : 'default';

    toast({
      title: this.getErrorTitle(errorInfo.type),
      description: errorInfo.userMessage,
      variant,
      duration: errorInfo.severity === ErrorSeverity.CRITICAL ? 0 : 5000, // Critical errors don't auto-dismiss
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