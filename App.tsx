import React, { useState, useEffect, useMemo } from 'react';
import { orderService } from './services/orderService';
import { Order } from './types';
import OrderTable from './components/OrderTable';
import OrderDetailsPanel from './components/OrderDetailsPanel';
import SettingsModal from './components/SettingsModal';
import ProductManagement from './components/ProductManagement';
import SupportDashboard from './components/SupportDashboard';
import LoginScreen from './components/LoginScreen';
import { Search, Settings, RefreshCw, LayoutDashboard, Package, LifeBuoy, AlertCircle, Moon, Sun, LogOut } from 'lucide-react';
import { NotificationContainer } from './components/Notifications';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { useSafeFetch } from './hooks/useSafeFetch';

type ViewMode = 'ORDERS' | 'INVENTORY' | 'SUPPORT';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('ORDERS');
  const { theme, toggleTheme } = useTheme();
  const { session, loading: authLoading, signOut } = useAuth();
  
  // Rate Limiter: Max 15 requests per minute
  const { safeExecute, isLocked } = useSafeFetch({ limit: 15, windowMs: 60000 });
  
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
    if (!session) return;
    setLoading(true);
    try {
      // Wrap the expensive API call in the safety breaker
      const data = await safeExecute(async () => await orderService.getAllOrders());
      
      // If data is null, it means rate limit hit
      if (data) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we have a session
    if (session) {
        fetchOrders();
    }
  }, [session]);

  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSelectedOrder(updatedOrder);
  };

  // Derived state for backlog (Pending orders)
  const backlogCount = useMemo(() => orders.filter(o => o.status === 'Pending').length, [orders]);

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

  // 1. Show Loading while checking auth
  if (authLoading) {
      return (
          <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-500">
              <RefreshCw className="animate-spin mr-2" /> Loading...
          </div>
      );
  }

  // 2. Show Login if not authenticated
  if (!session) {
      return (
        <>
            <NotificationContainer />
            <LoginScreen />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <div className="fixed bottom-4 right-4 z-50">
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-slate-800 text-slate-400 rounded-full hover:text-white shadow-lg">
                    <Settings size={20} />
                </button>
            </div>
        </>
      );
  }

  // 3. Main App
  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans relative transition-colors duration-300">
      <NotificationContainer />
      
      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-black text-white flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center">
             <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold mr-3 shadow-lg shadow-indigo-600/30">O</div>
             <h1 className="font-bold text-lg tracking-tight">OrderFlow</h1>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-slate-300 hover:text-white">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-300 hover:text-white">
                <Settings size={20} />
            </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="
        md:w-64 md:flex md:flex-col md:shrink-0 md:relative transition-all duration-300
        fixed bottom-0 left-0 right-0 z-50 flex-row h-16 items-center justify-around md:justify-start
        bg-white border-t border-slate-200 text-slate-500
        md:bg-black md:border-t-0 md:text-slate-400
        dark:bg-black dark:border-slate-800 dark:text-slate-400
      ">
        {/* Desktop Header */}
        <div className="hidden md:flex h-16 items-center px-6 border-b border-white/10">
           <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-indigo-600/30">O</div>
           <h1 className="text-white font-bold text-lg tracking-tight">OrderFlow</h1>
        </div>
        
        <nav className="p-1 md:p-4 space-x-1 md:space-x-0 md:space-y-2 flex-1 flex md:flex-col w-full">
           <button 
             onClick={() => setViewMode('ORDERS')}
             className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition-all group relative
             ${viewMode === 'ORDERS' 
                ? 'md:bg-indigo-600 md:text-white md:shadow-lg md:shadow-indigo-900/20 text-indigo-600' 
                : 'hover:bg-slate-50 md:hover:bg-white/10 md:hover:text-white'}`}
           >
             <LayoutDashboard size={20} />
             <span className="text-[10px] md:text-base font-medium md:flex-1 text-center md:text-left">Dashboard</span>
             {backlogCount > 0 && (
                <span className={`absolute top-1 right-8 md:static text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm 
                    ${viewMode === 'ORDERS' 
                        ? 'bg-white text-indigo-600' 
                        : 'bg-indigo-600 text-white md:bg-white md:text-black'
                    }`}>
                    {backlogCount}
                </span>
             )}
           </button>
           
           <button 
             onClick={() => setViewMode('INVENTORY')}
             className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition-all 
             ${viewMode === 'INVENTORY' 
                ? 'md:bg-indigo-600 md:text-white md:shadow-lg md:shadow-indigo-900/20 text-indigo-600' 
                : 'hover:bg-slate-50 md:hover:bg-white/10 md:hover:text-white'}`}
           >
             <Package size={20} />
             <span className="text-[10px] md:text-base font-medium md:flex-1 text-center md:text-left">Inventory</span>
           </button>

           <button 
             onClick={() => setViewMode('SUPPORT')}
             className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition-all 
             ${viewMode === 'SUPPORT' 
                ? 'md:bg-indigo-600 md:text-white md:shadow-lg md:shadow-indigo-900/20 text-indigo-600' 
                : 'hover:bg-slate-50 md:hover:bg-white/10 md:hover:text-white'}`}
           >
             <LifeBuoy size={20} />
             <span className="text-[10px] md:text-base font-medium md:flex-1 text-center md:text-left">Support</span>
           </button>

           {/* Quick Backlog Summary Widget (Desktop Only) */}
           <div className="hidden md:block mt-6 px-4 py-4 bg-slate-800 rounded-xl border border-slate-700 mx-2 shadow-sm">
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-2">
                 <AlertCircle size={12} /> Priority Stats
              </h3>
              <div className="flex justify-between items-center mb-1">
                 <span className="text-sm font-medium text-slate-200">Order Backlog</span>
                 <span className={`font-mono font-bold ${backlogCount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{backlogCount}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                 <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((backlogCount / (orders.length || 1)) * 100, 100)}%` }}
                 ></div>
              </div>
           </div>
        </nav>

        <div className="hidden md:block p-4 border-t border-white/10 space-y-2">
           <button 
             onClick={toggleTheme}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
           >
             {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
           </button>
           
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
           >
             <Settings size={20} />
             <span>System Settings</span>
           </button>

           <button 
             onClick={signOut}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
           >
             <LogOut size={20} />
             <span>Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0 relative">
        
        {viewMode === 'INVENTORY' ? (
          <ProductManagement />
        ) : viewMode === 'SUPPORT' ? (
          <SupportDashboard />
        ) : (
          /* Order Dashboard View */
          <main className="flex-1 flex overflow-hidden relative">
            
            {/* List View - Hidden on mobile if detail is open */}
            <div className={`
                flex-1 flex-col w-full md:min-w-[400px] transition-all duration-300 p-4 md:p-6 h-full overflow-hidden
                ${selectedOrder ? 'hidden md:flex' : 'flex'}
            `}>
              {/* Controls */}
              <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-4 flex flex-col md:flex-row gap-3 md:items-center shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" placeholder="Search Orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:placeholder-slate-500 transition-colors"
                  />
                </div>
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                   <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-2 py-2 outline-none dark:text-slate-300">
                     <option value="All">All Statuses</option>
                     <option value="Pending">Pending</option>
                     <option value="Processing">Processing</option>
                     <option value="Shipped">Shipped</option>
                   </select>
                   <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-2 py-2 outline-none dark:text-slate-300">
                     <option value="All">Labels</option>
                     <option value="Printed">Printed</option>
                     <option value="Pending">Pending</option>
                   </select>
                   <button onClick={fetchOrders} className="p-2 text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 rounded-lg"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                </div>
              </div>

              {/* Grid */}
              <OrderTable orders={filteredOrders} selectedOrderId={selectedOrder?.id || null} onSelectOrder={setSelectedOrder} isLocked={isLocked} />
              <div className="mt-2 text-xs text-slate-400 text-center md:text-left shrink-0">Showing {filteredOrders.length} orders</div>
            </div>

            {/* Details Panel - Full screen on mobile, panel on desktop */}
            <div className={`
                md:w-[450px] shrink-0 flex flex-col bg-white dark:bg-slate-900
                absolute inset-0 md:static md:h-full z-40 transition-transform duration-300 md:p-6 md:pl-0
                ${selectedOrder ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:hidden'}
            `}>
              <OrderDetailsPanel 
                order={selectedOrder} 
                onOrderUpdated={handleOrderUpdate} 
                onCloseMobile={() => setSelectedOrder(null)} 
               />
            </div>
          </main>
        )}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;