import React, { useState, useEffect } from 'react';
import { SupportTicket, User, Order } from '../types';
import { supportService } from '../services/supportService';
import { orderService } from '../services/orderService';
import { LifeBuoy, Plus, CheckCircle2, Circle, AlertCircle, Search, RefreshCw } from 'lucide-react';
import SupportTicketModal from './SupportTicketModal';
// Removed mock imports

const SupportDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  
  // Data for modal
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
        const [ticketsData, ordersData] = await Promise.all([
            supportService.getAllTickets(),
            orderService.getAllOrders()
        ]);
        setTickets(ticketsData);
        setAvailableOrders(ordersData);
        
        // Extract unique users from orders for the dropdown (simple approach)
        const uniqueUsersMap = new Map();
        ordersData.forEach(o => {
            if (o.user) uniqueUsersMap.set(o.user.id, o.user);
        });
        setAvailableUsers(Array.from(uniqueUsersMap.values()));

    } catch (error) {
        console.error("Failed to load support dashboard data", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = async (id: number) => {
    await supportService.resolveTicket(id);
    loadData();
  };

  const handleCreate = async (ticket: Partial<SupportTicket>) => {
    await supportService.createTicket(ticket);
    loadData();
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
        case 'High': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
        case 'Medium': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
        default: return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusIcon = (s: string) => {
    if (s === 'Resolved') return <CheckCircle2 size={14} className="text-green-500 dark:text-green-400" />;
    if (s === 'Closed') return <Circle size={14} className="text-slate-400 dark:text-slate-500" />;
    return <AlertCircle size={14} className="text-blue-500 dark:text-blue-400" />;
  };

  const filteredTickets = tickets.filter(t => filter === 'All' || t.status === filter);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 p-6 transition-colors">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex justify-between items-center transition-colors">
         <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
               <LifeBuoy className="mr-2 text-indigo-600 dark:text-indigo-400" /> Support Desk
            </h2>
            <div className="flex gap-2">
                {['All', 'Open', 'Resolved', 'Closed'].map(status => (
                    <button 
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === status ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button 
                onClick={loadData} 
                className="p-2 text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
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
      <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors">
         <div className="overflow-y-auto h-full custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
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
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-500 dark:text-slate-400">Loading Tickets...</td></tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500">No tickets found.</td></tr>
                  ) : filteredTickets.map(t => (
                     <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">{t.ticketNumber}</td>
                        <td className="px-6 py-4">
                           <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.user?.firstName} {t.user?.lastName}</div>
                           <div className="text-xs text-slate-500 dark:text-slate-500">{t.user?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-sm text-slate-800 dark:text-slate-200 font-medium">{t.subject}</div>
                           <div className="text-xs text-slate-500 dark:text-slate-500 truncate max-w-[200px]">{t.description}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">
                           {t.orderNumber ? t.orderNumber : <span className="text-slate-300 dark:text-slate-600">-</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(t.priority)}`}>
                              {t.priority}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex items-center justify-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                              {getStatusIcon(t.status)} {t.status}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {t.status === 'Open' && (
                               <button 
                                 onClick={() => handleResolve(t.id)}
                                 className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2 py-1 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                               >
                                 Resolve
                               </button>
                           )}
                           {t.status === 'Resolved' && (
                               <span className="text-xs text-slate-400 dark:text-slate-500 italic">No actions</span>
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
        users={availableUsers}
        orders={availableOrders}
      />
    </div>
  );
};

export default SupportDashboard;
