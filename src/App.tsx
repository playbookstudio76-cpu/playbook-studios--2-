import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthView from './components/AuthView';
import HomeView from './components/HomeView';
import ShopView from './components/ShopView';
import ProductDetailView from './components/ProductDetailView';
import CartDrawer from './components/CartDrawer';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import PageDetailView from './components/PageDetailView';
import { UserProfile, Product, Order, CartItem, Category, AnnouncementBar, FloatingBanner, SocialConfig, StoreConfig, CustomPage } from './types';
import { 
  getCurrentUser, 
  logoutUser, 
  getAllProducts, 
  getAllOrders, 
  getAllUsers, 
  getAllCategories, 
  getCartForUser, 
  saveCartForUser, 
  createOrder, 
  updateOrderStatus, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  addCategory,
  getWhatsAppCheckoutUrl,
  startFirebaseSync,
  getAllAnnouncements,
  getAllBanners,
  getSocialConfig,
  getStoreConfig,
  getCustomPages
} from './storage';

export default function App() {
  // Global App States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<string>('home'); // home, shop, product, auth, dashboard, admin
  const [viewParams, setViewParams] = useState<Record<string, any>>({});
  
  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  
  // Storage Lists
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementBar[]>([]);
  const [banners, setBanners] = useState<FloatingBanner[]>([]);
  const [socialConfig, setSocialConfig] = useState<SocialConfig | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [pages, setPages] = useState<CustomPage[]>([]);
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);

  // Initialize App states from database
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Set lists initially from cache
    setProducts(getAllProducts());
    setOrders(getAllOrders());
    setUsers(getAllUsers());
    setCategories(getAllCategories());
    setAnnouncements(getAllAnnouncements());
    setBanners(getAllBanners());
    setSocialConfig(getSocialConfig());
    setStoreConfig(getStoreConfig());
    setPages(getCustomPages());

    // Connect to real-time remote Firebase tables
    const unsubSync = startFirebaseSync(() => {
      setProducts(getAllProducts());
      setOrders(getAllOrders());
      setUsers(getAllUsers());
      setCategories(getAllCategories());
      setAnnouncements(getAllAnnouncements());
      setBanners(getAllBanners());
      setSocialConfig(getSocialConfig());
      setStoreConfig(getStoreConfig());
      setPages(getCustomPages());
      
      // Keep currentUser reactively in sync on Auth changes
      const activeUser = getCurrentUser();
      setCurrentUser(activeUser);
    });

    // Resolve Hash-based or basic path navigation for dynamic iframe refresh resilience
    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      const cleanHash = hash.replace('#', '');
      const activeUser = getCurrentUser();
      
      if (cleanHash === 'home') {
        setCurrentView('home');
      } else if (cleanHash === 'shop') {
        setCurrentView('shop');
      } else if (cleanHash.startsWith('product?id=')) {
        const prodId = cleanHash.split('?id=')[1];
        if (prodId) {
          setCurrentView('product');
          setViewParams({ id: prodId });
        }
      } else if (cleanHash.startsWith('page?slug=')) {
        const pageSlug = cleanHash.split('?slug=')[1];
        if (pageSlug) {
          setCurrentView('page');
          setViewParams({ slug: pageSlug });
        }
      } else if (cleanHash === 'dashboard') {
        setCurrentView(activeUser ? 'dashboard' : 'auth');
      } else if (cleanHash === 'admin') {
        setCurrentView(activeUser?.role === 'admin' ? 'admin' : 'auth');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial trigger
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      if (unsubSync) unsubSync();
    };
  }, []);

  // Update Cart when user logs in or out
  useEffect(() => {
    if (currentUser) {
      setCartItems(getCartForUser(currentUser.id));
    } else {
      // Guest local-storage cart fallback
      setCartItems(getCartForUser('guest'));
    }
  }, [currentUser]);

  // Sync Cart items with permanent Storage and check bounds
  const updateCartStateAndPersist = (newItems: CartItem[]) => {
    setCartItems(newItems);
    const idKey = currentUser ? currentUser.id : 'guest';
    saveCartForUser(idKey, newItems);
  };

  // Navigates securely with window coordinates scroll resetting
  const handleNavigate = (view: string, extraParams: Record<string, any> = {}) => {
    setCurrentView(view);
    setViewParams(extraParams);
    
    // Hash updates to persist route history on iframe reloads
    if (view === 'product' && extraParams.id) {
      window.location.hash = `product?id=${extraParams.id}`;
    } else if (view === 'page' && extraParams.slug) {
      window.location.hash = `page?slug=${extraParams.slug}`;
    } else {
      window.location.hash = view;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Authentication flow success
  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    // Refresh listing counters
    setUsers(getAllUsers());
  };

  // Handle Logout session clearing
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    handleNavigate('home');
    showToast('Logged out securely from playbook session.', 'info');
  };

  // Bag Action 1: Add or increment items inside bag
  const handleAddToCart = (item: Omit<CartItem, 'id' | 'quantity'>, quantity: number) => {
    const compositeId = `${item.productId}_${item.size}_${item.color.replace('#', '')}`;
    
    const existingIdx = cartItems.findIndex(i => i.id === compositeId);
    let updated = [...cartItems];

    if (existingIdx !== -1) {
      const currentQty = updated[existingIdx].quantity;
      const proposedQty = currentQty + quantity;
      
      if (proposedQty <= item.stock) {
        updated[existingIdx].quantity = proposedQty;
        showToast(`Incremented look in bag index. Total: ${proposedQty}`, 'success');
      } else {
        showToast(`Sorry, you have exceeded the maximum available studio stock of ${item.stock} for this size/color.`, 'error');
        return;
      }
    } else {
      updated.push({
        ...item,
        id: compositeId,
        quantity,
      });
      showToast('Streetwear garment styled and added to bag.', 'success');
    }

    updateCartStateAndPersist(updated);
    // Auto slide-open the gorgeous cart drawer so they feel immediate visual confirmation!
    setCartOpen(true);
  };

  // Bag Action 2: Update exact number from cart drawer
  const handleUpdateQuantity = (itemId: string, qty: number) => {
    const target = cartItems.find(i => i.id === itemId);
    if (!target) return;

    if (qty > target.stock) {
      showToast(`Limit reached: Maximum available studio stock is ${target.stock}.`, 'error');
      return;
    }

    const updated = cartItems.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: qty };
      }
      return item;
    });

    updateCartStateAndPersist(updated);
  };

  // Bag Action 3: Remove look entirely
  const handleRemoveItem = (itemId: string) => {
    const updated = cartItems.filter(i => i.id !== itemId);
    updateCartStateAndPersist(updated);
  };

  // Checkout process: Converts Cart into real Order record & triggers WhatsApp opens!
  const handleCheckoutSubmit = (deliveryAddress: string) => {
    if (!currentUser) {
      showToast('Sign-In Authentication is required to allocate dynamic order numbers.', 'error');
      handleNavigate('auth');
      setCartOpen(false);
      return;
    }

    if (cartItems.length === 0) {
      showToast('Your bag is currently empty.', 'info');
      return;
    }

    const completeAddressStr = deliveryAddress.trim() || 'No verified terminal address allocated. Standard Studio pickup.';
    const clientPhone = currentUser.phone || '+1 (555) 019-2834';

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = 0;
    const total = subtotal;

    // Create the finalized Order record
    const newOrder = createOrder(
      currentUser.id,
      `${currentUser.firstName} ${currentUser.lastName}`,
      currentUser.email,
      clientPhone,
      completeAddressStr,
      cartItems,
      subtotal,
      shipping,
      total
    );

    // Refresh database lists
    setOrders(getAllOrders());
    setProducts(getAllProducts()); // update stock views immediately!
    setCartItems([]); // clear UI state
    setCartOpen(false); // close drawer

    // Navigate them directly to their Orders History board! (Screenshot 5 visual)
    handleNavigate('dashboard');
    showToast(`Order #${newOrder.orderNumber} created! Redirecting to confirm payment on WhatsApp...`, 'success');

    // Automatic trigger to launch WhatsApp desktop/mobile with parsed templates!
    const waUrl = getWhatsAppCheckoutUrl(newOrder);
    window.open(waUrl, '_blank');
  };

  // Instant checkout button directly from dynamic product templates
  const handleInstantBuyNowWhatsApp = (
    itemData: Omit<CartItem, 'id' | 'quantity'>,
    size: string,
    color: string,
    qty: number,
    deliveryAddress: string
  ) => {
    if (!currentUser) {
      showToast('Please create or login to your customer account to authorize WhatsApp checkouts.', 'info');
      handleNavigate('auth');
      return;
    }

    const finalAddressStr = deliveryAddress.trim() || "No verified address allocated.";

    const subtotal = itemData.price * qty;
    const shipping = 0;
    const total = subtotal;

    const dummyItem: CartItem = {
      id: `${itemData.productId}_${size}_${color.replace('#', '')}`,
      ...itemData,
      size,
      color,
      quantity: qty
    };

    const customOrder = createOrder(
      currentUser.id,
      `${currentUser.firstName} ${currentUser.lastName}`,
      currentUser.email,
      currentUser.phone,
      finalAddressStr,
      [dummyItem],
      subtotal,
      shipping,
      total
    );

    // Refresh db view states
    setOrders(getAllOrders());
    setProducts(getAllProducts());
    setCartItems([]);

    handleNavigate('dashboard');
    
    // Redirect to WhatsApp
    const waUrl = getWhatsAppCheckoutUrl(customOrder);
    window.open(waUrl, '_blank');
  };

  // Admin Studio triggers: Write back and refresh list states
  const handleAdminAddProduct = async (prodData: Omit<Product, 'id' | 'createdAt'>) => {
    await addProduct(prodData);
    setProducts(getAllProducts()); // refresh state
  };

  const handleAdminUpdateProduct = async (id: string, updatedData: Partial<Product>) => {
    await updateProduct(id, updatedData);
    setProducts(getAllProducts());
  };

  const handleAdminDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    setProducts(getAllProducts());
  };

  const handleAdminOrderStatus = (orderId: string, status: Order['status']) => {
    updateOrderStatus(orderId, status);
    setOrders(getAllOrders());
  };

  const handleAdminAddCategory = async (name: string, imageUrl?: string) => {
    await addCategory(name, imageUrl);
    setCategories(getAllCategories());
  };

  // Derived Values
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  // Related Look Selection Generator
  const selectedProductForViews = useMemo(() => {
    if (currentView === 'product' && viewParams.id) {
      return products.find(p => p.id === viewParams.id) || null;
    }
    return null;
  }, [currentView, viewParams, products]);

  const relatedProductsList = useMemo(() => {
    if (selectedProductForViews) {
      return products.filter(
        p => p.id !== selectedProductForViews.id && p.category === selectedProductForViews.category
      );
    }
    return [];
  }, [selectedProductForViews, products]);

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans select-none antialiased">
      
      {/* GLOBAL ANNOUNCEMENT BARS (Admin-managed) */}
      {announcements.filter(a => a.isActive).map(ann => (
        <div 
          key={ann.id}
          style={{ backgroundColor: ann.backgroundColor, color: ann.textColor }}
          className="w-full text-center py-2 px-4 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest transition-all z-50 relative border-b border-white/5"
        >
          {ann.text}
        </div>
      ))}

      {/* 1. BRAND GLOBAL HEADER */}
      <Header
        currentUser={currentUser}
        cartCount={totalCartCount}
        onNavigate={handleNavigate}
        onOpenCart={() => setCartOpen(true)}
        onLogout={handleLogout}
        currentView={currentView}
      />

      {/* 2. DYNAMIC CONTENT MAIN ROUTER CANVAS */}
      <main className="flex-grow flex flex-col animate-fade-in relative">
        
        {currentView === 'home' && (
          <HomeView 
            products={products} 
            onNavigate={handleNavigate} 
            socialConfig={socialConfig}
            categories={categories}
            storeConfig={storeConfig}
          />
        )}

        {currentView === 'shop' && (
          <ShopView
            products={products}
            onNavigate={handleNavigate}
            initialFilters={viewParams}
          />
        )}

        {currentView === 'product' && selectedProductForViews ? (
          <ProductDetailView
            product={selectedProductForViews}
            relatedProducts={relatedProductsList.length ? relatedProductsList : products.filter(p => p.id !== selectedProductForViews.id)}
            onAddToCart={handleAddToCart}
            onNavigate={handleNavigate}
            onQuickCheckoutViaWhatsApp={handleInstantBuyNowWhatsApp}
            currentUser={currentUser}
            showToast={showToast}
          />
        ) : currentView === 'product' ? (
          <div className="flex-grow flex flex-col items-center justify-center p-20 text-center space-y-4">
            <p className="font-mono text-xs text-secondary">LOOK ARCHIVE STACK LOST</p>
            <h3 className="font-headline-sm text-base text-primary">GARMENT STANDARD NOT LOCATED</h3>
            <button
              onClick={() => handleNavigate('shop')}
              className="bg-primary text-on-primary text-xs font-label-caps px-6 py-2.5 uppercase tracking-widest rounded-none"
            >
              Shop All
            </button>
          </div>
        ) : null}

        {currentView === 'auth' && (
          <AuthView
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleNavigate}
            storeConfig={storeConfig}
          />
        )}

        {currentView === 'dashboard' && currentUser && (
          <CustomerDashboard
            currentUser={currentUser}
            orders={orders.filter(o => o.userId === currentUser.id)}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onUpdateUser={(usr) => setCurrentUser(usr)}
            initialTab={viewParams?.tab as any}
          />
        )}

        {currentView === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard
            products={products}
            orders={orders}
            users={users}
            categories={categories}
            onAddProduct={handleAdminAddProduct}
            onUpdateProduct={handleAdminUpdateProduct}
            onDeleteProduct={handleAdminDeleteProduct}
            onUpdateOrderStatus={handleAdminOrderStatus}
            onAddCategory={handleAdminAddCategory}
          />
        )}

        {currentView === 'page' && (
          <PageDetailView
            slug={viewParams.slug || 'sustainability'}
            pages={pages}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* FLOATING BANNERS (Admin-managed) */}
      {banners.filter(b => b.isActive && !window.sessionStorage.getItem(`dismiss_banner_${b.id}`)).map(ban => {
        // Map positions to tailwind coordinates
        let posClass = "bottom-6 right-6";
        if (ban.position === "bottom-left") posClass = "bottom-6 left-6";
        else if (ban.position === "top-right") posClass = "top-24 right-6";
        else if (ban.position === "top-left") posClass = "top-24 left-6";

        return (
          <div 
            key={ban.id}
            className={`fixed ${posClass} z-50 max-w-sm bg-white border border-outline-variant p-6 shadow-xl flex flex-col space-y-3 transition-all duration-300 transform scale-100`}
          >
            <div className="flex justify-between items-start">
              <span className="font-mono text-[9px] bg-zinc-100 text-primary px-2.5 py-0.5 uppercase tracking-widest font-semibold">
                ALERT
              </span>
              <button 
                onClick={() => {
                  window.sessionStorage.setItem(`dismiss_banner_${ban.id}`, 'true');
                  // Trigger a rerender of banners state to hide dismissed ones
                  setBanners(prev => prev.filter(b => b.id !== ban.id));
                }}
                className="text-secondary hover:text-primary transition text-xs font-bold font-mono tracking-wider uppercase ml-4"
              >
                ✕ CLOSE
              </button>
            </div>
            
            <h4 className="font-display-lg text-sm font-bold text-primary uppercase tracking-tight">
              {ban.title}
            </h4>
            <p className="font-sans text-xs text-secondary leading-relaxed">
              {ban.text}
            </p>
            
            {ban.linkUrl && ban.linkUrl !== '#' && (
              <a 
                href={ban.linkUrl} 
                onClick={(e) => {
                  if (ban.linkUrl?.startsWith('#')) {
                    e.preventDefault();
                    handleNavigate(ban.linkUrl.replace('#', ''));
                  }
                }}
                className="inline-block text-center bg-primary text-on-primary font-button-text text-[10px] uppercase tracking-widest py-2.5 px-4 hover:bg-opacity-90 transition font-bold"
              >
                {ban.linkUrl.startsWith('#') ? `EXPLORE` : `OPEN LINK`}
              </a>
            )}
          </div>
        );
      })}

      {/* 4. PERSISTENT BAG CHASSIS DRAWER OVERLAY */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckoutSubmit}
        currentUser={currentUser}
      />

      {/* 5. BRAND GLOBAL FOOTER */}
      <Footer onNavigate={handleNavigate} pages={pages} />

      {/* 6. CUSTOM PREMIUM FLOATING TOASTS NOTIFICATIONS */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => {
          let bgClass = "bg-zinc-900 border-zinc-700 text-white shadow-[0_8px_30px_rgb(0,0,0,0.36)]";
          if (toast.type === 'success') bgClass = "bg-emerald-950 border-emerald-800 text-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,0.15)]";
          if (toast.type === 'error') bgClass = "bg-rose-950 border-rose-900 text-rose-200 shadow-[0_8px_30px_rgba(244,63,94,0.15)]";
          return (
            <div
              key={toast.id}
              className={`${bgClass} border p-4 flex items-start gap-3 pointer-events-auto transition-all duration-300 transform translate-y-0 opacity-100 font-mono text-[10px] uppercase tracking-widest font-semibold border-l-4`}
              style={{ borderLeftColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#f43f5e' : '#ffffff' }}
            >
              <span className="flex-grow leading-relaxed">{toast.message}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="hover:opacity-80 transition font-bold shrink-0 ml-1 text-xs"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
