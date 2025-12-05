
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { detectIOSDevice, logIOSCompatibility } from '@/utils/iosCompatibility';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Smartphone, Shield } from '@/lib/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  deviceInfo?: any;
  isSecurityError?: boolean;
}

export class IOSErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isSecurityError = error.name === 'SecurityError' || 
                           error.message?.includes('insecure') ||
                           error.message?.includes('SecurityError');
    
    return { 
      hasError: true, 
      error,
      deviceInfo: detectIOSDevice(),
      isSecurityError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('iOS Error Boundary caught an error:', error, errorInfo);
    logIOSCompatibility();
    
    const isSecurityError = error.name === 'SecurityError' || 
                           error.message?.includes('insecure') ||
                           error.message?.includes('SecurityError');
    
    this.setState({
      error,
      errorInfo,
      deviceInfo: detectIOSDevice(),
      isSecurityError
    });

    // Log security errors specifically
    if (isSecurityError) {
      console.error('iOS Security Error detected:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        userAgent: navigator.userAgent,
        location: window.location.href,
        isPrivateBrowsing: this.state.deviceInfo?.isInPrivateBrowsing
      });
    }
  }

  handleRetry = () => {
    // Clear any problematic localStorage entries before retry
    try {
      if (this.state.isSecurityError) {
        // Try to clear potentially problematic storage
        const keysToRemove = ['supabase.auth.token', 'neighborlink-auth', 'app_preferences'];
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.debug('Could not remove localStorage key:', key);
          }
        });
      }
    } catch (e) {
      console.debug('Storage cleanup failed, continuing with retry');
    }
    
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, isSecurityError: false });
  };

  handleReload = () => {
    // Always use reload() to avoid URL corruption with HashRouter
    window.location.reload();
  };

  handlePrivateModeSwitch = () => {
    alert('Please try opening this app in a regular (non-private) browser tab for full functionality.');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { deviceInfo, error, isSecurityError } = this.state;
      const isIOSDevice = deviceInfo?.isIOS;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {isSecurityError ? (
                  <Shield className="h-12 w-12 text-destructive" />
                ) : isIOSDevice ? (
                  <Smartphone className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                )}
              </div>
              <CardTitle className="text-xl">
                {isSecurityError 
                  ? 'Security Error' 
                  : isIOSDevice 
                    ? 'iOS Compatibility Issue' 
                    : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {isSecurityError
                  ? 'A browser security restriction is preventing the app from loading properly.'
                  : isIOSDevice 
                    ? 'We detected an issue with iOS Safari compatibility.'
                    : 'An unexpected error occurred while loading the app.'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {isSecurityError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                  <p className="font-medium text-destructive">Security Restriction Detected</p>
                  <p className="text-muted-foreground mt-1">
                    This usually happens in private browsing mode or due to browser security settings.
                  </p>
                </div>
              )}

              {isIOSDevice && deviceInfo && (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Device Info:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>iOS Version: {deviceInfo.version || 'Unknown'}</li>
                    <li>Private Browsing: {deviceInfo.isInPrivateBrowsing ? 'Yes' : 'No'}</li>
                    <li>LocalStorage: {deviceInfo.supportsLocalStorage ? 'Available' : 'Blocked'}</li>
                  </ul>
                </div>
              )}

              {(deviceInfo?.isInPrivateBrowsing || isSecurityError) && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">Recommended Solutions:</p>
                  <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
                    <li>• Try using regular browsing mode (not private/incognito)</li>
                    <li>• Refresh the page and try again</li>
                    <li>• Check Safari security settings</li>
                    <li>• Try a different browser if available</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} variant="default" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button onClick={this.handleReload} variant="outline" className="w-full">
                  Reload Page
                </Button>

                {deviceInfo?.isInPrivateBrowsing && (
                  <Button onClick={this.handlePrivateModeSwitch} variant="secondary" className="w-full text-xs">
                    Switch to Regular Browsing
                  </Button>
                )}
              </div>

              {error && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Technical Details</summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {error.name}: {error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
