import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Layers, 
  PackageCheck, 
  Trash2, 
  Plus, 
  Edit3, 
  Search, 
  AlertTriangle, 
  Coins, 
  Package, 
  Users, 
  TrendingUp, 
  X, 
  Check, 
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import { Product, Order, UserProfile, Category } from '../types';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  users: UserProfile[];
  categories: Category[];
  onAddProduct: (prod: Omit<Product, 'id' | 'createdAt'>) => void;
  onUpdateProduct: (id: string, updated: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onAddCategory: (name: string) => void;
}

export default function AdminDashboard({
  products,
  orders,
  users,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onAddCategory,
}: AdminDashboardProps) {
  
  // Navigation Tabs inside admin
  const [activeAdminTab, setActiveAdminTab] = useState<'metrics' | 'products' | 'orders' | 'customers'>('metrics');

  // Product modal / forms trigger
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New Category trigger
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form Field parameters for product creation / editing
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('outerwear');
  const [formPrice, setFormPrice] = useState(150);
  const [formDiscountPrice, setFormDiscountPrice] = useState('');
  const [formStock, setFormStock] = useState(10);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formColorName, setFormColorName] = useState('Core Edition');
  const [formImagesText, setFormImagesText] = useState(''); // comma separated URLs
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L']);
  const [formColors, setFormColors] = useState<string[]>(['#000000', '#FFFFFF']);
  
  // Cloudinary Direct Uploader states
  const [uploading, setUploading] = useState(false);
  const [cloudinaryPreset, setCloudinaryPreset] = useState('ml_default');
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Cloudinary Upload Routines
  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadError('');

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryPreset);
      formData.append('cloud_name', 'df4qsb2lr');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/df4qsb2lr/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const specificMsg = errData?.error?.message || '';
         throw new Error(
          specificMsg || `HTTP error ${response.status}: Failed to upload.`
        );
      }

      const data = await response.json();
      if (data.secure_url) {
        const currentUrls = formImagesText.trim();
        const divider = currentUrls ? ', ' : '';
        setFormImagesText(currentUrls + divider + data.secure_url);
        alert('Streetwear image uploaded to Cloudinary, and added to image list!');
      } else {
        throw new Error('Upload output returned no secure URL.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(
        err.message || 'Check your internet connection or upload preset.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadError('');

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryPreset);
      formData.append('cloud_name', 'df4qsb2lr');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/df4qsb2lr/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const specificMsg = errData?.error?.message || '';
        throw new Error(
          specificMsg || `HTTP error ${response.status}: Failed to upload.`
        );
      }

      const data = await response.json();
      if (data.secure_url) {
        const currentUrls = formImagesText.trim();
        const divider = currentUrls ? ', ' : '';
        setFormImagesText(currentUrls + divider + data.secure_url);
        alert('Streetwear image uploaded to Cloudinary, and added to image list!');
      } else {
        throw new Error('Upload output returned no secure URL.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(
        err.message || 'Check your internet connection or upload preset.'
      );
    } finally {
      setUploading(false);
    }
  };

  // Filters inside order lists
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Filters inside customer list
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Dynamic Metrics Calculation
  const metrics = useMemo(() => {
    const totalCount = products.length;
    const totalOrders = orders.length;
    const pendingCount = orders.filter(o => o.status === 'Pending Payment').length;
    
    // Revenue counts all non-cancelled orders
    const completedRevenue = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((acc, o) => acc + o.total, 0);

    const lowStockCount = products.filter(p => p.stock <= 5).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    return {
      totalCount,
      totalOrders,
      pendingCount,
      completedRevenue,
      lowStockCount,
      outOfStockCount,
    };
  }, [products, orders]);

  // Form sizes options
  const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'O/S'];
  const AVAILABLE_COLORS = [
    { hex: '#0A0A0A', name: 'Jet Black' },
    { hex: '#EAEAEA', name: 'Optic White' },
    { hex: '#5C6B73', name: 'Stone Grey' },
    { hex: '#2F3E46', name: 'Charcoal' },
    { hex: '#DDA15E', name: 'Architect Tan' },
    { hex: '#7D82B8', name: 'Heather Grey' },
  ];

  // Load product to edit
  const handleStartEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormDesc(prod.description);
    setFormCategory(prod.category);
    setFormPrice(prod.price);
    setFormDiscountPrice(prod.discountPrice ? prod.discountPrice.toString() : '');
    setFormStock(prod.stock);
    setFormFeatured(prod.featured);
    setFormColorName(prod.colorName || 'Core Edition');
    setFormImagesText(prod.images.join(', '));
    setFormSizes(prod.sizes);
    setFormColors(prod.colors);
    setIsAddingProduct(true);
  };

  // Setup form with pristine fields for creation
  const handleStartAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDesc('');
    setFormCategory('outerwear');
    setFormPrice(150);
    setFormDiscountPrice('');
    setFormStock(15);
    setFormFeatured(false);
    setFormColorName('Core Edition');
    setFormImagesText('https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop');
    setFormSizes(['S', 'M', 'L']);
    setFormColors(['#0A0A0A', '#EAEAEA']);
    setIsAddingProduct(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDesc || !formImagesText) {
      alert('Please complete the product form.');
      return;
    }

    const imagesArray = formImagesText
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    const discountValue = formDiscountPrice ? Number(formDiscountPrice) : undefined;

    const productPayload = {
      name: formName.toUpperCase(),
      description: formDesc,
      category: formCategory,
      price: Number(formPrice),
      discountPrice: discountValue,
      stock: Number(formStock),
      featured: formFeatured,
      colorName: formColorName,
      images: imagesArray,
      sizes: formSizes,
      colors: formColors,
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, productPayload);
      alert('Product updated successfully.');
    } else {
      onAddProduct(productPayload);
      alert('New streetwear element added to collection.');
    }

    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const handleDeleteProductConfirmed = () => {
    if (deleteConfirmId) {
      onDeleteProduct(deleteConfirmId);
      setDeleteConfirmId(null);
      alert(' street element removed from local database and storage simulated buckets.');
    }
  };

  const toggleSizeSelection = (sz: string) => {
    if (formSizes.includes(sz)) {
      setFormSizes(formSizes.filter(s => s !== sz));
    } else {
      setFormSizes([...formSizes, sz]);
    }
  };

  const toggleColorSelection = (colHex: string) => {
    if (formColors.includes(colHex)) {
      setFormColors(formColors.filter(c => c !== colHex));
    } else {
      setFormColors([...formColors, colHex]);
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setNewCatName('');
    setIsAddingCategory(false);
    alert('New category directory registered.');
  };

  // Filter Orders Lists
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = o.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(orderSearchQuery.toLowerCase());
      
      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, orderSearchQuery, orderStatusFilter]);

  // Filter Customers Lists
  const filteredCustomers = useMemo(() => {
    return users.filter(usr => {
      const isCust = usr.role === 'customer';
      const matchSearch = usr.firstName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        usr.lastName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        usr.email.toLowerCase().includes(customerSearchQuery.toLowerCase());
      return isCust && matchSearch;
    });
  }, [users, customerSearchQuery]);

  return (
    <div className="flex-grow max-w-[1440px] mx-auto px-4 md:px-[64px] py-[64px] font-body-md text-on-background">
      
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant pb-6 mb-10 gap-4">
        <div>
          <h1 className="font-display-lg text-[28px] md:text-[36px] tracking-tight text-primary uppercase font-bold">
            PLAYBOOK STUDIOS ADMIN
          </h1>
          <p className="font-mono text-xs text-secondary mt-1 uppercase tracking-widest">
            Logged in as administrative security terminal: playbookstudio79@gmail.com
          </p>
        </div>

        {/* Categories Adding Action */}
        <div className="flex space-x-2">
          <button
            onClick={() => setIsAddingCategory(true)}
            className="border border-outline-variant hover:border-primary text-xs font-label-caps tracking-widest px-4 py-2.5 uppercase text-primary transition rounded-none"
          >
            Create Category Collection
          </button>
        </div>
      </div>

      {/* Adding Category Modal overlay */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 max-w-sm w-full border border-outline-variant">
            <h3 className="font-headline-sm text-lg font-medium tracking-tight mb-4 uppercase">New Dynamic Category</h3>
            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="font-label-caps text-[9px] text-secondary tracking-wider block mb-1">Category Title</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Knitwear, Footwear"
                  className="bg-zinc-50 border border-outline-variant p-2 w-full text-xs focus:outline-none focus:border-primary rounded-none"
                />
              </div>
              <div className="flex justify-end space-x-2.5 pt-2">
                <button
                  type="submit"
                  className="bg-primary text-on-primary px-4 py-2 text-xs font-label-caps uppercase tracking-wider rounded-none"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="border border-outline-variant text-secondary px-4 py-2 text-xs font-label-caps uppercase tracking-wider rounded-none"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab control triggers */}
      <div className="flex flex-wrap border-b border-outline-variant font-label-caps text-[10px] tracking-widest uppercase mb-10 text-secondary gap-x-2">
        {[
          { id: 'metrics', name: 'Operational Metrics', icon: <BarChart className="w-3.5 h-3.5" /> },
          { id: 'products', name: 'Product Index System', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'orders', name: 'Order Logs', icon: <PackageCheck className="w-3.5 h-3.5" /> },
          { id: 'customers', name: 'Customer logs', icon: <Users className="w-3.5 h-3.5" /> }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => {
              setActiveAdminTab(tb.id as any);
              setIsAddingProduct(false);
              setEditingProduct(null);
            }}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 hover:text-black hover:border-black transition ${
              activeAdminTab === tb.id ? 'border-primary text-primary font-bold' : 'border-transparent'
            }`}
          >
            {tb.icon}
            <span>{tb.name}</span>
          </button>
        ))}
      </div>

      {/* METRICS & INVENTORY SUMMARY AREA */}
      {activeAdminTab === 'metrics' && (
        <div className="space-y-12">
          
          {/* Quick Metrics KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1 */}
            <div className="border border-outline-variant bg-surface-container-lowest p-6 flex flex-col justify-between h-[140px]">
              <div className="flex justify-between items-center text-secondary">
                <span className="font-label-caps text-[9px] tracking-widest uppercase">Total Stock Elements</span>
                <Package className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-mono text-3xl font-bold text-primary mt-2">{metrics.totalCount}</h3>
                <p className="font-mono text-[9px] text-[#5d5f5f] uppercase tracking-wider mt-1">Active live listings</p>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="border border-outline-variant bg-surface-container-lowest p-6 flex flex-col justify-between h-[140px]">
              <div className="flex justify-between items-center text-secondary">
                <span className="font-label-caps text-[9px] tracking-widest uppercase">Total Order Submissions</span>
                <PackageCheck className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-mono text-3xl font-bold text-primary mt-2">{metrics.totalOrders}</h3>
                <p className="font-mono text-[9px] text-[#5d5f5f] uppercase tracking-wider mt-1">Pending payments: {metrics.pendingCount}</p>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="border border-outline-variant bg-surface-container-lowest p-6 flex flex-col justify-between h-[140px]">
              <div className="flex justify-between items-center text-secondary">
                <span className="font-label-caps text-[9px] tracking-widest uppercase">Accumulative Revenue</span>
                <Coins className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-mono text-3xl font-bold text-primary mt-2">₹{metrics.completedRevenue.toLocaleString()}</h3>
                <p className="font-mono text-[9px] text-green-700 uppercase tracking-wider font-semibold mt-1 flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Gross INR receipts</span>
                </p>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="border-border p-6 flex flex-col justify-between h-[140px] border border-red-200 bg-red-50/20">
              <div className="flex justify-between items-center text-red-700 font-semibold text-[9px] font-label-caps tracking-widest uppercase">
                <span>Low Stock Warns</span>
                <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-mono text-3xl font-bold text-red-700 mt-2">
                  {metrics.lowStockCount}
                </h3>
                <p className="font-mono text-[9px] text-[#ba1a1a] uppercase tracking-wider mt-1 font-semibold">
                  Out of stock targets: {metrics.outOfStockCount}
                </p>
              </div>
            </div>
          </div>

          {/* Low Stock inventory warning layout list instructions */}
          {products.filter(p => p.stock <= 5).length > 0 && (
            <div className="border border-dashed border-red-200 bg-red-50/10 p-6 md:p-8 space-y-4">
              <div className="flex items-center space-x-2 text-red-800 font-semibold font-label-caps text-[11px] uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Urgent: Seeding Low/Out-Of-Stock Inventory Checklist</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products
                  .filter(p => p.stock <= 5)
                  .map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleStartEdit(p)}
                      className="border border-outline-variant p-4 bg-white hover:border-red-600 cursor-pointer flex justify-between items-center transition"
                    >
                      <div className="space-y-0.5 max-w-[180px]">
                        <p className="font-semibold text-xs text-primary uppercase truncate">{p.name}</p>
                        <p className="font-mono text-[9px] text-[#5d5f5f] uppercase">Category: {p.category}</p>
                      </div>
                      <div className="text-right">
                        {p.stock === 0 ? (
                          <span className="bg-red-600 text-white font-label-caps text-[8px] tracking-wider px-2 py-0.5 uppercase">OUT OF STOCK</span>
                        ) : (
                          <span className="bg-[#ffdad6] text-[#93000a] font-mono text-[10px] px-2.5 py-1 font-bold">Only {p.stock} remain</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Display general instructions */}
          <div className="bg-surface-container-low p-6 md:p-8 space-y-3 border border-outline-variant">
            <h4 className="font-label-caps text-xs text-primary font-bold uppercase tracking-wider">Administration Guide</h4>
            <p className="font-body-md text-xs text-secondary leading-relaxed">
              This terminal provides complete simulated database interactions syncing seamlessly with persistent browser states. You can modify physical attributes, sizes, inventory counts, or toggle order statuses. Real items will deduct real-time inventory on checkout from client bag actions.
            </p>
          </div>
        </div>
      )}

      {/* PRODUCTS MANAGEMENT TABS */}
      {activeAdminTab === 'products' && (
        <div className="space-y-8">
          
          {/* Action trigger row */}
          {!isAddingProduct && (
            <div className="flex justify-between items-baseline border-b border-outline-variant pb-4">
              <h2 className="font-display-lg text-[22px] md:text-[28px] text-primary uppercase font-light">
                Product Database Index List
              </h2>
              <button
                onClick={handleStartAdd}
                className="bg-primary text-on-primary font-button-text text-xs tracking-widest py-3 px-6 uppercase hover:bg-opacity-95 active:scale-95 transition flex items-center space-x-1.5 rounded-none"
              >
                <Plus className="w-4 h-4" />
                <span>Add Streetwear Product</span>
              </button>
            </div>
          )}

          {/* CREATE & EDIT PRODUCT INLINE MODE */}
          {isAddingProduct && (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 md:p-10 space-y-8 max-w-3xl mx-auto">
              <div>
                <h3 className="font-headline-sm text-xl font-medium tracking-tight text-primary uppercase">
                  {editingProduct ? `Edit Streetwear Look: ${editingProduct.name}` : 'New Architectural Look Seeding Form'}
                </h3>
                <p className="font-body-md text-xs text-secondary mt-1">Configure structural details, price points, and stocks.</p>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6 text-xs text-secondary">
                
                {/* Product Name */}
                <div className="relative">
                  <label className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. CORE CORDUROY PARKA"
                    className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 text-sm bg-transparent rounded-none text-primary"
                  />
                </div>

                {/* Description */}
                <div className="relative">
                  <label className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase mb-1">Product Description</label>
                  <textarea
                    required
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Provide pristine craftsmanship detailing..."
                    rows={4}
                    className="border border-outline-variant focus:border-primary focus:outline-none w-full p-3 font-body-md text-sm bg-transparent rounded-none text-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Category select */}
                  <div className="relative">
                    <label className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase mb-1">Category directory</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 text-sm rounded-none bg-transparent text-primary"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pricing */}
                  <div className="relative">
                    <label className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase mb-1">Original Price (₹ INR)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 text-sm rounded-none bg-transparent text-primary"
                    />
                  </div>

                  {/* Discount Price */}
                  <div className="relative">
                    <label className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase mb-1">Discount Price (Optional)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Promo / sale price"
                      value={formDiscountPrice}
                      onChange={(e) => setFormDiscountPrice(e.target.value)}
                      className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 text-sm rounded-none bg-transparent text-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Stock count */}
                  <div className="relative">
                    <label className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase mb-1">Atelier Stock Quantity</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 text-sm rounded-none bg-transparent text-primary"
                    />
                  </div>

                  {/* Color naming */}
                  <div className="relative">
                    <label className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase mb-1">Primary Color Naming</label>
                    <input
                      type="text"
                      value={formColorName}
                      onChange={(e) => setFormColorName(e.target.value)}
                      placeholder="e.g. Black / Core"
                      className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 text-sm rounded-none bg-transparent text-primary"
                    />
                  </div>

                  {/* Featured element */}
                  <div className="flex items-center space-x-2 pt-5">
                    <input
                      type="checkbox"
                      id="formFeatured"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="accent-primary h-4 w-4 rounded-none cursor-pointer"
                    />
                    <label htmlFor="formFeatured" className="font-label-caps text-[9px] text-secondary tracking-widest uppercase cursor-pointer select-none">
                      Mark Featured Product
                    </label>
                  </div>
                </div>

                {/* Cloudinary Direct Secure Upload Widget */}
                <div className="border border-outline-variant p-4 space-y-3 bg-neutral-50/50">
                  <div className="flex justify-between items-center pb-2 border-b border-light-outline-variant">
                    <span className="font-label-caps text-[9px] text-[#0A0A0A] tracking-wider uppercase font-bold">Cloudinary Drag & Drop Uploader</span>
                    <span className="font-mono text-[8.5px] text-[#2563EB] uppercase font-semibold">CLOUD: df4qsb2lr</span>
                  </div>

                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('cloudinary-file-input')?.click()}
                    className={`border border-dashed p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer rounded-none relative ${
                      isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-outline-variant hover:border-zinc-400 bg-white'
                    }`}
                  >
                    <input
                      type="file"
                      id="cloudinary-file-input"
                      accept="image/*"
                      onChange={handleCloudinaryUpload}
                      className="hidden"
                    />
                    
                    {uploading ? (
                      <div className="flex flex-col items-center space-y-2 py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border border-primary border-t-transparent" />
                        <span className="font-mono text-[9px] text-primary tracking-widest uppercase animate-pulse">UPLOADING STREETWEAR ASSET...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-label-caps text-[10px] text-primary tracking-widest uppercase font-bold">Drag & Drop Image or Click to Browse</p>
                        <p className="font-mono text-[8px] text-secondary uppercase">Directly streams secure assets straight to Cloudinary media vault</p>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="text-[10px] text-red-600 font-mono bg-red-50 p-2.5 border-l-2 border-red-500 whitespace-pre-wrap leading-relaxed">
                      <p className="font-bold uppercase tracking-wider mb-1">Upload Error details:</p>
                      <p>{uploadError}</p>
                      <p className="mt-2 text-slate-500 text-[9px]">
                        💡 Cloudinary requires unsigned upload preset to access directly without using a backend api_secret. 
                        Please ensure you have created an Unsigned Upload Preset named <span className="font-bold underline text-primary">'{cloudinaryPreset}'</span> in your Cloudinary Dashboard under Settings &gt; Upload &gt; Upload presets.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-1">
                    <label className="font-mono text-[8px] text-[#5d5f5f] tracking-widest uppercase">Unsigned Upload Preset:</label>
                    <input 
                      type="text"
                      value={cloudinaryPreset}
                      onChange={(e) => setCloudinaryPreset(e.target.value)}
                      className="border-b border-light-outline-variant focus:border-primary focus:outline-none px-2 py-0.5 text-[10px] font-mono text-primary bg-transparent text-center"
                      placeholder="ml_default"
                    />
                  </div>
                </div>

                {/* Multiple Images URLs commas split */}
                <div className="relative">
                  <label className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase mb-1">Multiple Image URLs (Comma Separated)</label>
                  <input
                    type="text"
                    required
                    value={formImagesText}
                    onChange={(e) => setFormImagesText(e.target.value)}
                    placeholder="URL 1, URL 2, URL 3"
                    className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 text-sm bg-transparent rounded-none text-primary font-mono"
                  />
                  <span className="font-mono text-[8px] text-[#5d5f5f] block mt-1 uppercase">Recommended: Provide premium high-res unsplash landscape or streetwear links.</span>
                </div>

                {/* SIZES CHOICE MULTI */}
                <div className="space-y-2">
                  <span className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase font-bold">Sizes Available</span>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SIZES.map(sz => {
                      const sel = formSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSizeSelection(sz)}
                          className={`border px-4 py-2 text-xs font-mono rounded-none select-none transition ${
                            sel ? 'bg-primary text-on-primary border-primary font-semibold' : 'border-outline-variant text-primary hover:border-primary'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COLORS CHOICE MULTI CIRCULAR */}
                <div className="space-y-2">
                  <span className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase font-bold">Colors Available</span>
                  <div className="flex gap-4">
                    {AVAILABLE_COLORS.map(col => {
                      const sel = formColors.includes(col.hex);
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => toggleColorSelection(col.hex)}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center relative transition ${
                            sel ? 'ring-2 ring-primary ring-offset-2' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col.hex, borderColor: '#D1D1D1' }}
                          title={col.name}
                        >
                          {sel && <Check className="w-4 h-4 text-[#ba1a1a] stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons list */}
                <div className="flex space-x-3.5 pt-4">
                  <button
                    type="submit"
                    className="bg-primary text-on-primary font-button-text text-xs tracking-widest py-3 px-8 uppercase hover:opacity-90 active:scale-95 transition rounded-none"
                  >
                    {editingProduct ? 'UPDATE STYLING' : 'SEED NEW LOOK'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                    }}
                    className="border border-outline-variant text-secondary font-button-text text-xs tracking-widest py-3 px-8 uppercase hover:bg-zinc-50 transition rounded-none"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW PRODUCTS LIST GRID */}
          {!isAddingProduct && (
            <div className="border border-outline-variant overflow-x-auto bg-white">
              <table className="min-w-full divide-y divide-outline-variant text-left text-sm tracking-wide">
                <thead className="bg-surface-container-low font-label-caps text-[9px] tracking-widest uppercase text-secondary">
                  <tr>
                    <th scope="col" className="px-6 py-4">Visual asset</th>
                    <th scope="col" className="px-6 py-4">Look Naming & ID</th>
                    <th scope="col" className="px-6 py-4">Category</th>
                    <th scope="col" className="px-6 py-4">Original price</th>
                    <th scope="col" className="px-6 py-4">Atelier Stock</th>
                    <th scope="col" className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-xs text-primary">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center space-y-4">
                        <Package className="w-10 h-10 text-secondary mx-auto opacity-40 stroke-[1.2]" />
                        <div className="space-y-1">
                          <p className="font-label-caps text-xs text-primary font-bold uppercase tracking-wider">No Products Currently Listed</p>
                          <p className="font-body-md text-xs text-secondary max-w-sm mx-auto">
                            Add premium streetwear items to your dynamic inventory catalogue to show on the online storefront.
                          </p>
                        </div>
                        <button
                          onClick={handleStartAdd}
                          className="bg-primary text-on-primary font-button-text text-xs tracking-widest py-2.5 px-6 uppercase hover:opacity-90 active:scale-95 transition rounded-none"
                        >
                          Add Your First Product
                        </button>
                      </td>
                    </tr>
                  ) : (
                    products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        
                        {/* Image Thumbnail */}
                        <td className="px-6 py-4">
                          <div className="w-10 h-14 bg-surface-container overflow-hidden border border-outline-variant">
                            <img 
                              src={p.images[0]} 
                              alt={p.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                        </td>

                        {/* Naming */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold uppercase text-black">{p.name}</p>
                            <p className="font-mono text-[9px] text-[#5d5f5f]">{p.id} / {p.colorName || 'No Specific Color'}</p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4 uppercase font-label-caps text-[10px] tracking-wider text-[#5d5f5f]">
                          {p.category}
                        </td>

                        {/* Original price */}
                        <td className="px-6 py-4 font-mono font-medium">
                          {p.discountPrice ? (
                            <span className="space-x-1">
                              <span className="text-red-500">₹{p.discountPrice.toLocaleString()}</span>
                              <span className="text-slate-400 line-through text-[10px]">₹{p.price.toLocaleString()}</span>
                            </span>
                          ) : (
                            `₹${p.price.toLocaleString()}`
                          )}
                        </td>

                        {/* Stock level */}
                        <td className="px-6 py-4">
                          {p.stock === 0 ? (
                            <span className="bg-red-600 text-white font-label-caps text-[8px] tracking-widest px-2 py-0.5 uppercase">
                              OUT OF STOCK
                            </span>
                          ) : p.stock <= 5 ? (
                            <span className="bg-[#ffdad6] text-[#93000a] font-mono font-bold px-2 py-0.5">
                              LOW ({p.stock})
                            </span>
                          ) : (
                            <span className="font-mono text-[#5d5f5f]">{p.stock} units</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex space-x-4 items-center uppercase font-label-caps text-[9px] tracking-widest font-semibold header">
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="text-primary hover:underline hover:opacity-75 flex items-center space-x-1"
                            >
                              <Edit3 className="w-3 h-3 text-[#5d5f5f]" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="text-red-600 hover:text-red-700 hover:underline flex items-center space-x-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Delete Confirm Modal */}
          {deleteConfirmId && (
            <div className="fixed inset-0 bg-black/55 backdrop-blur-[2.5px] z-50 flex items-center justify-center p-4">
              <div className="bg-white p-8 max-w-sm w-full border border-outline-variant text-center space-y-6">
                <AlertTriangle className="w-10 h-10 text-red-600 mx-auto animate-bounce" />
                <div className="space-y-2">
                  <h3 className="font-headline-sm text-lg font-medium tracking-tight text-primary uppercase">Confirm Element Removal</h3>
                  <p className="font-body-md text-xs text-secondary leading-relaxed">
                    Are you sure you want to delete this streetwear look? This action removes files from firestore replica arrays permanently.
                  </p>
                </div>
                <div className="flex space-x-3 justify-center pt-2 font-label-caps text-xs tracking-widest">
                  <button
                    onClick={handleDeleteProductConfirmed}
                    className="bg-red-700 text-white py-3 px-6 hover:bg-red-800 transition uppercase font-semibold rounded-none"
                  >
                    DELETE
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="border border-outline-variant text-secondary py-3 px-6 hover:bg-slate-50 transition uppercase rounded-none"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ORDERS MANAGEMENT TABS */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-8">
          
          {/* Order sub-filters bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50 border border-outline-variant p-4">
            
            {/* Search */}
            <div className="relative w-full md:w-[320px] bg-white border border-outline-variant px-3 py-2 flex items-center md:h-11">
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Search orders, clients, emails..."
                className="bg-transparent border-none text-xs text-primary focus:outline-none w-full placeholder-zinc-400"
              />
              <Search className="w-4 h-4 text-secondary absolute right-3" />
            </div>

            {/* Status select */}
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-label-caps text-[9px] tracking-widest text-[#5d5f5f] uppercase">Filter Status</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-white border border-outline-variant py-2.5 px-4 text-xs font-label-caps tracking-widest rounded-none focus:outline-none focus:border-primary text-primary"
              >
                <option value="all">ALL ACTIVE STATUSES</option>
                <option value="Pending Payment">Pending Payment</option>
                <option value="Payment Received">Payment Received</option>
                <option value="Processing">Processing</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* List display */}
          <div className="border border-outline-variant overflow-x-auto bg-white">
            <table className="min-w-full divide-y divide-outline-variant text-left text-sm tracking-wide">
              <thead className="bg-surface-container-low font-label-caps text-[9px] tracking-widest uppercase text-secondary">
                <tr>
                  <th scope="col" className="px-6 py-4">Order Code</th>
                  <th scope="col" className="px-6 py-4">Client Detail</th>
                  <th scope="col" className="px-6 py-4">Date Recv</th>
                  <th scope="col" className="px-6 py-4">Quantity Total</th>
                  <th scope="col" className="px-6 py-4">Grand sum</th>
                  <th scope="col" className="px-6 py-4">Status Target Tracker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-xs text-primary">
                {filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    
                    {/* Order Code */}
                    <td className="px-6 py-4 font-mono font-semibold text-black">
                      {o.orderNumber}
                    </td>

                    {/* Customer Info */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-black uppercase">{o.customerName}</p>
                        <p className="font-mono text-[9px] text-[#5d5f5f]">{o.customerEmail}</p>
                        <p className="font-mono text-[9px] text-zinc-400">{o.customerPhone}</p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-[#5d5f5f]">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>

                    {/* Quantity Total */}
                    <td className="px-6 py-4 font-mono">
                      {o.items.reduce((acc, item) => acc + item.quantity, 0)} element(s)
                    </td>

                    {/* Grand sum */}
                    <td className="px-6 py-4 font-mono font-semibold text-black">
                      ₹{o.total.toLocaleString()}
                    </td>

                    {/* Status target tracker updater */}
                    <td className="px-6 py-4">
                      <select
                        value={o.status}
                        onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as any)}
                        className="bg-transparent border border-outline-variant py-1 px-2.5 text-[10px] font-label-caps tracking-wider rounded-none focus:outline-none focus:border-primary text-primary uppercase font-bold"
                      >
                        <option value="Pending Payment">Pending Payment</option>
                        <option value="Payment Received">Payment Received</option>
                        <option value="Processing">Processing</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-secondary font-mono text-xs">
                      No order directories match the search queries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMER MANAGEMENT TAB */}
      {activeAdminTab === 'customers' && (
        <div className="space-y-8">
          
          {/* Search trigger */}
          <div className="relative w-full md:w-[320px] bg-white border border-outline-variant px-3 py-2 flex items-center md:h-11">
            <input
              type="text"
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              placeholder="Search customers log by name / emails..."
              className="bg-transparent border-none text-xs text-primary focus:outline-none w-full placeholder-zinc-400"
            />
            <Search className="w-4 h-4 text-secondary absolute right-3" />
          </div>

          <div className="border border-outline-variant overflow-x-auto bg-white">
            <table className="min-w-full divide-y divide-outline-variant text-left text-sm tracking-wide">
              <thead className="bg-surface-container-low font-label-caps text-[9px] tracking-widest uppercase text-secondary">
                <tr>
                  <th scope="col" className="px-6 py-4">Client Look</th>
                  <th scope="col" className="px-6 py-4">Email Directory</th>
                  <th scope="col" className="px-6 py-4">Signal Phone</th>
                  <th scope="col" className="px-6 py-4">Registered Date</th>
                  <th scope="col" className="px-6 py-4">Order Count History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-xs text-primary">
                {filteredCustomers.map(usr => {
                  const custOrders = orders.filter(o => o.userId === usr.id);
                  const totalSpent = custOrders.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + o.total, 0);

                  return (
                    <tr key={usr.id} className="hover:bg-slate-50/50">
                      
                      <td className="px-6 py-4 font-semibold text-black uppercase">
                        {usr.firstName} {usr.lastName}
                      </td>

                      <td className="px-6 py-4 font-mono text-zinc-500">
                        {usr.email}
                      </td>

                      <td className="px-6 py-4 font-mono">
                        {usr.phone}
                      </td>

                      <td className="px-6 py-4 text-[#5d5f5f]">
                        {new Date(usr.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 font-mono">
                        <span className="font-bold text-primary">{custOrders.length} order(s)</span>
                        <span className="text-secondary block font-[9px] text-[10px]">(₹{totalSpent.toLocaleString()} accumulative)</span>
                      </td>

                    </tr>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-secondary font-mono text-xs">
                      No customer accounts logged on this device directory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
