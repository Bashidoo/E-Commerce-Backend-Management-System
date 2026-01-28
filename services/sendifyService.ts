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
   */
  async generateLabel(orderId: number, customShipmentId?: string): Promise<string> {
    try {
      const settings = this.getSettings();
      const env = (import.meta as any).env || {};
      
      let apiBase = settings.backendApiUrl?.trim() || env.VITE_API_URL || ''; 
      if (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1);
      
      if (!apiBase) {
        throw new Error("Backend API URL is missing. Please configure it in Settings.");
      }

      const proxyUrl = `${apiBase}/api/shipping/generate-label`;
      const testUrl = `${apiBase}/api/shipping/test`;

      // 1. PREPARE PAYLOAD
      const shipmentIdToUse = customShipmentId && customShipmentId.trim() !== '' 
          ? customShipmentId 
          : String(orderId);

      console.log(`[SendifyService] Target: ${proxyUrl} | ID: ${shipmentIdToUse}`);

      const payload = {
        shipment_ids: [shipmentIdToUse], 
        document_type: 'label',
        label_layout: '1x2',
        output_format: 'url'
      };

      const headers: any = { 'Content-Type': 'application/json' };
      if (settings.sendifyApiKey) headers['x-api-key'] = settings.sendifyApiKey;

      // 2. EXECUTE REQUEST
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get("content-type");
      let errorBody = "";
      
      if (contentType && contentType.includes("application/json")) {
          const json = await response.json();
          // If success
          if (response.ok) {
              if (!json.output_url) throw new Error("API success but missing 'output_url'.");
              return json.output_url;
          }
          errorBody = JSON.stringify(json, null, 2);
      } else {
          errorBody = await response.text();
          if (response.ok) {
             return errorBody; 
          }
      }

      // 3. HANDLE ERRORS
      if (response.status === 404) {
          // INTELLIGENT DETECTION: 
          // If the error body is JSON and contains "error", it is a BUSINESS ERROR from Sendify (Shipment Not Found),
          // passed through by an older version of the backend. It is NOT a connectivity error.
          let isBusinessError = false;
          try {
              if (errorBody && (errorBody.trim().startsWith('{') || errorBody.includes('"error"'))) {
                  isBusinessError = true;
              }
          } catch(e) {}

          if (isBusinessError) {
              // Extract the clean message if possible
              try {
                  const errJson = JSON.parse(errorBody);
                  const msg = errJson.error || errJson.message || errorBody;
                  throw new Error(`Shipment Not Found in Sendify: ${msg}`);
              } catch(e) {
                  throw new Error(`Shipment Not Found in Sendify: ${errorBody}`);
              }
          }

          // If it's NOT a business error, it's likely the Backend Route is missing.
          console.warn("[SendifyService] 404 encountered (Non-JSON). Running connectivity check...");
          try {
              const check = await fetch(testUrl);
              if (check.ok) {
                   throw new Error(`The Backend is Online, but the route '${proxyUrl}' was not found. This usually means the 'ShippingController' is missing from the deployment.`);
              } else {
                   throw new Error(`Backend Connectivity Check Failed (${check.status}). Is the server running at ${apiBase}?`);
              }
          } catch (connErr) {
              throw new Error(`Backend Unreachable (404). Check URL in settings. Details: ${errorBody}`);
          }
      }

      if (response.status === 502) {
          throw new Error(`Upstream Sendify Error: ${errorBody}`);
      }

      throw new Error(`API Error (${response.status}): ${errorBody}`);

    } catch (error: any) {
      console.error("Label Generation Failed:", error);
      throw error; // Re-throw to UI
    }
  }

  async testConnection(): Promise<boolean> {
     return true; 
  }
}

export const sendifyService = new SendifyService();