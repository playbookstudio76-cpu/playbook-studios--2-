import React, { useState, useEffect } from 'react';
import { User, Package, LogOut, ChevronDown, ChevronUp, MapPin, Plus, CheckCircle2, Circle, Edit3, X, Wallet, Heart, Shield } from 'lucide-react';
import { UserProfile, Order, Address } from '../types';
import { saveCurrentUserSnapshot, getUserWallet } from '../storage';

interface CustomerDashboardProps {
  currentUser: UserProfile;
  orders: Order[];
  onLogout: () => void;
  onNavigate: (view: string, props?: any) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  initialTab?: 'profile' | 'orders' | 'wallet';
}

export default function CustomerDashboard({
  currentUser,
  orders,
  onLogout,
  onNavigate,
  onUpdateUser,
  initialTab,
}: CustomerDashboardProps) {
  // Sidebar tab control
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wallet'>(initialTab || 'profile');

  // React to initialTab changes dynamically
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Accordion open for order lines
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(orders[0]?.id || null);

  // Editing profile fields
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [phone, setPhone] = useState(currentUser.phone);

  // Address add modal state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrFullName, setNewAddrFullName] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrState, setNewAddrState] = useState('');
  const [newAddrZip, setNewAddrZip] = useState('');
  const [newAddrCountry, setNewAddrCountry] = useState('United States');
  const [newAddrPhone, setNewAddrPhone] = useState('');

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = {
      ...currentUser,
      firstName,
      lastName,
      phone,
    };
    saveCurrentUserSnapshot(updatedUser);
    onUpdateUser(updatedUser);
    setIsEditingInfo(false);
    alert('Personal information updated successfully.');
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrFullName || !newAddrStreet || !newAddrCity || !newAddrZip) {
      alert('Please complete the address form.');
      return;
    }

    const newAddress: Address = {
      id: 'addr_' + Math.random().toString(36).substr(2, 9),
      label: newAddrLabel || 'New Address',
      fullName: newAddrFullName,
      street: newAddrStreet,
      city: newAddrCity,
      state: newAddrState,
      zip: newAddrZip,
      country: newAddrCountry,
      phone: newAddrPhone || currentUser.phone,
      isDefault: (currentUser.addresses || []).length === 0,
    };

    const currentAddresses = currentUser.addresses || [];
    const updatedAddresses = [...currentAddresses];
    if (newAddress.isDefault) {
      // remove isdefault from others
      updatedAddresses.forEach(a => { a.isDefault = false; });
    }
    updatedAddresses.push(newAddress);

    const updatedUser = {
      ...currentUser,
      addresses: updatedAddresses,
    };

    saveCurrentUserSnapshot(updatedUser);
    onUpdateUser(updatedUser);
    setIsAddingAddress(false);
    
    // Clear Form
    setNewAddrLabel('');
    setNewAddrFullName('');
    setNewAddrStreet('');
    setNewAddrCity('');
    setNewAddrState('');
    setNewAddrZip('');
    setNewAddrPhone('');
    alert('Address added successfully.');
  };

  const setDefaultAddress = (addrId: string) => {
    const updatedAddresses = (currentUser.addresses || []).map(addr => ({
      ...addr,
      isDefault: addr.id === addrId
    }));

    const updatedUser = {
      ...currentUser,
      addresses: updatedAddresses,
    };

    saveCurrentUserSnapshot(updatedUser);
    onUpdateUser(updatedUser);
  };

  const removeAddress = (addrId: string) => {
    if (confirm('Are you sure you want to remove this address?')) {
      const updatedAddresses = (currentUser.addresses || []).filter(a => a.id !== addrId);
      const updatedUser = {
        ...currentUser,
        addresses: updatedAddresses,
      };
      saveCurrentUserSnapshot(updatedUser);
      onUpdateUser(updatedUser);
    }
  };

  // Helper timeline status step mapper
  const getTimelineSteps = (currentStatus: Order['status']) => {
    const statusSequence: Order['status'][] = [
      'Pending Payment',
      'Payment Received',
      'Processing',
      'Packed',
      'Shipped',
      'Delivered',
    ];

    const timelineMapping = [
      { key: 'Pending Payment', text: 'Submitted order' },
      { key: 'Payment Received', text: 'Confirmed payment received' },
      { key: 'Processing', text: 'Atelier confirmation' },
      { key: 'Packed', text: 'Items packed & customized' },
      { key: 'Shipped', text: 'Secured courier pickup' },
      { key: 'Delivered', text: 'At address terminal' },
    ];

    const currentIdx = statusSequence.indexOf(currentStatus);
    return timelineMapping.map((step, idx) => {
      const isPast = idx <= currentIdx;
      const isCurrent = idx === currentIdx;
      return {
        ...step,
        isPast,
        isCurrent,
      };
    });
  };

  return (
    <div className="flex-grow max-w-[1440px] mx-auto px-4 md:px-[64px] py-[64px]">
      <div className="flex flex-col md:flex-row gap-12 font-body-md text-on-background">
        
        {/* SIDEBAR NAVIGATION - Perfect Replica of Screenshot 5 and 6 */}
        <nav className="w-full md:w-[240px] flex-shrink-0 space-y-6">
          <div className="mb-4">
            <h3 className="font-display-lg text-2xl font-semibold tracking-tight text-primary uppercase">Account</h3>
            <p className="text-[11px] font-label-caps tracking-widest text-secondary uppercase mt-1">Manage your preferences.</p>
          </div>

          <div className="flex flex-row md:flex-col flex-wrap md:flex-nowrap border-b md:border-b-0 md:border-l border-outline-variant font-label-caps text-[11px] tracking-widest uppercase md:space-y-4 pt-4 md:pt-[24px]">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2.5 px-4 py-3 text-left w-full hover:bg-surface-container border-b-2 md:border-b-0 md:border-l-2 transition-all ${
                activeTab === 'profile'
                  ? 'border-primary text-primary font-bold bg-surface-container-low'
                  : 'border-transparent text-secondary'
              }`}
            >
              <User className="w-4 h-4 text-on-tertiary-container" />
              <span>Profile Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-2.5 px-4 py-3 text-left w-full hover:bg-surface-container border-b-2 md:border-b-0 md:border-l-2 transition-all ${
                activeTab === 'orders'
                  ? 'border-primary text-primary font-bold bg-surface-container-low'
                  : 'border-transparent text-secondary'
              }`}
            >
              <Package className="w-4 h-4 text-on-tertiary-container" />
              <span>My Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center space-x-2.5 px-4 py-3 text-left w-full hover:bg-surface-container border-b-2 md:border-b-0 md:border-l-2 transition-all ${
                activeTab === 'wallet'
                  ? 'border-primary text-primary font-bold bg-surface-container-low'
                  : 'border-transparent text-secondary'
              }`}
            >
              <Wallet className="w-4 h-4 text-on-tertiary-container" />
              <span>My Wallet (₹{getUserWallet(currentUser.id).balance})</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2.5 px-4 py-3 text-left w-full hover:bg-surface-container text-red-600 transition-all border-b-2 md:border-b-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        {/* DETAILS BODY CONTAINER */}
        <section className="flex-grow">
          {activeTab === 'profile' ? (
            
            // PROFILE OVERVIEW - Match Screenshot 6
            <div className="space-y-[48px]">
              <div>
                <h1 className="font-display-lg text-[28px] md:text-[36px] tracking-tight text-primary uppercase font-medium">
                  Profile Overview
                </h1>
                <p className="font-body-md text-xs text-secondary mt-1">
                  Welcome back, {currentUser.firstName}. View and edit your personal information below.
                </p>
              </div>

              {/* Personal Information card */}
              <div className="border border-outline-variant p-6 md:p-8 bg-surface-container-lowest relative">
                <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-6">
                  <span className="font-label-caps text-[10px] tracking-widest text-secondary uppercase font-bold">
                    Personal Information
                  </span>
                  
                  {!isEditingInfo && (
                    <button
                      onClick={() => setIsEditingInfo(true)}
                      className="group flex items-center space-x-1 font-label-caps text-[10px] tracking-widest uppercase text-secondary hover:text-primary underline decoration-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>EDIT</span>
                    </button>
                  )}
                </div>

                {isEditingInfo ? (
                  <form onSubmit={handleSaveInfo} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="relative">
                        <label className="font-label-caps text-[10px] text-secondary block uppercase tracking-widest mb-1">First Name</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 text-sm bg-transparent rounded-none"
                        />
                      </div>
                      <div className="relative">
                        <label className="font-label-caps text-[10px] text-secondary block uppercase tracking-widest mb-1">Last Name</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 text-sm bg-transparent rounded-none"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="font-label-caps text-[10px] text-secondary block uppercase tracking-widest mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 text-sm bg-transparent rounded-none"
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="bg-primary text-on-primary font-button-text font-semibold uppercase text-xs tracking-widest px-6 py-3 hover:opacity-90 transition rounded-none"
                      >
                        SAVE CHANGES
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingInfo(false);
                          setFirstName(currentUser.firstName);
                          setLastName(currentUser.lastName);
                          setPhone(currentUser.phone);
                        }}
                        className="border border-outline-variant text-secondary font-button-text font-semibold uppercase text-xs tracking-widest px-6 py-3 hover:bg-slate-50 transition rounded-none"
                      >
                        CANCEL
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                    <div>
                      <span className="font-label-caps text-[9px] tracking-widest text-secondary block uppercase">First Name</span>
                      <p className="font-medium text-primary mt-1">{currentUser.firstName}</p>
                    </div>
                    <div>
                      <span className="font-label-caps text-[9px] tracking-widest text-secondary block uppercase">Last Name</span>
                      <p className="font-medium text-primary mt-1">{currentUser.lastName}</p>
                    </div>
                    <div>
                      <span className="font-label-caps text-[9px] tracking-widest text-secondary block uppercase">Email Address</span>
                      <p className="text-primary mt-1 font-mono">{currentUser.email}</p>
                    </div>
                    <div>
                      <span className="font-label-caps text-[9px] tracking-widest text-secondary block uppercase">Phone Number</span>
                      <p className="font-medium text-primary mt-1">{currentUser.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* SAVED ADDRESSES - Match Screenshot 6 */}
              <div className="space-y-6">
                <div className="flex justify-between items-baseline border-b border-outline-variant pb-4">
                  <h3 className="font-label-caps text-[10px] tracking-[0.2em] text-secondary font-bold uppercase">
                    Saved Addresses
                  </h3>
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="bg-primary text-on-primary font-button-text text-[10px] py-2 px-4 uppercase tracking-widest hover:opacity-90 active:scale-95 transition flex items-center space-x-1.5 rounded-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD NEW</span>
                  </button>
                </div>

                {/* Adding Address Inline Form Block */}
                {isAddingAddress && (
                  <form onSubmit={handleAddAddress} className="border border-outline-variant p-6 bg-surface-container-low space-y-4">
                    <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                      <span className="font-label-caps text-[10px] text-primary uppercase font-bold">New Delivery Endpoint</span>
                      <button type="button" onClick={() => setIsAddingAddress(false)}>
                        <X className="w-4 h-4 text-secondary hover:text-primary" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-label-caps text-[9px] text-secondary tracking-wider block mb-1">Address Label (e.g. Work, Home)</label>
                        <input
                          type="text"
                          required
                          value={newAddrLabel}
                          onChange={(e) => setNewAddrLabel(e.target.value)}
                          placeholder="Playbook Studios (Work)"
                          className="bg-white border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary rounded-none"
                        />
                      </div>
                      <div>
                        <label className="font-label-caps text-[9px] text-secondary tracking-wider block mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={newAddrFullName}
                          onChange={(e) => setNewAddrFullName(e.target.value)}
                          className="bg-white border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary rounded-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-label-caps text-[9px] text-secondary tracking-wider block mb-1">Street Address</label>
                      <input
                        type="text"
                        required
                        value={newAddrStreet}
                        onChange={(e) => setNewAddrStreet(e.target.value)}
                        placeholder="1428 Elm Street, Apt 4B"
                        className="bg-white border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary rounded-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="col-span-1">
                        <label className="font-label-caps text-[9px] text-secondary tracking-wider block mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={newAddrCity}
                          onChange={(e) => setNewAddrCity(e.target.value)}
                          className="bg-white border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary rounded-none"
                        />
                      </div>
                      <div>
                        <label className="font-label-caps text-[9px] text-secondary tracking-wider block mb-1">State / Prov</label>
                        <input
                          type="text"
                          value={newAddrState}
                          onChange={(e) => setNewAddrState(e.target.value)}
                          placeholder="NY"
                          className="bg-white border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary rounded-none"
                        />
                      </div>
                      <div>
                        <label className="font-label-caps text-[9px] text-secondary tracking-wider block mb-1">Postal Code</label>
                        <input
                          type="text"
                          required
                          value={newAddrZip}
                          onChange={(e) => setNewAddrZip(e.target.value)}
                          className="bg-white border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary rounded-none"
                        />
                      </div>
                      <div>
                        <label className="font-label-caps text-[9px] text-secondary tracking-wider block mb-1">Country</label>
                        <input
                          type="text"
                          required
                          value={newAddrCountry}
                          onChange={(e) => setNewAddrCountry(e.target.value)}
                          className="bg-white border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary rounded-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-label-caps text-[9px] text-secondary tracking-wider block mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={newAddrPhone}
                        onChange={(e) => setNewAddrPhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="bg-white border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary rounded-none"
                      />
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="submit"
                        className="bg-primary hover:bg-opacity-95 text-on-primary px-5 py-2.5 font-label-caps text-[10px] tracking-widest uppercase transition rounded-none"
                      >
                        SAVE ADDRESS
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="border border-outline-variant text-secondary hover:bg-white px-5 py-2.5 font-label-caps text-[10px] tracking-widest uppercase transition rounded-none"
                      >
                        CLOSE
                      </button>
                    </div>
                  </form>
                )}

                {/* Saved addresses grid index (Screenshot 6 visual layouts) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {currentUser.addresses && currentUser.addresses.length > 0 ? (
                    currentUser.addresses.map(addr => (
                      <div 
                        key={addr.id}
                        className={`border p-6 bg-surface-container-lowest flex flex-col justify-between tracking-wide relative ${
                          addr.isDefault ? 'border-primary' : 'border-outline-variant hover:border-secondary'
                        }`}
                      >
                        {addr.isDefault && (
                          <span className="absolute top-4 right-4 bg-surface-container px-2 py-0.5 text-[8px] font-label-caps uppercase tracking-widest text-[#5d5f5f]">
                            DEFAULT BILLING & SHIPPING
                          </span>
                        )}

                        <div className="space-y-3.5 text-xs text-secondary leading-relaxed pt-2">
                          <h4 className="font-label-caps text-[11px] font-bold text-primary uppercase">
                            {addr.label}
                          </h4>
                          <div>
                            <p className="font-medium text-primary">{addr.fullName}</p>
                            <p>{addr.street}</p>
                            <p>{addr.city}, {addr.state} {addr.zip}</p>
                            <p>{addr.country}</p>
                          </div>
                          <p className="font-mono text-[10px] text-on-tertiary-container">{addr.phone}</p>
                        </div>

                        <div className="border-t border-outline-variant pt-4 mt-6 flex justify-between items-center text-[9px] font-label-caps tracking-widest uppercase">
                          {!addr.isDefault ? (
                            <button
                              onClick={() => setDefaultAddress(addr.id)}
                              className="text-primary hover:opacity-75 underline underline-offset-4"
                            >
                              SET AS DEFAULT
                            </button>
                          ) : (
                            <span className="text-primary font-bold">Standard default</span>
                          )}

                          <button
                            onClick={() => removeAddress(addr.id)}
                            className="text-red-600 hover:text-red-700 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-10 border border-dashed border-outline-variant">
                      <MapPin className="w-6 h-6 text-on-tertiary-container mx-auto mb-2" />
                      <p className="text-secondary text-xs">No saved terminal endpoints configured.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'orders' ? (
            
            // ORDER DETAILS & TIMELINE - Matches Screenshot 4 and 5
            <div className="space-y-8">
              <div>
                <h1 className="font-display-lg text-[28px] md:text-[36px] tracking-tight text-primary uppercase font-medium mt-1">
                  My Orders
                </h1>
                <p className="font-body-md text-xs text-secondary mt-1">
                  View and track your athletic / architectural streetwear purchases.
                </p>
              </div>

              <div className="space-y-4">
                {orders.length > 0 ? (
                  orders.map(order => {
                    const isExpanded = order.id === expandedOrderId;
                    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <div 
                        key={order.id}
                        className="border border-outline-variant bg-surface-container-lowest transition-all"
                      >
                        {/* Summary Line Header (perfect replica visual match to Screenshot 4) */}
                        <div 
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer hover:bg-slate-50 gap-4"
                        >
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] text-secondary tracking-widest uppercase block">
                              ORDER {order.orderNumber}
                            </span>
                            <span className="font-headline-sm text-xl text-primary font-medium block">
                              {formattedDate}
                            </span>
                          </div>

                          <div className="flex items-center space-x-12 w-full sm:w-auto justify-between sm:justify-start">
                            <div className="text-right sm:text-left">
                              <span className="font-label-caps text-[9px] text-secondary tracking-widest uppercase block">
                                TOTAL
                              </span>
                              <span className="font-mono text-sm text-primary font-semibold block">
                               ₹{order.total.toLocaleString()}
                              </span>
                            </div>

                            <div className="text-right flex items-center space-x-3">
                              <div>
                                <span className="font-label-caps text-[9px] text-secondary tracking-widest uppercase block">
                                  STATUS
                                </span>
                                <span className="font-label-caps text-xs text-primary font-bold tracking-wider block uppercase">
                                  {order.status}
                                </span>
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-secondary shrink-0" /> : <ChevronDown className="w-4 h-4 text-secondary shrink-0" />}
                            </div>
                          </div>
                        </div>

                        {/* Collateral Expanding Section */}
                        {isExpanded && (
                          <div className="px-6 pb-8 pt-4 border-t border-outline-variant bg-zinc-50/50 space-y-8">
                            
                            {/* Detailed Step-By-Step Timeline Checkpoints */}
                            <div className="space-y-4 pt-2">
                              <h4 className="font-label-caps text-[10px] tracking-widest text-[#5d5f5f] uppercase font-bold">
                                Order Delivery Timeline Tracking
                              </h4>
                              
                              <div className="grid grid-cols-2 md:grid-cols-6 gap-y-6 gap-x-3 text-left">
                                {getTimelineSteps(order.status).map((step, idx) => (
                                  <div key={idx} className="space-y-1.5 relative">
                                    <div className="flex items-center space-x-2">
                                      {step.isPast ? (
                                        <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                                      ) : (
                                        <Circle className="w-4.5 h-4.5 text-slate-300 shrink-0 stroke-[1.5]" />
                                      )}
                                      <p className="font-label-caps text-[10px] tracking-wider text-primary truncate font-semibold uppercase">
                                        {step.key}
                                      </p>
                                    </div>
                                    <p className="font-mono text-[9px] text-secondary uppercase leading-relaxed pl-6">
                                      {step.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 border-t border-outline-variant">
                              
                              {/* 1. Itemized item elements */}
                              <div className="lg:col-span-2 space-y-4">
                                <span className="font-label-caps text-[10px] tracking-widest text-secondary block font-bold uppercase">
                                  Items List
                                </span>

                                <div className="divide-y divide-outline-variant">
                                  {order.items.map(item => (
                                    <div key={item.id} className="py-3 flex space-x-4 first:pt-0">
                                      <div className="w-12 h-16 bg-surface-container overflow-hidden shrink-0 border border-outline-variant">
                                        <img 
                                          src={item.image} 
                                          alt={item.name} 
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover object-center"
                                        />
                                      </div>
                                      <div className="flex-grow flex justify-between items-center text-xs">
                                        <div className="space-y-0.5">
                                          <p className="font-semibold text-primary uppercase">{item.name}</p>
                                          <p className="font-mono text-[10px] text-secondary uppercase tracking-wider">
                                            Size {item.size} / {item.color} x{item.quantity}
                                          </p>
                                        </div>
                                        <span className="font-mono font-medium text-primary">
                                          ₹{(item.price * item.quantity).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 2. Addresses info */}
                              <div className="bg-white border border-outline-variant p-5 space-y-4 text-xs">
                                <div>
                                  <span className="font-label-caps text-[9px] text-secondary tracking-widest uppercase block mb-1">
                                    Recipient Name
                                  </span>
                                  <p className="font-medium text-primary">{order.customerName}</p>
                                </div>
                                <div>
                                  <span className="font-label-caps text-[9px] text-secondary tracking-widest uppercase block mb-1">
                                    Dispatch Terminal Location
                                  </span>
                                  <p className="text-secondary leading-relaxed">{order.customerAddress || 'No Address Listed'}</p>
                                </div>
                                <div>
                                  <span className="font-label-caps text-[9px] text-secondary tracking-widest uppercase block mb-1">
                                    Support Phone Signal
                                  </span>
                                  <p className="font-mono text-[10px] text-primary">{order.customerPhone}</p>
                                </div>
                              </div>

                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 border border-dashed border-outline-variant bg-surface-container-low max-w-xl mx-auto">
                    <Package className="w-8 h-8 mx-auto text-secondary mb-3 stroke-[1]" />
                    <p className="font-headline-sm text-base text-primary">No Active Direct Seeding Orders Logged</p>
                    <p className="font-body-md text-xs text-secondary mt-1">Start scanning the collections grid to place an order via WhatsApp confirmation.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // MY WALLET VIEW
            <div className="space-y-[48px]">
              <div>
                <h1 className="font-display-lg text-[28px] md:text-[36px] tracking-tight text-primary uppercase font-medium">
                  My Web Wallet
                </h1>
                <p className="font-body-md text-xs text-secondary mt-1">
                  Secure store credits, gift keys, and post-order rewards of Playbook Studios.
                </p>
              </div>

              {/* Wallet Card balance banner */}
              <div className="bg-black text-white p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center border border-neutral-800">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-amber-500" />
                    <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">Active Store Balance</span>
                  </div>
                  <div>
                    <span className="font-mono text-4xl md:text-5xl font-bold">₹{getUserWallet(currentUser.id).balance.toLocaleString()}</span>
                    <span className="font-mono text-xs text-neutral-400 ml-2">INR</span>
                  </div>
                </div>

                <div className="mt-6 md:mt-0 bg-neutral-900 border border-neutral-800 p-4 space-y-2 max-w-sm rounded-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">🛒 Wallet Usage Policy</h4>
                  <p className="text-[10px] text-neutral-400 leading-relaxed font-mono">
                    Wallet cash and coupon discounts can combine to cover up to 15% of your total checkout cart value. If an applied Coupon alone covers 15% or more, your wallet balance will remain preserved for later.
                  </p>
                </div>
              </div>

              {/* Transaction Register */}
              <div className="space-y-6">
                <h3 className="font-label-caps text-xs tracking-[0.2em] font-bold text-primary uppercase border-b border-outline-variant pb-3">
                  Transaction Ledger History
                </h3>

                {getUserWallet(currentUser.id).transactions.length > 0 ? (
                  <div className="border border-outline-variant overflow-hidden">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="bg-surface-container border-b border-outline-variant text-secondary uppercase font-bold text-[10px] tracking-widest">
                          <th className="p-4">Transaction ID</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Description</th>
                          <th className="p-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {getUserWallet(currentUser.id).transactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 font-semibold text-secondary">{tx.id}</td>
                            <td className="p-4 text-secondary">{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td className="p-4 text-primary font-body-md font-semibold text-xs">{tx.description}</td>
                            <td className={`p-4 text-right font-semibold font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-primary'}`}>
                              {tx.amount > 0 ? `+₹${tx.amount.toLocaleString()}` : `-₹${Math.abs(tx.amount).toLocaleString()}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-outline-variant bg-slate-50 text-secondary">
                    <p className="text-xs">No wallet transactions logged.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
