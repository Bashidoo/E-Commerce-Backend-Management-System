import React, { useState } from 'react';
import { Order } from '../types';
import { Printer, RefreshCw, AlertTriangle, Truck, MapPin, CreditCard, User, Package, ExternalLink, ArrowLeft } from 'lucide-react';
import { orderService } from '../services/orderService';
import { sendifyService } from '../services/sendifyService';
import AsyncImage from './AsyncImage';

interface OrderDetailsPanelProps {
  order: Order | null;
  onOrderUpdated: (updatedOrder: Order) => void;
  onCloseMobile?: () => void; // Function to close panel on mobile
}

const OrderDetailsPanel: React.FC<OrderDetailsPanelProps> = ({ order, onOrderUpdated, onCloseMobile }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [confirmReprint, setConfirmReprint] = useState(false);

  // Reset confirmation when selected order changes
  React.useEffect(() => {
    setConfirmReprint(false);
  }, [order?.id]);

  if (!order) {
    return (
      <div className="hidden md:flex h-full flex-col items-center justify-center text-slate-400 p-8 border border-slate-200 border-dashed rounded-xl bg-slate-50">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Truck size={32} className="text-slate-300" />
        </div>
        <p className="text-lg font-medium text-slate-500">No Order Selected</p>
        <p className="text-sm">Select an order from the list to view details and manage shipping labels.</p>
      </div>
    );
  }

  const handlePrintLabel = async () => {
    if (order.isLabelPrinted && !confirmReprint) {
      setConfirmReprint(true);
      return;
    }

    try {
      setIsPrinting(true);
      
      // 1. Call Sendify Service
      const labelUrl = await sendifyService.createShipment(order);
      
      // 2. Update Order via OrderService (Simulating Supabase update)
      const updated = await orderService.updateOrderLabelStatus(order.id, true, labelUrl);
      
      setIsPrinting(false);
      setConfirmReprint(false);
      onOrderUpdated(updated);
      
      // 3. Open PDF in new tab
      if (labelUrl) {
          window.open(labelUrl, '_blank');
      }
      
    } catch (error) {
      console.error("Failed to print label", error);
      setIsPrinting(false);
      alert("Error generating shipping label. Please check your Sendify API Key.");
    }
  };

  return (
    <div className="bg-white md:border md:border-slate-200 md:rounded-xl shadow-sm flex flex-col h-full w-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
        {/* Mobile Back Button */}
        <div className="flex md:hidden items-center mb-2">
            <button onClick={onCloseMobile} className="flex items-center text-slate-500 hover:text-indigo-600">
                <ArrowLeft size={18} className="mr-1" /> Back to Orders
            </button>
        </div>

        <div className="flex justify-between items-start">
            <div>
            <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-slate-800">{order.orderNumber}</h2>
                {order.isLabelPrinted && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium border border-green-200">
                    Label Printed
                </span>
                )}
            </div>
            <p className="text-sm text-slate-500">
                Placed on {new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(order.orderDate))}
            </p>
            </div>
            
            <div className="flex flex-col items-end">
            {confirmReprint && (
                <div className="flex flex-col items-end mb-2 animate-in fade-in slide-in-from-top-1">
                    <span className="text-xs text-amber-600 font-bold flex items-center mb-1">
                    <AlertTriangle size={12} className="mr-1"/> 
                    Already Printed
                    </span>
                    <button onClick={() => setConfirmReprint(false)} className="text-xs text-indigo-600 hover:text-indigo-800 underline">
                    Cancel
                    </button>
                </div>
            )}

            <button
                onClick={handlePrintLabel}
                disabled={isPrinting}
                className={`
                flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm font-semibold text-sm transition-all
                ${confirmReprint 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-200' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
                }
                ${isPrinting ? 'opacity-70 cursor-not-allowed' : ''}
                `}
            >
                {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                <span>{isPrinting ? 'Generating...' : (confirmReprint ? 'Confirm' : 'Print Label')}</span>
            </button>
            </div>
        </div>
        
        {/* View Label Link if exists */}
        {order.labelUrl && (
            <a href={order.labelUrl} target="_blank" rel="noreferrer" className="text-xs flex items-center text-indigo-600 hover:underline">
                <ExternalLink size={12} className="mr-1"/> View Existing Label PDF
            </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Customer Info */}
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-slate-500 text-sm uppercase tracking-wide font-semibold">
              <User size={14} /> Customer Details
            </div>
            <div className="space-y-1 text-sm text-slate-800">
              <p className="font-semibold">{order.user?.firstName} {order.user?.lastName}</p>
              <p>{order.user?.email}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-slate-500 text-sm uppercase tracking-wide font-semibold">
              <MapPin size={14} /> Shipping Address
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{order.user?.address}</p>
          </div>
        </div>

        <div className="border-t border-slate-100 my-2"></div>

        {/* Order Items */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
            <Package size={16} className="mr-2 text-indigo-500" />
            Order Items ({order.orderItems.length})
          </h3>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                <AsyncImage src={item.product?.imageUrl} alt={item.product?.name} className="w-16 h-16 rounded-md border border-slate-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 truncate">{item.product?.name}</h4>
                  <p className="text-xs text-slate-500 mb-1">{item.product?.inspiredBy ? `Inspired by ${item.product.inspiredBy}` : item.product?.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Qty: {item.quantity}</span>
                     <span className="text-xs text-slate-500">x €{item.unitPrice.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">€{(item.quantity * item.unitPrice).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 mt-auto">
          <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-3">
             <span>Total</span>
             <span>€{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded">
             <CreditCard size={12} />
             Payment Intent: <span className="font-mono">{order.stripePaymentIntentId || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPanel;