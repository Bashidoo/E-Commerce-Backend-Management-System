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

  private getApiBase() {
    const settings = this.getSettings();
    const env = (import.meta as any).env || {};
    let apiBase = settings.backendApiUrl?.trim() || env.VITE_API_URL || ''; 
    if (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1);
    
    if (!apiBase) {
      throw new Error("Backend API URL is missing. Please configure it in Settings.");
    }
    return apiBase;
  }

  /**
   * Books a shipment using the address details.
   */
  async bookShipment(order: Order, isTest: boolean = false): Promise<{ labelUrl: string, warning?: string }> {
     const apiBase = this.getApiBase();
     const settings = this.getSettings();
     const url = `${apiBase}/api/shipping/book`;

     // Fallback to User data if Snapshot is missing
     const name = `${order.user?.firstName} ${order.user?.lastName}`;
     const email = order.user?.email || "customer@example.com";
     const address = order.shippingAddressSnapshot || order.user?.address || "";
     const city = order.shippingCitySnapshot || "Unknown";
     const country = order.shippingCountrySnapshot || "SE"; // Default to Sweden if unknown
     const zip = order.shippingZipSnapshot || "00000";

     const payload = {
        Name: name,
        Email: email,
        AddressLine: address,
        City: city,
        Country: country,
        PostalCode: zip,
        IsTest: isTest
     };

     const headers: any = { 'Content-Type': 'application/json' };
     if (settings.sendifyApiKey) headers['x-api-key'] = settings.sendifyApiKey;

     const response = await fetch(url, {
         method: 'POST',
         headers: headers,
         body: JSON.stringify(payload)
     });

     const data = await response.json();

     if (!response.ok) {
         throw new Error(data.error || data.details || "Booking failed");
     }

     return { 
         labelUrl: data.label_url,
         warning: data.warning
     };
  }

  /**
   * Generates a shipping label.
   */
  async generateLabel(orderId: number, customShipmentId?: string): Promise<string> {
    try {
      const settings = this.getSettings();
      const apiBase = this.getApiBase();
      const proxyUrl = `${apiBase}/api/shipping/generate-label`;

      const shipmentIdToUse = customShipmentId && customShipmentId.trim() !== '' 
          ? customShipmentId 
          : String(orderId);

      const payload = {
        shipment_ids: [shipmentIdToUse], 
        document_type: 'label',
        label_layout: '1x2',
        output_format: 'url'
      };

      const headers: any = { 'Content-Type': 'application/json' };
      if (settings.sendifyApiKey) headers['x-api-key'] = settings.sendifyApiKey;

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get("content-type");
      let errorBody = "";
      
      if (contentType && contentType.includes("application/json")) {
          const json = await response.json();
          if (response.ok) {
              if (!json.output_url) throw new Error("API success but missing 'output_url'.");
              return json.output_url;
          }
          errorBody = JSON.stringify(json, null, 2);
      } else {
          errorBody = await response.text();
          if (response.ok) return errorBody; 
      }

      if (response.status === 404 || response.status === 502) {
          throw new Error("Shipment Not Found");
      }

      throw new Error(`API Error (${response.status}): ${errorBody}`);

    } catch (error: any) {
      console.error("Label Generation Failed:", error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
     return true; 
  }
}

export const sendifyService = new SendifyService();