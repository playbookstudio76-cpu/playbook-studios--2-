import { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { CartItem, UserProfile } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (deliveryAddress: string) => void;
  currentUser: UserProfile | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  currentUser,
}: CartDrawerProps) {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateField, setStateField] = useState('');
  const [pincode, setPincode] = useState('');
  const [validationErr, setValidationErr] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValidationErr('');
      if (currentUser) {
        const defaultAddress = currentUser.addresses?.find(a => a.isDefault);
        if (defaultAddress) {
          setStreet(defaultAddress.street || '');
          setCity(defaultAddress.city || '');
          setStateField(defaultAddress.state || '');
          setPincode(defaultAddress.zip || '');
        } else {
          setStreet('');
          setCity('');
          setStateField('');
          setPincode('');
        }
      } else {
        setStreet('');
        setCity('');
        setStateField('');
        setPincode('');
      }
    }
  }, [currentUser, isOpen]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-body-md text-on-background">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[1.5px] transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        {/* Drawer Body Panel */}
        <div className="w-screen max-w-md bg-white flex flex-col h-full border-l border-outline-variant shadow-2xl">
          
          {/* Header toolbar */}
          <div className="px-6 py-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 stroke-[2]" />
              <h2 className="font-label-caps text-xs tracking-[0.2em] font-bold text-primary uppercase">
                Shopping Bag ({cartItems.length})
              </h2>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 text-secondary hover:text-primary transition-colors"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items slot */}
          <div className="flex-grow overflow-y-auto px-6 py-6 divide-y divide-outline-variant">
            {cartItems.length > 0 ? (
              cartItems.map(item => (
                <div key={item.id} className="py-5 flex space-x-4 first:pt-0">
                  <div className="w-20 h-24 bg-surface-container overflow-hidden flex-shrink-0 border border-outline-variant">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-body-md text-xs font-semibold text-primary uppercase tracking-tight line-clamp-1 max-w-[180px]">
                          {item.name}
                        </h3>
                        <span className="font-mono text-xs font-semibold text-primary shrink-0 leading-none">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-[10px] font-mono text-secondary uppercase tracking-widest mt-1.5">
                        <span className="bg-surface-container px-2 py-0.5">{item.color}</span>
                        <span>•</span>
                        <span className="bg-surface-container px-2 py-0.5">Size {item.size}</span>
                      </div>
                    </div>

                    {/* Quantity selectors + Trash item */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-outline-variant bg-white h-8 w-24 justify-between font-mono text-xs">
                        <button
                          disabled={item.quantity <= 1}
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-full flex items-center justify-center hover:bg-slate-50 disabled:opacity-35 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-primary">{item.quantity}</span>
                        <button
                          disabled={item.quantity >= item.stock}
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-full flex items-center justify-center hover:bg-slate-50 disabled:opacity-35 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-secondary hover:text-red-600 transition p-1.5"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 flex flex-col items-center justify-center h-full space-y-4">
                <ShoppingCart className="w-10 h-10 text-secondary stroke-[1]" />
                <h3 className="font-headline-sm text-base font-medium">Your studio bag is empty</h3>
                <p className="font-body-md text-xs text-secondary max-w-xs mx-auto">
                  Find premium high-fashion products in our latest collections index files.
                </p>
                <button
                  onClick={onClose}
                  className="border border-primary text-xs font-label-caps tracking-widest px-6 py-2.5 uppercase text-primary hover:bg-primary hover:text-white transition"
                >
                  Start Seeding Looks
                </button>
              </div>
            )}
          </div>

          {/* Footer totals + submitting */}
          {cartItems.length > 0 && (
            <div className="px-6 py-6 bg-surface-container-lowest border-t border-outline-variant space-y-4 shadow-inner">
              <div className="space-y-2.5 font-body-md text-xs text-primary">
                <div className="flex justify-between">
                  <span className="text-secondary">Bag Subtotal</span>
                  <span className="font-mono">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-outline-variant pt-2.5 text-sm">
                  <span>Grand Total</span>
                  <span className="font-mono text-primary">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Delivery Address Form Block */}
              <div className="space-y-2 pt-2 border-t border-dashed border-outline-variant">
                <label className="text-[10px] font-label-caps tracking-widest text-secondary uppercase font-bold block">
                  Delivery Address (Required)
                </label>
                
                {validationErr && (
                  <p className="text-[9px] font-mono text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 uppercase">
                    ⚠️ {validationErr}
                  </p>
                )}

                <div className="space-y-2">
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => { setStreet(e.target.value); setValidationErr(''); }}
                    placeholder="Street address, building, apartment / flat no."
                    className="w-full text-[11px] font-mono p-2 border border-outline-variant focus:border-primary focus:outline-none bg-white text-primary rounded-none shadow-sm"
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setValidationErr(''); }}
                      placeholder="Town / City"
                      className="w-full text-[11px] font-mono p-2 border border-outline-variant focus:border-primary focus:outline-none bg-white text-primary rounded-none shadow-sm"
                    />
                    <input
                      type="text"
                      value={stateField}
                      onChange={(e) => { setStateField(e.target.value); setValidationErr(''); }}
                      placeholder="State"
                      className="w-full text-[11px] font-mono p-2 border border-outline-variant focus:border-primary focus:outline-none bg-white text-primary rounded-none shadow-sm"
                    />
                  </div>

                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => { setPincode(e.target.value); setValidationErr(''); }}
                    placeholder="Pincode / ZIP Code"
                    className="w-full text-[11px] font-mono p-2 border border-outline-variant focus:border-primary focus:outline-none bg-white text-primary rounded-none shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    if (!currentUser) {
                      // Handled by App.tsx (redirect to sign in)
                      onCheckout('');
                      return;
                    }
                    const s = street.trim();
                    const c = city.trim();
                    const st = stateField.trim();
                    const p = pincode.trim();
                    if (!s || !c || !st || !p) {
                      setValidationErr('Please fill in complete address details before checkout.');
                      return;
                    }
                    setValidationErr('');
                    onCheckout(`${s}, ${c}, ${st} - ${p}`);
                  }}
                  className="w-full bg-primary text-on-primary font-button-text font-semibold uppercase text-xs tracking-widest py-4 hover:bg-opacity-95 transition-all text-center flex items-center justify-center space-x-2"
                >
                  <span>Go to Checkout & Auto-checkout via WhatsApp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <p className="text-[9px] font-mono text-secondary text-center mt-2 leading-relaxed">
                  Your order will be logged securely in local database. Submitting will automatically open WhatsApp for instant, production-ready payment matching.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
