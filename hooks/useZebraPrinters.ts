import { useState, useCallback } from 'react';
import { PrinterDevice } from '../types';
import { zebraService } from '../services/zebraService';

export const useZebraPrinters = () => {
  const [foundPrinters, setFoundPrinters] = useState<PrinterDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scan for Local LAN/USB printers via Browser Print Agent
  const scanLanPrinters = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      const printers = await zebraService.checkBrowserPrintConnection();
      setFoundPrinters((prev) => {
        // Merge without duplicates based on UID
        const existingIds = new Set(prev.map(p => p.uid));
        const newPrinters = printers.filter(p => !existingIds.has(p.uid));
        return [...prev, ...newPrinters];
      });
      if (printers.length === 0) {
        console.log("No LAN printers found via Browser Print.");
      }
    } catch (err: any) {
      setError("Could not connect to Zebra Browser Print agent. Is it running?");
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Scan for Bluetooth printers (Must be triggered by user click)
  const scanBluetooth = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      const printer = await zebraService.scanBluetoothPrinters();
      setFoundPrinters((prev) => {
         // Avoid duplicates
         if (prev.find(p => p.uid === printer.uid)) return prev;
         return [...prev, printer];
      });
    } catch (err: any) {
      if (err.name !== 'NotFoundError') { // User cancelled
         setError("Bluetooth scan failed: " + err.message);
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

  const printTestLabel = async (printer: PrinterDevice) => {
    setError(null);
    try {
        const testZpl = `
^XA
^FO50,50^ADN,36,20^FDTest Print^FS
^FO50,100^ADN,18,10^FDConnection: ${printer.connection}^FS
^FO50,150^ADN,18,10^FD${printer.name}^FS
^XZ`;
        await zebraService.printLabel(printer, testZpl);
        alert("Print sent successfully!");
    } catch (err: any) {
        setError("Print failed: " + err.message);
        console.error(err);
    }
  };

  return {
    printers: foundPrinters,
    isScanning,
    error,
    scanLanPrinters,
    scanBluetooth,
    printTestLabel
  };
};