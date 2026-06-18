import { useState, useMemo } from 'react';
import { Minus, Plus, ChevronDown, ChevronUp, RefreshCw, CreditCard, ShoppingBag } from 'lucide-react';
import { Product, CartItem } from '../types';

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>, quantity: number) => void;
  onNavigate: (view: string, props?: any) => void;
  onQuickCheckoutViaWhatsApp: (item: Omit<CartItem, 'id' | 'quantity'>, size: string, color: string, qty: number) => void;
}

export default function ProductDetailView({
  product,
  relatedProducts,
  onAddToCart,
  onNavigate,
  onQuickCheckoutViaWhatsApp,
}: ProductDetailViewProps) {
  // Gallery Active state
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // User Product State Options
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'S');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '#000000');
  const [quantity, setQuantity] = useState(1);

  // Accordions Active state
  const [openSection, setOpenSection] = useState<string | null>('details');

  // Multi-image list setup
  const galleryImages = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    // Fallback if somehow empty
    return ['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=600&auto=format&fit=crop'];
  }, [product]);

  // Handle increment/decrement of qty
  const handleQtyChange = (type: 'inc' | 'dec') => {
    if (type === 'inc') {
      if (quantity < product.stock) {
        setQuantity(q => q + 1);
      } else {
        alert(`Only ${product.stock} items remaining in our studio inventory.`);
      }
    } else {
      setQuantity(q => Math.max(1, q - 1));
    }
  };

  const handleAdd = () => {
    if (product.stock === 0) {
      alert('This element is currently out of stock.');
      return;
    }
    onAddToCart(
      {
        productId: product.id,
        name: product.name,
        price: product.discountPrice || product.price,
        image: galleryImages[0],
        size: selectedSize,
        color: selectedColorHexName(selectedColor),
        stock: product.stock,
      },
      quantity
    );
  };

  const handleBuyNow = () => {
    if (product.stock === 0) {
      alert('This element is currently out of stock.');
      return;
    }
    // Add to cart first, then trigger cart slide open or navigation directly to user profile checkout
    handleAdd();
    alert('Buy Now activated! Opening checkout drawer.');
    // will auto open custom drawer or checkout
  };

  const handleWhatsAppOrder = () => {
    onQuickCheckoutViaWhatsApp(
      {
        productId: product.id,
        name: product.name,
        price: product.discountPrice || product.price,
        image: galleryImages[0],
        size: selectedSize,
        color: selectedColorHexName(selectedColor),
        stock: product.stock,
      },
      selectedSize,
      selectedColorHexName(selectedColor),
      quantity
    );
  };

  // Convert Color color Hex to descriptive string
  const selectedColorHexName = (hex: string) => {
    if (hex.toUpperCase() === '#0A0A0A' || hex.toUpperCase() === '#000000' || hex.toUpperCase() === '#121212') return 'Jet Black';
    if (hex.toUpperCase() === '#EAEAEA' || hex.toUpperCase() === '#FFFFFF') return 'Optic White';
    if (hex.toUpperCase() === '#5C6B73') return 'Stone Grey';
    if (hex.toUpperCase() === '#333333' || hex.toUpperCase() === '#2F3E46') return 'Charcoal';
    if (hex.toUpperCase() === '#DDA15E') return 'Architect Tan';
    if (hex.toUpperCase() === '#666666' || hex.toUpperCase() === '#7D82B8') return 'Heather Grey';
    return 'Core Edition';
  };

  return (
    <div className="flex-grow max-w-[1440px] mx-auto px-4 md:px-[64px] py-10">
      
      {/* 1. Breadcrumbs matches Screenshot 3 */}
      <nav className="mb-10 text-[10px] font-label-caps tracking-[0.2em] text-secondary flex items-center space-x-2">
        <button onClick={() => onNavigate('home')} className="hover:text-primary transition uppercase">HOME</button>
        <span>/</span>
        <button onClick={() => onNavigate('shop')} className="hover:text-primary transition uppercase">Collections</button>
        <span>/</span>
        <span className="text-primary uppercase truncate max-w-[200px] font-medium">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-[64px] items-start">
        
        {/* LEFT GALLERY PANEL - Screenshot 3 layout */}
        <div className="w-full lg:w-3/5 flex gap-4 md:gap-6 flex-col-reverse md:flex-row">
          
          {/* A. Vertical Thumbnail list */}
          <div className="flex md:flex-col gap-2.5 md:gap-4 flex-wrap md:flex-nowrap w-full md:w-[80px] shrink-0">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`border bg-surface-container aspect-square md:aspect-[3/4] w-16 md:w-full overflow-hidden rounded-none flex-shrink-0 relative ${
                  idx === activeImageIdx ? 'border-primary' : 'border-outline-variant hover:border-secondary'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain object-center bg-zinc-50"
                />
              </button>
            ))}
          </div>

          {/* B. Large Primary Display Box */}
          <div className="flex-grow aspect-[3/4] bg-white overflow-hidden relative border border-surface-container flex items-center justify-center">
            <img
              src={galleryImages[activeImageIdx]}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain object-center transition-transform duration-1000 hover:scale-[1.02]"
            />
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                <span className="border-2 border-white text-white font-label-caps text-xs tracking-[0.2em] uppercase px-6 py-3">
                  SOLD OUT ARCHIVE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT METADATA COURIER - Matches Screenshot 3 */}
        <div className="w-full lg:w-2/5 space-y-8">
          
          {/* Title & Price Header */}
          <div>
            <h1 className="font-display-lg text-[28px] md:text-[36px] tracking-tight text-primary uppercase font-semibold">
              {product.name}
            </h1>
            <div className="flex items-center space-x-3 mt-3 flex-wrap gap-y-2">
              {product.discountPrice ? (
                <>
                  <span className="font-mono text-xl font-semibold text-red-500">
                    ₹{product.discountPrice.toLocaleString()}
                  </span>
                  <span className="font-mono text-sm text-secondary line-through">
                    ₹{product.price.toLocaleString()}
                  </span>
                  <span className="text-emerald-700 font-extrabold font-sans text-[10px] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 uppercase tracking-wider rounded-none shrink-0">
                    {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                  </span>
                </>
              ) : (
                <span className="font-mono text-xl font-semibold text-primary">
                  ₹{product.price.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Core description block */}
          <p className="font-body-md text-sm text-secondary leading-relaxed border-b border-outline-variant pb-6">
            {product.description}
          </p>

          {/* COLOR SELECTION */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline font-label-caps text-[10px] tracking-widest text-secondary text-right">
              <span className="font-semibold uppercase text-left">Color</span>
              <span className="uppercase font-medium text-primary">
                {selectedColorHexName(selectedColor)}
              </span>
            </div>
            
            <div className="flex space-x-3.5">
              {product.colors.map(col => (
                <button
                  key={col}
                  onClick={() => setSelectedColor(col)}
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                    selectedColor === col ? 'ring-1 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: col, borderColor: '#D1D1D1' }}
                  title={selectedColorHexName(col)}
                />
              ))}
            </div>
          </div>

          {/* SIZE SELECTION */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-[10px] font-label-caps tracking-widest text-secondary">
              <span className="font-semibold uppercase">Size</span>
              <button 
                onClick={() => alert(`Playbook Studios Architectural Sizing: True to boxy streetwear form. Order your high-frequency usual sizing.`)}
                className="underline uppercase font-medium hover:text-primary transition"
              >
                Size Guide
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`border w-12 h-12 flex items-center justify-center text-xs font-mono select-none transition ${
                    selectedSize === size
                      ? 'bg-primary text-on-primary border-primary font-semibold'
                      : 'border-outline-variant hover:border-primary text-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* QUANTITY CHASSIS */}
          <div className="space-y-3">
            <span className="font-label-caps text-[10px] tracking-widest text-secondary block font-semibold uppercase">
              Quantity
            </span>

            <div className="flex items-center border border-outline-variant w-[120px] justify-between h-12 bg-white">
              <button
                disabled={quantity <= 1 || product.stock === 0}
                onClick={() => handleQtyChange('dec')}
                className="w-10 h-full flex items-center justify-center hover:bg-surface-container-low transition disabled:opacity-30"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-sm text-primary font-semibold">{quantity}</span>
              <button
                disabled={product.stock === 0}
                onClick={() => handleQtyChange('inc')}
                className="w-10 h-full flex items-center justify-center hover:bg-surface-container-low transition disabled:opacity-30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ACTION BUTTON CHAINS (Screenshot 3 style: Add to Cart / Buy Now / WhatsApp Checkout) */}
          <div className="space-y-3 pt-4 border-t border-outline-variant">
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="w-full bg-primary text-on-primary py-4 font-label-caps text-xs tracking-[0.15em] uppercase hover:bg-opacity-90 transition active:scale-[0.99] select-none rounded-none flex items-center justify-center space-x-2 disabled:bg-on-primary-fixed-variant"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2]" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="w-full border border-primary text-primary py-4 font-label-caps text-xs tracking-[0.15em] uppercase hover:bg-surface-container-low transition active:scale-[0.99] select-none rounded-none flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4 stroke-[1.5]" />
              <span>Buy It Now</span>
            </button>

            {/* Premium WhatsApp button (Screenshot 3) */}
            <button
              onClick={handleWhatsAppOrder}
              disabled={product.stock === 0}
              className="w-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-green-700 hover:text-green-800 py-4 font-label-caps text-xs tracking-[0.15em] uppercase transition active:scale-[0.99] select-none rounded-none flex items-center justify-center space-x-2 border-dashed"
            >
              {/* WhatsApp custom outline SVG */}
              <svg 
                className="w-4.5 h-4.5 fill-current" 
                viewBox="0 0 24 24"
              >
                <path d="M12.012 2c-5.523 0-10 4.477-10 10a9.982 9.982 0 0 0 1.457 5.144L2.012 22l5.02-1.313A9.957 9.957 0 0 0 12.012 22c5.522 0 10-4.477 10-10s-4.478-10-10-10zm.017 18.25a8.21 8.21 0 0 1-4.19-1.144l-.3-.178-3.111.815.829-3.033-.196-.312a8.204 8.204 0 0 1-1.26-4.382c.004-4.532 3.691-8.215 8.227-8.215 2.193.001 4.256.855 5.808 2.41a8.163 8.163 0 0 1 2.404 5.81c-.004 4.533-3.691 8.216-8.211 8.216z"/>
              </svg>
              <span>Order via WhatsApp</span>
            </button>
          </div>

          {/* ACCORDIONS SECTIONS - Highly clean minimal detail switches */}
          <div className="border-t border-outline-variant pt-2 space-y-1 text-xs">
            
            {/* Details & Care section */}
            <div className="border-b border-outline-variant py-3.5">
              <button
                onClick={() => setOpenSection(openSection === 'details' ? null : 'details')}
                className="w-full flex justify-between items-center font-label-caps text-[10px] tracking-widest text-primary uppercase font-semibold text-left"
              >
                <span>Details & Care</span>
                {openSection === 'details' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {openSection === 'details' && (
                <div className="mt-3 text-secondary space-y-2 leading-relaxed font-body-md text-xs">
                  <p>• 100% fine long-staple cotton / industrial double layer blend.</p>
                  <p>• Preshrunk technique to maximize lifetime alignment stability.</p>
                  <p>• Cold gentle wash inside-out with dark neutral detergents. Hang dry naturally.</p>
                </div>
              )}
            </div>

            {/* Shipping & Returns section */}
            <div className="border-b border-outline-variant py-3.5">
              <button
                onClick={() => setOpenSection(openSection === 'shipping' ? null : 'shipping')}
                className="w-full flex justify-between items-center font-label-caps text-[10px] tracking-widest text-primary uppercase font-semibold text-left"
              >
                <span>Shipping & Returns</span>
                {openSection === 'shipping' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {openSection === 'shipping' && (
                <div className="mt-3 text-secondary space-y-2 leading-relaxed font-body-md text-xs">
                  <p>• Premium Global tracked courier dispatch within 48 studio hours.</p>
                  <p>• Returns accepted on structured garments in original pristine tags within 14 days of receipt.</p>
                </div>
              )}
            </div>

            {/* Authenticity section */}
            <div className="border-b border-outline-variant py-3.5">
              <button
                onClick={() => setOpenSection(openSection === 'auth' ? null : 'auth')}
                className="w-full flex justify-between items-center font-label-caps text-[10px] tracking-widest text-primary uppercase font-semibold text-left"
              >
                <span>Authenticity</span>
                {openSection === 'auth' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {openSection === 'auth' && (
                <div className="mt-3 text-secondary space-y-2 leading-relaxed font-body-md text-xs">
                  <p>• Playbook Studios elements are embedded with high-density security NFC signature chips.</p>
                  <p>• 100% verified authentic production. Crafted strictly in premium atelier facilities.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETE THE LOOK SECTION - Screenshot 3 design block */}
      {relatedProducts.length > 0 && (
        <section className="mt-[100px] border-t border-outline-variant pt-16">
          <div className="mb-10 text-center md:text-left">
            <span className="font-label-caps text-[10px] tracking-[0.2em] text-secondary uppercase block mb-1">
              FINISH THE SILHOUETTE
            </span>
            <h2 className="font-display-lg text-[22px] md:text-[28px] tracking-tight text-primary uppercase">
              Complete The Look
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map(lookProd => (
              <div
                key={lookProd.id}
                onClick={() => {
                  onNavigate('product', { id: lookProd.id });
                  setActiveImageIdx(0);
                  setQuantity(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group cursor-pointer flex flex-col"
              >
                <div className="bg-surface-container aspect-[3/4] overflow-hidden mb-4 relative flex items-center justify-center bg-zinc-50">
                  <img
                    src={lookProd.images[0]}
                    alt={lookProd.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition duration-700"
                  />
                </div>
                <h4 className="font-label-caps text-[10px] tracking-widest text-secondary uppercase">
                  {lookProd.category}
                </h4>
                <h3 className="font-body-md text-sm text-primary font-medium mt-1 group-hover:underline truncate">
                  {lookProd.name}
                </h3>
                <span className="font-mono text-xs text-primary font-medium mt-0.5">₹{lookProd.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
