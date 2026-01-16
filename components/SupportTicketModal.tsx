import React, { useState } from 'react';
import { SupportTicket, Order, User } from '../types';
import { X, Save, MessageSquare } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: Partial<SupportTicket>) => Promise<void>;
  users: User[];
  orders: Order[];
}

const SupportTicketModal: React.FC<SupportTicketModalProps> = ({ 
  isOpen, onClose, onSave, users, orders 
}) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<Partial<SupportTicket>>({
    userId: users[0]?.id,
    subject: '',
    description: '',
    priority: 'Medium',
    orderId: undefined
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.userId) {
        showNotification('error', 'Please select a Customer.');
        return;
    }
    if (!formData.subject?.trim()) {
        showNotification('error', 'Subject line is missing.');
        return;
    }
    if (!formData.description?.trim()) {
        showNotification('error', 'Please provide a description of the issue.');
        return;
    }

    setIsSaving(true);
    
    // Auto-populate Order Number based on selected Order ID
    let selectedOrderNumber = undefined;
    if (formData.orderId) {
       const order = orders.find(o => o.id === Number(formData.orderId));
       if (order) selectedOrderNumber = order.orderNumber;
    }

    try {
      await onSave({
          ...formData,
          orderNumber: selectedOrderNumber
      });
      showNotification('success', 'Support ticket created.');
      onClose();
      // Reset form
      setFormData({
        userId: users[0]?.id,
        subject: '',
        description: '',
        priority: 'Medium',
        orderId: undefined
      });
    } catch (err) {
      showNotification('error', 'Failed to create ticket. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400"/> Log New Support Ticket
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer <span className="text-red-500">*</span></label>
              <select 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                value={formData.userId} 
                onChange={e => setFormData({...formData, userId: Number(e.target.value)})}
              >
                {users.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Related Order (Optional)</label>
              <select 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                value={formData.orderId || ''} 
                onChange={e => setFormData({...formData, orderId: e.target.value ? Number(e.target.value) : undefined})}
              >
                <option value="">-- No Specific Order --</option>
                {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.orderNumber} - {new Date(o.orderDate).toLocaleDateString()}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                   <select 
                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                     value={formData.priority}
                     onChange={e => setFormData({...formData, priority: e.target.value as any})}
                   >
                     <option value="Low">Low</option>
                     <option value="Medium">Medium</option>
                     <option value="High">High</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject <span className="text-red-500">*</span></label>
                   <input 
                     type="text" 
                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                     value={formData.subject}
                     onChange={e => setFormData({...formData, subject: e.target.value})}
                     placeholder="e.g., Wrong item received"
                   />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea 
                rows={4} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the issue..."
              />
            </div>
        </form>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={isSaving} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
             {isSaving ? <span>Saving...</span> : <><Save size={16} /><span>Create Ticket</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketModal;