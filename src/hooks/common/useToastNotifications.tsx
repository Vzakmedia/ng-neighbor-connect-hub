import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastMessage } from '@/types/common';

export const useToastNotifications = () => {
  const { toast } = useToast();

  const showSuccess = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
    });
  }, [toast]);

  const showError = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "destructive",
    });
  }, [toast]);

  const showToast = useCallback((toastMessage: ToastMessage) => {
    toast(toastMessage);
  }, [toast]);

  // Common toast messages
  const showLoadingError = useCallback(() => {
    showError("Error", "Could not load data. Please try again.");
  }, [showError]);

  const showSaveSuccess = useCallback(() => {
    showSuccess("Success", "Data saved successfully.");
  }, [showSuccess]);

  const showSaveError = useCallback(() => {
    showError("Error", "Could not save data. Please try again.");
  }, [showError]);

  const showDeleteSuccess = useCallback(() => {
    showSuccess("Success", "Item deleted successfully.");
  }, [showSuccess]);

  const showDeleteError = useCallback(() => {
    showError("Error", "Could not delete item. Please try again.");
  }, [showError]);

  const showNetworkError = useCallback(() => {
    showError("Network Error", "Please check your connection and try again.");
  }, [showError]);

  const showPermissionError = useCallback(() => {
    showError("Permission Denied", "You don't have permission to perform this action.");
  }, [showError]);

  return {
    showSuccess,
    showError,
    showToast,
    showLoadingError,
    showSaveSuccess,
    showSaveError,
    showDeleteSuccess,
    showDeleteError,
    showNetworkError,
    showPermissionError,
  };
};