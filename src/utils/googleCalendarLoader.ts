export class GoogleCalendarLoader {
  private static readonly SCRIPT_URL = 'https://apis.google.com/js/api.js';
  private static readonly TIMEOUT_MS = 15000;
  
  static async loadGoogleAPI(): Promise<void> {
    console.log('GoogleCalendarLoader: Starting API load process');
    
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }

    if (window.gapi) {
      console.log('GoogleCalendarLoader: GAPI already loaded');
      await this.waitForGapi();
      return;
    }

    console.log('GoogleCalendarLoader: GAPI not found, loading script...');
    
    try {
      // Try primary loading method
      await this.loadGapiScript();
      console.log('GoogleCalendarLoader: Script loaded successfully via direct method');
    } catch (scriptError) {
      console.warn('GoogleCalendarLoader: Direct script loading failed, trying alternative method:', scriptError);
      
      // Try alternative loading method
      try {
        await this.loadGapiAlternative();
        console.log('GoogleCalendarLoader: Script loaded successfully via alternative method');
      } catch (altError) {
        console.error('GoogleCalendarLoader: All loading methods failed:', altError);
        throw new Error('Unable to load Google Calendar API. Please check your network connection and try again.');
      }
    }
    
    // Wait for gapi to be fully available
    await this.waitForGapi();
    console.log('GoogleCalendarLoader: Google API fully loaded and ready');
  }

  private static loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('GoogleCalendarLoader: Creating script element for direct loading');
      
      // Remove any existing failed scripts
      this.removeExistingScripts();

      const script = document.createElement('script');
      script.src = this.SCRIPT_URL;
      script.async = true;
      script.defer = false;
      
      const timeout = setTimeout(() => {
        console.error('GoogleCalendarLoader: Script loading timeout');
        script.remove();
        reject(new Error('Google API script loading timeout'));
      }, this.TIMEOUT_MS);
      
      script.onload = () => {
        console.log('GoogleCalendarLoader: Script onload event triggered');
        clearTimeout(timeout);
        
        // Give it a moment to initialize
        setTimeout(() => {
          if (window.gapi) {
            console.log('GoogleCalendarLoader: GAPI available after script load');
            resolve();
          } else {
            console.error('GoogleCalendarLoader: GAPI not available after script load');
            reject(new Error('Google API not available after script load'));
          }
        }, 200);
      };
      
      script.onerror = (error) => {
        console.error('GoogleCalendarLoader: Script loading error:', error);
        clearTimeout(timeout);
        script.remove();
        reject(new Error('Failed to load Google API script'));
      };
      
      console.log('GoogleCalendarLoader: Appending script to head');
      document.head.appendChild(script);
    });
  }

  private static loadGapiAlternative(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${this.SCRIPT_URL}?callback=initGapi`;
      script.async = true;
      
      // Create a global callback
      window.initGapi = () => {
        console.log('Google API loaded via callback method');
        resolve();
        delete window.initGapi;
      };
      
      const timeout = setTimeout(() => {
        reject(new Error('Alternative Google API loading timeout'));
      }, this.TIMEOUT_MS);
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  }

  private static async waitForGapi(): Promise<void> {
    console.log('GoogleCalendarLoader: Waiting for GAPI to be available');
    
    let attempts = 0;
    const maxAttempts = 100; // Increased attempts for better reliability
    
    while (!window.gapi && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      
      if (attempts % 10 === 0) {
        console.log(`GoogleCalendarLoader: Still waiting for GAPI (attempt ${attempts}/${maxAttempts})`);
      }
    }
    
    if (!window.gapi) {
      console.error('GoogleCalendarLoader: GAPI failed to initialize after maximum wait time');
      throw new Error('Google API failed to initialize after loading');
    }
    
    console.log('GoogleCalendarLoader: GAPI is now available and ready');
  }

  private static removeExistingScripts(): void {
    const existingScripts = document.querySelectorAll('script[src*="apis.google.com"]');
    existingScripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });
  }
}