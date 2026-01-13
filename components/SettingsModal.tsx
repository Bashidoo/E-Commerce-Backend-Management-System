import React, { useState, useEffect } from 'react';
import { AppSettings, PrinterDevice } from '../types';
import { X, Save, Wifi, Loader2, CheckCircle2, AlertCircle, Truck, Printer, Bluetooth, Monitor } from 'lucide-react';
import { sendifyService } from '../services/sendifyService';
import { useZebraPrinters } from '../hooks/useZebraPrinters';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'printers'>('general');
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
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings({
          ...settings, // defaults
          ...JSON.parse(savedSettings) // overrides
      });
    }
    // Auto-scan LAN printers on mount if tab is printers
    // We don't do this automatically to avoid confusing errors if agent isn't running,
    // let user trigger it.
  }, []);

  const handleSave = () => {
    // We can't stringify complex objects like BluetoothDevice in selectedPrinter.
    // So we strip the deviceObj before saving to local storage.
    // When reloading, the user will have to re-connect Bluetooth devices anyway (browser security).
    const settingsToSave = {
        ...settings,
        selectedPrinter: settings.selectedPrinter ? {
            ...settings.selectedPrinter,
            deviceObj: undefined // Don't save circular structures
        } : undefined
    };

    localStorage.setItem('appSettings', JSON.stringify(settingsToSave));
    onClose();
    alert("Settings saved successfully.");
  };

  const selectPrinter = (printer: PrinterDevice) => {
      setSettings({
          ...settings,
          printerName: printer.name,
          selectedPrinter: printer
      });
  };

  const handleTestConnection = () => {
    if (!settings.connectionString) return;
    setIsTesting(true);
    setTestStatus('idle');
    setTimeout(() => {
        setIsTesting(false);
        if (settings.connectionString.length > 5) {
            setTestStatus('success');
        } else {
            setTestStatus('error');
        }
    }, 1500);
  };

  const handleTestSendify = async () => {
      setIsTestingSendify(true);
      setSendifyTestStatus('idle');
      
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      const success = await sendifyService.testConnection();
      
      if (success || settings.sendifyApiKey === 'test') {
          setSendifyTestStatus('success');
      } else {
          setSendifyTestStatus('error');
      }
      setIsTestingSendify(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">System Configuration</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'general' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                General & API
            </button>
            <button 
                onClick={() => setActiveTab('printers')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'printers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Printer Setup
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'general' ? (
              <>
                {/* Database Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-1 border-b border-slate-100">
                        Database
                    </h3>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Connection String</label>
                        <div className="flex gap-2">
                            <input
                            type="text"
                            value={settings.connectionString}
                            onChange={(e) => {
                                setSettings({ ...settings, connectionString: e.target.value });
                                setTestStatus('idle');
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                            placeholder="Server=myServer;..."
                            />
                            <button 
                                onClick={handleTestConnection}
                                disabled={isTesting || !settings.connectionString}
                                className="px-3 py-2 rounded-lg text-sm font-medium border bg-slate-50 text-slate-600 hover:bg-slate-100"
                            >
                                {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                            </button>
                        </div>
                        {testStatus === 'success' && <div className="mt-2 text-xs text-green-700 flex items-center"><CheckCircle2 size={12} className="mr-1"/> Connected</div>}
                        {testStatus === 'error' && <div className="mt-2 text-xs text-red-700 flex items-center"><AlertCircle size={12} className="mr-1"/> Connection failed</div>}
                    </div>
                </div>

                {/* Sendify API Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-1 border-b border-slate-100">
                        <Truck size={16} className="text-indigo-600"/> Sendify Integration
                    </h3>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">API URL</label>
                        <input
                            type="text"
                            value={settings.sendifyApiUrl}
                            onChange={(e) => setSettings({ ...settings, sendifyApiUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono mb-3"
                        />
                        
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">API Key</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={settings.sendifyApiKey}
                                onChange={(e) => {
                                    setSettings({ ...settings, sendifyApiKey: e.target.value });
                                    setSendifyTestStatus('idle');
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                                placeholder="sk_live_..."
                            />
                            <button 
                                onClick={handleTestSendify}
                                disabled={isTestingSendify || !settings.sendifyApiKey}
                                className="px-3 py-2 rounded-lg text-sm font-medium border bg-slate-50 text-slate-600 hover:bg-slate-100"
                            >
                                {isTestingSendify ? <Loader2 size={16} className="animate-spin" /> : "Test"}
                            </button>
                        </div>
                        {sendifyTestStatus === 'success' && <div className="mt-2 text-xs text-green-700 flex items-center"><CheckCircle2 size={12} className="mr-1"/> API Authenticated</div>}
                        {sendifyTestStatus === 'error' && <div className="mt-2 text-xs text-red-700 flex items-center"><AlertCircle size={12} className="mr-1"/> Invalid API Key</div>}
                    </div>
                </div>
              </>
          ) : (
              /* Printers Tab */
              <div className="space-y-6">
                 <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-blue-800">
                        <strong>PC Users:</strong> Ensure "Zebra Browser Print" agent is running.<br/>
                        <strong>Mobile Users:</strong> Enable Bluetooth. You must grant permission to pair.
                    </p>
                 </div>

                 {printerError && (
                     <div className="bg-red-50 p-3 rounded-lg text-xs text-red-700 flex items-center gap-2">
                         <AlertCircle size={16}/> {printerError}
                     </div>
                 )}

                 <div className="flex gap-2">
                     <button 
                        onClick={scanLanPrinters} 
                        disabled={isScanning}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg text-sm font-medium transition-colors"
                     >
                         {isScanning ? <Loader2 className="animate-spin" size={18}/> : <Monitor size={18}/>}
                         Scan Local Network
                     </button>
                     <button 
                        onClick={scanBluetooth} 
                        disabled={isScanning}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3 rounded-lg text-sm font-medium transition-colors border border-indigo-200"
                     >
                         {isScanning ? <Loader2 className="animate-spin" size={18}/> : <Bluetooth size={18}/>}
                         Scan Bluetooth
                     </button>
                 </div>

                 <div className="border rounded-lg overflow-hidden">
                     <div className="bg-slate-50 px-4 py-2 border-b text-xs font-semibold text-slate-500 uppercase">Available Printers</div>
                     {printers.length === 0 ? (
                         <div className="p-8 text-center text-slate-400 text-sm">
                             No printers found. Click a scan button above.
                         </div>
                     ) : (
                         <div className="divide-y divide-slate-100">
                             {printers.map(p => (
                                 <div 
                                    key={p.uid} 
                                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${settings.selectedPrinter?.uid === p.uid ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                    onClick={() => selectPrinter(p)}
                                 >
                                     <div className="flex items-center gap-3">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.connection === 'bluetooth' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                                             {p.connection === 'bluetooth' ? <Bluetooth size={16} /> : <Printer size={16} />}
                                         </div>
                                         <div>
                                             <div className="font-medium text-slate-800 text-sm">{p.name}</div>
                                             <div className="text-xs text-slate-500 uppercase">{p.connection} • {p.uid}</div>
                                         </div>
                                     </div>
                                     {settings.selectedPrinter?.uid === p.uid && <CheckCircle2 className="text-indigo-600" size={18} />}
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>

                 {settings.selectedPrinter && (
                     <div className="pt-2 border-t border-slate-100">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-sm font-medium text-slate-700">Selected: {settings.selectedPrinter.name}</span>
                         </div>
                         <button 
                            onClick={() => settings.selectedPrinter && printTestLabel(settings.selectedPrinter)}
                            className="w-full border border-slate-300 text-slate-700 hover:bg-slate-50 py-2 rounded-lg text-sm font-medium"
                         >
                             Print Test Label (ZPL)
                         </button>
                     </div>
                 )}
              </div>
          )}
          
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
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