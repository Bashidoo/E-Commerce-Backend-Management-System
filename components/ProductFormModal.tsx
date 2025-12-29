import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { X, Save } from 'lucide-react';
import AsyncImage from './AsyncImage';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  productToEdit?: Product | null;
  categories: Category[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ 
  isOpen, onClose, onSave, productToEdit, categories 
}) => {
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
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      alert("Validation Error: Please check all fields.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">
            {productToEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price (€)</label>
                    <input required type="number" step="0.01" min="0" className="w-full px-3 py-2 border rounded-lg"
                      value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock Qty</label>
                    <input required type="number" min="0" className="w-full px-3 py-2 border rounded-lg"
                      value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: parseInt(e.target.value)})} />
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                 <select className="w-full px-3 py-2 border rounded-lg"
                   value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: parseInt(e.target.value)})}>
                   {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
            </div>

            {/* Right Column: Image & Extra Details */}
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Cloudinary)</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg mb-2 text-xs"
                    placeholder="https://..."
                    value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                  
                  {/* Async Preview */}
                  <div className="h-48 w-full border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
                     {formData.imageUrl ? (
                       <AsyncImage src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                     ) : (
                       <span className="text-slate-400 text-sm">Image Preview</span>
                     )}
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <select className="w-full px-3 py-2 border rounded-lg"
                      value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                      <option>Unisex</option>
                      <option>Men</option>
                      <option>Women</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inspired By</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-lg"
                      value={formData.inspiredBy} onChange={e => setFormData({...formData, inspiredBy: e.target.value})} />
                 </div>
               </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button>
          <button onClick={handleSubmit} disabled={isSaving} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
             {isSaving ? <span>Saving...</span> : <><Save size={18} /><span>Save Product</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;