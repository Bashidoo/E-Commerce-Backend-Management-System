import React, { useState, useEffect } from 'react';
import { SupportTicket, User, Order } from '../types';
import { supportService } from '../services/supportService';
import { mockOrders, users } from '../services/mockData';
import { LifeBuoy, Plus, CheckCircle2, Circle, AlertCircle, Search, RefreshCw } from 'lucide-react';
import SupportTicketModal from './SupportTicketModal';

const SupportDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');

  const loadTickets = async () => {
    setLoading(true);
    const data = await supportService.getAllTickets();
    // Hydrate users just in case (simulating join)
    const hydratedData = data.map(t => ({
        ...t,
        user: users.find(u => u.id === t.userId)
    }));
    setTickets(hydratedData);
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleResolve = async (id: number) => {
    await supportService.resolveTicket(id);
    loadTickets();
  };

  const handleCreate = async (ticket: Partial<SupportTicket>) => {
    await supportService.createTicket(ticket);
    loadTickets();
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
        case 'High': return 'text-red-600 bg-red-50 border-red-200';
        case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
        default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getStatusIcon = (s: string) => {
    if (s === 'Resolved') return <CheckCircle2 size={14} className="text-green-500" />;
    if (s === 'Closed') return <Circle size={14} className="text-slate-400" />;
    return <AlertCircle size={14} className="text-blue-500" />;
  };

  const filteredTickets = tickets.filter(t => filter === 'All' || t.status === filter);

  return (
    <div className="flex flex-col h-full bg-slate-100 p-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex justify-between items-center">
         <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
               <LifeBuoy className="mr-2 text-indigo-600" /> Support Desk
            </h2>
            <div className="flex gap-2">
                {['All', 'Open', 'Resolved', 'Closed'].map(status => (
                    <button 
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === status ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button 
                onClick={loadTickets} 
                className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                title="Refresh Tickets"
            >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
                <Plus size={18} /> New Ticket
            </button>
         </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
         <div className="overflow-y-auto h-full custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                  <tr>
                     <th className="px-6 py-4">Ticket ID</th>
                     <th className="px-6 py-4">Customer</th>
                     <th className="px-6 py-4">Subject</th>
                     <th className="px-6 py-4">Related Order</th>
                     <th className="px-6 py-4 text-center">Priority</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10">Loading Tickets...</td></tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400">No tickets found.</td></tr>
                  ) : filteredTickets.map(t => (
                     <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono text-sm text-slate-600">{t.ticketNumber}</td>
                        <td className="px-6 py-4">
                           <div className="text-sm font-medium text-slate-800">{t.user?.firstName} {t.user?.lastName}</div>
                           <div className="text-xs text-slate-500">{t.user?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-sm text-slate-800 font-medium">{t.subject}</div>
                           <div className="text-xs text-slate-500 truncate max-w-[200px]">{t.description}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                           {t.orderNumber ? t.orderNumber : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(t.priority)}`}>
                              {t.priority}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex items-center justify-center gap-1.5 text-sm text-slate-700">
                              {getStatusIcon(t.status)} {t.status}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {t.status === 'Open' && (
                               <button 
                                 onClick={() => handleResolve(t.id)}
                                 className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                               >
                                 Resolve
                               </button>
                           )}
                           {t.status === 'Resolved' && (
                               <span className="text-xs text-slate-400 italic">No actions</span>
                           )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <SupportTicketModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreate}
        users={users}
        orders={mockOrders}
      />
    </div>
  );
};

export default SupportDashboard;