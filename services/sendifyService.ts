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
   * Generates a shipping label using the specific Sendify Print Endpoint.
   * Prioritizes the key from App Settings (runtime update), falls back to process.env.
   */
  async generateLabel(orderId: number): Promise<string> {
    try {
      const settings = this.getSettings();
      // Allow runtime configuration override, otherwise use build-time env var
      const apiKey = settings.sendifyApiKey || process.env.SENDIFY_API_KEY;
      const printUrl = 'https://app.sendify.se/external/v1/shipments/print';

      if (!apiKey) {
        throw new Error("Configuration Error: Sendify API Key is missing. Please configure it in System Settings.");
      }

      const payload = {
        shipment_ids: [orderId], // Using the Order ID as requested
        document_type: 'label',
        label_layout: '1x2',
        output_format: 'url'
      };

      const response = await fetch(printUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Attempt to parse error message from API
        let errorMessage = "Label generation failed.";
        try {
          const errData = await response.json();
          errorMessage = errData.message || errData.error || errorMessage;
        } catch (e) { /* ignore json parse error */ }
        
        throw new Error(`Sendify API Error: ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.output_url) {
        throw new Error("API returned success but no output_url was found.");
      }

      return data.output_url;

    } catch (error: any) {
      console.error("Sendify Label Generation Failed:", error);
      // Re-throw to be caught by the UI
      throw new Error(error.message || "Unable to connect to Sendify API.");
    }
  }

  /**
   * Legacy method for booking (kept for backward compatibility/demo)
   */
  async createShipment(order: Order): Promise<string> {
    const settings = this.getSettings();
    const apiUrl = settings.sendifyApiUrl || 'https://api.sendify.com/v1';
    
    const apiKey = settings.sendifyApiKey || process.env.SENDIFY_API_KEY;
    
    if (!apiKey) {
      // Return mock for demo purposes if no key configured in settings
      return this.getMockLabelUrl();
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
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn("Real API call failed, falling back to mock PDF for demo.");
        return this.getMockLabelUrl();
      }

      const data = await response.json();
      return data.label_url || this.getMockLabelUrl();

    } catch (error) {
      console.error("Sendify API Error:", error);
      return this.getMockLabelUrl();
    }
  }

  async testConnection(): Promise<boolean> {
    const settings = this.getSettings();
    const apiKey = settings.sendifyApiKey || process.env.SENDIFY_API_KEY;
    
    if (!apiKey) return false;

    try {
      // Simple GET to check auth
      // Note: Sendify API structure varies, assuming /products is a valid endpoint for auth check
      // Adjust endpoint based on actual API documentation if needed.
      const response = await fetch(`${settings.sendifyApiUrl}/products`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'x-api-key': apiKey // Try both headers for test
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