import React, { useState, useMemo, useEffect } from 'react';
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
  FolderPlus,
  Mail,
  Link2,
  Send,
  Smartphone,
  Volume2,
  Tags,
  Sliders,
  UserPlus,
  Shield,
  MessageSquare,
  Lock,
  ThumbsUp
} from 'lucide-react';
import { Product, Order, UserProfile, Category, Coupon, FloatingBanner, AnnouncementBar, SocialConfig, WhatsAppConfig, TeamMember, NewsletterEmail, UserWallet, StoreConfig, WalletAndProfitSettings } from '../types';
import { 
  getCurrentUser,
  getAllAnnouncements, saveAnnouncement, deleteAnnouncement,
  getAllBanners, saveBanner, deleteBanner,
  getSocialConfig, saveSocialConfig,
  getWhatsAppConfig, saveWhatsAppConfig,
  getAllCoupons, saveCoupon, deleteCoupon,
  getAllTeamMembers, saveTeamMember, deleteTeamMember,
  getAllNewsletterEmails, deleteNewsletterEmail, addNewsletterEmail,
  getAllWallets, saveWalletRaw, updateUserWallet,
  getStoreConfig, saveStoreConfig,
  getWalletAndProfitSettings, saveWalletAndProfitSettings
} from '../storage';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  users: UserProfile[];
  categories: Category[];
  onAddProduct: (prod: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProduct: (id: string, updated: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onAddCategory: (name: string, imageUrl?: string) => Promise<void>;
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
  const [activeAdminTab, setActiveAdminTab] = useState<
    | 'metrics'
    | 'products'
    | 'orders'
    | 'customers'
    | 'categories'
    | 'banners'
    | 'coupons'
    | 'socials'
    | 'merch_mail'
    | 'whatsapp'
    | 'announcements'
    | 'team_members'
    | 'wallets'
    | 'store_config'
  >('metrics');

  // Product modal / forms trigger
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // New Category trigger
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');

  // Layout branding configuration
  const [layoutHeroUrl, setLayoutHeroUrl] = useState('');
  const [layoutAuthUrl, setLayoutAuthUrl] = useState('');
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  // Load Layout Configuration setting
  useEffect(() => {
    const config = getStoreConfig();
    if (config) {
      setLayoutHeroUrl(config.heroImageUrl || '');
      setLayoutAuthUrl(config.authImageUrl || '');
    }
  }, []);

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

  // --- SUB-STATES FOR THE NEWLY SUPPORTED ADMIN MODULES ---
  
  // 1. Floating Banners
  const [bannersList, setBannersList] = useState<FloatingBanner[]>(() => getAllBanners());
  const [banTitle, setBanTitle] = useState('');
  const [banText, setBanText] = useState('');
  const [banLink, setBanLink] = useState('');
  const [banPos, setBanPos] = useState<FloatingBanner['position']>('bottom-right');
  const [banActive, setBanActive] = useState(true);

  // 2. Coupons List
  const [couponsList, setCouponsList] = useState<Coupon[]>(() => getAllCoupons());
  const [cpCode, setCpCode] = useState('');
  const [cpType, setCpType] = useState<'percent' | 'fixed'>('percent');
  const [cpVal, setCpVal] = useState<number>(15);
  const [cpActive, setCpActive] = useState(true);
  const [cpSelectedProduct, setCpSelectedProduct] = useState<string>(''); // specific product discount

  // 3. Social config state
  const [socialConfig, setSocialConfig] = useState<SocialConfig>(() => getSocialConfig());
  const [scInsta, setScInsta] = useState(socialConfig.instagram || '');
  const [scTwitter, setScTwitter] = useState(socialConfig.twitter || '');
  const [scYoutube, setScYoutube] = useState(socialConfig.youtube || '');
  const [scFB, setScFB] = useState(socialConfig.facebook || '');
  const [scPin, setScPin] = useState(socialConfig.pinterest || '');
  const [scInstaImages, setScInstaImages] = useState<string[]>(() => socialConfig.instagramImages || []);

  // 4. WhatsApp support config
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(() => getWhatsAppConfig());
  const [waPhone, setWaPhone] = useState(waConfig.phoneNumber || '');
  const [waMsg, setWaMsg] = useState(waConfig.prefilledMessageText || '');
  const [waEnabled, setWaEnabled] = useState(waConfig.isEnabled !== false);

  // 5. Announcement bars
  const [announcementsList, setAnnouncementsList] = useState<AnnouncementBar[]>(() => getAllAnnouncements());
  const [annText, setAnnText] = useState('');
  const [annActive, setAnnActive] = useState(true);
  const [annBgCol, setAnnBgCol] = useState('#1D4ED8');
  const [annTxtCol, setAnnTxtCol] = useState('#FFFFFF');

  // 6. Campaign Broadcast newsletters (Merch mail)
  const [newsletterEmails, setNewsletterEmails] = useState<NewsletterEmail[]>(() => getAllNewsletterEmails());
  const [emailSubject, setEmailSubject] = useState('🔥 NEW ATHLETIC streetwear DROP AT PLAYBOOK STUDIOS 🔥');
  const [emailBody, setEmailBody] = useState(`Hey Playbook Fam,

We are dropping our highly anticipated Winter Atelier collection next week!
As our valued customer, we've loaded a direct ₹300 signup bonus to your dynamic web wallet.

Use your points and special code PB15 together at checkout for 15% off.

Stay tuned,
The Playbook Studios Atelier Team`);
  const [emailGroupFilter, setEmailGroupFilter] = useState<'all' | 'prior' | 'community'>('all');
  const [campaignLogs, setCampaignLogs] = useState<string[]>(['[System Info] Merch Mail campaign roster active.', '[Historical Logs] Welcome campaign broadcasted on initial platform boot. Recipient count: 18']);
  const [isBroadcastingCampaign, setIsBroadcastingCampaign] = useState(false);

  // 7. Team management (limited roles and access permissions)
  const [teamList, setTeamList] = useState<TeamMember[]>(() => getAllTeamMembers());
  const [tmName, setTmName] = useState('');
  const [tmEmail, setTmEmail] = useState('');
  const [tmRole, setTmRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [tmPermissions, setTmPermissions] = useState<string[]>(['products', 'coupons']);

  // 8. Stores client side Wallets ledger
  const [walletsList, setWalletsList] = useState<UserWallet[]>(() => getAllWallets());
  const [selectedWalletUser, setSelectedWalletUser] = useState<string | null>(null);
  const [walletTxAmount, setWalletTxAmount] = useState<number>(100);
  const [walletTxDesc, setWalletTxDesc] = useState('🎁 Special Promotional Airdrop Reward');

  // Wallet and Profit settings configuration state
  const [wpSettings, setWpSettings] = useState<WalletAndProfitSettings>(() => getWalletAndProfitSettings());

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
    setFormImagesText('');
    setFormSizes(['S', 'M', 'L']);
    setFormColors(['#0A0A0A', '#EAEAEA']);
    setIsAddingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
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

    setIsSavingCloud(true);
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, productPayload);
        alert('🎉 CONFIRMATION: Product has been successfully updated and synchronized globally in Firestore!');
      } else {
        await onAddProduct(productPayload);
        alert('🎉 CONFIRMATION: Product has been successfully uploaded, created, and published to the Firestore catalog!');
      }
      setIsAddingProduct(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error(err);
      alert(`❌ ERROR UPLOADING PRODUCT: ${err.message || 'Check connection or user authentication permission.'}`);
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleDeleteProductConfirmed = async () => {
    if (deleteConfirmId) {
      setIsSavingCloud(true);
      try {
        await onDeleteProduct(deleteConfirmId);
        setDeleteConfirmId(null);
        alert('🗑️ CONFIRMATION: Streetwear element has been deleted successfully from Firestore catalog.');
      } catch (err: any) {
        console.error(err);
        alert(`❌ ERROR DELETING PRODUCT: ${err.message || 'Check permissions.'}`);
      } finally {
        setIsSavingCloud(false);
      }
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

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSavingCloud(true);
    try {
      await onAddCategory(newCatName.trim(), newCatImageUrl.trim() || undefined);
      setNewCatName('');
      setNewCatImageUrl('');
      setIsAddingCategory(false);
      alert('🎉 CONFIRMATION: New category has been successfully synchronized to Firestore!');
    } catch (err: any) {
      console.error(err);
      alert(`❌ ERROR CREATING CATEGORY: ${err.message || 'Check connection or user admin permission.'}`);
    } finally {
      setIsSavingCloud(false);
    }
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

  const currentUser = getCurrentUser();
  const currentEmail = currentUser?.email || 'playbookstudio76@gmail.com';

  return (
    <div className="flex-grow max-w-[1440px] mx-auto px-4 md:px-[64px] py-[64px] font-body-md text-on-background">
      
      {/* Cloud Synchronizing Overlay */}
      {isSavingCloud && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-[3px] z-[9999] flex flex-col items-center justify-center p-4">
          <div className="bg-white border border-outline-variant p-8 flex flex-col items-center max-w-sm text-center shadow-xl">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-4" />
            <p className="font-display-sm text-[16px] tracking-widest font-bold uppercase text-primary animate-pulse">
              SYNCING WITH CLOUD...
            </p>
            <p className="font-mono text-[10px] text-zinc-500 uppercase mt-2">
              Streaming streetwear structural records securely to Firestore database hubs
            </p>
          </div>
        </div>
      )}

      {/* Title bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant pb-6 mb-10 gap-4">
        <div>
          <h1 className="font-display-lg text-[28px] md:text-[36px] tracking-tight text-primary uppercase font-bold">
            PLAYBOOK STUDIOS ADMIN
          </h1>
          <p className="font-mono text-xs text-secondary mt-1 uppercase tracking-widest">
            Logged in as administrative security terminal: {currentEmail}
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
              <div>
                <label className="font-label-caps text-[9px] text-secondary tracking-wider block mb-1">Category Image (Cloudinary or Direct URL)</label>
                <input
                  type="text"
                  value={newCatImageUrl}
                  onChange={(e) => setNewCatImageUrl(e.target.value)}
                  placeholder="Paste image link or upload below..."
                  className="bg-zinc-50 border border-outline-variant p-2 w-full text-xs focus:outline-none focus:border-primary rounded-none mb-2"
                />
                
                <div className="border border-dashed border-zinc-300 p-4 bg-zinc-50 text-center hover:bg-zinc-100 transition duration-300">
                  <input
                    type="file"
                    accept="image/*"
                    id="cat-image-modal-uploader"
                    className="hidden"
                    disabled={isSavingCloud}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setIsSavingCloud(true);
                      try {
                        const file = files[0];
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('upload_preset', cloudinaryPreset);
                        formData.append('cloud_name', 'df4qsb2lr');
                        
                        const response = await fetch(
                          `https://api.cloudinary.com/v1_1/df4qsb2lr/image/upload`,
                          { method: 'POST', body: formData }
                        );
                        if (!response.ok) {
                          throw new Error('Upload failed. Status: ' + response.status);
                        }
                        const data = await response.json();
                        if (data.secure_url) {
                          setNewCatImageUrl(data.secure_url);
                          alert('🎉 Category image uploaded to Cloudinary successfully!');
                        }
                      } catch (err: any) {
                        alert('Cloudinary upload failure: ' + (err.message || err));
                      } finally {
                        setIsSavingCloud(false);
                      }
                    }}
                  />
                  <label htmlFor="cat-image-modal-uploader" className="cursor-pointer text-[10px] font-mono uppercase tracking-widest text-[#5d5f5f] font-semibold hover:text-black block">
                    {isSavingCloud ? "⚡ Processing Upload..." : "↑ Upload File via Cloudinary"}
                  </label>
                </div>
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
      <div className="flex flex-wrap border-b border-outline-variant font-label-caps text-[10px] tracking-widest uppercase mb-10 text-secondary gap-x-1.5 gap-y-1.5">
        {[
          { id: 'metrics', name: 'Metrics', icon: <BarChart className="w-3.5 h-3.5" /> },
          { id: 'products', name: 'Products', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'orders', name: 'Orders', icon: <PackageCheck className="w-3.5 h-3.5" /> },
          { id: 'customers', name: 'Customers', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'categories', name: 'Categories', icon: <FolderPlus className="w-3.5 h-3.5" /> },
          { id: 'banners', name: 'Banners', icon: <Sliders className="w-3.5 h-3.5" /> },
          { id: 'coupons', name: 'Coupons', icon: <Tags className="w-3.5 h-3.5" /> },
          { id: 'announcements', name: 'Bars', icon: <Volume2 className="w-3.5 h-3.5" /> },
          { id: 'socials', name: 'Socials', icon: <Link2 className="w-3.5 h-3.5" /> },
          { id: 'whatsapp', name: 'WhatsApp', icon: <Smartphone className="w-3.5 h-3.5" /> },
          { id: 'merch_mail', name: 'Merch Mail', icon: <Mail className="w-3.5 h-3.5" /> },
          { id: 'team_members', name: 'Team', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'wallets', name: 'Wallets', icon: <Coins className="w-3.5 h-3.5" /> },
          { id: 'store_config', name: 'Layout Style', icon: <Sliders className="w-3.5 h-3.5" /> }
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
                  <label className="font-label-caps text-[9px] text-secondary tracking-widest block uppercase mb-1">Uploaded Image URLs (Populated via Cloudinary Only)</label>
                  <input
                    type="text"
                    required
                    readOnly={true}
                    value={formImagesText}
                    onChange={(e) => setFormImagesText(e.target.value)}
                    placeholder="No images uploaded yet. Drop or browse images above to upload via Cloudinary."
                    className="border-b border-outline-variant focus:outline-none w-full pb-2 pt-1 text-sm bg-neutral-100/50 cursor-not-allowed rounded-none text-secondary font-mono px-2"
                  />
                  <span className="font-mono text-[8px] text-[#2563EB] block mt-1 uppercase font-semibold">🔒 Upload Restriction: Images must be securely uploaded through the Cloudinary uploader panel above.</span>
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

      {/* 1. CATEGORIES MANAGEMENT PANEL */}
      {activeAdminTab === 'categories' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-outline-variant pb-4">
            <div>
              <h1 className="font-display-lg text-2xl tracking-tight text-primary uppercase font-medium">Category Architecture</h1>
              <p className="font-body-md text-xs text-secondary mt-1">Classify and segment your streetwear products index directory.</p>
            </div>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="bg-primary text-on-primary font-button-text text-xs uppercase px-5 py-3 tracking-widest hover:opacity-95 transition"
            >
              + Create Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map(cat => {
              const count = products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase() || p.category.toLowerCase() === cat.id).length;
              return (
                <div key={cat.id} className="border border-outline-variant p-6 bg-white space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    {cat.imageUrl ? (
                      <div className="w-full aspect-[2/1] overflow-hidden bg-zinc-100 border border-outline-variant">
                        <img 
                          src={cat.imageUrl} 
                          alt={cat.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center" 
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[2/1] bg-zinc-50 border border-dashed border-outline-variant flex items-center justify-center">
                        <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">NO IMAGE ASSIGNED</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest block">ID: {cat.id}</span>
                      <h3 className="font-display-lg text-lg font-bold text-primary uppercase">{cat.name}</h3>
                      <p className="font-mono text-xs text-secondary">{count} Active Product(s)</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (count > 0) {
                          alert("Cannot delete a category that has active products assigned.");
                          return;
                        }
                        if (confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
                          // Call clean deletion
                          import('../storage').then(m => {
                            m.deleteCategory(cat.id).then(() => {
                              alert("Category deleted successfully.");
                            });
                          });
                        }
                      }}
                      className="text-red-600 hover:text-red-700 font-mono text-xs uppercase tracking-wider font-semibold"
                    >
                      Delete Category
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. FLOATING BANNERS MANAGEMENT PANEL */}
      {activeAdminTab === 'banners' && (
        <div className="space-y-8">
          <div className="border-b border-outline-variant pb-4">
            <h1 className="font-display-lg text-2xl tracking-tight text-primary uppercase font-medium">Floating Banners Manager</h1>
            <p className="font-body-md text-xs text-secondary mt-1">Toggle eye-catching pop-ups on the web interface footer coordinate rails.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Admin Forms addition */}
            <div className="border border-outline-variant p-6 bg-surface-container-lowest space-y-4">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary">Deploy Floating Banner</h3>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-secondary uppercase text-[10px] block">Banner Caption Title</label>
                  <input
                     type="text"
                     placeholder="e.g. EARLY ACCESS CODE"
                     value={banTitle}
                     onChange={(e) => setBanTitle(e.target.value)}
                     className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-secondary uppercase text-[10px] block">Promotional Message Body</label>
                  <textarea
                     placeholder="Register today and receive free ₹300 credits immediately!"
                     value={banText}
                     onChange={(e) => setBanText(e.target.value)}
                     className="bg-white border border-outline-variant p-2 w-full h-24 focus:outline-none focus:ring-0 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-secondary uppercase text-[10px] block">CTA Redirect Link URL</label>
                  <input
                     type="text"
                     placeholder="e.g. #join, /shop"
                     value={banLink}
                     onChange={(e) => setBanLink(e.target.value)}
                     className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-secondary uppercase text-[10px] block">Corner Position placement</label>
                  <select
                     value={banPos}
                     onChange={(e: any) => setBanPos(e.target.value)}
                     className="bg-white border border-outline-variant p-2 w-full h-9 focus:outline-none"
                  >
                    <option value="bottom-right">Bottom Right Corner</option>
                    <option value="bottom-left">Bottom Left Corner</option>
                    <option value="top-right">Top Right Corner</option>
                    <option value="top-left">Top Left Corner</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                     type="checkbox"
                     id="chk_ban_active"
                     checked={banActive}
                     onChange={(e) => setBanActive(e.target.checked)}
                     className="w-4 h-4 border-outline-variant text-primary focus:ring-0"
                  />
                  <label htmlFor="chk_ban_active" className="text-secondary uppercase text-[10px] cursor-pointer">Active and visible</label>
                </div>
              </div>

              <button
                 onClick={async () => {
                   if (!banTitle.trim() || !banText.trim()) {
                     alert("Please fill in the banner parameters.");
                     return;
                   }
                   const newB: FloatingBanner = {
                     id: "ban_" + Math.random().toString(36).substr(2, 9),
                     title: banTitle.trim(),
                     text: banText.trim(),
                     linkUrl: banLink.trim() || '#',
                     isActive: banActive,
                     position: banPos,
                     createdAt: new Date().toISOString()
                   };
                   await saveBanner(newB);
                   setBannersList(getAllBanners());
                   setBanTitle('');
                   setBanText('');
                   setBanLink('');
                   alert("Banner saved and deployed successfully!");
                 }}
                 className="w-full bg-primary text-on-primary text-xs uppercase py-3 font-semibold tracking-widest hover:opacity-90 transition"
              >
                Save Banner Element
              </button>
            </div>

            {/* Dynamic banners showcase list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-secondary border-b border-outline-variant pb-2">Active Banners</h3>
              {bannersList.length > 0 ? (
                <div className="divide-y divide-outline-variant border border-outline-variant bg-white">
                  {bannersList.map(ban => (
                    <div key={ban.id} className="p-5 flex justify-between items-start hover:bg-zinc-50 transition">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${ban.isActive ? 'bg-green-500' : 'bg-zinc-300'}`} />
                          <h4 className="font-display-lg text-sm font-bold text-primary uppercase">{ban.title}</h4>
                        </div>
                        <p className="text-xs text-secondary leading-relaxed max-w-lg">{ban.text}</p>
                        <div className="flex items-center space-x-3 text-[10px] font-mono text-zinc-400">
                          <span className="bg-surface-container px-2 py-0.5">{ban.position}</span>
                          <span>Link: {ban.linkUrl}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                           onClick={async () => {
                             const updated = { ...ban, isActive: !ban.isActive };
                             await saveBanner(updated);
                             setBannersList(getAllBanners());
                           }}
                           className="font-mono text-[10px] uppercase text-primary border border-outline-variant px-3 py-1 hover:bg-slate-50 block w-full text-center"
                        >
                          {ban.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                           onClick={async () => {
                             if (confirm("Delete this banner?")) {
                               await deleteBanner(ban.id);
                               setBannersList(getAllBanners());
                             }
                           }}
                           className="font-mono text-[10px] uppercase text-red-600 block w-full text-center hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-secondary font-mono text-xs border border-dashed border-outline-variant">
                  No floating banners created.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. COUPONS MANAGEMENT PANEL */}
      {activeAdminTab === 'coupons' && (
        <div className="space-y-8">
          <div className="border-b border-outline-variant pb-4">
            <h1 className="font-display-lg text-2xl tracking-tight text-primary uppercase font-medium">Coupon Suite</h1>
            <p className="font-body-md text-xs text-secondary mt-1">Configure fixed or percentage rate promo coupon codes with specific items exclusion traits.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Insertion form */}
            <div className="border border-outline-variant p-6 bg-surface-container-lowest space-y-4 font-mono text-xs">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary font-sans">Craft Promotion Rule</h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-secondary text-[10px] uppercase block font-bold">Coupon Code</label>
                  <input
                     type="text"
                     placeholder="e.g. WINTER30"
                     value={cpCode}
                     onChange={(e) => setCpCode(e.target.value.toUpperCase().trim())}
                     className="bg-white border border-outline-variant p-2 w-full uppercase focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-secondary text-[10px] uppercase block">Discount Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                       onClick={() => setCpType('percent')}
                       className={`p-2 border font-bold text-center ${cpType === 'percent' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant bg-white text-secondary'}`}
                    >
                      % Percentage
                    </button>
                    <button
                       onClick={() => setCpType('fixed')}
                       className={`p-2 border font-bold text-center ${cpType === 'fixed' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant bg-white text-secondary'}`}
                    >
                      Fixed Rate (₹)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-secondary text-[10px] uppercase block">Discount Value ({cpType === 'percent' ? '%' : '₹'})</label>
                  <input
                     type="number"
                     placeholder="e.g. 15"
                     value={cpVal}
                     onChange={(e) => setCpVal(parseFloat(e.target.value) || 0)}
                     className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                  />
                </div>

                <div className="space-y-1 font-sans">
                  <label className="text-secondary text-[10px] uppercase block font-mono">Applicable Item specific restrictor (Optional)</label>
                  <select
                     value={cpSelectedProduct}
                     onChange={(e) => setCpSelectedProduct(e.target.value)}
                     className="bg-white border border-outline-variant p-2 w-full h-9 focus:outline-none text-xs"
                  >
                    <option value="">-- Apply to Complete Order --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Atelier ID: {p.id.substr(0, 5)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                 onClick={async () => {
                   if (!cpCode.trim() || cpVal <= 0) {
                     alert("Please input coupon codename and non-zero discount values.");
                     return;
                   }
                   const targetPr = cpSelectedProduct ? products.find(p => p.id === cpSelectedProduct) : undefined;
                   const newCp: Coupon = {
                     id: "cp_" + Math.random().toString(36).substr(2, 9),
                     code: cpCode.trim().toUpperCase(),
                     discountType: cpSelectedProduct ? 'product_specific' : cpType as 'fixed' | 'percent',
                     discountValue: cpVal,
                     isActive: cpActive,
                     targetProductId: cpSelectedProduct || undefined,
                     createdAt: new Date().toISOString()
                   };
                   await saveCoupon(newCp);
                   setCouponsList(getAllCoupons());
                   setCpCode('');
                   setCpVal(15);
                   setCpSelectedProduct('');
                   alert("Coupon created successfully and registered inside active indexes!");
                 }}
                 className="w-full bg-primary text-on-primary text-xs uppercase py-3 font-semibold tracking-widest hover:opacity-90 transition font-sans"
              >
                Register Coupon Code
              </button>
            </div>

            {/* Existing coupons list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-secondary border-b border-outline-variant pb-2">Active Promotional Coupons</h3>
              
              {couponsList.length > 0 ? (
                <div className="border border-outline-variant bg-white overflow-hidden">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant text-[10px] tracking-widest text-secondary font-bold uppercase">
                        <th className="p-4">Promo Campaign Code</th>
                        <th className="p-4">Value Offer</th>
                        <th className="p-4">Scope Scope</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {couponsList.map(cp => (
                        <tr key={cp.id} className="hover:bg-zinc-50/55 transition">
                          <td className="p-4 font-bold text-primary font-sans text-sm tracking-tight">{cp.code}</td>
                          <td className="p-4 text-primary font-semibold">
                            {cp.discountType === 'percent' ? `${cp.discountValue}% Off` : `₹${cp.discountValue.toLocaleString()} Deduct`}
                          </td>
                          <td className="p-4 text-secondary">
                            {cp.specificProductName ? (
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 border border-amber-200">
                                Exclusive: {cp.specificProductName}
                              </span>
                            ) : (
                              <span className="text-slate-500 bg-slate-100 px-2 py-0.5">Global Cart</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${cp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {cp.isActive ? 'Live' : 'Off'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                               onClick={async () => {
                                 const updated = { ...cp, isActive: !cp.isActive };
                                 await saveCoupon(updated);
                                 setCouponsList(getAllCoupons());
                               }}
                               className="text-secondary hover:text-primary underline"
                            >
                              Toggle
                            </button>
                            <button
                               onClick={async () => {
                                 if (confirm("Delete this coupon code permanently?")) {
                                   await deleteCoupon(cp.id);
                                   setCouponsList(getAllCoupons());
                                 }
                               }}
                               className="text-red-600 font-bold hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-secondary font-mono text-xs border border-dashed border-outline-variant bg-zinc-50">
                  No campaigns configuration coupon logged.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SOCIAL MEDIA CHANNELS DETAILS SETTINGS */}
      {activeAdminTab === 'socials' && (
        <div className="space-y-8">
          <div className="border-b border-outline-variant pb-4">
            <h1 className="font-display-lg text-2xl tracking-tight text-primary uppercase font-medium">Social Integration config</h1>
            <p className="font-body-md text-xs text-secondary mt-1">Configure public handles linked in footer elements of Playbook Studios.</p>
          </div>

          <div className="max-w-2xl border border-outline-variant p-8 bg-white space-y-6">
            <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant pb-2">Footer Channels Links</h3>
            
            <div className="font-mono text-xs space-y-4">
              <div className="space-y-1">
                <label className="text-secondary text-[10px] uppercase block font-bold">Instagram URL</label>
                <div className="flex bg-white border border-outline-variant items-center px-3 py-1.5 focus-within:border-primary">
                  <Link2 className="w-4 h-4 text-secondary shrink-0 mr-2" />
                  <input
                     type="text"
                     placeholder="https://instagram.com/playbookstudios"
                     value={scInsta}
                     onChange={(e) => setScInsta(e.target.value)}
                     className="border-none bg-transparent w-full focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-secondary text-[10px] uppercase block font-bold">Twitter X URL</label>
                <div className="flex bg-white border border-outline-variant items-center px-3 py-1.5 focus-within:border-primary">
                  <Link2 className="w-4 h-4 text-secondary shrink-0 mr-2" />
                  <input
                     type="text"
                     placeholder="https://twitter.com/playbookstudios"
                     value={scTwitter}
                     onChange={(e) => setScTwitter(e.target.value)}
                     className="border-none bg-transparent w-full focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-secondary text-[10px] uppercase block font-bold">YouTube Chanel URL</label>
                <div className="flex bg-white border border-outline-variant items-center px-3 py-1.5 focus-within:border-primary">
                  <Link2 className="w-4 h-4 text-secondary shrink-0 mr-2" />
                  <input
                     type="text"
                     placeholder="https://youtube.com/@playbook"
                     value={scYoutube}
                     onChange={(e) => setScYoutube(e.target.value)}
                     className="border-none bg-transparent w-full focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-secondary text-[10px] uppercase block font-bold">Facebook Profile (Optional)</label>
                <div className="flex bg-white border border-outline-variant items-center px-3 py-1.5 focus-within:border-primary">
                  <Link2 className="w-4 h-4 text-secondary shrink-0 mr-2" />
                  <input
                     type="text"
                     placeholder="https://facebook.com/playbook"
                     value={scFB}
                     onChange={(e) => setScFB(e.target.value)}
                     className="border-none bg-transparent w-full focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-secondary text-[10px] uppercase block font-bold">Pinterest Board (Optional)</label>
                <div className="flex bg-white border border-outline-variant items-center px-3 py-1.5 focus-within:border-primary">
                  <Link2 className="w-4 h-4 text-secondary shrink-0 mr-2" />
                  <input
                     type="text"
                     placeholder="https://pinterest.com/playbook"
                     value={scPin}
                     onChange={(e) => setScPin(e.target.value)}
                     className="border-none bg-transparent w-full focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Instagram Images Grid urls */}
            <div className="border-t border-outline-variant pt-6 space-y-4">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant pb-2">
                Instagram Banner Grid Images (6 Elements)
              </h3>
              <p className="font-sans text-[11px] text-secondary leading-relaxed">
                Supply absolute Image URLs from the web (Unsplash recommended) to showcase selected high-contrast looks on the storefront.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="space-y-2 font-mono text-xs border border-zinc-100 p-4 bg-zinc-50/50">
                    <label className="text-secondary text-[10px] uppercase block font-bold">Grid Photo #{idx + 1}</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={scInstaImages[idx] || ''}
                      onChange={(e) => {
                        const copy = [...scInstaImages];
                        copy[idx] = e.target.value.trim();
                        setScInstaImages(copy);
                      }}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none text-xs"
                    />
                    
                    {/* Cloudinary Drop/Click Upload box for Social Lookbook Feed Images */}
                    <div className="border border-dashed border-zinc-300 p-3 bg-white text-center hover:bg-zinc-50 transition duration-300">
                      <input
                        type="file"
                        accept="image/*"
                        id={`insta-image-uploader-${idx}`}
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          try {
                            const file = files[0];
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('upload_preset', cloudinaryPreset);
                            formData.append('cloud_name', 'df4qsb2lr');
                            
                            const response = await fetch(
                              `https://api.cloudinary.com/v1_1/df4qsb2lr/image/upload`,
                              { method: 'POST', body: formData }
                            );
                            if (!response.ok) {
                              throw new Error('Upload failed. Status: ' + response.status);
                            }
                            const data = await response.json();
                            if (data.secure_url) {
                              const copy = [...scInstaImages];
                              copy[idx] = data.secure_url;
                              setScInstaImages(copy);
                              alert(`🎉 Lookbook Grid image #${idx + 1} uploaded to Cloudinary successfully!`);
                            }
                          } catch (err: any) {
                            alert('Cloudinary upload failure: ' + (err.message || err));
                          }
                        }}
                      />
                      <label htmlFor={`insta-image-uploader-${idx}`} className="cursor-pointer text-[9px] font-mono uppercase tracking-widest text-primary font-bold hover:underline block">
                        ↑ Upload image via Cloudinary
                      </label>
                    </div>

                    {scInstaImages[idx] && (
                      <div className="mt-1 w-20 h-20 border border-outline-variant bg-zinc-100 overflow-hidden relative group">
                        <img 
                          src={scInstaImages[idx]} 
                          alt={`Preview #${idx + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/150?text=Error';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...scInstaImages];
                            copy[idx] = '';
                            setScInstaImages(copy);
                          }}
                          className="absolute right-0 top-0 bg-red-600 text-white p-1 text-[9px] uppercase font-bold hover:bg-red-700"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
               onClick={async () => {
                 // Ensure we have 6 elements or fallback to empty string
                 const finalImages = [...scInstaImages];
                 while (finalImages.length < 6) {
                   finalImages.push('');
                 }
                 const updated: SocialConfig = {
                   id: 'social_links',
                   instagram: scInsta.trim(),
                   twitter: scTwitter.trim(),
                   youtube: scYoutube.trim(),
                   facebook: scFB.trim(),
                   pinterest: scPin.trim(),
                   instagramImages: finalImages
                 };
                 await saveSocialConfig(updated);
                 setSocialConfig(getSocialConfig());
                 alert("Social directories and lookbook media sync updated successfully!");
               }}
               className="w-full bg-primary text-on-primary text-xs uppercase py-3 font-semibold tracking-widest hover:bg-opacity-95 transition"
            >
              Commit Config Changes
            </button>
          </div>
        </div>
      )}

      {/* 5. WHATSAPP SUPPORT COORDINATES SETUPS */}
      {activeAdminTab === 'whatsapp' && (
        <div className="space-y-8">
          <div className="border-b border-outline-variant pb-4">
            <h1 className="font-display-lg text-2xl tracking-tight text-primary uppercase font-medium">WhatsApp ordering dispatch</h1>
            <p className="font-body-md text-xs text-secondary mt-1">Configure direct order placement rerouting to business numbers of Playbook Studios.</p>
          </div>

          <div className="max-w-2xl border border-outline-variant p-8 bg-white space-y-6">
            <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant pb-2">Support Coordinates</h3>
            
            <div className="font-mono text-xs space-y-4">
              <div className="space-y-1">
                <label className="text-secondary text-[10px] uppercase block font-bold">Atelier WhatsApp Number (with Country Code, no spaces)</label>
                <div className="flex bg-white border border-outline-variant items-center px-3 py-1.5">
                  <Smartphone className="w-4 h-4 text-secondary shrink-0 mr-2" />
                  <input
                     type="text"
                     placeholder="e.g. 919861239776"
                     value={waPhone}
                     onChange={(e) => setWaPhone(e.target.value.replace(/[^0-9]/g, ''))}
                     className="border-none bg-transparent w-full focus:outline-none font-bold"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 font-sans mt-1">Please insertcountry prefixes first (e.g. 91 for India, 1 for United States).</p>
              </div>

              <div className="space-y-1 font-sans">
                <label className="text-secondary text-[10px] uppercase block font-mono">Order Prefix Greeting Heading</label>
                <textarea
                   value={waMsg}
                   onChange={(e) => setWaMsg(e.target.value)}
                   className="bg-white border border-outline-variant p-2 w-full h-20 focus:outline-none focus:ring-0 font-sans text-xs"
                   placeholder="Hey Playbook! I am interested in ordering: "
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                   type="checkbox"
                   id="chk_wa_enabled"
                   checked={waEnabled}
                   onChange={(e) => setWaEnabled(e.target.checked)}
                   className="w-4 h-4 text-primary focus:ring-0"
                />
                <label htmlFor="chk_wa_enabled" className="text-secondary uppercase text-[10px] cursor-pointer">Enable instant checkout redirects</label>
              </div>
            </div>

            <button
               onClick={async () => {
                 if (!waPhone.trim()) {
                   alert("Please input a valid WhatsApp coordinates record.");
                   return;
                 }
                 const updated: WhatsAppConfig = {
                   id: 'whatsapp_config',
                   phoneNumber: waPhone.trim(),
                   isEnabled: waEnabled,
                   prefilledMessageText: waMsg
                 };
                 await saveWhatsAppConfig(updated);
                 setWaConfig(getWhatsAppConfig());
                 alert("WhatsApp ordering credentials synced live!");
               }}
               className="w-full bg-primary text-on-primary text-xs uppercase py-3 font-semibold tracking-widest hover:bg-opacity-95 transition"
            >
              Commit Config Changes
            </button>
          </div>
        </div>
      )}

      {/* 6. ANNOUNCEMENT BARS TAB */}
      {activeAdminTab === 'announcements' && (
        <div className="space-y-8">
          <div className="border-b border-outline-variant pb-4">
            <h1 className="font-display-lg text-2xl tracking-tight text-primary uppercase font-medium">Announcement Bars</h1>
            <p className="font-body-md text-xs text-secondary mt-1">Deploy striking notice statements above header navigation grids.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Admin Forms addition */}
            <div className="border border-outline-variant p-6 bg-surface-container-lowest space-y-4 font-mono text-xs">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary font-sans">Deploy Notice Bar</h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-secondary text-[10px] uppercase block font-bold">Announcement Notice (Caps recommended)</label>
                  <input
                     type="text"
                     placeholder="e.g. GET ₹300 IMMEDATE SIGNUP BONUS!"
                     value={annText}
                     onChange={(e) => setAnnText(e.target.value)}
                     className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-secondary text-[10px] uppercase block font-bold">Bar Color Theme (Hex Code)</label>
                  <div className="flex space-x-2">
                    <input
                       type="color"
                       value={annBgCol}
                       onChange={(e) => setAnnBgCol(e.target.value)}
                       className="w-9 h-9 border border-outline-variant cursor-pointer p-0 shrink-0"
                    />
                    <input
                       type="text"
                       value={annBgCol}
                       onChange={(e) => setAnnBgCol(e.target.value)}
                       className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-secondary text-[10px] uppercase block font-bold">Text Color (Hex Code)</label>
                  <div className="flex space-x-2">
                    <input
                       type="color"
                       value={annTxtCol}
                       onChange={(e) => setAnnTxtCol(e.target.value)}
                       className="w-9 h-9 border border-outline-variant cursor-pointer p-0 shrink-0"
                    />
                    <input
                       type="text"
                       value={annTxtCol}
                       onChange={(e) => setAnnTxtCol(e.target.value)}
                       className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                     type="checkbox"
                     id="chk_ann_active"
                     checked={annActive}
                     onChange={(e) => setAnnActive(e.target.checked)}
                     className="w-4 h-4 text-primary focus:ring-0"
                  />
                  <label htmlFor="chk_ann_active" className="text-secondary uppercase text-[10px] cursor-pointer">Live deployment on mount</label>
                </div>
              </div>

              <button
                 onClick={async () => {
                   if (!annText.trim()) {
                     alert("Notice bar text is empty.");
                     return;
                   }
                   const newA: AnnouncementBar = {
                     id: "ann_" + Math.random().toString(36).substr(2, 9),
                     text: annText.toUpperCase(),
                     isActive: annActive,
                     backgroundColor: annBgCol,
                     textColor: annTxtCol,
                     createdAt: new Date().toISOString()
                   };
                   await saveAnnouncement(newA);
                   setAnnouncementsList(getAllAnnouncements());
                   setAnnText('');
                   alert("Announcement bar deployed successfully!");
                 }}
                 className="w-full bg-primary text-on-primary text-xs uppercase py-3 font-semibold tracking-widest hover:opacity-90 transition font-sans"
              >
                Broadcast Announcement Bar
              </button>
            </div>

            {/* Existing announcements list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-secondary border-b border-outline-variant pb-2">Active broadcast announcements</h3>
              {announcementsList.length > 0 ? (
                <div className="border border-outline-variant divide-y divide-outline-variant bg-white">
                  {announcementsList.map(ann => (
                    <div key={ann.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex-grow space-y-2">
                        <div
                           style={{ backgroundColor: ann.backgroundColor, color: ann.textColor }}
                           className="px-4 py-2 font-mono text-[10px] font-bold text-center tracking-wider max-w-xl transition uppercase"
                        >
                          {ann.text}
                        </div>
                        <div className="flex items-center space-x-3 text-[9px] font-mono text-zinc-400">
                          <span>Bg: {ann.backgroundColor}</span>
                          <span>Text: {ann.textColor}</span>
                          <span>Status: {ann.isActive ? 'Live' : 'Hidden'}</span>
                        </div>
                      </div>

                      <div className="ml-4 shrink-0 space-y-1">
                        <button
                           onClick={async () => {
                             const updated = { ...ann, isActive: !ann.isActive };
                             await saveAnnouncement(updated);
                             setAnnouncementsList(getAllAnnouncements());
                           }}
                           className="text-xs font-mono block text-primary border border-outline-variant px-3 py-1 hover:bg-zinc-100 text-center w-full"
                        >
                          {ann.isActive ? 'Hide' : 'Show'}
                        </button>
                        <button
                           onClick={async () => {
                             if (confirm("Delete announcement permanently?")) {
                               await deleteAnnouncement(ann.id);
                               setAnnouncementsList(getAllAnnouncements());
                             }
                           }}
                           className="text-xs font-mono block text-red-600 font-bold hover:underline text-center w-full"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-secondary font-mono text-xs border border-dashed border-outline-variant bg-zinc-50">
                  No notices logged in backend database.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. MERCH MAIL / CAMPAIGNS BROADCASES PANEL */}
      {activeAdminTab === 'merch_mail' && (
        <div className="space-y-8 animate-fade-in font-sans">
          <div className="border-b border-outline-variant pb-4 flex justify-between items-end">
            <div>
              <h1 className="font-display-lg text-2xl tracking-tight text-primary uppercase font-medium">Merch Mail Campaign CRM</h1>
              <p className="font-body-md text-xs text-secondary mt-1">Manage, list, and simulated-broadcast centralized newsletters to subscribers.</p>
            </div>
            
            <div className="space-x-2">
              <button
                 onClick={() => {
                   const email = prompt("Directly insert subscriber email:");
                   if (email && email.trim()) {
                     addNewsletterEmail(email.trim()).then(() => {
                       setNewsletterEmails(getAllNewsletterEmails());
                       alert("Subscriber added successfully!");
                     });
                   }
                 }}
                 className="bg-neutral-900 text-white font-mono text-[10px] tracking-widest px-4 py-2.5 uppercase rounded-none"
              >
                + Insert Subscriber Email
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* List of active subscribers and categories */}
            <div className="lg:col-span-5 space-y-6 font-mono text-xs">
              <div className="border border-outline-variant p-5 bg-white space-y-4">
                <div className="flex justify-between items-baseline border-b border-outline-variant pb-2">
                  <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-secondary">Roster Directories</h3>
                  <span className="font-mono text-[10px] text-zinc-400">Total: {newsletterEmails.length}</span>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[9px] tracking-widest uppercase">
                  <button
                     onClick={() => setEmailGroupFilter('all')}
                     className={`py-1.5 border text-center font-bold ${emailGroupFilter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container border-outline-variant font-medium'}`}
                  >
                    All ({newsletterEmails.length})
                  </button>
                  <button
                     onClick={() => setEmailGroupFilter('prior')}
                     className={`py-1.5 border text-center font-bold ${emailGroupFilter === 'prior' ? 'bg-primary text-on-primary' : 'bg-surface-container border-outline-variant font-medium'}`}
                  >
                    Prior ({newsletterEmails.filter(e => e.isPriorCustomer).length})
                  </button>
                  <button
                     onClick={() => setEmailGroupFilter('community')}
                     className={`py-1.5 border text-center font-bold ${emailGroupFilter === 'community' ? 'bg-primary text-on-primary' : 'bg-surface-container border-outline-variant font-medium'}`}
                  >
                    Web Signups ({newsletterEmails.filter(e => !e.isPriorCustomer).length})
                  </button>
                </div>

                {/* Emails Table */}
                <div className="border border-outline-variant overflow-y-auto max-h-[300px]">
                  <table className="w-full text-left font-mono text-[11px]">
                    <tbody className="divide-y divide-outline-variant">
                      {newsletterEmails
                        .filter(e => {
                          if (emailGroupFilter === 'prior') return e.isPriorCustomer;
                          if (emailGroupFilter === 'community') return !e.isPriorCustomer;
                          return true;
                        })
                        .map(nm => (
                          <tr key={nm.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-semibold text-primary">{nm.email}</td>
                            <td className="p-3 text-right">
                              <span className={`px-2 py-0.5 text-[8px] font-bold uppercase inline-block mr-2 ${nm.isPriorCustomer ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                {nm.isPriorCustomer ? 'Prior Customer' : 'Community'}
                              </span>
                              <button
                                 onClick={async () => {
                                   if (confirm(`Remove email ${nm.email} from campaigns?`)) {
                                     await deleteNewsletterEmail(nm.id);
                                     setNewsletterEmails(getAllNewsletterEmails());
                                   }
                                 }}
                                 className="text-red-600 font-bold font-sans text-xs"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      {newsletterEmails.length === 0 && (
                        <tr>
                          <td className="p-4 text-center text-zinc-400 italic font-sans text-xs">No subscriber emails configured.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Simulated logging console feedback */}
              <div className="bg-zinc-950 text-emerald-400 p-5 rounded-none border border-neutral-800 font-mono text-[10px] space-y-2">
                <div className="flex justify-between border-b border-neutral-900 pb-1 text-[9px] text-zinc-500 uppercase">
                  <span>Campaign Console Logger</span>
                  <span className="animate-pulse">● SYNCED</span>
                </div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto font-mono text-[10px]">
                  {campaignLogs.map((log, idx) => (
                    <p key={idx} className="leading-relaxed">{log}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Compose campaign body section */}
            <div className="lg:col-span-7 border border-outline-variant p-6 bg-white space-y-4">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant pb-2">Centralized Campaign Broadcaster</h3>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-secondary text-[10px] uppercase block font-bold">Mail Subject Line</label>
                  <input
                     type="text"
                     value={emailSubject}
                     onChange={(e) => setEmailSubject(e.target.value)}
                     className="bg-white border border-outline-variant p-2 w-full focus:outline-none text-xs font-bold"
                  />
                </div>

                <div className="space-y-1 font-sans">
                  <label className="text-secondary text-[10px] uppercase font-mono block font-bold">Campaign Content Body</label>
                  <textarea
                     value={emailBody}
                     onChange={(e) => setEmailBody(e.target.value)}
                     className="bg-white border border-outline-variant p-3 w-full h-[250px] focus:outline-none focus:ring-0 font-mono text-xs leading-relaxed"
                  />
                </div>
              </div>

              <button
                 disabled={isBroadcastingCampaign}
                 onClick={() => {
                   if (!emailSubject.trim() || !emailBody.trim()) {
                     alert("Subject and Body are required parameters.");
                     return;
                   }
                   setIsBroadcastingCampaign(true);
                   const targetRecipients = newsletterEmails.filter(e => {
                     if (emailGroupFilter === 'prior') return e.isPriorCustomer;
                     if (emailGroupFilter === 'community') return !e.isPriorCustomer;
                     return true;
                   });

                   const logLine = `[Campaign Outbound] Transmitting broadcast campaign subject: "${emailSubject}" targeting ${targetRecipients.length} recipients...`;
                   setCampaignLogs(p => [logLine, ...p]);

                   setTimeout(() => {
                     setIsBroadcastingCampaign(false);
                     alert(`Merch Mail Sent! Campaign successfully sent to ${targetRecipients.length} recipients of Playbook Studios.`);
                     const finishLine = `[Outbound Success] Broadcaster dispatched payload safely to ${targetRecipients.length} endpoints at ${new Date().toLocaleTimeString()}.`;
                     setCampaignLogs(p => [finishLine, ...p]);
                   }, 1500);
                 }}
                 className="w-full bg-primary text-on-primary text-xs uppercase py-3.5 font-bold tracking-widest hover:opacity-95 disabled:opacity-40 transition flex items-center justify-center space-x-2"
              >
                {isBroadcastingCampaign ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                    <span>Dispatched Outbound Broadcast Payload...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 justify-center text-white" />
                    <span>Broadcast Campaign to {
                      newsletterEmails.filter(e => {
                        if (emailGroupFilter === 'prior') return e.isPriorCustomer;
                        if (emailGroupFilter === 'community') return !e.isPriorCustomer;
                        return true;
                      }).length
                    } Recipients</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. TEAM MEMBERS ROSTERS Access Control */}
      {activeAdminTab === 'team_members' && (
        <div className="space-y-8 animate-fade-in font-sans">
          <div className="border-b border-outline-variant pb-4 flex justify-between items-baseline">
            <div>
              <h1 className="font-display-lg text-2xl tracking-tight text-primary uppercase font-medium">Team Roster Security</h1>
              <p className="font-body-md text-xs text-secondary mt-1">Assign studio collaborators and configured roles with restricted access scopes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Adding team members */}
            <div className="border border-outline-variant p-6 bg-surface-container-lowest space-y-4 font-mono text-xs">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary font-sans">Enlist Collaborator</h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-secondary text-[10px] uppercase block">Collaborator Name</label>
                  <input
                     type="text"
                     placeholder="e.g. Sahu Editor"
                     value={tmName}
                     onChange={(e) => setTmName(e.target.value)}
                     className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-secondary text-[10px] uppercase block">Collaborator Verified Email</label>
                  <input
                     type="email"
                     placeholder="e.g. editor@playbook.com"
                     value={tmEmail}
                     onChange={(e) => setTmEmail(e.target.value.toLowerCase().trim())}
                     className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                  />
                </div>

                <div className="space-y-1 font-sans">
                  <label className="text-secondary text-[10px] uppercase block font-mono">Role Classification</label>
                  <select
                     value={tmRole}
                     onChange={(e: any) => setTmRole(e.target.value)}
                     className="bg-white border border-outline-variant p-2 w-full h-9 focus:outline-none text-xs font-mono font-bold"
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="editor">Editor (Write Products/Coupons)</option>
                    <option value="viewer">Viewer (Read Only access)</option>
                  </select>
                </div>

                <div className="space-y-2 font-sans pt-1">
                  <label className="text-secondary text-[10px] uppercase block font-mono font-bold text-primary">Module Access Scopes Option</label>
                  
                  {['products', 'orders', 'coupons', 'banners', 'team', 'wallet'].map(perm => {
                    const isChecked = tmPermissions.includes(perm);
                    return (
                      <div key={perm} className="flex items-center space-x-2">
                        <input
                           type="checkbox"
                           id={`chk_perm_${perm}`}
                           checked={tmRole === 'admin' ? true : isChecked}
                           disabled={tmRole === 'admin'}
                           onChange={() => {
                             if (isChecked) {
                               setTmPermissions(p => p.filter(x => x !== perm));
                             } else {
                               setTmPermissions(p => [...p, perm]);
                             }
                           }}
                           className="w-4 h-4 text-primary focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor={`chk_perm_${perm}`} className="text-xs uppercase tracking-wider text-secondary font-mono cursor-pointer">
                          {perm}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                 onClick={async () => {
                   if (!tmName.trim() || !tmEmail.trim()) {
                     alert("Roster name and verified email fields are required.");
                     return;
                   }
                   const newM: TeamMember = {
                     id: "tm_" + Math.random().toString(36).substr(2, 9),
                     name: tmName.trim(),
                     email: tmEmail.trim().toLowerCase(),
                     role: tmRole,
                     permissions: tmRole === 'admin' ? ['products', 'orders', 'coupons', 'banners', 'team', 'wallet'] : tmPermissions,
                     createdAt: new Date().toISOString()
                   };
                   await saveTeamMember(newM);
                   setTeamList(getAllTeamMembers());
                   setTmName('');
                   setTmEmail('');
                   alert("Collaborator safely listed in team roster registry.");
                 }}
                 className="w-full bg-primary text-on-primary text-xs uppercase py-3 font-semibold tracking-widest hover:opacity-95 transition font-sans text-center inline-block"
              >
                Register Collaborator Credentials
              </button>
            </div>

            {/* Collaborators list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-secondary border-b border-outline-variant pb-2">Logged Studio Collaborators</h3>

              <div className="border border-outline-variant bg-white overflow-hidden">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant text-[10px] tracking-widest text-secondary font-bold uppercase">
                      <th className="p-4">Staff Member</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role Assigned</th>
                      <th className="p-4">Permissions Scope</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {teamList.map(tm => (
                      <tr key={tm.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-primary text-xs font-sans uppercase">{tm.name}</td>
                        <td className="p-4 text-secondary">{tm.email}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-sm ${tm.role === 'admin' ? 'bg-red-100 text-red-800' : tm.role === 'editor' ? 'bg-yellow-101 bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-800'}`}>
                            {tm.role}
                          </span>
                        </td>
                        <td className="p-4 text-[9px] text-zinc-500 max-w-[200px] truncate leading-normal">
                          {tm.permissions ? tm.permissions.join(', ') : 'None'}
                        </td>
                        <td className="p-4 text-right">
                          {tm.email === 'playbookstudio76@gmail.com' ? (
                            <span className="text-[9px] font-bold uppercase text-zinc-400">Root Admin</span>
                          ) : (
                            <button
                               onClick={async () => {
                                 if (confirm(`Remove collaborator ${tm.name} permanently?`)) {
                                   await deleteTeamMember(tm.id);
                                   setTeamList(getAllTeamMembers());
                                 }
                               }}
                               className="text-red-600 block hover:underline text-right"
                            >
                              Revoke access
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. CUSTOMERS WALLETS CASH MANAGEMENT PANEL */}
      {activeAdminTab === 'wallets' && (
        <div className="space-y-8 animate-fade-in font-sans">
          <div className="border-b border-outline-variant pb-4">
            <h1 className="font-display-lg text-2xl tracking-tight text-primary uppercase font-medium">Customer Web Wallets Ledger</h1>
            <p className="font-body-md text-xs text-secondary mt-1">Dispensation and ledger logs tracking for user signups, orders, and custom deposits.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Ledger Database */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-secondary border-b border-outline-variant pb-2">Active Store Wallets</h3>
              
              <div className="border border-outline-variant bg-white overflow-hidden">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant text-[10px] tracking-widest text-secondary font-bold uppercase">
                      <th className="p-4">Owner ID Reference</th>
                      <th className="p-4">Credit Balance (₹)</th>
                      <th className="p-4">Transactions count</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {walletsList.map(wl => {
                      const matchesUser = users.find(u => u.id === wl.id);
                      return (
                        <tr key={wl.id} className="hover:bg-slate-50 transition">
                          <td className="p-4">
                            <div className="space-y-0.5 font-sans">
                              <p className="font-bold text-xs uppercase text-primary">{matchesUser ? `${matchesUser.firstName} ${matchesUser.lastName}` : 'Direct ID User'}</p>
                              <span className="text-[10px] text-zinc-400 block break-all font-mono">{matchesUser ? matchesUser.email : wl.id}</span>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-sm text-primary font-mono">₹{wl.balance.toLocaleString()}</td>
                          <td className="p-4 text-secondary">{wl.transactions ? wl.transactions.length : 0} logged</td>
                          <td className="p-4 text-right">
                            <button
                               onClick={() => {
                                 setSelectedWalletUser(wl.id);
                               }}
                               className="bg-primary text-on-primary font-mono text-[10px] tracking-widest uppercase px-3 py-1.5"
                            >
                              Adjust Money
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {walletsList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-zinc-400 italic">No customer wallets initialized. They initialize automatically on signup bonus trigger.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Credit/Debit Deposit Forms modal panel drawer */}
            <div className="border border-outline-variant p-6 bg-surface-container font-mono text-xs space-y-4">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary font-sans border-b border-outline pb-2">Credit Adjustment</h3>
              
              {selectedWalletUser ? (
                <div className="space-y-4">
                  <div className="bg-white border p-3 font-mono text-[11px] space-y-1">
                    <span className="text-[9px] text-zinc-400 block uppercase font-bold">Targeted User email</span>
                    <p className="font-bold text-primary text-xs tracking-tight uppercase break-all font-sans">
                      {(() => {
                        const matchU = users.find(u => u.id === selectedWalletUser);
                        return matchU ? matchU.email : selectedWalletUser;
                      })()}
                    </p>
                    <span className="text-amber-600 block text-[10px] font-bold">Current Balance: ₹{
                      (() => {
                        const data = localStorage.getItem('pb_wallets_db');
                        const map = data ? JSON.parse(data) : {};
                        return map[selectedWalletUser]?.balance || 0;
                      })().toLocaleString()
                    }</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase block font-bold">Adjustment value (Rupees)</label>
                    <input
                       type="number"
                       value={walletTxAmount}
                       onChange={(e) => setWalletTxAmount(parseFloat(e.target.value) || 0)}
                       className="bg-white border border-outline-variant p-2 w-full focus:outline-none focus:ring-0 font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase block">Audit Note Statement</label>
                    <input
                       type="text"
                       value={walletTxDesc}
                       onChange={(e) => setWalletTxDesc(e.target.value)}
                       className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                       placeholder="Special campaign credit"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                       onClick={() => {
                         if (walletTxAmount <= 0) {
                           alert("Credit amount must be greater than zero.");
                           return;
                         }
                         updateUserWallet(selectedWalletUser, walletTxAmount, `🌟 ${walletTxDesc}`);
                         setWalletsList(getAllWallets());
                         alert(`Credited ₹${walletTxAmount} successfully!`);
                       }}
                       className="bg-emerald-600 text-white py-2 px-3 font-bold text-center uppercase tracking-wider hover:bg-emerald-700 transition"
                    >
                      + Deposit
                    </button>
                    <button
                       onClick={() => {
                         if (walletTxAmount <= 0) {
                           alert("Debit amount must be greater than zero.");
                           return;
                         }
                         updateUserWallet(selectedWalletUser, -walletTxAmount, `⚠️ ${walletTxDesc}`);
                         setWalletsList(getAllWallets());
                         alert(`Debited ₹${walletTxAmount} successfully!`);
                       }}
                       className="bg-primary text-on-primary py-2 px-3 font-bold text-center uppercase tracking-wider hover:opacity-95 transition"
                    >
                      - Withdraw
                    </button>
                  </div>

                  <button
                     onClick={() => setSelectedWalletUser(null)}
                     className="w-full text-center text-zinc-500 font-sans hover:underline text-[10px] block pt-2"
                  >
                    Cancel adjustment selection
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-secondary bg-white border border-outline-variant px-4 italic leading-relaxed font-sans font-xs">
                  Select a client wallet list row from the main ledger to handle adjustments.
                </div>
              )}
            </div>
          </div>

          {/* WALLET AND PROFIT MARGIN CONFIGURATION CONTROL CENTER */}
          <div className="border border-outline-variant bg-white p-6 space-y-6">
            <div className="border-b border-outline-variant pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-display-md text-lg tracking-tight text-primary uppercase font-medium">Wallet & Profit Margin System Settings</h3>
                <p className="font-sans text-[11px] text-secondary mt-0.5">Control client store credit signup bonuses, cashback limitations, and business profit safeguard margins.</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await saveWalletAndProfitSettings(wpSettings);
                    alert("🎉 Wallet & Profit Margin Settings successfully deployed and committed!");
                  } catch (err: any) {
                    alert("Failure storing settings: " + (err.message || err));
                  }
                }}
                className="bg-primary text-on-primary py-2.5 px-6 text-xs uppercase font-semibold tracking-widest hover:opacity-90 transition active:scale-95"
              >
                Save Settings
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-mono">
              {/* Wallet System Rules Box */}
              <div className="space-y-4">
                <h4 className="font-label-caps text-xs font-bold uppercase tracking-wider text-secondary border-b border-zinc-100 pb-1.5 flex items-center justify-between">
                  <span>1. Wallet Credit Incentives Rules</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${wpSettings.walletEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {wpSettings.walletEnabled ? 'ACTIVE-LEDGER' : 'DISABLED'}
                  </span>
                </h4>

                {/* Toggle System */}
                <div className="flex items-center justify-between py-2 bg-zinc-50 px-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-primary text-[11px] uppercase block">Enable Wallet System</span>
                    <span className="text-[10px] text-secondary font-sans leading-relaxed block">Allows customers to hold store balance credits and redeem them at checkout.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wpSettings.walletEnabled}
                    onChange={(e) => setWpSettings(prev => ({ ...prev, walletEnabled: e.target.checked }))}
                    className="w-4 h-4 text-primary rounded focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase font-bold block">Sign Up Bonus Credit (₹)</label>
                    <input
                      type="number"
                      value={wpSettings.signupBonus}
                      onChange={(e) => setWpSettings(prev => ({ ...prev, signupBonus: parseFloat(e.target.value) || 0 }))}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase font-bold block">Bonus Life Limit (Days)</label>
                    <input
                      type="number"
                      value={wpSettings.signupBonusExpiryDays}
                      onChange={(e) => setWpSettings(prev => ({ ...prev, signupBonusExpiryDays: parseInt(e.target.value) || 0 }))}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase font-bold block">Min Order Value To Use Wallet (₹)</label>
                    <input
                      type="number"
                      value={wpSettings.minOrderValueToUseWallet}
                      onChange={(e) => setWpSettings(prev => ({ ...prev, minOrderValueToUseWallet: parseFloat(e.target.value) || 0 }))}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase font-bold block">Max Wallet Usage per Order (%)</label>
                    <input
                      type="number"
                      max="100"
                      min="0"
                      value={wpSettings.maxWalletUsagePercentage}
                      onChange={(e) => setWpSettings(prev => ({ ...prev, maxWalletUsagePercentage: parseFloat(e.target.value) || 0 }))}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase font-bold block">Max Combined Discount Limit (%)</label>
                    <input
                      type="number"
                      max="100"
                      min="0"
                      value={wpSettings.maxCombinedDiscountPercentage}
                      onChange={(e) => setWpSettings(prev => ({ ...prev, maxCombinedDiscountPercentage: parseFloat(e.target.value) || 0 }))}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                      placeholder="e.g. 50"
                    />
                    <span className="text-[9px] text-zinc-400 font-sans block mt-0.5">Cap discount combining code coupon & wallet balance.</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase font-bold block">Minimum Withdrawal (₹)</label>
                    <input
                      type="number"
                      value={wpSettings.minWithdrawal || 0}
                      onChange={(e) => setWpSettings(prev => ({ ...prev, minWithdrawal: parseFloat(e.target.value) || 0 }))}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Profitability Control & Cashback Guard Box */}
              <div className="space-y-4">
                <h4 className="font-label-caps text-xs font-bold uppercase tracking-wider text-secondary border-b border-zinc-100 pb-1.5 flex items-center justify-between">
                  <span>2. Profit Margins & Loyalty Protection</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${wpSettings.cashbackEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {wpSettings.cashbackEnabled ? 'CASHBACK-ON' : 'CASHBACK-OFF'}
                  </span>
                </h4>

                {/* Cashback Toggle Option */}
                <div className="flex items-center justify-between py-2 bg-zinc-50 px-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-primary text-[11px] uppercase block">First Order Cashback</span>
                    <span className="text-[10px] text-secondary font-sans leading-relaxed block">Renders instant wallet balance cash reward back on completed initial client checkout.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wpSettings.cashbackEnabled}
                    onChange={(e) => setWpSettings(prev => ({ ...prev, cashbackEnabled: e.target.checked }))}
                    className="w-4 h-4 text-primary rounded focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase font-bold block">Loyalty Cashback Per Order (₹)</label>
                    <input
                      type="number"
                      value={wpSettings.cashbackPerOrder}
                      onChange={(e) => setWpSettings(prev => ({ ...prev, cashbackPerOrder: parseFloat(e.target.value) || 0 }))}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase font-bold block">Loyalty Cashback Expiry Limit (Days)</label>
                    <input
                      type="number"
                      value={wpSettings.cashbackExpiryDays}
                      onChange={(e) => setWpSettings(prev => ({ ...prev, cashbackExpiryDays: parseInt(e.target.value) || 0 }))}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase font-bold block">Minimum Safe Profit per Order (₹)</label>
                    <input
                      type="number"
                      value={wpSettings.minimumProfitPerOrder}
                      onChange={(e) => setWpSettings(prev => ({ ...prev, minimumProfitPerOrder: parseFloat(e.target.value) || 0 }))}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                    <span className="text-[9px] text-zinc-400 font-sans block mt-0.5">Order cannot validate if total value drops beneath cost + this margin threshold.</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-secondary text-[10px] uppercase font-bold block font-mono">Default Cost of Goods (%)</label>
                    <input
                      type="number"
                      value={wpSettings.defaultCostPercentageOfSellingPrice}
                      onChange={(e) => setWpSettings(prev => ({ ...prev, defaultCostPercentageOfSellingPrice: parseFloat(e.target.value) || 0 }))}
                      className="bg-white border border-outline-variant p-2 w-full focus:outline-none"
                    />
                    <span className="text-[9px] text-zinc-400 font-sans block mt-0.5">Assumed baseline cost percentage of product list pricing for real-time margin checking.</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 bg-zinc-50 px-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-primary text-[11px] uppercase block">Social Referral Bonus System</span>
                    <span className="text-[10px] text-secondary font-sans leading-relaxed block">Reward referral agents automatically from administrative cache.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wpSettings.referralSystemEnabled}
                    onChange={(e) => setWpSettings(prev => ({ ...prev, referralSystemEnabled: e.target.checked }))}
                    className="w-4 h-4 text-primary rounded focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. LANDING HOMEPAGE HERO BANNER & AUTH SIDE BAR BACKDROP CONFIGURATION PANEL */}
      {activeAdminTab === 'store_config' && (
        <div className="space-y-8 animate-fade-in font-sans">
          <div className="border-b border-outline-variant pb-4">
            <h1 className="font-display-lg text-2xl tracking-tight text-primary uppercase font-medium">Layout Brand & Cloudinary Setup</h1>
            <p className="font-body-md text-xs text-secondary mt-1">Configure your streetwear lookbook banners, auth panel side backdrops, and customize Cloudinary keys.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Box 1: Store Style Configuration settings */}
            <div className="border border-outline-variant p-6 bg-white space-y-6">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant pb-2">Hero & Auth Visuals</h3>
              
              {/* Hero Banner field */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase text-secondary block font-bold">Homepage Hero Image Background (Cloudinary URL or Direct URL)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={layoutHeroUrl}
                    onChange={(e) => setLayoutHeroUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="bg-zinc-50 border border-outline-variant p-2 w-full text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                
                {/* Cloudinary File Drop Zone for Hero Banner background */}
                <div className="border border-dashed border-zinc-300 p-4 bg-zinc-50 text-center hover:bg-zinc-100 transition duration-300">
                  <input
                    type="file"
                    accept="image/*"
                    id="hero-image-uploader-element"
                    className="hidden"
                    disabled={isSavingLayout}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setIsSavingLayout(true);
                      try {
                        const file = files[0];
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('upload_preset', cloudinaryPreset);
                        formData.append('cloud_name', 'df4qsb2lr');
                        
                        const response = await fetch(
                          `https://api.cloudinary.com/v1_1/df4qsb2lr/image/upload`,
                          { method: 'POST', body: formData }
                        );
                        if (!response.ok) {
                          throw new Error('Upload failed. Status: ' + response.status);
                        }
                        const data = await response.json();
                        if (data.secure_url) {
                          setLayoutHeroUrl(data.secure_url);
                          alert('🎉 Homepage Hero background image successfully uploaded to Cloudinary!');
                        }
                      } catch (err: any) {
                        alert('Cloudinary upload failure: ' + (err.message || err));
                      } finally {
                        setIsSavingLayout(false);
                      }
                    }}
                  />
                  <label htmlFor="hero-image-uploader-element" className="cursor-pointer text-[10px] font-mono uppercase tracking-widest text-[#5d5f5f] font-semibold hover:text-black block">
                    {isSavingLayout ? "⏳ Uploading..." : "↑ Upload Homepage Hero via Cloudinary"}
                  </label>
                </div>
              </div>

              {/* Auth Backdrop Background field */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase text-secondary block font-bold">Authentication Page Sidebar Image (Cloudinary URL or Direct URL)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={layoutAuthUrl}
                    onChange={(e) => setLayoutAuthUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="bg-zinc-50 border border-outline-variant p-2 w-full text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                
                {/* Cloudinary File Drop Zone for Auth Backdrop banner background */}
                <div className="border border-dashed border-zinc-300 p-4 bg-zinc-50 text-center hover:bg-zinc-100 transition duration-300">
                  <input
                    type="file"
                    accept="image/*"
                    id="auth-image-uploader-element"
                    className="hidden"
                    disabled={isSavingLayout}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setIsSavingLayout(true);
                      try {
                        const file = files[0];
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('upload_preset', cloudinaryPreset);
                        formData.append('cloud_name', 'df4qsb2lr');
                        
                        const response = await fetch(
                          `https://api.cloudinary.com/v1_1/df4qsb2lr/image/upload`,
                          { method: 'POST', body: formData }
                        );
                        if (!response.ok) {
                          throw new Error('Upload failed. Status: ' + response.status);
                        }
                        const data = await response.json();
                        if (data.secure_url) {
                          setLayoutAuthUrl(data.secure_url);
                          alert('🎉 Authentication side image successfully uploaded to Cloudinary!');
                        }
                      } catch (err: any) {
                        alert('Cloudinary upload failure: ' + (err.message || err));
                      } finally {
                        setIsSavingLayout(false);
                      }
                    }}
                  />
                  <label htmlFor="auth-image-uploader-element" className="cursor-pointer text-[10px] font-mono uppercase tracking-widest text-[#5d5f5f] font-semibold hover:text-black block">
                    {isSavingLayout ? "⏳ Uploading..." : "↑ Upload Auth Sidebar via Cloudinary"}
                  </label>
                </div>
              </div>

              {/* Save layout changes action */}
              <div className="pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={async () => {
                    setIsSavingLayout(true);
                    try {
                      await saveStoreConfig({
                        id: 'store_config',
                        heroImageUrl: layoutHeroUrl.trim(),
                        authImageUrl: layoutAuthUrl.trim()
                      });
                      alert('🎉 Layout Brand branding styles saved and synchronized to Firestore settings!');
                    } catch (err: any) {
                      alert('Error persisting config: ' + err);
                    } finally {
                      setIsSavingLayout(false);
                    }
                  }}
                  disabled={isSavingLayout}
                  className="w-full bg-primary text-on-primary py-3 font-button-text text-xs uppercase tracking-widest hover:opacity-95 transition rounded-none font-bold"
                >
                  {isSavingLayout ? "PERSISTING LAYOUT..." : "Synchronize Visuals to Firestore"}
                </button>
              </div>
            </div>

            {/* Box 2: Cloudinary Setup Info Guide */}
            <div className="border border-outline-variant p-6 bg-surface-container space-y-6 font-mono text-xs text-secondary">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary font-sans border-b border-outline pb-2">Technical Core Connection Guide</h3>
              
              <div className="space-y-4 font-sans leading-relaxed text-zinc-600">
                <p>The Playbook Admin workspace uses Cloudinary's fast and reliable direct image ingestion API to safely parse mockups, apparel garments, categories and brand slides.</p>
                
                <div className="bg-white p-4 border border-outline-variant font-mono text-[11px] space-y-2">
                  <span className="font-bold uppercase text-[9px] text-[#5d5f5f] block">Currently Configured Global Cloudinary Settings</span>
                  <p><strong>Cloud Name:</strong> df4qsb2lr</p>
                  <p><strong>Upload Ingress Preset:</strong> ml_default</p>
                  <p className="text-[10px] text-zinc-400 mt-2 italic">* Using environment-integrated enterprise storage buckets. File drops will execute immediately.</p>
                </div>

                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-primary">How to obtain your own credentials:</h4>
                  <ul className="list-decimal pl-4 space-y-1 text-[11px]">
                    <li>Sign up for a free developer tier at <a href="https://cloudinary.com" target="_blank" rel="noreferrer" className="underline text-primary font-bold">Cloudinary.com</a></li>
                    <li>Copy your unique <strong>Cloud Name</strong> from the account dashboard console</li>
                    <li>In Cloudinary settings, go to "Upload" tab and create a new <strong>Unsigned Upload Preset</strong> (enable active incoming uploads)</li>
                    <li>This workspace maps upload files cleanly to direct content CDNs worldwide in Real Time</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
