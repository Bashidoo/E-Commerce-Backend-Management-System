import { PrinterDevice } from '../types';

// Types for Zebra Browser Print Responses
interface BrowserPrintDevice {
  deviceType: string;
  uid: string;
  provider: string;
  name: string;
  connection: string;
  version: number;
  manufacturer: string;
}

interface BrowserPrintResponse {
  printer: BrowserPrintDevice[];
}

// Web Bluetooth Types (Locally defined as they are not standard in all TS envs)
interface BluetoothRemoteGATTCharacteristic {
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTService {
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

class ZebraService {
  private browserPrintUrl = "http://localhost:9100";

  /**
   * PC Detection: Checks for Zebra Browser Print Agent
   * typically running on localhost:9100
   */
  async checkBrowserPrintConnection(): Promise<PrinterDevice[]> {
    try {
      // 1. Check if the service is available
      // The 'available' endpoint returns all printers the agent sees (USB/Network)
      const response = await fetch(`${this.browserPrintUrl}/available`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error("Browser Print agent not reachable");
      }

      const data: BrowserPrintResponse = await response.json();

      if (data && data.printer && Array.isArray(data.printer)) {
        return data.printer.map((p) => ({
          uid: p.uid,
          name: p.name.replace(/_/g, ' '), // Zebra often uses underscores
          connection: 'lan', // Browser Print abstracts USB/LAN as a local resource
          deviceObj: p
        }));
      }
      
      return [];
    } catch (error) {
      console.warn("Zebra Browser Print Check Failed:", error);
      // We return empty array instead of throwing to allow the UI to show "No printers found"
      return [];
    }
  }

  /**
   * Mobile Detection: Uses Web Bluetooth API
   * Must be triggered by a user gesture
   */
  async scanBluetoothPrinters(): Promise<PrinterDevice> {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      throw new Error("Web Bluetooth is not supported in this browser.");
    }

    try {
      // Request device with filters for Zebra printers
      // Zebra often uses specific serial port services or just filtering by name is safer
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Zprinter' },
          { namePrefix: 'Zebra' },
          { namePrefix: 'XX' } // Common test prefix
        ],
        // We need to access generic services to find the serial port for writing
        optionalServices: [
            'generic_access', 
            'device_information',
            '000018f0-0000-1000-8000-00805f9b34fb', // Generic service
            '38eb4a80-c570-11e3-9507-0002a5d5c51b'  // Zebra specific serial service
        ]
      }) as BluetoothDevice;

      return {
        uid: device.id,
        name: device.name || 'Unknown Zebra Device',
        connection: 'bluetooth',
        deviceObj: device
      };
    } catch (error) {
      console.error("Bluetooth Scan Error:", error);
      throw error;
    }
  }

  /**
   * Unified Print Function
   */
  async printLabel(printer: PrinterDevice, zplCode: string): Promise<void> {
    if (printer.connection === 'lan') {
      return this.printToBrowserPrint(printer, zplCode);
    } else if (printer.connection === 'bluetooth') {
      return this.printToBluetooth(printer, zplCode);
    } else {
      throw new Error("Unknown printer connection type");
    }
  }

  // Private Implementation: Browser Print (POST Request)
  private async printToBrowserPrint(printer: PrinterDevice, zplCode: string): Promise<void> {
    const url = `${this.browserPrintUrl}/write`;
    
    // Structure required by Zebra Browser Print
    const payload = {
      device: {
        name: printer.deviceObj.name,
        uid: printer.deviceObj.uid
      },
      data: zplCode
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Failed to send print job to Browser Print agent");
    }
  }

  // Private Implementation: Bluetooth (GATT Write)
  private async printToBluetooth(printer: PrinterDevice, zplCode: string): Promise<void> {
    const device = printer.deviceObj as BluetoothDevice;
    
    if (!device.gatt) {
        throw new Error("Bluetooth device has no GATT server");
    }

    let server = device.gatt;
    
    // Reconnect if disconnected
    if (!server.connected) {
        server = await device.gatt.connect();
    }

    // Find a writable characteristic
    // Note: This logic tries to find a common writable characteristic for serial communication
    const services = await server.getPrimaryServices();
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

    for (const service of services) {
        const chars = await service.getCharacteristics();
        for (const c of chars) {
            // Check if we can write to it
            if (c.properties.write || c.properties.writeWithoutResponse) {
                characteristic = c;
                break;
            }
        }
        if (characteristic) break;
    }

    if (!characteristic) {
        throw new Error("No writable characteristic found on Bluetooth printer");
    }

    // Chunking might be required for large ZPL, but for simple labels, direct write usually works
    // Max ATT MTU is usually 23 bytes (default) to 512 bytes. 
    // It's safer to chunk for Bluetooth.
    const encoder = new TextEncoder();
    const data = encoder.encode(zplCode);
    const CHUNK_SIZE = 50; // Conservative chunk size

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await characteristic.writeValue(chunk);
    }
  }
}

export const zebraService = new ZebraService();