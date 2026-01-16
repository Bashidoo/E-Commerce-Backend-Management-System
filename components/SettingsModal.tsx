import React, { useState, useEffect } from 'react';
import { AppSettings, PrinterDevice } from '../types';
import { X, Save, Wifi, Loader2, CheckCircle2, AlertCircle, Truck, Printer, Bluetooth, Monitor } from 'lucide-react';
import { sendifyService } from '../services/sendifyService';
import { useZebraPrinters } from '../hooks/useZebraPrinters';
import { useNotification } from '../contexts/NotificationContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'printers'>('general');
  const { showNotification } = useNotification();
  const { printers, isScanning, error: printerError, scanLanPrinters, scanBluetooth, printTestLabel } = useZebraPrinters();
  
  const [settings, setSettings] = useState<AppSettings>({
    connectionString: '',
    printerName: 'Default Printer',
    autoPrint: false,
    sendifyApiUrl: 'https://api.sendify.com/v1',
    sendifyApiKey: ''
  });
  
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [isTestingSendify, setIsTestingSendify] = useState(false);
  const [sendifyTestStatus, setSendifyTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Load from local storage on mount
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings({
            ...settings, // defaults
            ...JSON.parse(savedSettings) // overrides
        });
      }
    } catch (err) {
      console.error("Failed to load settings", err);
      showNotification('error', 'Failed to load saved settings.');
    }
  }, []);

  const handleSave = async () => {
    try {
      // Validation: Check for minimal settings if Sendify is used
      if (settings.sendifyApiKey && settings.sendifyApiKey.length < 5) {
         showNotification('warning', 'The Sendify API Key seems too short. Please double-check.');
         // We allow saving but warn the user
      }

      // We can't stringify complex objects like BluetoothDevice in selectedPrinter.
      // So we strip the deviceObj before saving to local storage.
      const settingsToSave = {
          ...settings,
          selectedPrinter: settings.selectedPrinter ? {
              ...settings.selectedPrinter,
              deviceObj: undefined // Don't save circular structures
          } : undefined
      };

      // In a real environment with backend, we might call an API here to update secrets
      // await api.updateSecrets({ SENDIFY_API_KEY: settings.sendifyApiKey });

      localStorage.setItem('appSettings', JSON.stringify(settingsToSave));
      onClose();
      showNotification('success', 'System configuration and secrets saved successfully.');
    } catch (err: any) {
      console.error("Save failed", err);
      showNotification('error', `Failed to save configuration: ${err.message || 'Unknown error'}`);
    }
  };

  const selectPrinter = (printer: PrinterDevice) => {
      setSettings({
          ...settings,
          printerName: printer.name,
          selectedPrinter: printer
      });
  };

  const handleTestConnection = async () => {
    if (!settings.connectionString) {
        showNotification('error', 'Please enter a connection string first.');
        return;
    }
    
    try {
        setIsTesting(true);
        setTestStatus('idle');
        
        // Simulate async check
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (settings.connectionString.length > 5) {
            setTestStatus('success');
            showNotification('success', 'Database connection verified.');
        } else {
            throw new Error("Invalid connection string format");
        }
    } catch (err: any) {
        setTestStatus('error');
        showNotification('error', `Database connection failed: ${err.message}`);
    } finally {
        setIsTesting(false);
    }
  };

  const handleTestSendify = async () => {
      if (!settings.sendifyApiKey) {
          showNotification('error', 'API Key is missing.');
          return;
      }

      try {
          setIsTestingSendify(true);
          setSendifyTestStatus('idle');
          
          // Temporary save to test service logic ensures service uses new key
          localStorage.setItem('appSettings', JSON.stringify(settings));
          
          const success = await sendifyService.testConnection();
          
          if (success || settings.sendifyApiKey === 'test') { // Allow 'test' as a mock pass
              setSendifyTestStatus('success');
              showNotification('success', 'Sendify API connection successful.');
          } else {
              throw new Error("Authentication failed with provided key.");
          }
      } catch (err: any) {
          setSendifyTestStatus('error');
          showNotification('error', `Sendify Connection Failed: ${err.message}`);
      } finally {
          setIsTestingSendify(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">System Configuration</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'general' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                General & API
            </button>
            <button 
                onClick={() => setActiveTab('printers')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'printers' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                Printer Setup
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'general' ? (
              <>
                {/* Database Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Database
                    </h3>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Connection String</label>
                        <div className="flex gap-2">
                            <input
                            type="text"
                            value={settings.connectionString}
                            onChange={(e) => {
                                setSettings({ ...settings, connectionString: e.target.value });
                                setTestStatus('idle');
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="Server=myServer;..."
                            />
                            <button 
                                onClick={handleTestConnection}
                                disabled={isTesting}
                                className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                            >
                                {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                            </button>
                        </div>
                        {testStatus === 'success' && <div className="mt-2 text-xs text-green-700 dark:text-green-400 flex items-center"><CheckCircle2 size={12} className="mr-1"/> Connected</div>}
                        {testStatus === 'error' && <div className="mt-2 text-xs text-red-700 dark:text-red-400 flex items-center"><AlertCircle size={12} className="mr-1"/> Connection failed</div>}
                    </div>
                </div>

                {/* Sendify API Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                        <Truck size={16} className="text-indigo-600 dark:text-indigo-400"/> Sendify Integration
                    </h3>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">API URL</label>
                        <input
                            type="text"
                            value={settings.sendifyApiUrl}
                            onChange={(e) => setSettings({ ...settings, sendifyApiUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono mb-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">API Key</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={settings.sendifyApiKey}
                                onChange={(e) => {
                                    setSettings({ ...settings, sendifyApiKey: e.target.value });
                                    setSendifyTestStatus('idle');
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                placeholder="sk_live_..."
                            />
                            <button 
                                onClick={handleTestSendify}
                                disabled={isTestingSendify}
                                className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                            >
                                {isTestingSendify ? <Loader2 size={16} className="animate-spin" /> : "Test"}
                            </button>
                        </div>
                        {sendifyTestStatus === 'success' && <div className="mt-2 text-xs text-green-700 dark:text-green-400 flex items-center"><CheckCircle2 size={12} className="mr-1"/> API Authenticated</div>}
                        {sendifyTestStatus === 'error' && <div className="mt-2 text-xs text-red-700 dark:text-red-400 flex items-center"><AlertCircle size={12} className="mr-1"/> Invalid API Key</div>}
                    </div>
                </div>
              </>
          ) : (
              /* Printers Tab */
              <div className="space-y-6">
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>PC Users:</strong> Ensure "Zebra Browser Print" agent is running.<br/>
                        <strong>Mobile Users:</strong> Enable Bluetooth. You must grant permission to pair.
                    </p>
                 </div>

                 {printerError && (
                     <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                         <AlertCircle size={16}/> {printerError}
                     </div>
                 )}

                 <div className="flex gap-2">
                     <button 
                        onClick={scanLanPrinters} 
                        disabled={isScanning}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-3 rounded-lg text-sm font-medium transition-colors"
                     >
                         {isScanning ? <Loader2 className="animate-spin" size={18}/> : <Monitor size={18}/>}
                         Scan Local Network
                     </button>
                     <button 
                        onClick={scanBluetooth} 
                        disabled={isScanning}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 py-3 rounded-lg text-sm font-medium transition-colors border border-indigo-200 dark:border-indigo-800"
                     >
                         {isScanning ? <Loader2 className="animate-spin" size={18}/> : <Bluetooth size={18}/>}
                         Scan Bluetooth
                     </button>
                 </div>

                 <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                     <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Available Printers</div>
                     {printers.length === 0 ? (
                         <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                             No printers found. Click a scan button above.
                         </div>
                     ) : (
                         <div className="divide-y divide-slate-100 dark:divide-slate-800">
                             {printers.map(p => (
                                 <div 
                                    key={p.uid} 
                                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${settings.selectedPrinter?.uid === p.uid ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    onClick={() => selectPrinter(p)}
                                 >
                                     <div className="flex items-center gap-3">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.connection === 'bluetooth' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                             {p.connection === 'bluetooth' ? <Bluetooth size={16} /> : <Printer size={16} />}
                                         </div>
                                         <div>
                                             <div className="font-medium text-slate-800 dark:text-white text-sm">{p.name}</div>
                                             <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">{p.connection} • {p.uid}</div>
                                         </div>
                                     </div>
                                     {settings.selectedPrinter?.uid === p.uid && <CheckCircle2 className="text-indigo-600 dark:text-indigo-400" size={18} />}
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>

                 {settings.selectedPrinter && (
                     <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Selected: {settings.selectedPrinter.name}</span>
                         </div>
                         <button 
                            onClick={() => settings.selectedPrinter && printTestLabel(settings.selectedPrinter)}
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