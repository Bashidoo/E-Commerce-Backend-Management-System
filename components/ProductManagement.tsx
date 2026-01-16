import React, { useState, useEffect } from 'react';
import { Product, Category, Order } from '../types';
import { inventoryService } from '../services/inventoryService';
import { orderService } from '../services/orderService';
import { Edit2, Trash2, Plus, Search, Package, RefreshCw, RotateCcw, XCircle, Clock } from 'lucide-react';
import ProductFormModal from './ProductFormModal';
import AsyncImage from './AsyncImage';
import { useNotification } from '../contexts/NotificationContext';

const ProductManagement: React.FC = () => {
  const { showNotification } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]); // Need orders for stats
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [prodData, catData, orderData] = await Promise.all([
      inventoryService.getAllProducts(),
      inventoryService.getAllCategories(),
      orderService.getAllOrders()
    ]);
    setProducts(prodData);
    setCategories(catData);
    setOrders(orderData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Soft Delete
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Move this product to trash?")) {
      await inventoryService.deleteProduct(id);
      showNotification('success', 'Product moved to trash.');
      loadData();
    }
  };

  // Restore
  const handleRestore = async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      await inventoryService.restoreProduct(id);
      showNotification('success', 'Product restored.');
      loadData();
  };

  // Permanent Delete
  const handlePermanentDelete = async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      if (confirm("Permanently delete this product? This action cannot be undone.")) {
          await inventoryService.permanentDeleteProduct(id);
          showNotification('success', 'Product permanently deleted.');
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

  // Calculate stats for a specific product
  const getProductStats = (productId: number) => {
      let totalOrders = 0;
      let totalUnitsSold = 0;
      let totalRevenue = 0;
      let latestOrderDate: string | null = null;

      orders.forEach(order => {
          const item = order.orderItems.find(i => i.productId === productId);
          if (item) {
              totalOrders++;
              totalUnitsSold += item.quantity;
              totalRevenue += (item.quantity * item.unitPrice);

              // Check for latest order
              if (!latestOrderDate || new Date(order.orderDate) > new Date(latestOrderDate)) {
                  latestOrderDate = order.orderDate;
              }
          }
      });

      return { totalOrders, totalUnitsSold, totalRevenue, latestOrderDate };
  };

  // Filter products based on search AND view mode (active vs trash)
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (viewMode === 'active') {
        return matchesSearch && !p.isDeleted;
    } else {
        return matchesSearch && p.isDeleted;
    }
  });

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 p-6 transition-colors">
      
      {/* Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex justify-between items-center transition-colors">
         <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
               <Package className="mr-2 text-indigo-600 dark:text-indigo-400" /> Inventory
            </h2>
            
            {/* View Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('active')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'active' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                >
                    Active
                </button>
                <button 
                    onClick={() => setViewMode('trash')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${viewMode === 'trash' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                >
                    <Trash2 size={12}/> Trash
                </button>
            </div>

            <div className="relative max-w-md w-full ml-4">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder={viewMode === 'active' ? "Search active products..." : "Search deleted products..."} 
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white dark:placeholder-slate-500"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button 
              onClick={loadData} 
              className="p-2 text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
              title="Refresh Inventory"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            {viewMode === 'active' && (
                <button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
                    <Plus size={18} /> Add Product
                </button>
            )}
         </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors">
         <div className="overflow-y-auto h-full custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                  <tr>
                     <th className="px-6 py-4">Image</th>
                     <th className="px-6 py-4">Product Name</th>
                     <th className="px-6 py-4">Category</th>
                     <th className="px-6 py-4">Price</th>
                     <th className="px-6 py-4 text-center">Stock</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">Loading Inventory...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">
                            {viewMode === 'active' ? 'No active products found.' : 'Trash is empty.'}
                        </td>
                    </tr>
                  ) : filteredProducts.map(p => (
                     <tr 
                        key={p.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group cursor-pointer"
                        onClick={() => openEditModal(p)}
                     >
                        <td className="px-6 py-3">
                           <AsyncImage src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded border border-slate-200 dark:border-slate-700" />
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">{p.name}</td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400 text-sm">
                           <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700">
                              {p.category?.name || 'Uncategorized'}
                           </span>
                        </td>
                        <td className="px-6 py-3 text-slate-800 dark:text-slate-200">€{p.price.toFixed(2)}</td>
                        <td className="px-6 py-3 text-center">
                           <span className={`font-mono text-sm ${p.stockQuantity < 10 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                              {p.stockQuantity}
                           </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {viewMode === 'active' ? (
                                <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openEditModal(p); }} 
                                        className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                                        title="Edit & View Stats"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, p.id)} 
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                        title="Move to Trash"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                              ) : (
                                <>
                                    <button 
                                        onClick={(e) => handleRestore(e, p.id)} 
                                        className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors"
                                        title="Restore"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => handlePermanentDelete(e, p.id)} 
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                        title="Delete Permanently"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </>
                              )}
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
        stats={editingProduct ? getProductStats(editingProduct.id) : undefined}
      />
    </div>
  );
};

export default ProductManagement;