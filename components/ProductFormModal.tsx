import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { X, Save, TrendingUp, ShoppingBag, Clock, AlertTriangle } from 'lucide-react';
import AsyncImage from './AsyncImage';
import { useNotification } from '../contexts/NotificationContext';

interface ProductStats {
    totalOrders: number;
    totalUnitsSold: number;
    totalRevenue: number;
    latestOrderDate: string | null;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  productToEdit?: Product | null;
  categories: Category[];
  stats?: ProductStats; // New prop for statistics
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ 
  isOpen, onClose, onSave, productToEdit, categories, stats 
}) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    imageUrl: '',
    categoryId: categories[0]?.id || 0,
    inspiredBy: '',
    gender: 'Unisex'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setFormData({ ...productToEdit });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        stockQuantity: 0,
        imageUrl: '',
        categoryId: categories[0]?.id || 0,
        inspiredBy: '',
        gender: 'Unisex'
      });
    }
  }, [productToEdit, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict Validation
    if (!formData.name?.trim()) {
        showNotification('error', 'Product Name is missing!');
        return;
    }
    if (!formData.price || formData.price <= 0) {
        showNotification('error', 'Please enter a valid Price.');
        return;
    }
    if (formData.stockQuantity === undefined || formData.stockQuantity < 0) {
        showNotification('error', 'Stock Quantity cannot be negative.');
        return;
    }
    if (!formData.categoryId) {
        showNotification('warning', 'Please select a Category.');
        return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      showNotification('success', productToEdit ? 'Product updated successfully.' : 'New product added.');
      onClose();
    } catch (err: any) {
      showNotification('error', err.message || "Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {productToEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Deleted Warning */}
        {productToEdit?.isDeleted && (
            <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-2 border-b border-amber-100 dark:border-amber-800 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle size={16} />
                <span>This product is currently in the <strong>Trash</strong>. Restore it to make it active again.</span>
            </div>
        )}

        {/* Analytics Section */}
        {productToEdit && stats && (
            <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 grid grid-cols-4 gap-4">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold flex items-center gap-1">
                        <ShoppingBag size={12} /> Orders
                    </span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">{stats.totalOrders}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
                        Units Sold
                    </span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">{stats.totalUnitsSold}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold flex items-center gap-1">
                        <TrendingUp size={12} /> Revenue
                    </span>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">€{stats.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold flex items-center gap-1">
                        <Clock size={12} /> Latest
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white truncate" title={stats.latestOrderDate ? new Date(stats.latestOrderDate).toLocaleString() : 'Never'}>
                        {stats.latestOrderDate 
                            ? new Date(stats.latestOrderDate).toLocaleDateString() 
                            : 'N/A'}
                    </span>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price (€) <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" min="0" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Qty <span className="text-red-500">*</span></label>
                    <input type="number" min="0" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: parseInt(e.target.value)})} />
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                 <select className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                   value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: parseInt(e.target.value)})}>
                   {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
            </div>

            {/* Right Column: Image & Extra Details */}
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image URL (Cloudinary)</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg mb-2 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    placeholder="https://..."
                    value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                  
                  {/* Async Preview */}
                  <div className="h-48 w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                     {formData.imageUrl ? (
                       <AsyncImage src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                     ) : (
                       <span className="text-slate-400 text-sm">Image Preview</span>
                     )}
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                    <select className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                      <option>Unisex</option>
                      <option>Men</option>
                      <option>Women</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Inspired By</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      value={formData.inspiredBy} onChange={e => setFormData({...formData, inspiredBy: e.target.value})} />
                 </div>
               </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">Cancel</button>
          {!productToEdit?.isDeleted && (
              <button onClick={handleSubmit} disabled={isSaving} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                {isSaving ? <span>Saving...</span> : <><Save size={18} /><span>Save Product</span></>}
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;