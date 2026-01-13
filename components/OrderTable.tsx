import React from 'react';
import { Order } from '../types';
import { Package, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  selectedOrderId: number | null;
  onSelectOrder: (order: Order) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, selectedOrderId, onSelectOrder }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
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

  return (
    <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full">
      <div className="overflow-x-auto overflow-y-auto flex-grow custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10">
              <th className="px-4 md:px-6 py-4">Order #</th>
              <th className="px-4 md:px-6 py-4">Customer</th>
              <th className="hidden md:table-cell px-6 py-4">Date</th>
              <th className="hidden lg:table-cell px-6 py-4">Total</th>
              <th className="px-4 md:px-6 py-4 text-center">Status</th>
              <th className="hidden md:table-cell px-6 py-4 text-center">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                   <div className="flex flex-col items-center justify-center">
                     <Package size={48} className="mb-2 text-slate-300" />
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
                      ? 'bg-indigo-50 hover:bg-indigo-50' 
                      : 'hover:bg-slate-50'
                    }
                  `}
                >
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span className={`font-mono font-medium ${selectedOrderId === order.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">
                        {order.user?.firstName} {order.user?.lastName}
                      </span>
                      <span className="text-xs text-slate-500 hidden md:inline">{order.user?.email}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(order.orderDate))}
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap font-medium text-slate-800">
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
                      <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium border border-green-100">
                        <CheckCircle2 size={12} className="mr-1" />
                        Printed
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-slate-400 bg-slate-50 px-2 py-1 rounded text-xs font-medium border border-slate-200">
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