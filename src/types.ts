export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discountPrice?: number;
  sizes: string[];
  colors: string[];
  stock: number;
  images: string[];
  featured: boolean;
  colorName?: string; // e.g. "Black / Core"
  createdAt: string;
}

export interface CartItem {
  id: string; // unique item id (composite of product.id + size + color)
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  stock: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export type OrderStatus =
  | 'Pending Payment'
  | 'Payment Received'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'percent' | 'product_specific';
  discountValue: number;
  targetProductId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface FloatingBanner {
  id: string;
  title: string;
  text: string;
  linkUrl: string;
  isActive: boolean;
  position: 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  imageUrl?: string;
  createdAt: string;
}

export interface AnnouncementBar {
  id: string;
  text: string;
  isActive: boolean;
  backgroundColor: string;
  textColor: string;
  linkUrl?: string;
  createdAt: string;
}

export interface SocialConfig {
  id: string; // 'social_links'
  instagram?: string;
  twitter?: string;
  youtube?: string;
  facebook?: string;
  pinterest?: string;
  instagramImages?: string[];
}

export interface WhatsAppConfig {
  id: string; // 'whatsapp_config'
  phoneNumber: string;
  isEnabled: boolean;
  prefilledMessageText?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'editor' | 'viewer' | 'admin';
  createdAt: string;
  permissions: string[]; // e.g. ['products', 'orders', 'banners', 'coupons']
}

export interface NewsletterEmail {
  id: string;
  email: string;
  isPriorCustomer: boolean;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface UserWallet {
  id: string; // userId
  balance: number;
  transactions: WalletTransaction[];
}
