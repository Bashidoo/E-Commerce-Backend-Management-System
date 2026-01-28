import React, { useState, useEffect } from "react";
import { AppSettings, PrinterDevice } from "../types";
import {
  X,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Printer,
  Bluetooth,
  Monitor,
  Database,
  Globe,
} from "lucide-react";
import { sendifyService } from "../services/sendifyService";
import { useZebraPrinters } from "../hooks/useZebraPrinters";
import { useNotification } from "../contexts/NotificationContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"general" | "printers">("general");
  const { showNotification } = useNotification();
  const {
    printers,
    isScanning,
    error: printerError,
    scanLanPrinters,
    scanBluetooth,
    printTestLabel,
  } = useZebraPrinters();

  const [settings, setSettings] = useState<AppSettings>({
    connectionString: "", // Legacy
    printerName: "Default Printer",
    autoPrint: false,
    sendifyApiUrl: "https://api.sendify.com/v1",
    sendifyApiKey: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    backendApiUrl: "",
  });

  const [isTestingSendify, setIsTestingSendify] = useState(false);

  useEffect(() => {
    // Load existing settings
    try {
      const savedSettings = localStorage.getItem("appSettings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      // Clean up URL
      const cleanSettings = { ...settings };
      if (cleanSettings.backendApiUrl?.endsWith("/")) {
        cleanSettings.backendApiUrl = cleanSettings.backendApiUrl.slice(0, -1);
      }

      // Save settings to local storage
      const settingsToSave = {
        ...cleanSettings,
        selectedPrinter: settings.selectedPrinter
          ? {
              ...settings.selectedPrinter,
              deviceObj: undefined,
            }
          : undefined,
      };

      localStorage.setItem("appSettings", JSON.stringify(settingsToSave));
      setSettings(cleanSettings);

      onClose();
      showNotification("success", "Configuration saved. Reloading...");

      // Reload to apply new database/api settings if changed
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Save failed", err);
      const msg =
        err?.message || (typeof err === "string" ? err : "Unknown error");
      showNotification("error", `Failed to save configuration: ${msg}`);
    }
  };

  const selectPrinter = (printer: PrinterDevice) => {
    setSettings({
      ...settings,
      printerName: printer.name,
      selectedPrinter: printer,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            System Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === "general" ? "text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            System & Integrations
          </button>
          <button
            onClick={() => setActiveTab("printers")}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === "printers" ? "text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            Printer Setup
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "general" ? (
            <>
              {/* Backend Configuration (Priority) */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <Globe
                    size={16}
                    className="text-indigo-600 dark:text-indigo-400"
                  />{" "}
                  .NET Backend API
                </h3>
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 mb-2">
                  Enter the URL of your deployed Cloud Run container (e.g.{" "}
                  <code>https://orderflow-api-....run.app</code>).
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Backend URL
                  </label>
                  <input
                    type="text"
                    value={settings.backendApiUrl || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        backendApiUrl: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="https://orderflow-api-..."
                  />
                </div>
              </div>

              {/* Database Config */}
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <Database
                    size={16}
                    className="text-indigo-600 dark:text-indigo-400"
                  />{" "}
                  Database Connection
                </h3>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Supabase URL
                  </label>
                  <input
                    type="text"
                    value={settings.supabaseUrl || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, supabaseUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="https://xyz.supabase.co"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Anon Key
                  </label>
                  <input
                    type="password"
                    value={settings.supabaseAnonKey || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        supabaseAnonKey: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="eyJh..."
                  />
                </div>
              </div>

              {/* Sendify API Section */}
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <Truck
                    size={16}
                    className="text-indigo-600 dark:text-indigo-400"
                  />{" "}
                  Sendify Integration
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 mb-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <strong>Note:</strong> If you have configured{" "}
                    <code>SENDIFY_API_KEY</code> on your Backend/Cloud Run, you
                    can leave this blank.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Local Override Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={settings.sendifyApiKey}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sendifyApiKey: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="sk_live_... (Leave empty to use Server Key)"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Printers Tab */
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-3">
                <AlertCircle
                  className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                  size={18}
                />
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>PC Users:</strong> Ensure "Zebra Browser Print" agent
                  is running.
                  <br />
                  <strong>Mobile Users:</strong> Enable Bluetooth. You must
                  grant permission to pair.
                </p>
              </div>

              {printerError && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle size={16} /> {printerError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={scanLanPrinters}
                  disabled={isScanning}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-3 rounded-lg text-sm font-medium transition-colors"
                >
                  {isScanning ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Monitor size={18} />
                  )}
                  Scan Local Network
                </button>
                <button
                  onClick={scanBluetooth}
                  disabled={isScanning}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 py-3 rounded-lg text-sm font-medium transition-colors border border-indigo-200 dark:border-indigo-800"
                >
                  {isScanning ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Bluetooth size={18} />
                  )}
                  Scan Bluetooth
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Available Printers
                </div>
                {printers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No printers found. Click a scan button above.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {printers.map((p) => (
                      <div
                        key={p.uid}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${settings.selectedPrinter?.uid === p.uid ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                        onClick={() => selectPrinter(p)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${p.connection === "bluetooth" ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
                          >
                            {p.connection === "bluetooth" ? (
                              <Bluetooth size={16} />
                            ) : (
                              <Printer size={16} />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 dark:text-white text-sm">
                              {p.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                              {p.connection} • {p.uid}
                            </div>
                          </div>
                        </div>
                        {settings.selectedPrinter?.uid === p.uid && (
                          <CheckCircle2
                            className="text-indigo-600 dark:text-indigo-400"
                            size={18}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {settings.selectedPrinter && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Selected: {settings.selectedPrinter.name}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      settings.selectedPrinter &&
                      printTestLabel(settings.selectedPrinter)
                    }
                    className="w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 py-2 rounded-lg text-sm font-medium"
                  >
                    Print Test Label (ZPL)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Save size={18} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
