import { Search, User, ShoppingBag, LogOut, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentUser: UserProfile | null;
  cartCount: number;
  onNavigate: (view: string, extraParams?: Record<string, any>) => void;
  onOpenCart: () => void;
  onLogout: () => void;
  currentView: string;
}

export default function Header({
  currentUser,
  cartCount,
  onNavigate,
  onOpenCart,
  onLogout,
  currentView
}: HeaderProps) {
  return (
    <header className="border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-40 transition-all">
      <div className="max-w-[1440px] mx-auto px-4 md:px-[64px] h-[80px] flex items-center justify-between">
        {/* Navigation Categories - Left */}
        <nav className="hidden lg:flex items-center space-x-8">
          <button
            onClick={() => onNavigate('shop', { category: 'all' })}
            className={`font-label-caps text-xs tracking-widest uppercase transition-all duration-300 hover:opacity-60 ${
              currentView === 'shop' ? 'underline decoration-1 underline-offset-8 font-semibold' : 'text-secondary'
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => onNavigate('shop', { filter: 'new' })}
            className="font-label-caps text-xs tracking-widest uppercase text-secondary transition-all hover:opacity-60"
          >
            New Arrivals
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="font-label-caps text-xs tracking-widest uppercase text-secondary transition-all hover:opacity-60"
          >
            Editorial
          </button>
          <button
            onClick={() => onNavigate('shop', { category: 'all' })}
            className="font-label-caps text-xs tracking-widest uppercase text-secondary transition-all hover:opacity-60"
          >
            Archive
          </button>
        </nav>

        {/* Mobile Menu Trigger (just moves back to shop/home) */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => onNavigate('shop')}
            className="font-label-caps text-xs tracking-widest text-primary font-bold mr-4"
          >
            Shop All
          </button>
        </div>

        {/* Logo - Centered */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="font-display-lg font-bold tracking-[-0.04em] text-[24px] md:text-[32px] uppercase outline-none focus:outline-none text-primary cursor-pointer hover:opacity-85"
          >
            PLAYBOOK STUDIOS
          </button>
        </div>

        {/* Actions - Right */}
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Admin Tag indicator if role === admin */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className="hidden md:flex items-center space-x-1 px-3 py-1 border border-primary text-[10px] font-label-caps tracking-wider uppercase text-on-background animate-pulse"
            >
              <ShieldAlert className="w-3 select-none h-3 text-red-600" />
              <span>Admin Studio</span>
            </button>
          )}

          {/* Search Trigger (focuses or switches to shop) */}
          <button
            onClick={() => onNavigate('shop')}
            className="text-on-background hover:opacity-60 transition-opacity"
            title="Search products"
          >
            <Search className="w-5 h-5 stroke-[1.5]" />
          </button>

          {/* User Account / Login */}
          {currentUser ? (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate(currentUser.role === 'admin' ? 'admin' : 'dashboard')}
                className="text-on-background hover:opacity-60 transition-opacity flex items-center space-x-1"
                title="Account Settings"
              >
                <User className="w-5 h-5 stroke-[1.5]" />
                <span className="hidden md:inline font-label-caps text-[10px] uppercase text-secondary">
                  {currentUser.firstName}
                </span>
              </button>
              <button
                onClick={onLogout}
                className="text-secondary hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="text-on-background hover:opacity-60 transition-opacity"
              title="Sign In"
            >
              <User className="w-5 h-5 stroke-[1.5]" />
            </button>
          )}

          {/* Cart Bag */}
          <button
            onClick={onOpenCart}
            className="relative text-on-background hover:opacity-60 transition-opacity p-1"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-[1px] -right-[1px] bg-primary text-on-primary text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-surface-container-lowest">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
