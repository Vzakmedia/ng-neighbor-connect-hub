export class GoogleCalendarLoader {
  private static readonly SCRIPT_URL = 'https://apis.google.com/js/api.js';
  private static readonly TIMEOUT_MS = 15000;
  
  static async loadGoogleAPI(): Promise<void> {
    if (window.gapi) {
      console.log('Google API already loaded');
      return;
    }

    console.log('Loading Google API...');
    
    try {
      // Try primary loading method
      await this.loadGapiScript();
    } catch (scriptError) {
      console.warn('Direct script loading failed, trying alternative method:', scriptError);
      
      // Try alternative loading method
      try {
        await this.loadGapiAlternative();
      } catch (altError) {
        console.error('All loading methods failed:', altError);
        throw new Error('Unable to load Google Calendar API. Please check your network connection and try again.');
      }
    }
    
    // Wait for gapi to be fully available
    await this.waitForGapi();
  }

  private static loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Remove any existing failed scripts
      this.removeExistingScripts();

      const script = document.createElement('script');
      script.src = this.SCRIPT_URL;
      script.async = true;
      script.defer = false;
      
      const timeout = setTimeout(() => {
        reject(new Error('Google API script loading timeout'));
      }, this.TIMEOUT_MS);
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('Google API script loaded successfully via direct method');
        resolve();
      };
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Google API script failed to load via direct method:', error);
        reject(error);
      };
      
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
    let attempts = 0;
    const maxAttempts = 50;
    
    while (!window.gapi && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.gapi) {
      throw new Error('Google API failed to initialize after loading');
    }
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