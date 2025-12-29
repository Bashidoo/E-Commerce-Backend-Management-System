import React, { useState, useEffect, useMemo } from 'react';
import { orderService } from './services/orderService';
import { Order } from './types';
import OrderTable from './components/OrderTable';
import OrderDetailsPanel from './components/OrderDetailsPanel';
import SettingsModal from './components/SettingsModal';
import ProductManagement from './components/ProductManagement';
import { Search, Settings, Filter, RefreshCw, Printer, LayoutDashboard, Package } from 'lucide-react';

type ViewMode = 'ORDERS' | 'INVENTORY';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('ORDERS');
  
  // Order State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [labelFilter, setLabelFilter] = useState<string>('All');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSelectedOrder(updatedOrder);
  };

  // Filter Logic for Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user?.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      
      const matchesLabel = 
        labelFilter === 'All' || 
        (labelFilter === 'Printed' && order.isLabelPrinted) || 
        (labelFilter === 'Pending' && !order.isLabelPrinted);

      return matchesSearch && matchesStatus && matchesLabel;
    });
  }, [orders, searchQuery, statusFilter, labelFilter]);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation (Windows Forms Menu Simulation) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
           <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center text-white font-bold mr-3">O</div>
           <h1 className="text-white font-bold text-lg">OrderFlow</h1>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
           <button 
             onClick={() => setViewMode('ORDERS')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${viewMode === 'ORDERS' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
           >
             <LayoutDashboard size={20} />
             <span className="font-medium">Order Dashboard</span>
           </button>
           
           <button 
             onClick={() => setViewMode('INVENTORY')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${viewMode === 'INVENTORY' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
           >
             <Package size={20} />
             <span className="font-medium">Product Inventory</span>
           </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
             onClick={() => setIsSettingsOpen(true)}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
           >
             <Settings size={20} />
             <span>System Settings</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {viewMode === 'INVENTORY' ? (
          <ProductManagement />
        ) : (
          /* Order Dashboard View */
          <main className="flex-1 flex overflow-hidden p-6 gap-6">
            <div className="flex-1 flex flex-col min-w-[400px]">
              {/* Controls */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" placeholder="Search Orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {/* Filters */}
                <div className="flex gap-2">
                   <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none">
                     <option value="All">All Statuses</option>
                     <option value="Pending">Pending</option>
                     <option value="Processing">Processing</option>
                     <option value="Shipped">Shipped</option>
                   </select>
                   <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none">
                     <option value="All">All Labels</option>
                     <option value="Printed">Printed</option>
                     <option value="Pending">Pending</option>
                   </select>
                   <button onClick={fetchOrders} className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                </div>
              </div>

              {/* Grid */}
              <OrderTable orders={filteredOrders} selectedOrderId={selectedOrder?.id || null} onSelectOrder={setSelectedOrder} />
              <div className="mt-2 text-xs text-slate-400">Showing {filteredOrders.length} orders</div>
            </div>

            {/* Details Panel */}
            <div className="w-[450px] shrink-0 flex flex-col">
              <OrderDetailsPanel order={selectedOrder} onOrderUpdated={handleOrderUpdate} />
            </div>
          </main>
        )}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;