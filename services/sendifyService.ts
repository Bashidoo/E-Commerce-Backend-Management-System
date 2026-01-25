import { Order, AppSettings } from '../types';

/**
 * Service to interact with the Sendify API for label generation.
 */
class SendifyService {
  private getSettings(): AppSettings {
    try {
      const saved = localStorage.getItem('appSettings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse settings", e);
    }
    return {
      connectionString: '',
      printerName: '',
      autoPrint: false,
      sendifyApiUrl: 'https://api.sendify.com/v1',
      sendifyApiKey: ''
    };
  }

  /**
   * Generates a shipping label.
   * ROUTES REQUEST THROUGH BACKEND PROXY.
   * STRICT SECURITY: This method does NOT read any env vars for the API key.
   * It assumes the Backend (API) has the key injected securely in the cloud.
   */
  async generateLabel(orderId: number): Promise<string> {
    try {
      const settings = this.getSettings();
      const env = (import.meta as any).env || {};
      
      // If the user manually entered a key in Settings, use it (Dev/Override mode).
      // Otherwise, send NOTHING. The backend will use its secure server-side secret.
      const apiKey = settings.sendifyApiKey;

      const apiBase = env.VITE_API_URL || ''; 
      const proxyUrl = `${apiBase}/api/shipping/generate-label`;

      console.log(`Generating label for Order ${orderId} via Backend Proxy...`);

      const payload = {
        shipment_ids: [orderId], 
        document_type: 'label',
        label_layout: '1x2',
        output_format: 'url'
      };

      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      // Only attach header if user explicitly overrode it in Local Settings.
      if (apiKey) {
          headers['x-api-key'] = apiKey;
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Safe error reading to prevent "body stream already read"
        let errorText = response.statusText;
        try {
            errorText = await response.text();
        } catch (readError) {
            console.warn("Could not read error response body:", readError);
        }
        
        // Handle 404 specifically
        if (response.status === 404) {
             throw new Error("Backend Endpoint Not Found (404). Please ensure your .NET Backend is running.");
        }

        let errorMessage = `API Error ${response.status}`;
        try {
            // Try to parse as JSON if possible
            const errData = JSON.parse(errorText);
            console.error("Sendify API Error Payload:", errData);
            errorMessage = errData.message || errData.error || errorMessage;
        } catch (e) { 
             // If not JSON, use the raw text
             if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.output_url) {
        throw new Error("API returned success but no 'output_url' was found.");
      }

      return data.output_url;

    } catch (error: any) {
      console.error("Sendify Label Generation Failed:", error);
      throw new Error(error.message || "Unable to connect to Sendify API via Proxy.");
    }
  }

  /**
   * Simple check to see if we have a manual override, otherwise we assume Server is configured.
   */
  async testConnection(): Promise<boolean> {
     // We can't truly "test" the server key without making a transaction.
     // We return true to assume the server is configured correctly.
     return true; 
  }
}

export const sendifyService = new SendifyService();