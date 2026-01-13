import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { inventoryService } from '../services/inventoryService';
import { Edit2, Trash2, Plus, Search, Package, RefreshCw } from 'lucide-react';
import ProductFormModal from './ProductFormModal';
import AsyncImage from './AsyncImage';

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [prodData, catData] = await Promise.all([
      inventoryService.getAllProducts(),
      inventoryService.getAllCategories()
    ]);
    setProducts(prodData);
    setCategories(catData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await inventoryService.deleteProduct(id);
      loadData();
    }
  };

  const handleSave = async (product: Partial<Product>) => {
    await inventoryService.saveProduct(product);
    loadData();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-100 p-6">
      
      {/* Header Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex justify-between items-center">
         <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
               <Package className="mr-2 text-indigo-600" /> Inventory
            </h2>
            <div className="relative max-w-md w-full ml-8">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search products by name or category..." 
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button 
              onClick={loadData} 
              className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
              title="Refresh Inventory"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
                <Plus size={18} /> Add Product
            </button>
         </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
         <div className="overflow-y-auto h-full custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                  <tr>
                     <th className="px-6 py-4">Image</th>
                     <th className="px-6 py-4">Product Name</th>
                     <th className="px-6 py-4">Category</th>
                     <th className="px-6 py-4">Price</th>
                     <th className="px-6 py-4 text-center">Stock</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10">Loading Inventory...</td></tr>
                  ) : filteredProducts.map(p => (
                     <tr key={p.id} className="hover:bg-slate-50 group">
                        <td className="px-6 py-3">
                           <AsyncImage src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded border border-slate-200" />
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-800">{p.name}</td>
                        <td className="px-6 py-3 text-slate-600 text-sm">
                           <span className="bg-slate-100 px-2 py-1 rounded-full text-xs font-medium border border-slate-200">
                              {p.category?.name || 'Uncategorized'}
                           </span>
                        </td>
                        <td className="px-6 py-3 text-slate-800">€{p.price.toFixed(2)}</td>
                        <td className="px-6 py-3 text-center">
                           <span className={`font-mono text-sm ${p.stockQuantity < 10 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                              {p.stockQuantity}
                           </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(p)} className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded">
                                 <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded">
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        productToEdit={editingProduct}
        categories={categories}
      />
    </div>
  );
};

export default ProductManagement;