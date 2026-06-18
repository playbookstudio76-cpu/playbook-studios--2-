import { ArrowRight, Instagram } from 'lucide-react';
import { Product, SocialConfig, Category, StoreConfig } from '../types';

interface HomeViewProps {
  products: Product[];
  onNavigate: (view: string, props?: any) => void;
  socialConfig?: SocialConfig | null;
  categories: Category[];
  storeConfig?: StoreConfig | null;
}

export default function HomeView({ products, onNavigate, socialConfig, categories, storeConfig }: HomeViewProps) {
  const sampleProductIds = ['pb-001', 'pb-002', 'pb-003', 'pb-004', 'pb-005', 'pb-006', 'pb-007', 'pb-008', 'pb-009', 'pb-010'];
  // Filter out any default sample/preset products so that we only showcase newly added ones
  const userProducts = products.filter(p => !sampleProductIds.includes(p.id));

  // Determine arrivals and featured listings using only user custom products
  const arrivalsList = userProducts.slice(0, 3);
  
  let featuredProducts = userProducts.filter(p => p.featured).slice(0, 4);
  if (featuredProducts.length === 0 && userProducts.length > 0) {
    featuredProducts = userProducts.slice(0, 4);
  }

  return (
    <div className="flex-grow bg-background">
      {/* 1. HERO BANNER - Stunning High Contrast Editorial Presentation */}
      <section className="relative h-[85vh] md:h-[90vh] bg-surface-container overflow-hidden">
        {/* Full bleeds background image matching color and theme of reference */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[4000ms] hover:scale-105"
          style={{ 
            backgroundImage: `url('${storeConfig?.heroImageUrl || 'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1520&auto=format&fit=crop'}')` 
          }}
        />
        {/* Soft layout filter overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/10 md:from-black/15" />

        {/* Dynamic Card Container positioned exactly like Screenshot 2 (Left Bottom) */}
        <div className="absolute bottom-4 sm:bottom-[48px] left-4 right-4 sm:right-auto sm:left-[64px] bg-white/95 backdrop-blur-[2px] p-5 sm:p-8 md:p-12 max-w-[560px] border border-outline-variant duration-500 ease-out transform translate-y-0">
          <p className="font-label-caps text-[9px] sm:text-[10px] tracking-[0.2em] text-secondary uppercase mb-2">
            FALL / WINTER 2026
          </p>
          <h1 className="font-display-lg text-[22px] sm:text-[32px] md:text-[48px] leading-tight tracking-tight font-medium text-primary mb-2 sm:mb-4 uppercase">
            THE NEW STANDARD
          </h1>
          <p className="font-body-md text-[11px] sm:text-xs md:text-sm text-secondary leading-relaxed mb-4 sm:mb-8 line-clamp-3 sm:line-clamp-none">
            A study in structured silhouettes and fluid fabrics. Redefining modern utility for the urban environment. Made with premium, wind-resistant double cotton weaving.
          </p>
          
          <div className="flex flex-row gap-2 sm:gap-4">
            <button
              onClick={() => onNavigate('shop')}
              className="flex-1 sm:flex-none bg-primary text-on-primary font-button-text text-[10.5px] sm:text-xs uppercase tracking-widest py-3 sm:py-4 px-4 sm:px-8 select-none hover:bg-opacity-95 transform hover:-translate-y-[1px] transition duration-200 text-center"
            >
              SHOP NOW
            </button>
            <button
              onClick={() => onNavigate('shop', { filter: 'editorial' })}
              className="flex-1 sm:flex-none border border-primary bg-transparent text-primary font-button-text text-[10.5px] sm:text-xs uppercase tracking-widest py-3 sm:py-4 px-4 sm:px-8 hover:bg-surface-container-low transition duration-200 text-center"
            >
              EDITORIAL
            </button>
          </div>
        </div>
      </section>

      {/* 2. NEW ARRIVALS - Perfect Replica of Screenshot 2 Section */}
      <section className="py-[80px] md:py-[120px] max-w-[1440px] mx-auto px-4 md:px-[64px]">
        <div className="flex justify-between items-baseline mb-12 border-b border-outline-variant pb-4">
          <h2 className="font-display-lg text-[24px] md:text-[32px] tracking-tight text-primary">
            New Arrivals
          </h2>
          <button
            onClick={() => onNavigate('shop')}
            className="group flex items-center space-x-1 font-label-caps text-xs text-secondary hover:text-primary transition-colors tracking-widest uppercase"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 3-Column Product feed */}
        {arrivalsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-8">
            {arrivalsList.map(item => (
              <div 
                key={item.id}
                onClick={() => onNavigate('product', { id: item.id })}
                className="group cursor-pointer flex flex-col"
              >
                {/* Image Frame */}
                <div className="bg-surface-container-low overflow-hidden aspect-[3/4] mb-4 relative">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
                  />
                  <div className="absolute hover:opacity-10 opacity-0 inset-0 bg-black" />
                </div>
                
                {/* Product Metadata formatted exactly like Screenshot 2 */}
                <div className="flex justify-between items-start pt-1 font-label-caps text-xs">
                  <span className="text-secondary text-[10px] tracking-[0.15em] uppercase">
                    {item.category}
                  </span>
                  <span className="text-primary font-semibold">
                    ₹{item.price.toLocaleString()}
                  </span>
                </div>
                <h3 className="font-body-md text-sm text-primary font-medium mt-1 group-hover:underline decoration-1">
                  {item.name}
                </h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-outline-variant bg-surface-container-low max-w-xl mx-auto px-6 w-full">
            <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-semibold">STUDIO ARCHIVE EMPTY</p>
            <p className="font-headline-sm text-sm text-primary mt-2 uppercase">No custom models or looks seeded yet</p>
            <p className="font-body-md text-xs text-secondary mt-1">
              Whenever you publish a look in the Admin dashboard, your new garments will immediately populate this showcase.
            </p>
            <button
              onClick={() => onNavigate('shop')}
              className="mt-6 border border-primary text-xs font-label-caps px-6 py-2.5 tracking-widest uppercase hover:bg-primary hover:text-white transition duration-200"
            >
              Explore Catalog
            </button>
          </div>
        )}
      </section>

      {/* 3. FEATURED SPREAD - Minimal Editorial Banner with high impact */}
      <section className="bg-primary text-on-primary py-[100px] text-center px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="font-label-caps text-[10px] tracking-[0.25em] text-on-primary-fixed-variant uppercase">
            STREETWEAR DICTIONARY
          </p>
          <h2 className="font-display-lg text-[28px] md:text-[40px] leading-tight tracking-[0.01em] uppercase font-light">
            "PLAYBOOK DOES NOT DICTATE TRENDS. WE RECORD ARCHITECTURE ON TEXTILE."
          </h2>
          <div className="w-12 h-[1px] bg-white/40 mx-auto"></div>
          <button 
            onClick={() => onNavigate('shop')}
            className="font-label-caps text-xs tracking-widest text-on-primary underline underline-offset-8 uppercase hover:opacity-75 transition"
          >
            DISCOVER ARCHIVE SEEDING
          </button>
        </div>
      </section>

      {/* 4. BEST SELLERS - Bento Grid presentation */}
      {featuredProducts.length > 0 && (
        <section className="py-[80px] md:py-[120px] max-w-[1440px] mx-auto px-4 md:px-[64px]">
          <div className="mb-12 border-b border-outline-variant pb-4">
            <span className="font-label-caps text-[10px] tracking-[0.2em] text-secondary uppercase block mb-1">
              CURATED PICKS
            </span>
            <h2 className="font-display-lg text-[24px] md:text-[32px] tracking-tight text-primary uppercase">
              Current Best Sellers
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {featuredProducts.map(prod => (
              <div 
                key={prod.id} 
                onClick={() => onNavigate('product', { id: prod.id })}
                className="group cursor-pointer flex flex-col"
              >
                <div className="bg-surface-container aspect-[3/4] overflow-hidden mb-4 relative">
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
                  />
                  {prod.discountPrice && (
                    <div className="absolute top-3 left-3 bg-secondary text-white text-[9px] font-label-caps px-2 py-1 uppercase tracking-widest">
                      SALE
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-baseline text-xs uppercase font-label-caps">
                  <span className="text-secondary text-[10px] tracking-wider truncate mr-2">
                    {prod.category}
                  </span>
                  <div className="flex space-x-1">
                    {prod.discountPrice ? (
                      <>
                        <span className="text-red-500 font-semibold">₹{prod.discountPrice.toLocaleString()}</span>
                        <span className="text-on-primary-fixed-variant line-through font-normal">₹{prod.price.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-primary font-semibold">₹{prod.price.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <h3 className="font-body-md text-sm text-primary font-medium mt-1 truncate">
                  {prod.name}
                </h3>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. SHOP BY CATEGORY SECTION */}
      <section className="pb-[100px] max-w-[1440px] mx-auto px-4 md:px-[64px]">
        <h3 className="font-label-caps text-xs tracking-widest uppercase mb-6 text-primary">
          Shop Categories
        </h3>
        
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map(cat => {
              // Priority is category's custom imageUrl, fallback is products in this category
              const catImg = cat.imageUrl || userProducts.find(
                p => p.category.toLowerCase() === cat.id.toLowerCase() || p.category.toLowerCase() === cat.name.toLowerCase()
              )?.images[0] || null;

              return (
                <div 
                  key={cat.id}
                  onClick={() => onNavigate('shop', { category: cat.id })}
                  className="relative aspect-[4/5] overflow-hidden group cursor-pointer bg-zinc-50 border border-outline-variant hover:border-zinc-400 transition-all flex flex-col justify-between p-6 rounded-none"
                >
                  {catImg ? (
                    <>
                      <img 
                        src={catImg} 
                        alt={cat.name} 
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90 z-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-95 group-hover:opacity-100 transition-opacity z-10" />
                      <div className="absolute bottom-6 left-6 text-white text-left z-20">
                        <span className="font-label-caps text-[9px] tracking-widest text-zinc-300 block uppercase font-mono">Category</span>
                        <span className="font-headline-sm text-lg md:text-xl font-semibold tracking-tight mt-1 block uppercase font-bold">
                          {cat.name}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col justify-between h-full w-full z-10">
                      <div>
                        <span className="font-mono text-[9px] tracking-widest text-zinc-400 block uppercase font-semibold">EMPTY ARCHIVE</span>
                      </div>
                      <div className="text-left">
                        <span className="font-label-caps text-[9px] tracking-widest text-[#5d5f5f] block uppercase font-mono">Category</span>
                        <span className="font-headline-sm text-base md:text-lg font-semibold tracking-tight mt-1 block text-primary uppercase font-bold">
                          {cat.name}
                        </span>
                        <span className="mt-2 text-[9px] font-semibold text-zinc-400 group-hover:text-primary transition-colors font-mono tracking-widest inline-block uppercase">
                          ADD PRODUCTS +
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-outline-variant bg-surface-container-low text-secondary font-mono text-xs">
            NO ACTIVE SECTIONS SEEDED // SETUP CUSTOM LOOK CATEGORIES FROM ADMIN PANEL
          </div>
        )}
      </section>

      {/* 5B. THE PLAYBOOK ATELIER LIVE FEED / INSTAGRAM PORTAL */}
      {(() => {
        const activeImages = (socialConfig?.instagramImages || []).filter(img => img && img.trim() !== '');
        const hasInsta = socialConfig?.instagram && socialConfig.instagram.trim() !== '';
        
        if (!hasInsta && activeImages.length === 0) {
          return null;
        }

        const getInstaHandle = () => {
          if (!hasInsta) return 'STUDIO';
          try {
            const cleanUrl = socialConfig.instagram!.trim();
            const url = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
            const pathName = url.pathname.replace(/\//g, '');
            return pathName ? `@${pathName.toUpperCase()}` : 'STUDIO';
          } catch {
            return 'STUDIO';
          }
        };

        return (
          <section className="pb-[100px] border-t border-outline-variant pt-[80px] max-w-[1440px] mx-auto px-4 md:px-[64px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 space-y-4 md:space-y-0">
              <div>
                <span className="font-label-caps text-[10px] tracking-[0.25em] text-secondary uppercase block mb-1">
                  STUDIO PORTAL
                </span>
                <h3 className="font-display-lg text-2xl md:text-3xl tracking-tight text-primary uppercase font-light">
                  GALLERY SEEDING // {getInstaHandle()}
                </h3>
              </div>
              {hasInsta && (
                <a 
                  href={socialConfig.instagram!.trim().startsWith('http') ? socialConfig.instagram!.trim() : `https://${socialConfig.instagram!.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 border border-outline-variant px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-primary hover:text-on-primary transition duration-300"
                >
                  <Instagram className="w-4 h-4" />
                  <span>FOLLOW INSTAGRAM</span>
                </a>
              )}
            </div>

            {/* Grid items */}
            {activeImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {activeImages.slice(0, 6).map((imgUrl, idx) => (
                  <a
                    key={idx}
                    href={hasInsta ? (socialConfig.instagram!.trim().startsWith('http') ? socialConfig.instagram!.trim() : `https://${socialConfig.instagram!.trim()}`) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-[1/1] block overflow-hidden bg-zinc-200 border border-outline-variant"
                  >
                    <img
                      src={imgUrl}
                      alt={`Studio look ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-primary/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-on-primary">
                      <Instagram className="w-6 h-6 mb-1 text-white" />
                      <span className="font-label-caps text-[9px] tracking-widest uppercase font-bold text-white">VIEW LOOK</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-outline-variant text-secondary font-mono text-xs">
                LOOKBOOK ALBUM EMPTY // SEED HIGH-CONTRAST LOOK PHOTOS VIA ADMIN PANEL
              </div>
            )}
          </section>
        );
      })()}

      {/* 6. EDITORIAL NEWSLETTER SIGNUP */}
      <section className="bg-surface-container-low border-t border-b border-outline-variant py-[100px]">
        <div className="max-w-xl mx-auto px-4 text-center space-y-6">
          <span className="font-label-caps text-[10px] tracking-[0.25em] text-secondary uppercase block">
            PLAYBOOK COURIER
          </span>
          <h2 className="font-display-lg text-[28px] md:text-[36px] tracking-tight text-primary">
            Subscribe To Our Seeding Lists
          </h2>
          <p className="font-body-md text-xs md:text-sm text-secondary max-w-md mx-auto leading-relaxed">
            Gain early priority authorization to new architectural standard streetwear drops, seasonal collections, and limited studio archival seedings.
          </p>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              alert('Authorization Successful! Thank you for subscribing to Playbook Studios seeding lists.');
              (e.target as HTMLFormElement).reset();
            }} 
            className="pt-4 flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input 
              type="email" 
              required
              placeholder="YOUR EMAIL ADDRESS" 
              className="flex-grow bg-white border border-outline-variant text-[12px] font-label-caps tracking-widest font-normal px-4 py-3 pb-3 border-r focus:outline-none focus:border-primary text-primary text-center sm:text-left placeholder-secondary/70"
            />
            <button
              type="submit"
              className="bg-primary text-on-primary font-button-text font-semibold text-xs tracking-widest px-6 py-3 uppercase hover:opacity-90 active:scale-95 transition"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
