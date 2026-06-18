import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { Product } from '../types';

interface ShopViewProps {
  products: Product[];
  onNavigate: (view: string, props?: any) => void;
  initialFilters?: { category?: string; filter?: string };
}

export default function ShopView({ products, onNavigate, initialFilters }: ShopViewProps) {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync category filter if user clicked from Home or Header
  useEffect(() => {
    if (initialFilters?.category) {
      setSelectedCategory(initialFilters.category);
      setCurrentPage(1);
    }
    if (initialFilters?.filter === 'new') {
      setSortBy('Newest');
      setSelectedCategory('all');
      setCurrentPage(1);
    }
  }, [initialFilters]);

  // Categories & Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
      outerwear: 0,
      tops: 0,
      bottoms: 0,
      accessories: 0,
    };
    products.forEach(p => {
      const cat = p.category.toLowerCase();
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts[cat] = 1;
      }
    });
    return counts;
  }, [products]);

  // Size list options from prompt and screenshot 1
  const sizesList = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Filter & Sort core logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
    }

    // Size
    if (selectedSize) {
      result = result.filter(p => p.sizes.includes(selectedSize));
    }

    // Price
    result = result.filter(p => {
      const actualPrice = p.discountPrice || p.price;
      return actualPrice <= maxPrice;
    });

    // Sort By
    if (sortBy === 'Newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'Price: Low-High') {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === 'Price: High-Low') {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === 'A-Z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, selectedCategory, searchQuery, selectedSize, maxPrice, sortBy]);

  // Pagination parameters (6 per page as shown in screenshot)
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSize(null);
    setMaxPrice(10000);
    setSortBy('Newest');
    setCurrentPage(1);
  };

  return (
    <div className="flex-grow max-w-[1440px] mx-auto px-4 md:px-[64px] py-10">
      
      {/* Mobile-First Collapsible Filter Header */}
      <div className="lg:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4 mb-6">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full sm:w-auto flex items-center justify-between border border-primary px-4 py-3 font-mono text-[11px] tracking-widest uppercase font-semibold text-primary transition-colors hover:bg-neutral-50 active:bg-neutral-100"
        >
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showMobileFilters ? '✕ CLOSE FILTERS' : '⚡ FILTERS & SEARCH'}</span>
          </div>
          <span className="bg-primary text-on-primary text-[9px] px-1.5 py-0.5 ml-3 font-bold rounded-full">
            { (selectedCategory !== 'all' ? 1 : 0) + (selectedSize ? 1 : 0) + (searchQuery.trim() !== '' ? 1 : 0) + (maxPrice < 10000 ? 1 : 0) }
          </span>
        </button>
        <div className="flex items-center justify-between sm:justify-end gap-4 text-[10px] font-mono text-secondary uppercase">
          <span>{filteredProducts.length} architectural items</span>
          {((selectedCategory !== 'all') || selectedSize || searchQuery || maxPrice < 10000) && (
            <button 
              onClick={resetAllFilters}
              className="text-red-500 hover:underline hover:text-red-600 font-semibold"
            >
              Reset All
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* SIDEBAR FILTERS - Match Screenshot 1 */}
        <aside className={`w-full lg:w-[260px] flex-shrink-0 space-y-10 border-b border-outline-variant pb-8 lg:border-b-0 lg:pb-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          
          {/* A. Bottom-bordered Search Input */}
          <div className="relative border-b border-outline-variant pb-2 flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search products..."
              className="bg-transparent border-none text-sm text-primary placeholder-on-tertiary-container focus:outline-none w-full pr-8"
            />
            <Search className="w-4 h-4 text-on-tertiary-container absolute right-0" />
          </div>

          {/* B. Category Filter */}
          <div className="space-y-4">
            <h4 className="font-label-caps text-[10px] tracking-[0.2em] text-secondary uppercase font-semibold">
              Category
            </h4>
            <div className="space-y-2.5 font-body-md text-sm text-primary">
              {[
                { id: 'all', name: 'All' },
                { id: 'outerwear', name: 'Outerwear' },
                { id: 'tops', name: 'Tops' },
                { id: 'bottoms', name: 'Bottoms' },
                { id: 'accessories', name: 'Accessories' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`flex justify-between w-full hover:text-black hover:font-medium transition-all text-left ${
                    selectedCategory === cat.id ? 'text-primary font-semibold' : 'text-on-surface-variant'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="font-mono text-xs text-on-tertiary-container">
                    {categoryCounts[cat.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* C. Size Filters as Grid Blocks (Screenshot 1: S is highlighted) */}
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <h4 className="font-label-caps text-[10px] tracking-[0.2em] text-secondary uppercase font-semibold">
                Size
              </h4>
              {selectedSize && (
                <button 
                  onClick={() => setSelectedSize(null)}
                  className="font-label-caps text-[8px] tracking-[0.1em] text-red-500 uppercase hover:underline"
                >
                  Clear size
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {sizesList.map(size => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size === selectedSize ? null : size);
                    setCurrentPage(1);
                  }}
                  className={`border py-2 text-center text-xs font-mono rounded-none select-none transition-all ${
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

          {/* D. Price Filtration Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-baseline font-label-caps text-[10px]">
              <h4 className="tracking-[0.2em] text-secondary uppercase font-semibold">
                Price
              </h4>
              <span className="text-primary font-medium font-mono">₹{maxPrice} max</span>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-primary bg-outline-variant h-[2px] cursor-ew-resize focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-secondary pt-2">
                <span>₹0</span>
                <span>₹10,000+</span>
              </div>
            </div>
          </div>

          {/* Filter Reset */}
          <button
            onClick={resetAllFilters}
            className="w-full text-center border border-outline-variant hover:border-primary py-3 font-label-caps text-[10px] tracking-widest uppercase transition-all duration-300"
          >
            Clear All Filters
          </button>
        </aside>

        {/* MAIN PRODUCT GRID PANELS */}
        <main className="flex-grow">
          
          {/* Header toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant pb-6 mb-8 gap-4">
            <div>
              <h1 className="font-display-lg text-[32px] md:text-[40px] tracking-tight text-primary uppercase font-light">
                {selectedCategory === 'all' ? 'Shop All' : selectedCategory}
              </h1>
              <p className="font-mono text-xs text-secondary mt-1">
                Showing {filteredProducts.length} of {products.length} architectural elements
              </p>
            </div>

            {/* Sorting Selection (matching Screenshot 1: Sort By Newest with precise styling) */}
            <div className="flex items-center space-x-3 text-sm self-end sm:self-auto">
              <span className="font-label-caps text-[10px] tracking-widest text-secondary uppercase">
                Sort By
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-surface-container-low border border-outline-variant py-2 pl-4 pr-10 text-xs font-label-caps tracking-widest uppercase rounded-none focus:outline-none focus:border-primary text-primary"
                >
                  <option value="Newest">Newest</option>
                  <option value="Price: Low-High">Price: Low-High</option>
                  <option value="Price: High-Low">Price: High-Low</option>
                  <option value="A-Z">A-Z</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-secondary absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Grid list elements */}
          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {paginatedProducts.map(prod => {
                const isOutOfStock = prod.stock === 0;
                const isLowStock = prod.stock > 0 && prod.stock <= 5;
                const finalPrice = prod.discountPrice || prod.price;

                return (
                  <div
                    key={prod.id}
                    onClick={() => onNavigate('product', { id: prod.id })}
                    className="group cursor-pointer flex flex-col relative"
                  >
                    {/* Badge */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1">
                      {isOutOfStock ? (
                        <span className="bg-red-600 text-white text-[9px] font-label-caps tracking-widest px-2 py-0.5 uppercase">
                          OUT OF STOCK
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-[#ba1a1a] text-white text-[9px] font-label-caps tracking-widest px-2 py-0.5 uppercase animate-pulse">
                          LOW STOCK ({prod.stock})
                        </span>
                      ) : null}
                      
                      {prod.discountPrice && (
                        <span className="bg-rose-600 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 uppercase">
                          {Math.round(((prod.price - prod.discountPrice) / prod.price) * 100)}% OFF
                        </span>
                      )}
                    </div>

                    {/* Image Box */}
                    <div className="bg-surface-container aspect-[3 / 4] overflow-hidden mb-4 relative z-0 flex items-center justify-center bg-zinc-50">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain object-center group-hover:scale-[1.03] transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-transparent hover:bg-black/5 transition duration-300" />
                    </div>

                    {/* Meta info matching Screenshot 1 bottom layout */}
                    <div className="flex justify-between items-baseline text-xs font-label-caps mt-1">
                      <span className="text-secondary text-[10px] tracking-widest uppercase mr-3 truncate max-w-[170px]">
                        {prod.name}
                      </span>
                      <span className="text-primary font-semibold font-mono tracking-tight shrink-0">
                        {prod.discountPrice ? (
                          <span className="space-x-1 flex items-center justify-end">
                            <span className="text-red-500">₹{prod.discountPrice.toLocaleString()}</span>
                            <span className="text-on-primary-fixed-variant line-through font-normal text-[10px]">₹{prod.price.toLocaleString()}</span>
                            <span className="text-emerald-600 font-extrabold text-[8.5px] lowercase normal-case tracking-normal ml-1 shrink-0">
                              ({Math.round(((prod.price - prod.discountPrice) / prod.price) * 100)}% off)
                            </span>
                          </span>
                        ) : (
                          `₹${prod.price.toLocaleString()}`
                        )}
                      </span>
                    </div>

                    {/* Subtle color palette note */}
                    <p className="font-body-md text-xs text-on-primary-fixed-variant mt-1">
                      {prod.colorName || (prod.category === 'outerwear' ? 'Core Seeding' : 'Minimal Grey')}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-outline-variant bg-surface-container-low max-w-xl mx-auto">
              <SlidersHorizontal className="w-8 h-8 mx-auto text-secondary mb-3 stroke-[1]" />
              <p className="font-headline-sm text-[16px] text-primary">No Structural Elements Match These Standards</p>
              <p className="font-body-md text-xs text-secondary mt-1">Adjust limits or reset filters to explore.</p>
              <button
                onClick={resetAllFilters}
                className="mt-4 border border-primary text-xs font-label-caps px-6 py-2 tracking-widest uppercase hover:bg-primary hover:text-white transition"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* PAGE PAGINATION - Perfect replica of Screenshot 1 [ < ] [ 1 ] [ 2 ] [ ... ] [ 8 ] [ > ] */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-1 md:space-x-1.5 mt-16 pt-8 border-t border-outline-variant">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="border border-outline-variant hover:border-primary disabled:opacity-40 w-10 h-10 select-none flex items-center justify-center font-mono text-sm transition"
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 select-none transition flex items-center justify-center font-mono text-sm border ${
                      currentPage === pageNum
                        ? 'bg-primary text-on-primary border-primary font-semibold'
                        : 'border-outline-variant hover:border-primary text-primary'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Mock ending ellipses to matching screen visual look */}
              {totalPages < 8 && (
                <>
                  <span className="px-1 text-secondary font-mono">...</span>
                  <button
                    onClick={() => alert('Demo limits: Page 8 redirected to live database archives!')}
                    className="border border-outline-variant hover:border-primary w-10 h-10 select-none flex items-center justify-center font-mono text-sm transition"
                  >
                    8
                  </button>
                </>
              )}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="border border-outline-variant hover:border-primary disabled:opacity-40 w-10 h-10 select-none flex items-center justify-center font-mono text-sm transition"
              >
                &gt;
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
