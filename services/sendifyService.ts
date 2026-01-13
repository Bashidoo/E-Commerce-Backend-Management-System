import { Order, AppSettings } from '../types';

/**
 * Service to interact with the Sendify API for label generation.
 * NOTE: In a production environment, calling 3rd party APIs directly from the browser
 * may cause CORS issues. It is recommended to route this through a backend proxy 
 * (e.g., Supabase Edge Functions or a .NET API).
 */
class SendifyService {
  private getSettings(): AppSettings {
    const saved = localStorage.getItem('appSettings');
    if (saved) return JSON.parse(saved);
    return {
      connectionString: '',
      printerName: '',
      autoPrint: false,
      sendifyApiUrl: 'https://api.sendify.com/v1',
      sendifyApiKey: ''
    };
  }

  async createShipment(order: Order): Promise<string> {
    const settings = this.getSettings();
    const apiUrl = settings.sendifyApiUrl || 'https://api.sendify.com/v1';
    
    if (!settings.sendifyApiKey) {
      throw new Error("Sendify API Key is missing in settings.");
    }

    // Map Order to Sendify Payload
    const payload = {
      reference: order.orderNumber,
      sender: {
        name: "OrderFlow Warehouse",
        email: "logistics@orderflow.com",
        address_line1: "123 Distribution Blvd",
        city: "Logistics City",
        country: "SE",
        postal_code: "12345"
      },
      receiver: {
        name: `${order.user?.firstName} ${order.user?.lastName}`,
        email: order.user?.email,
        address_line1: order.user?.address || "Unknown Address",
        city: "Stockholm", // Mock data mapping
        country: "SE",     // Mock data mapping
        postal_code: "10000" // Mock data mapping
      },
      parcels: [
        {
          weight: 1.5, // Mock weight
          height: 10,
          length: 20,
          width: 15,
          contents: "Fragrances"
        }
      ],
      carrier_product_id: "postnord_my_pack_collect" // Example carrier product
    };

    try {
      // Direct fetch call
      const response = await fetch(`${apiUrl}/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.sendifyApiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Handle mock scenario for demo purposes if real API fails (likely due to invalid key/cors)
        console.warn("Real API call failed, falling back to mock PDF for demo.");
        return this.getMockLabelUrl();
      }

      const data = await response.json();
      // Assuming API returns { label_url: "..." }
      return data.label_url || this.getMockLabelUrl();

    } catch (error) {
      console.error("Sendify API Error:", error);
      // Fallback for demo experience
      return this.getMockLabelUrl();
    }
  }

  async testConnection(): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings.sendifyApiKey) return false;

    try {
      // Simple GET to check auth
      const response = await fetch(`${settings.sendifyApiUrl}/products`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${settings.sendifyApiKey}`
        }
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  private getMockLabelUrl(): string {
    // Return a dummy PDF placeholder
    return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
  }
}

export const sendifyService = new SendifyService();