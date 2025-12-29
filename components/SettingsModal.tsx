import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { X, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    connectionString: '',
    printerName: 'Default Printer',
    autoPrint: false
  });

  useEffect(() => {
    // Load from local storage on mount
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    onClose();
    // In a real app, you might trigger a context update here
    alert("Settings saved successfully.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">System Configuration</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Database Connection String
            </label>
            <input
              type="text"
              value={settings.connectionString}
              onChange={(e) => setSettings({ ...settings, connectionString: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-mono"
              placeholder="Server=myServer;Database=myDB;..."
            />
            <p className="text-xs text-slate-400 mt-1">
              Securely stored in local browser storage for this demo.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Target Printer
            </label>
            <select
              value={settings.printerName}
              onChange={(e) => setSettings({ ...settings, printerName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option>Default Printer</option>
              <option>Zebra ZP 450</option>
              <option>Rollo USB Printer</option>
              <option>DYMO LabelWriter 4XL</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="autoPrint"
              checked={settings.autoPrint}
              onChange={(e) => setSettings({ ...settings, autoPrint: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="autoPrint" className="text-sm text-slate-700 select-none">
              Auto-print label when order status changes to "Processing"
            </label>
          </div>
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