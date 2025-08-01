import { useState, useCallback } from 'react';
import { AsyncOperationResult, AsyncCallback, AsyncCallbackWithArgs } from '@/types/common';

interface UseAsyncOperationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

export const useAsyncOperation = <T = any>(
  options: UseAsyncOperationOptions = {}
) => {
  const [state, setState] = useState<AsyncOperationResult<T>>({
    loading: false,
    error: null,
  });

  const execute = useCallback(async (operation: AsyncCallback<T>) => {
    try {
      setState({ loading: true, error: null });
      const result = await operation();
      setState({ data: result, loading: false, error: null });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ loading: false, error: errorMessage });
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    }
  }, [options]);

  const executeWithArgs = useCallback(async <U = any>(
    operation: AsyncCallbackWithArgs<T, U>,
    args: U
  ) => {
    try {
      setState({ loading: true, error: null });
      const result = await operation(args);
      setState({ data: result, loading: false, error: null });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ loading: false, error: errorMessage });
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    executeWithArgs,
    reset,
  };
};