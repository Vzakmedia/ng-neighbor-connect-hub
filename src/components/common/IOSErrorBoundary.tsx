import React, { Component, ErrorInfo, ReactNode } from 'react';
import { detectIOSDevice, logIOSCompatibility } from '@/utils/iosCompatibility';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Smartphone } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  deviceInfo?: any;
}

export class IOSErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      deviceInfo: detectIOSDevice()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error with iOS device information
    console.error('iOS Error Boundary caught an error:', error, errorInfo);
    logIOSCompatibility();
    
    this.setState({
      error,
      errorInfo,
      deviceInfo: detectIOSDevice()
    });

    // Report to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `iOS Error: ${error.message}`,
        fatal: false,
        custom_map: {
          ios_version: this.state.deviceInfo?.version,
          is_private_browsing: this.state.deviceInfo?.isInPrivateBrowsing,
          supports_local_storage: this.state.deviceInfo?.supportsLocalStorage
        }
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { deviceInfo, error } = this.state;
      const isIOSDevice = deviceInfo?.isIOS;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {isIOSDevice ? (
                  <Smartphone className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                )}
              </div>
              <CardTitle className="text-xl">
                {isIOSDevice ? 'iOS Compatibility Issue' : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {isIOSDevice 
                  ? 'We detected an issue with iOS Safari compatibility.'
                  : 'An unexpected error occurred while loading the app.'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
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

              {deviceInfo?.isInPrivateBrowsing && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">Private Browsing Detected</p>
                  <p className="text-muted-foreground">
                    Some features may not work properly in private browsing mode. 
                    Try using regular browsing mode for the best experience.
                  </p>
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
              </div>

              {error && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Technical Details</summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {error.toString()}
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