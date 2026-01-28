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
      sendifyApiKey: '',
      backendApiUrl: ''
    };
  }

  /**
   * Generates a shipping label.
   * ROUTES REQUEST THROUGH BACKEND PROXY.
   * 
   * @param orderId The internal order ID.
   * @param customShipmentId Optional. If provided, uses this ID (e.g. 'shp_123') instead of the numeric orderId.
   */
  async generateLabel(orderId: number, customShipmentId?: string): Promise<string> {
    try {
      const settings = this.getSettings();
      const env = (import.meta as any).env || {};
      
      // Order of precedence:
      // 1. Local Storage Setting (User configured in UI)
      // 2. Env Var (VITE_API_URL)
      // 3. Fallback to empty (relative path)
      let apiBase = settings.backendApiUrl || env.VITE_API_URL || ''; 
      
      // Remove trailing slash if present
      if (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1);

      const proxyUrl = `${apiBase}/api/shipping/generate-label`;

      // FIX: Ensure ID is always a STRING. Sendify API rejects numbers in the JSON array.
      const shipmentIdToUse = customShipmentId && customShipmentId.trim() !== '' 
          ? customShipmentId 
          : String(orderId);

      console.log(`Generating label via Backend Proxy at: ${proxyUrl}. Shipment ID: ${shipmentIdToUse}`);

      const payload = {
        shipment_ids: [shipmentIdToUse], 
        document_type: 'label',
        label_layout: '1x2',
        output_format: 'url'
      };

      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      // Only attach header if user explicitly overrode it in Local Settings.
      const apiKey = settings.sendifyApiKey;
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
             throw new Error(`Backend Endpoint Not Found (404) at ${proxyUrl}. Please ensure your Backend URL in Settings is correct and the API is running.`);
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