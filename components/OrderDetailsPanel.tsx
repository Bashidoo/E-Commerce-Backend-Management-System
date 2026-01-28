import React, { useState } from "react";
import { Order } from "../types";
import {
  Printer,
  RefreshCw,
  AlertTriangle,
  Truck,
  MapPin,
  CreditCard,
  User,
  Package,
  ExternalLink,
  ArrowLeft,
  FileText,
  Settings2,
  TestTube2,
} from "lucide-react";
import { orderService } from "../services/orderService";
import { sendifyService } from "../services/sendifyService";
import AsyncImage from "./AsyncImage";
import { useNotification } from "../contexts/NotificationContext";

interface OrderDetailsPanelProps {
  order: Order | null;
  onOrderUpdated: (updatedOrder: Order) => void;
  onCloseMobile?: () => void;
}

const OrderDetailsPanel: React.FC<OrderDetailsPanelProps> = ({
  order,
  onOrderUpdated,
  onCloseMobile,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [confirmReprint, setConfirmReprint] = useState(false);
  const [customShipmentId, setCustomShipmentId] = useState("");
  const [showAdvancedLabel, setShowAdvancedLabel] = useState(false);
  const [isTestBooking, setIsTestBooking] = useState(true); // Default to Test mode for safety
  const { showNotification } = useNotification();

  React.useEffect(() => {
    setConfirmReprint(false);
    setCustomShipmentId("");
    setShowAdvancedLabel(false);
    setIsTestBooking(true);
  }, [order?.id]);

  if (!order) {
    return (
      <div className="hidden md:flex h-full flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Truck size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
          No Order Selected
        </p>
        <p className="text-sm">
          Select an order from the list to view details and manage shipping
          labels.
        </p>
      </div>
    );
  }

  const handleGenerateLabel = async () => {
    if (order.isLabelPrinted && !confirmReprint) {
      setConfirmReprint(true);
      return;
    }

    try {
      setIsPrinting(true);
      let labelUrl = "";

      // 1. Try to Print Existing (Skip if forcing test booking)
      try {
        // If user specifically wants to simulate a booking, we skip checking for existing IDs that might fail
        if (isTestBooking && !customShipmentId && !order.isLabelPrinted) {
          throw new Error("Force Test Booking");
        }
        labelUrl = await sendifyService.generateLabel(
          order.id,
          customShipmentId,
        );
      } catch (printError: any) {
        // 2. If Failed (Not Found) OR forcing test, Try to BOOK using address
        if (
          (printError.message.includes("Shipment Not Found") ||
            printError.message === "Force Test Booking") &&
          !customShipmentId
        ) {
          if (!isTestBooking) {
            showNotification(
              "info",
              "Shipment ID not found. Attempting to Book Real Shipment...",
            );
          }

          const booking = await sendifyService.bookShipment(
            order,
            isTestBooking,
          );
          labelUrl = booking.labelUrl;

          if (booking.warning) {
            showNotification("warning", booking.warning);
          } else {
            showNotification("success", "Shipment Booked Successfully!");
          }
        } else {
          throw printError;
        }
      }

      // 3. Update Order State
      const updated = await orderService.updateOrderLabelStatus(
        order.id,
        true,
        labelUrl,
      );

      setIsPrinting(false);
      setConfirmReprint(false);
      onOrderUpdated(updated);

      if (labelUrl) {
        window.open(labelUrl, "_blank");
      }
    } catch (error: any) {
      console.error("Label Error", error);
      setIsPrinting(false);

      if (error.message.includes("Shipment Not Found")) {
        setShowAdvancedLabel(true);
        showNotification(
          "warning",
          `Could not find or book shipment. Check Sendify credentials.`,
        );
      } else {
        showNotification("error", error.message || "Error generating label.");
      }
    }
  };

  const renderAddress = () => {
    if (order.shippingAddressSnapshot) {
      return (
        <div className="space-y-0.5">
          <p>{order.shippingAddressSnapshot}</p>
          <p>
            {order.shippingCitySnapshot}, {order.shippingStateSnapshot}{" "}
            {order.shippingZipSnapshot}
          </p>
          <p>{order.shippingCountrySnapshot}</p>
        </div>
      );
    }
    return (
      <p className="whitespace-pre-line leading-relaxed">
        {order.user?.address}
      </p>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 md:border md:border-slate-200 dark:md:border-slate-800 md:rounded-xl shadow-sm flex flex-col h-full w-full transition-colors">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex md:hidden items-center mb-2">
          <button
            onClick={onCloseMobile}
            className="flex items-center text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft size={18} className="mr-1" /> Back
          </button>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {order.orderNumber}
              </h2>
              {order.isLabelPrinted && (
                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-medium border border-green-200 dark:border-green-800">
                  Label Printed
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Placed on{" "}
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(new Date(order.orderDate))}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {confirmReprint && (
              <div className="flex flex-col items-end mb-2 animate-in fade-in slide-in-from-top-1">
                <span className="text-xs text-amber-600 dark:text-amber-500 font-bold flex items-center mb-1">
                  <AlertTriangle size={12} className="mr-1" />
                  Already Generated
                </span>
                <button
                  onClick={() => setConfirmReprint(false)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 underline"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={handleGenerateLabel}
              disabled={isPrinting}
              className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm font-semibold text-sm transition-all
                    ${
                      confirmReprint
                        ? "bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-200"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
                    }
                    ${isPrinting ? "opacity-70 cursor-not-allowed" : ""}
                    `}
            >
              {isPrinting ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <FileText size={18} />
              )}
              <span>
                {isPrinting
                  ? "Processing..."
                  : confirmReprint
                    ? "Regenerate"
                    : "Generate Label"}
              </span>
            </button>

            <button
              onClick={() => setShowAdvancedLabel(!showAdvancedLabel)}
              className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1"
            >
              <Settings2 size={12} />{" "}
              {showAdvancedLabel ? "Hide Options" : "Advanced Options"}
            </button>
          </div>
        </div>

        {showAdvancedLabel && (
          <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg animate-in fade-in zoom-in-95 shadow-inner">
            {/* Test Mode Toggle */}
            <div className="flex items-center gap-2 mb-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
              <input
                type="checkbox"
                id="testMode"
                checked={isTestBooking}
                onChange={(e) => setIsTestBooking(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="testMode"
                className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1 cursor-pointer select-none"
              >
                <TestTube2 size={14} /> Simulate Booking (No Charge)
              </label>
            </div>

            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Manual Sendify Shipment ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customShipmentId}
                onChange={(e) => setCustomShipmentId(e.target.value)}
                placeholder="e.g. shp_123456"
                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {order.labelUrl && (
          <a
            href={order.labelUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ExternalLink size={12} className="mr-1" /> View Existing Label PDF
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wide font-semibold">
              <User size={14} /> Customer Details
            </div>
            <div className="space-y-1 text-sm text-slate-800 dark:text-slate-200">
              <p className="font-semibold">
                {order.user?.firstName} {order.user?.lastName}
              </p>
              <p>{order.user?.email}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wide font-semibold">
              <MapPin size={14} /> Shipping Address
            </div>
            <div className="text-sm text-slate-800 dark:text-slate-200">
              {renderAddress()}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
            <Package size={16} className="mr-2 text-indigo-500" />
            Order Items ({order.orderItems.length})
          </h3>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-colors"
              >
                <AsyncImage
                  src={item.product?.imageUrl}
                  alt={item.product?.name}
                  className="w-16 h-16 rounded-md border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {item.product?.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {item.product?.inspiredBy
                      ? `Inspired by ${item.product.inspiredBy}`
                      : item.product?.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      x €{item.unitPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    €{(item.quantity * item.unitPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto">
          <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white pt-3">
            <span>Total</span>
            <span>€{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded">
            <CreditCard size={12} />
            Payment Intent:{" "}
            <span className="font-mono">
              {order.stripePaymentIntentId || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPanel;
