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
      
      let apiBase = settings.backendApiUrl?.trim() || env.VITE_API_URL || ''; 
      
      // Basic URL Cleanup
      if (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1);
      
      if (!apiBase) {
        throw new Error("Backend API URL is missing. Please configure it in Settings.");
      }

      const proxyUrl = `${apiBase}/api/shipping/generate-label`;
      const testUrl = `${apiBase}/api/shipping/test`;

      // 1. DIAGNOSTIC PRE-CHECK
      console.log(`Diagnosing Connection to: ${apiBase}`);
      try {
        const testResp = await fetch(testUrl, { method: 'GET' });
        if (!testResp.ok) {
            console.warn(`Warning: Test Endpoint returned ${testResp.status}. The Controller might not be deployed.`);
        } else {
            console.log("Diagnostic Check: Shipping Controller is Active.");
        }
      } catch (checkErr) {
        console.warn("Diagnostic Check Failed: Could not reach backend root.", checkErr);
        // We continue anyway, just in case it's a specific endpoint issue
      }

      // 2. PREPARE REQUEST
      // Ensure ID is always a STRING.
      const shipmentIdToUse = customShipmentId && customShipmentId.trim() !== '' 
          ? customShipmentId 
          : String(orderId);

      console.log(`Sending Label Request to: ${proxyUrl}. Shipment ID: ${shipmentIdToUse}`);

      const payload = {
        shipment_ids: [shipmentIdToUse], 
        document_type: 'label',
        label_layout: '1x2',
        output_format: 'url'
      };

      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      const apiKey = settings.sendifyApiKey;
      if (apiKey) {
          headers['x-api-key'] = apiKey;
      }

      // 3. EXECUTE REQUEST
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorText = response.statusText;
        try {
            errorText = await response.text();
        } catch (readError) {
            console.warn("Could not read error response body:", readError);
        }
        
        if (response.status === 404) {
             throw new Error(`Endpoint 404 Not Found at ${proxyUrl}. The API is reachable, but 'api/shipping/generate-label' does not exist. Check Cloud Run logs.`);
        }

        let errorMessage = `API Error ${response.status}`;
        try {
            const errData = JSON.parse(errorText);
            console.error("Sendify API Error Payload:", errData);
            errorMessage = errData.message || errData.error || errorMessage;
        } catch (e) { 
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

  async testConnection(): Promise<boolean> {
     return true; 
  }
}

export const sendifyService = new SendifyService();