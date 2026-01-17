import React from 'react';
import { Order } from '../types';
import { Package, CheckCircle2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  selectedOrderId: number | null;
  onSelectOrder: (order: Order) => void;
  isLocked?: boolean; // New prop to show safety lock status
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, selectedOrderId, onSelectOrder, isLocked }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock size={14} className="mr-1.5" />;
      case 'Delivered': return <CheckCircle2 size={14} className="mr-1.5" />;
      case 'Cancelled': return <AlertCircle size={14} className="mr-1.5" />;
      default: return <Package size={14} className="mr-1.5" />;
    }
  };

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl">
        <ShieldAlert size={48} className="text-red-600 dark:text-red-400 mb-4" />
        <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Security Lock Engaged</h3>
        <p className="text-sm text-red-600 dark:text-red-300 max-w-md mt-2">
          Your browser is making too many requests. We have paused data fetching to protect your system. Please refresh the page in a minute.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-full transition-colors">
      <div className="overflow-x-auto overflow-y-auto flex-grow custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold sticky top-0 z-10">
              <th className="px-4 md:px-6 py-4">Order #</th>
              <th className="px-4 md:px-6 py-4">Customer</th>
              <th className="hidden md:table-cell px-6 py-4">Date</th>
              <th className="hidden lg:table-cell px-6 py-4">Total</th>
              <th className="px-4 md:px-6 py-4 text-center">Status</th>
              <th className="hidden md:table-cell px-6 py-4 text-center">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                   <div className="flex flex-col items-center justify-center">
                     <Package size={48} className="mb-2 text-slate-300 dark:text-slate-600" />
                     <p>No orders found matching your criteria.</p>
                   </div>
                 </td>
               </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className={`
                    cursor-pointer transition-colors duration-150 group
                    ${selectedOrderId === order.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }
                  `}
                >
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span className={`font-mono font-medium ${selectedOrderId === order.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {order.user?.firstName} {order.user?.lastName}
                      </span>
                      <span className="text-xs text-slate-500 hidden md:inline">{order.user?.email}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(order.orderDate))}
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                    €{order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      <span className="md:inline hidden">{getStatusIcon(order.status)}</span>
                      {order.status}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-center">
                    {order.isLabelPrinted ? (
                      <span className="inline-flex items-center text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800 px-2 py-1 rounded text-xs font-medium border border-green-100">
                        <CheckCircle2 size={12} className="mr-1" />
                        Printed
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-slate-400 bg-slate-50 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
